import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import FeedScreen from '../screens/feed/FeedScreen';
import CheckinScreen from '../screens/checkin/CheckinScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import RewardsScreen from '../screens/rewards/RewardsScreen';
import { colors } from '../theme';

export type MainTabParamList = {
  Feed: undefined;
  Checkin: undefined;
  Profile: undefined;
  Rewards: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>{icon}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

function CenterTabButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.centerButton} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.centerButtonInner}>
        <Text style={styles.centerButtonIcon}>🍔</Text>
      </View>
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
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="📋" label={t('feed.title')} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Rewards"
        component={RewardsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🎁" label={t('rewards.title')} focused={focused} />
          ),
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
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="👤" label={t('profile.title')} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.background,
    borderTopColor: colors.borderLight,
    borderTopWidth: 1,
    height: 85,
    paddingBottom: 25,
    paddingTop: 8,
    elevation: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 22,
    opacity: 0.5,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    color: colors.tabInactive,
    marginTop: 2,
  },
  tabLabelActive: {
    color: colors.tabActive,
    fontWeight: '600',
  },
  centerButton: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  centerButtonIcon: {
    fontSize: 28,
  },
});
