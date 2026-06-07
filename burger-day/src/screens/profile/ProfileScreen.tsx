import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import type { RootStackParamList } from '../../navigation/AppNavigator';

type StatItem = {
  label: string;
  value: number;
  emoji: string;
  color: string;
};

export default function ProfileScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session, profile, isGuest, guestProfile, signOut } = useAuth();

  const handleLogout = () => {
    Alert.alert(t('auth.logout'), 'Are you sure?', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('auth.logout'), style: 'destructive', onPress: signOut },
    ]);
  };

  const dp = {
    username: session ? (profile?.username ?? 'Burger Lover') : (guestProfile?.username ?? 'Burger Lover'),
    avatar_url: session ? profile?.avatar_url : guestProfile?.avatar_url,
    total_points: session ? (profile?.total_points ?? 0) : (guestProfile?.total_points ?? 0),
    total_checkins: session ? (profile?.total_checkins ?? 0) : (guestProfile?.total_checkins ?? 0),
    current_streak: session ? (profile?.current_streak ?? 0) : (guestProfile?.current_streak ?? 0),
    max_streak: session ? (profile?.max_streak ?? 0) : (guestProfile?.max_streak ?? 0),
  };

  const stats: StatItem[] = [
    { label: t('profile.totalPoints'), value: dp.total_points, emoji: '⭐', color: '#FFF3CC' },
    { label: t('profile.totalCheckins'), value: dp.total_checkins, emoji: '📋', color: '#E8F4FD' },
    { label: t('profile.currentStreak'), value: dp.current_streak, emoji: '🔥', color: '#FFE8E0' },
    { label: t('profile.maxStreak'), value: dp.max_streak, emoji: '🏆', color: '#FFF0CC' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient
        colors={[colors.background, colors.backgroundSecondary]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
        {isGuest && <View style={styles.guestBadge}><Text style={styles.guestBadgeText}>Guest</Text></View>}
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Profile Hero ── */}
        <View style={styles.heroSection}>
          <View style={styles.heroBg}>
            <LinearGradient
              colors={[colors.primaryLight, colors.background]}
              style={StyleSheet.absoluteFill}
            />
          </View>
          <View style={styles.avatarWrap}>
            {dp.avatar_url ? (
              <Image source={{ uri: dp.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarEmoji}>{isGuest ? '👤' : '😊'}</Text>
              </View>
            )}
          </View>
          <Text style={styles.username}>{dp.username}</Text>
          <Text style={styles.tagline}>🍔 {t('app.tagline')}</Text>
          {isGuest && (
            <Text style={styles.guestHint}>{t('profile.loginPrompt')}</Text>
          )}
        </View>

        {/* ── Bento Stats Grid ── */}
        <View style={styles.bentoGrid}>
          {stats.map((stat, i) => (
            <View
              key={i}
              style={[
                styles.bentoItem,
                i === 0 && styles.bentoHighlight,
                { backgroundColor: stat.color },
              ]}
            >
              <Text style={styles.bentoEmoji}>{stat.emoji}</Text>
              <Text style={[styles.bentoValue, i === 0 && styles.bentoValueHighlight]}>
                {stat.value}
              </Text>
              <Text style={styles.bentoLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Auth Buttons (Guest) ── */}
        {isGuest && (
          <View style={styles.authSection}>
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => navigation.navigate('Login')}
            >
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginBtnGrad}
              >
                <Text style={styles.loginBtnText}>{t('auth.login')}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.registerBtn}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.registerBtnText}>{t('auth.register')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Menu ── */}
        <View style={styles.menuSection}>
          <MenuItem icon="🏅" label={t('profile.achievementWall')} onPress={() => {}} />
          <MenuItem icon="📅" label={t('profile.checkinCalendar')} onPress={() => {}} />
          <MenuItem icon="📊" label={t('profile.pointHistory')} onPress={() => {}} />
          <MenuItem icon="🎁" label={t('profile.redeemStore')} onPress={() => {}} />
          <MenuItem icon="🌐" label={t('profile.language')} onPress={() => {}} last />
        </View>

        {/* ── Achievements ── */}
        <View style={styles.achievementSection}>
          <Text style={styles.sectionTitle}>🏅 {t('profile.achievements')}</Text>
          <View style={styles.achievementGrid}>
            {achievementIcons.map((item, index) => (
              <View key={index} style={[styles.achiItem, item.locked && styles.achiLocked]}>
                <Text style={[styles.achiIcon, item.locked && styles.achiIconLocked]}>
                  {item.locked ? '🔒' : item.icon}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Logout ── */}
        {!isGuest && (
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>{t('auth.logout')}</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function MenuItem({
  icon, label, onPress, last = false,
}: {
  icon: string; label: string; onPress: () => void; last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, !last && styles.menuItemBorder]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={styles.menuLabel}>{label}</Text>
      <View style={styles.menuArrowWrap}>
        <Text style={styles.menuArrow}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const CARD_W = 0; // used in bento grid calculation

const achievementIcons = [
  { icon: '🍔', locked: false },
  { icon: '🔥', locked: false },
  { icon: '⭐', locked: true },
  { icon: '👑', locked: true },
  { icon: '📸', locked: false },
  { icon: '💬', locked: true },
  { icon: '🏆', locked: true },
  { icon: '🎯', locked: true },
];

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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  guestBadge: {
    backgroundColor: colors.backgroundTertiary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  guestBadgeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  heroBg: {
    ...StyleSheet.absoluteFill,
  },
  avatarWrap: {
    marginBottom: spacing.md,
    ...shadows.floating,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarPlaceholder: {
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarEmoji: {
    fontSize: 38,
  },
  username: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  tagline: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  guestHint: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },

  // Bento grid
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  bentoItem: {
    width: (spacing.lg * 2 + CARD_W) / 2 - spacing.sm / 2,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    minWidth: 75,
    flex: 1,
    minHeight: 90,
    justifyContent: 'center',
  },
  bentoHighlight: {
    flexBasis: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    minHeight: 70,
  },
  bentoEmoji: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  bentoValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  bentoValueHighlight: {
    fontSize: 32,
    color: colors.accent,
  },
  bentoLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Auth section
  authSection: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  loginBtn: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.button,
  },
  loginBtnGrad: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  loginBtnText: {
    color: colors.textInverse,
    fontSize: 17,
    fontWeight: '700',
  },
  registerBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  registerBtnText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },

  // Menu
  menuSection: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: spacing.xl,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  menuArrowWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuArrow: {
    fontSize: 18,
    color: colors.textTertiary,
    fontWeight: '300',
    lineHeight: 20,
  },

  // Achievements
  achievementSection: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  achiItem: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achiLocked: {
    backgroundColor: colors.borderLight,
    opacity: 0.7,
  },
  achiIcon: {
    fontSize: 22,
  },
  achiIconLocked: {
    fontSize: 18,
  },

  // Logout
  logoutBtn: {
    marginHorizontal: spacing.lg,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  logoutText: {
    fontSize: 15,
    color: colors.error,
    fontWeight: '600',
  },
});
