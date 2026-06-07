import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import type { Burger, Reward } from '../../lib/database.types';

export default function RewardsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user, profile, isGuest, guestProfile, refreshProfile } = useAuth();
  const [burgers, setBurgers] = useState<Burger[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  const points = isGuest ? (guestProfile?.total_points ?? 0) : (profile?.total_points ?? 0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: burgerData } = await supabase.from('burgers').select('*');
    if (burgerData) setBurgers(burgerData as Burger[]);

    if (user) {
      const { data: rewardData } = await supabase
        .from('rewards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (rewardData) setRewards(rewardData as Reward[]);
    }

    setLoading(false);
  };

  const handleRedeem = async (burger: Burger) => {
    if (isGuest) {
      Alert.alert(t('auth.login'), t('profile.loginPrompt'));
      return;
    }
    if (!user || !profile) return;

    if (profile.total_points < burger.points_reward) {
      Alert.alert(t('rewards.insufficientPoints'));
      return;
    }

    Alert.alert(
      t('rewards.confirmRedeem'),
      t('rewards.confirmMessage', { points: burger.points_reward }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('rewards.redeem'),
          onPress: async () => {
            setRedeeming(burger.id);
            try {
              const voucherCode = `BD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

              const { error: rewardError } = await supabase.from('rewards').insert({
                user_id: user.id,
                voucher_code: voucherCode,
                points_cost: burger.points_reward,
                is_redeemed: false,
              });
              if (rewardError) throw rewardError;

              const { error: pointsError } = await supabase
                .from('profiles')
                .update({ total_points: profile.total_points - burger.points_reward })
                .eq('id', user.id);
              if (pointsError) throw pointsError;

              await refreshProfile();
              Alert.alert(t('rewards.redeemSuccess'), `${t('rewards.voucherCode')}: ${voucherCode}`);
              fetchData();
            } catch (error: any) {
              Alert.alert(t('common.error'), error.message);
            }
            setRedeeming(null);
          },
        },
      ]
    );
  };

  const renderRewardItem = ({ item }: { item: Burger }) => {
    const isDisabled = isGuest || points < item.points_reward;

    return (
      <TouchableOpacity
        style={[styles.rewardCard, isDisabled && styles.rewardCardDisabled]}
        activeOpacity={0.85}
        onPress={() => handleRedeem(item)}
      >
        <Image
          source={{ uri: item.image_url || 'https://via.placeholder.com/200' }}
          style={styles.rewardImage}
        />
        <View style={styles.rewardInfo}>
          <Text style={styles.rewardName}>{item.name_zh_cn}</Text>
          <Text style={styles.rewardNameEn}>{item.name_en}</Text>
          <View style={styles.pointsRow}>
            <Text style={styles.rewardPoints}>
              {item.points_reward} pts
            </Text>
          </View>
        </View>
        {redeeming === item.id ? (
          <ActivityIndicator color={colors.accent} size="small" />
        ) : isGuest ? (
          <Text style={styles.lockIcon}>🔒</Text>
        ) : (
          <View style={styles.redeemBadge}>
            <Text style={styles.redeemBadgeText}>
              {t('rewards.redeem')}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderVoucherItem = ({ item }: { item: Reward }) => (
    <View style={[styles.voucherCard, item.is_redeemed && styles.voucherCardUsed]}>
      <View style={styles.voucherLeft}>
        <Text style={styles.voucherIcon}>🎫</Text>
      </View>
      <View style={styles.voucherInfo}>
        <Text style={styles.voucherCode}>{item.voucher_code}</Text>
        <Text style={styles.voucherPoints}>-{item.points_cost} pts</Text>
        <Text style={styles.voucherStatus}>
          {item.is_redeemed ? '✓ ' + t('rewards.redeemed') : '⏳ ' + t('rewards.active')}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with points */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('rewards.title')}</Text>
        <View style={styles.pointsBadge}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.pointsBadgeGrad}
          >
            <Text style={styles.pointsBadgeText}>⭐ {points} pts</Text>
          </LinearGradient>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : (
        <FlatList
          data={burgers}
          renderItem={renderRewardItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            rewards.length > 0 ? (
              <View style={styles.vouchersSection}>
                <Text style={styles.sectionTitle}>🎫 {t('rewards.myVouchers')}</Text>
                {rewards.map(reward => (
                  <View key={reward.id}>
                    {renderVoucherItem({ item: reward })}
                  </View>
                ))}
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🎁</Text>
              <Text style={styles.emptyText}>{t('rewards.noRewards')}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  pointsBadge: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  pointsBadgeGrad: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  pointsBadgeText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  vouchersSection: {
    marginBottom: spacing.xl,
  },
  voucherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    ...shadows.card,
  },
  voucherCardUsed: {
    opacity: 0.6,
    borderLeftColor: colors.textTertiary,
  },
  voucherLeft: {
    marginRight: spacing.md,
  },
  voucherIcon: {
    fontSize: 28,
  },
  voucherInfo: {
    flex: 1,
  },
  voucherCode: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  voucherPoints: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  voucherStatus: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },

  // Reward cards
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  rewardCardDisabled: {
    opacity: 0.7,
  },
  rewardImage: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundSecondary,
  },
  rewardInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  rewardNameEn: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  rewardPoints: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
  },
  lockIcon: {
    fontSize: 20,
  },
  redeemBadge: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.sm,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
  },
  redeemBadgeText: {
    color: colors.textInverse,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: spacing.lg,
    opacity: 0.6,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
