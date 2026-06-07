import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../supabase/client';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import type { Post } from '../../lib/database.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 3) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.45;

export default function FeedScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const isLoadingRef = useRef(false);
  const PAGE_SIZE = 10;

  const fetchPosts = useCallback(async (pageNum: number, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else { setLoading(true); isLoadingRef.current = true; }

    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('posts')
      .select(`
        id, user_id, checkin_id, content, like_count, comment_count, created_at,
        checkin:checkin_id (
          id, store_name, address, lat, lng, photo_urls, rating, review, points_earned, created_at
        ),
        profile:user_id (
          id, username, avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching posts:', error);
    } else if (data) {
      if (isRefresh || pageNum === 0) {
        setPosts(data as unknown as Post[]);
      } else {
        setPosts(prev => [...prev, ...(data as unknown as Post[])]);
      }
      setHasMore(data.length === PAGE_SIZE);
    }

    setLoading(false);
    isLoadingRef.current = false;
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchPosts(0);
  }, [fetchPosts]);

  const onRefresh = () => {
    setPage(0);
    fetchPosts(0, true);
  };

  const onLoadMore = () => {
    if (!isLoadingRef.current && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage);
    }
  };

  const renderPostCard = ({ item, index }: { item: Post; index: number }) => {
    const photoUrls = (item.checkin as any)?.photo_urls || [];
    const storeName = (item.checkin as any)?.store_name || '';
    const username = (item.profile as any)?.username || 'Anonymous';
    const avatarUrl = (item.profile as any)?.avatar_url;
    const photoUrl = Array.isArray(photoUrls) && photoUrls.length > 0 ? photoUrls[0] : null;
    const rating = (item.checkin as any)?.rating || 0;
    // Alternate tilt for polaroid feel
    const tilt = index % 3 === 0 ? -2 : index % 3 === 1 ? 1 : 0;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          { marginLeft: index % 2 === 0 ? 0 : spacing.sm, marginRight: index % 2 === 0 ? spacing.sm : 0 },
          { transform: [{ rotate: tilt + 'deg' }] },
        ]}
        activeOpacity={0.92}
      >
        {/* Polaroid photo area */}
        <View style={styles.cardImageWrap}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.cardImage} />
          ) : (
            <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
              <Text style={styles.placeholderEmoji}>🍔</Text>
            </View>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.4)']}
            style={styles.cardOverlay}
          />
          <Text style={styles.cardStoreOverlay} numberOfLines={1}>
            {storeName || "McDonald's"}
          </Text>
        </View>

        {/* Polaroid bottom area */}
        <View style={styles.cardContent}>
          {rating > 0 && (
            <Text style={styles.ratingText}>{'⭐'.repeat(rating)}</Text>
          )}
          <View style={styles.userRow}>
            <View style={[styles.avatar, !avatarUrl && styles.avatarPlaceholder]}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarEmoji}>😊</Text>
              )}
            </View>
            <Text style={styles.username} numberOfLines={1}>{username}</Text>
          </View>
          <View style={styles.actions}>
            <Text style={styles.actionItem}>❤️ {item.like_count || 0}</Text>
            <Text style={styles.actionItem}>💬 {item.comment_count || 0}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t('feed.title')}</Text>
          <Text style={styles.headerSub}>Discover burger moments</Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerEmoji}>🍔</Text>
        </View>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPostCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📸</Text>
              <Text style={styles.emptyTitle}>No moments yet</Text>
              <Text style={styles.emptySub}>Be the first to check in!</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loading && posts.length > 0 ? (
            <View style={styles.footer}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : null
        }
      />
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
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  headerBadge: {
    backgroundColor: colors.backgroundSecondary,
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 22,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  cardImageWrap: {
    width: '100%',
    height: CARD_HEIGHT * 0.7,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardImagePlaceholder: {
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 40,
    opacity: 0.5,
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  cardStoreOverlay: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.md,
    right: spacing.md,
    color: colors.textInverse,
    fontSize: 13,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cardContent: {
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  ratingText: {
    fontSize: 11,
    marginBottom: spacing.xs,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  avatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  avatarEmoji: {
    fontSize: 11,
  },
  username: {
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionItem: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: spacing.lg,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  footer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
});
