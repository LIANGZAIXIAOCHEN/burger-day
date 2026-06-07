import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import FeedScreen from '../screens/feed/FeedScreen';
import CheckinScreen from '../screens/checkin/CheckinScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import RewardsScreen from '../screens/rewards/RewardsScreen';
import { colors, shadows } from '../theme';

export type MainTabParamList = {
  Feed: undefined;
  Checkin: undefined;
  Profile: undefined;
  Rewards: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  Feed: { active: '📋', inactive: '📋' },
  Rewards: { active: '🎁', inactive: '🎁' },
  Profile: { active: '👤', inactive: '👤' },
};

function TabIcon({ routeName, focused }: { routeName: string; focused: boolean }) {
  const icons = TAB_ICONS[routeName] || { active: '●', inactive: '○' };
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
        {focused ? icons.active : icons.inactive}
      </Text>
      <View style={[styles.tabDot, focused && styles.tabDotActive]} />
    </View>
  );
}

function CenterTabButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.centerBtn} onPress={onPress} activeOpacity={0.85}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.centerBtnGrad}
      >
        <Text style={styles.centerBtnIcon}>🍔</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function MainTabNavigator() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
      }}
    >
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon routeName="Feed" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Rewards"
        component={RewardsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon routeName="Rewards" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Checkin"
        component={CheckinScreen}
        options={{
          tabBarButton: (props) => <CenterTabButton {...props as any} />,
          tabBarIcon: () => null,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon routeName="Profile" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.card,
    borderTopColor: colors.borderLight,
    borderTopWidth: 1,
    height: 85,
    paddingBottom: 25,
    paddingTop: 8,
    paddingHorizontal: 10,
    elevation: 10,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabIcon: {
    fontSize: 22,
    opacity: 0.5,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  tabDotActive: {
    backgroundColor: colors.tabActive,
  },

  // Center button
  centerBtn: {
    top: -16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerBtnGrad: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.floating,
  },
  centerBtnIcon: {
    fontSize: 28,
  },
});
