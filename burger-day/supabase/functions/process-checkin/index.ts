// Edge Function: process-checkin
// Triggered after a new checkin is inserted.
// Calculates points and checks achievements.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface CheckinEvent {
  type: 'INSERT';
  table: string;
  record: {
    id: string;
    user_id: string;
    rating: number;
    review: string | null;
    photo_urls: string[];
    created_at: string;
  };
}

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const event: CheckinEvent = await req.json();

    if (event.type !== 'INSERT' || event.table !== 'checkins') {
      return new Response('OK', { status: 200 });
    }

    const { user_id, id: checkinId, rating, review, photo_urls, created_at } = event.record;

    // === 1. Calculate Points ===
    let basePoints = 10;
    let photoBonus = 0;
    let reviewBonus = 0;
    let streakBonus = 0;

    // Photo bonus: 5 points per photo, max 15
    const photoCount = photo_urls?.length || 0;
    photoBonus = Math.min(photoCount * 5, 15);

    // Review bonus: 5 points if review exists
    if (review && review.trim().length > 0) {
      reviewBonus = 5;
    }

    // Rating bonus: extra points for high ratings
    const ratingBonus = Math.max(0, (rating || 3) - 3) * 2;

    // Streak calculation
    const { data: lastCheckin } = await supabase
      .from('checkins')
      .select('created_at')
      .eq('user_id', user_id)
      .neq('id', checkinId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let currentStreak = 1;
    if (lastCheckin) {
      const lastDate = new Date(lastCheckin.created_at).toDateString();
      const today = new Date(created_at).toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();

      // Get current streak from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_streak, max_streak, total_checkins')
        .eq('id', user_id)
        .single();

      if (profile) {
        if (lastDate === yesterday) {
          currentStreak = profile.current_streak + 1;
        } else if (lastDate === today) {
          // Same day checkin, don't increment streak
          currentStreak = profile.current_streak;
        } else {
          currentStreak = 1;
        }
      }
    }

    // Streak bonus: 2 points per consecutive day
    streakBonus = Math.min((currentStreak - 1) * 2, 20);

    const totalPoints = basePoints + photoBonus + reviewBonus + ratingBonus + streakBonus;

    // === 2. Update Profile ===
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    const newTotalCheckins = (currentProfile?.total_checkins || 0) + 1;
    const newTotalPoints = (currentProfile?.total_points || 0) + totalPoints;

    await supabase
      .from('profiles')
      .update({
        total_points: newTotalPoints,
        total_checkins: newTotalCheckins,
        current_streak: currentStreak,
        max_streak: Math.max(currentStreak, currentProfile?.max_streak || 0),
      })
      .eq('id', user_id);

    // Update the checkin with points earned
    await supabase
      .from('checkins')
      .update({ points_earned: totalPoints })
      .eq('id', checkinId);

    // === 3. Check Achievements ===
    const { data: achievements } = await supabase
      .from('achievements')
      .select('*');

    if (achievements) {
      // Calculate aggregate stats for achievement checking
      const { data: allCheckins } = await supabase
        .from('checkins')
        .select('rating, photo_urls, review')
        .eq('user_id', user_id);

      const totalReviews = allCheckins?.filter(c => c.review && c.review.trim().length > 0).length || 0;
      const totalPhotos = allCheckins?.reduce((sum, c) => sum + (c.photo_urls?.length || 0), 0) || 0;

      for (const achievement of achievements) {
        let earned = false;

        switch (achievement.trigger_type) {
          case 'total_checkins':
            earned = newTotalCheckins >= achievement.trigger_threshold;
            break;
          case 'streak':
            earned = currentStreak >= achievement.trigger_threshold;
            break;
          case 'total_points':
            earned = newTotalPoints >= achievement.trigger_threshold;
            break;
          case 'rating':
            earned = totalReviews >= achievement.trigger_threshold;
            break;
          case 'photo_count':
            earned = totalPhotos >= achievement.trigger_threshold;
            break;
        }

        if (earned) {
          // Check if already awarded
          const { data: existing } = await supabase
            .from('user_achievements')
            .select('*')
            .eq('user_id', user_id)
            .eq('achievement_id', achievement.id)
            .maybeSingle();

          if (!existing) {
            await supabase.from('user_achievements').insert({
              user_id,
              achievement_id: achievement.id,
            });

            // Award achievement points bonus
            if (achievement.points_reward > 0) {
              await supabase
                .from('profiles')
                .update({ total_points: newTotalPoints + achievement.points_reward })
                .eq('id', user_id);
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        points_earned: totalPoints,
        streak: currentStreak,
        breakdown: { basePoints, photoBonus, reviewBonus, ratingBonus, streakBonus },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing checkin:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
