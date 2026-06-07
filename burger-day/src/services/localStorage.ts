import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Checkin } from '../lib/database.types';

// Guest user constants
const GUEST_PREFIX = 'burger_day_guest_';
const GUEST_PROFILE_KEY = GUEST_PREFIX + 'profile';
const GUEST_CHECKINS_KEY = GUEST_PREFIX + 'checkins';

export interface GuestProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  total_points: number;
  total_checkins: number;
  current_streak: number;
  max_streak: number;
  last_checkin_date: string | null;
}

function generateGuestId(): string {
  return 'guest_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
}

export async function getGuestProfile(): Promise<GuestProfile> {
  const stored = await AsyncStorage.getItem(GUEST_PROFILE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  // Create a new guest profile
  const profile: GuestProfile = {
    id: generateGuestId(),
    username: 'Burger Lover',
    avatar_url: null,
    total_points: 0,
    total_checkins: 0,
    current_streak: 0,
    max_streak: 0,
    last_checkin_date: null,
  };
  await AsyncStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

export async function updateGuestProfile(updates: Partial<GuestProfile>): Promise<GuestProfile> {
  const current = await getGuestProfile();
  const updated = { ...current, ...updates };
  await AsyncStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(updated));
  return updated;
}

export async function getGuestCheckins(): Promise<Checkin[]> {
  const stored = await AsyncStorage.getItem(GUEST_CHECKINS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export async function addGuestCheckin(checkin: Checkin): Promise<void> {
  const checkins = await getGuestCheckins();
  checkins.unshift(checkin);
  await AsyncStorage.setItem(GUEST_CHECKINS_KEY, JSON.stringify(checkins));
}

export async function clearGuestData(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const guestKeys = keys.filter(k => k.startsWith(GUEST_PREFIX));
  if (guestKeys.length > 0) {
    await AsyncStorage.multiRemove(guestKeys);
  }
}

// Calculate points for a checkin (same formula as Edge Function)
export function calculateGuestPoints(
  rating: number,
  photoCount: number,
  review: string | null,
  currentStreak: number,
): { points: number; breakdown: Record<string, number> } {
  const basePoints = 10;
  const photoBonus = Math.min(photoCount * 5, 15);
  const reviewBonus = review && review.trim() ? 5 : 0;
  const ratingBonus = Math.max(0, (rating - 3) * 2);
  const streakBonus = Math.min((currentStreak) * 2, 20);

  const total = basePoints + photoBonus + reviewBonus + ratingBonus + streakBonus;

  return {
    points: total,
    breakdown: { basePoints, photoBonus, reviewBonus, ratingBonus, streakBonus },
  };
}
