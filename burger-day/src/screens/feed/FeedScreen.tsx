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
import { supabase } from '../../supabase/client';
import { colors, spacing, borderRadius } from '../../theme';
import type { Post } from '../../lib/database.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 3) / 2;

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

    return (
      <TouchableOpacity
        style={[
          styles.card,
          index % 2 === 1 ? { marginLeft: spacing.sm } : { marginRight: spacing.sm },
        ]}
        activeOpacity={0.9}
      >
        {/* Photo */}
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
            <Text style={styles.placeholderEmoji}>🍔</Text>
          </View>
        )}

        {/* Content */}
        <View style={styles.cardContent}>
          {/* Store name */}
          <Text style={styles.storeName} numberOfLines={1}>
            {storeName || 'McDonald\'s'}
          </Text>

          {/* Rating */}
          {(item.checkin as any)?.rating && (
            <Text style={styles.rating}>
              {'⭐'.repeat((item.checkin as any).rating)}
            </Text>
          )}

          {/* User & actions */}
          <View style={styles.cardFooter}>
            <View style={styles.userRow}>
              <View style={[styles.avatar, !avatarUrl && styles.avatarPlaceholder]}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>😊</Text>
                )}
              </View>
              <Text style={styles.username} numberOfLines={1}>{username}</Text>
            </View>
            <View style={styles.actions}>
              <Text style={styles.actionText}>❤️ {item.like_count || 0}</Text>
              <Text style={styles.actionText}>💬 {item.comment_count || 0}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('feed.title')}</Text>
        <Text style={styles.headerEmoji}>🍔</Text>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPostCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📸</Text>
              <Text style={styles.emptyText}>{t('common.noData')}</Text>
              <Text style={styles.emptySubtext}>Be the first to check in!</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loading && posts.length > 0 ? (
            <View style={styles.footer}>
              <ActivityIndicator color={colors.primary} />
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
  headerEmoji: {
    fontSize: 24,
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
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: CARD_WIDTH * 1.2,
    resizeMode: 'cover',
  },
  cardImagePlaceholder: {
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 40,
  },
  cardContent: {
    padding: spacing.md,
  },
  storeName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  rating: {
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  avatarText: {
    fontSize: 12,
  },
  username: {
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionText: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  footer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
});
