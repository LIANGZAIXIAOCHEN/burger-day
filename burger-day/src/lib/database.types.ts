// Database schema types for Supabase

export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  total_points: number;
  total_checkins: number;
  current_streak: number;
  max_streak: number;
  created_at?: string;
}

export interface Checkin {
  id: string;
  user_id: string;
  store_id: string;
  store_name: string;
  address: string;
  lat: number;
  lng: number;
  photo_urls: string[];
  rating: number;
  review: string | null;
  points_earned: number;
  created_at: string;
}

export interface Achievement {
  id: string;
  code: string;
  name: Record<string, string>; // i18n key or name per locale
  description: Record<string, string>;
  badge_icon: string;
  trigger_type: 'total_checkins' | 'streak' | 'total_points' | 'rating' | 'photo_count';
  trigger_threshold: number;
  points_reward: number;
}

export interface UserAchievement {
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievement?: Achievement;
}

export interface Post {
  id: string;
  user_id: string;
  checkin_id: string;
  content: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
  // Joined fields
  checkin?: Checkin;
  profile?: Profile;
}

export interface Reward {
  id: string;
  user_id: string;
  voucher_code: string;
  points_cost: number;
  is_redeemed: boolean;
  created_at: string;
  // Joined
  burger?: Burger;
}

export interface Burger {
  id: string;
  name_zh_cn: string;
  name_zh_tw: string;
  name_en: string;
  image_url: string;
  points_reward: number;
}
