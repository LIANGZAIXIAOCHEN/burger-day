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
import { supabase } from '../../supabase/client';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, borderRadius } from '../../theme';
import type { Burger, Reward } from '../../lib/database.types';

export default function RewardsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user, profile, refreshProfile } = useAuth();
  const [burgers, setBurgers] = useState<Burger[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Fetch available burgers (rewards catalog)
    const { data: burgerData } = await supabase.from('burgers').select('*');
    if (burgerData) setBurgers(burgerData as Burger[]);

    // Fetch user's redeemed rewards
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
              // Generate voucher code
              const voucherCode = `BD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

              // Insert reward record
              const { error: rewardError } = await supabase.from('rewards').insert({
                user_id: user.id,
                voucher_code: voucherCode,
                points_cost: burger.points_reward,
                is_redeemed: false,
              });

              if (rewardError) throw rewardError;

              // Deduct points from user profile
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

  const renderRewardItem = ({ item }: { item: Burger }) => (
    <View style={styles.rewardCard}>
      <Image
        source={{ uri: item.image_url || 'https://via.placeholder.com/200' }}
        style={styles.rewardImage}
      />
      <View style={styles.rewardInfo}>
        <Text style={styles.rewardName}>{item.name_zh_cn}</Text>
        <Text style={styles.rewardNameEn}>{item.name_en}</Text>
        <Text style={styles.rewardPoints}>
          {item.points_reward} {t('rewards.pointsPrefix')}
        </Text>
      </View>
      <TouchableOpacity
        style={[
          styles.redeemButton,
          (profile && profile.total_points < item.points_reward) && styles.redeemButtonDisabled,
        ]}
        onPress={() => handleRedeem(item)}
        disabled={redeeming === item.id}
      >
        {redeeming === item.id ? (
          <ActivityIndicator color={colors.textInverse} size="small" />
        ) : (
          <Text style={styles.redeemButtonText}>{t('rewards.redeem')}</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderVoucherItem = ({ item }: { item: Reward }) => (
    <View style={[styles.voucherCard, item.is_redeemed && styles.voucherCardUsed]}>
      <View style={styles.voucherLeft}>
        <Text style={styles.voucherIcon}>🎫</Text>
      </View>
      <View style={styles.voucherInfo}>
        <Text style={styles.voucherCode}>{item.voucher_code}</Text>
        <Text style={styles.voucherPoints}>-{item.points_cost} {t('rewards.pointsPrefix')}</Text>
        <Text style={styles.voucherStatus}>
          {item.is_redeemed ? '✓ ' + t('rewards.redeemed') : '⏳ ' + t('rewards.redeem')}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('rewards.title')}</Text>
        <Text style={styles.headerPoints}>
          {profile?.total_points ?? 0} {t('rewards.pointsPrefix')}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={burgers}
          renderItem={renderRewardItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🎁</Text>
              <Text style={styles.emptyText}>{t('rewards.noRewards')}</Text>
            </View>
          }
          ListHeaderComponent={
            rewards.length > 0 ? (
              <View style={styles.vouchersSection}>
                <Text style={styles.sectionTitle}>{t('rewards.myVouchers')}</Text>
                {rewards.map(reward => (
                  <View key={reward.id}>
                    {renderVoucherItem({ item: reward })}
                  </View>
                ))}
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
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
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerPoints: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent,
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
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rewardImage: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.backgroundSecondary,
  },
  rewardInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  rewardNameEn: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  rewardPoints: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
    marginTop: spacing.xs,
  },
  redeemButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.sm,
    paddingVertical: 8,
    paddingHorizontal: spacing.lg,
  },
  redeemButtonDisabled: {
    backgroundColor: colors.border,
  },
  redeemButtonText: {
    color: colors.textInverse,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  vouchersSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
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
});
