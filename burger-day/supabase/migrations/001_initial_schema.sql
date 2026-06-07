-- ============================================================
-- 堡了么 / Burger Day - Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  avatar_url TEXT,
  total_points INTEGER DEFAULT 0,
  total_checkins INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  max_streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'User_' || substr(NEW.id::text, 1, 8))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. Checkins
CREATE TABLE IF NOT EXISTS checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  store_id TEXT NOT NULL,
  store_name TEXT NOT NULL,
  address TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  photo_urls TEXT[] DEFAULT '{}',
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checkins_user_id ON checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_created_at ON checkins(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON checkins(user_id, created_at DESC);

-- 3. Achievements (pre-set catalog)
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name JSONB NOT NULL, -- {"zh-CN": "...", "zh-TW": "...", "en": "..."}
  description JSONB NOT NULL,
  badge_icon TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('total_checkins', 'streak', 'total_points', 'rating', 'photo_count')),
  trigger_threshold INTEGER NOT NULL,
  points_reward INTEGER DEFAULT 0
);

-- 4. User Achievements (junction)
CREATE TABLE IF NOT EXISTS user_achievements (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

-- 5. Posts (for feed)
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  checkin_id UUID NOT NULL REFERENCES checkins(id) ON DELETE CASCADE,
  content TEXT,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- 6. Rewards / Vouchers
CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  voucher_code TEXT NOT NULL,
  points_cost INTEGER NOT NULL,
  is_redeemed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Burgers (redeemable catalog)
CREATE TABLE IF NOT EXISTS burgers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_zh_cn TEXT NOT NULL,
  name_zh_tw TEXT NOT NULL,
  name_en TEXT NOT NULL,
  image_url TEXT NOT NULL,
  points_reward INTEGER NOT NULL
);

-- ============================================================
-- RLS Policies
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE burgers ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all profiles, update only their own
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Checkins: users can CRUD their own, read others
CREATE POLICY "Users can insert own checkins"
  ON checkins FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Checkins are viewable by everyone"
  ON checkins FOR SELECT USING (true);

CREATE POLICY "Users can update own checkins"
  ON checkins FOR UPDATE USING (auth.uid() = user_id);

-- Achievements: public read
CREATE POLICY "Achievements are viewable by everyone"
  ON achievements FOR SELECT USING (true);

-- User Achievements: users can read their own
CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert achievements"
  ON user_achievements FOR INSERT WITH CHECK (true);

-- Posts: public read, authenticated insert
CREATE POLICY "Posts are viewable by everyone"
  ON posts FOR SELECT USING (true);

CREATE POLICY "Users can insert own posts"
  ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Rewards: users can CRUD their own
CREATE POLICY "Users can view own rewards"
  ON rewards FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rewards"
  ON rewards FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Burgers: public read
CREATE POLICY "Burgers are viewable by everyone"
  ON burgers FOR SELECT USING (true);

-- ============================================================
-- Seed Data
-- ============================================================

-- Pre-set Achievements
INSERT INTO achievements (code, name, description, badge_icon, trigger_type, trigger_threshold, points_reward) VALUES
  ('first_checkin', '{"zh-CN": "初次打卡", "zh-TW": "初次打卡", "en": "First Check-in"}', '{"zh-CN": "完成第一次打卡", "zh-TW": "完成第一次打卡", "en": "Complete your first check-in"}', '🍔', 'total_checkins', 1, 10),
  ('streak_3', '{"zh-CN": "连续三天", "zh-TW": "連續三天", "en": "3-Day Streak"}', '{"zh-CN": "连续打卡3天", "zh-TW": "連續打卡3天", "en": "Check in for 3 consecutive days"}', '🔥', 'streak', 3, 20),
  ('streak_7', '{"zh-CN": "一周坚持", "zh-TW": "一週堅持", "en": "Week Warrior"}', '{"zh-CN": "连续打卡7天", "zh-TW": "連續打卡7天", "en": "Check in for 7 consecutive days"}', '🔥', 'streak', 7, 50),
  ('streak_30', '{"zh-CN": "月度达人", "zh-TW": "月度達人", "en": "Monthly Master"}', '{"zh-CN": "连续打卡30天", "zh-TW": "連續打卡30天", "en": "Check in for 30 consecutive days"}', '👑', 'streak', 30, 200),
  ('checkins_10', '{"zh-CN": "十次打卡", "zh-TW": "十次打卡", "en": "Ten Check-ins"}', '{"zh-CN": "累计打卡10次", "zh-TW": "累計打卡10次", "en": "Accumulate 10 check-ins"}', '📋', 'total_checkins', 10, 30),
  ('checkins_50', '{"zh-CN": "汉堡达人", "zh-TW": "漢堡達人", "en": "Burger Lover"}', '{"zh-CN": "累计打卡50次", "zh-TW": "累計打卡50次", "en": "Accumulate 50 check-ins"}', '⭐', 'total_checkins', 50, 100),
  ('checkins_100', '{"zh-CN": "汉堡之王", "zh-TW": "漢堡之王", "en": "Burger King"}', '{"zh-CN": "累计打卡100次", "zh-TW": "累計打卡100次", "en": "Accumulate 100 check-ins"}', '👑', 'total_checkins', 100, 300),
  ('photo_master', '{"zh-CN": "摄影大师", "zh-TW": "攝影大師", "en": "Photo Master"}', '{"zh-CN": "上传10张打卡照片", "zh-TW": "上傳10張打卡照片", "en": "Upload 10 check-in photos"}', '📸', 'photo_count', 10, 50),
  ('reviewer', '{"zh-CN": "评论家", "zh-TW": "評論家", "en": "Reviewer"}', '{"zh-CN": "发表20条评价", "zh-TW": "發表20條評價", "en": "Write 20 reviews"}', '💬', 'rating', 20, 50)
ON CONFLICT (code) DO NOTHING;

-- Sample Burgers (redeemable)
INSERT INTO burgers (name_zh_cn, name_zh_tw, name_en, image_url, points_reward) VALUES
  ('巨无霸', '大麥克', 'Big Mac', 'https://via.placeholder.com/200?text=Big+Mac', 100),
  ('双层吉士汉堡', '雙層吉事漢堡', 'Quarter Pounder with Cheese', 'https://via.placeholder.com/200?text=QPC', 80),
  ('麦辣鸡腿堡', '麥脆雞腿堡', 'McSpicy Chicken', 'https://via.placeholder.com/200?text=McSpicy', 80),
  ('麦香鱼', '麥香魚', 'Filet-O-Fish', 'https://via.placeholder.com/200?text=Fish', 60),
  ('麦乐鸡', '麥克雞塊', 'Chicken McNuggets', 'https://via.placeholder.com/200?text=Nuggets', 50)
ON CONFLICT DO NOTHING;
