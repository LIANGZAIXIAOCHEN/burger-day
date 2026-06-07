// Ad Service - Rewarded Video Ads
// Wraps AdMob (expo-ads-admob) or Pangle (react-native-pangle)
// Falls back gracefully when ad SDK is not available

const REWARD_POINTS = 20; // Points earned per ad watch

// Ad unit IDs
const AD_UNIT_IDS = {
  ios: process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID || 'ca-app-pub-3940256099942544/1712485313', // Test ID
  android: process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID || 'ca-app-pub-3940256099942544/1712485313', // Test ID
};

interface AdResult {
  success: boolean;
  points?: number;
  error?: string;
}

/**
 * Play a rewarded video ad.
 * Returns whether the user watched the full ad and earned points.
 *
 * NOTE: Ad SDKs require native modules. If not installed:
 *   npx expo install expo-ads-admob
 * or for Pangle:
 *   npm install react-native-pangle
 *
 * Falls back to a simulated ad if the SDK is not configured.
 */
export async function playRewardedAd(): Promise<AdResult> {
  try {
    // In production, replace this with actual AdMob rewarded ad:
    //
    // const { RewardedAd, RewardedAdEventType } = require('expo-ads-admob');
    // const rewardedAd = RewardedAd.createForAdRequest(AD_UNIT_IDS.ios, {
    //   requestNonPersonalizedAdsOnly: true,
    // });
    //
    // return new Promise((resolve) => {
    //   rewardedAd.addEventListener(RewardedAdEventType.LOADED, () => rewardedAd.show());
    //   rewardedAd.addEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
    //     resolve({ success: true, points: reward.amount || REWARD_POINTS });
    //   });
    //   rewardedAd.addEventListener(RewardedAdEventType.CLOSED, () => {
    //     resolve({ success: false, error: 'Ad closed early' });
    //   });
    //   rewardedAd.load();
    // });

    // Simulated ad for development
    console.log('[AdService] Playing rewarded ad (simulated)');
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      success: true,
      points: REWARD_POINTS,
    };
  } catch (error: any) {
    console.error('[AdService] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Award points after watching a rewarded ad.
 */
export async function awardAdPoints(userId: string): Promise<void> {
  const { supabase } = await import('../supabase/client');

  // Get current profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('total_points')
    .eq('id', userId)
    .single();

  if (profile) {
    await supabase
      .from('profiles')
      .update({ total_points: profile.total_points + REWARD_POINTS })
      .eq('id', userId);
  }
}
