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
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, borderRadius } from '../../theme';
import type { RootStackParamList } from '../../navigation/AppNavigator';

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

  // Use real profile if logged in, or guest profile for local mode
  const displayProfile = {
    username: session ? (profile?.username ?? 'Burger Lover') : (guestProfile?.username ?? 'Burger Lover'),
    avatar_url: session ? profile?.avatar_url : guestProfile?.avatar_url,
    total_points: session ? (profile?.total_points ?? 0) : (guestProfile?.total_points ?? 0),
    total_checkins: session ? (profile?.total_checkins ?? 0) : (guestProfile?.total_checkins ?? 0),
    current_streak: session ? (profile?.current_streak ?? 0) : (guestProfile?.current_streak ?? 0),
    max_streak: session ? (profile?.max_streak ?? 0) : (guestProfile?.max_streak ?? 0),
  };

  const StatCard = ({ label, value, emoji }: { label: string; value: number; emoji: string }) => (
    <View style={styles.statCard}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const MenuItem = ({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
        {isGuest && (
          <Text style={styles.guestBadge}>Guest</Text>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {displayProfile.avatar_url ? (
              <Image source={{ uri: displayProfile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarEmoji}>{isGuest ? '👤' : '😊'}</Text>
              </View>
            )}
          </View>
          <Text style={styles.username}>{displayProfile.username}</Text>
          <Text style={styles.bio}>🍔 {t('app.tagline')}</Text>
          {isGuest && (
            <Text style={styles.guestHint}>{t('profile.loginPrompt')}</Text>
          )}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard
            label={t('profile.totalPoints')}
            value={displayProfile.total_points}
            emoji="⭐"
          />
          <StatCard
            label={t('profile.totalCheckins')}
            value={displayProfile.total_checkins}
            emoji="📋"
          />
          <StatCard
            label={t('profile.currentStreak')}
            value={displayProfile.current_streak}
            emoji="🔥"
          />
          <StatCard
            label={t('profile.maxStreak')}
            value={displayProfile.max_streak}
            emoji="🏆"
          />
        </View>

        {/* Auth Buttons for Guest */}
        {isGuest && (
          <View style={styles.authSection}>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginButtonText}>{t('auth.login')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.registerButtonText}>{t('auth.register')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <MenuItem
            icon="🏅"
            label={t('profile.achievementWall')}
            onPress={() => {}}
          />
          <MenuItem
            icon="📅"
            label={t('profile.checkinCalendar')}
            onPress={() => {}}
          />
          <MenuItem
            icon="📊"
            label={t('profile.pointHistory')}
            onPress={() => {}}
          />
          <MenuItem
            icon="🎁"
            label={t('profile.redeemStore')}
            onPress={() => {}}
          />
          <MenuItem
            icon="🌐"
            label={t('profile.language')}
            onPress={() => {}}
          />
        </View>

        {/* Achievements Preview */}
        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>{t('profile.achievements')}</Text>
          <View style={styles.achievementGrid}>
            {achievementIcons.map((item, index) => (
              <View key={index} style={styles.achievementItem}>
                <Text style={styles.achievementIcon}>{item.locked ? '🔒' : item.icon}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Logout (only for logged-in users) */}
        {!isGuest && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>{t('auth.logout')}</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

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
  guestBadge: {
    fontSize: 12,
    color: colors.textSecondary,
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingVertical: spacing.xxl,
    marginBottom: spacing.md,
  },
  avatarContainer: {
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 36,
  },
  username: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  bio: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  guestHint: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statEmoji: {
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  authSection: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  loginButton: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  loginButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
  registerButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  registerButtonText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  menuSection: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
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
  },
  menuArrow: {
    fontSize: 20,
    color: colors.textTertiary,
  },
  achievementsSection: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  achievementItem: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementIcon: {
    fontSize: 24,
  },
  logoutButton: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutText: {
    fontSize: 15,
    color: colors.error,
    fontWeight: '500',
  },
});
