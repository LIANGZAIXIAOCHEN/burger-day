import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
  TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, borderRadius } from '../../theme';

interface NearbyStore {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance?: number;
}

export default function CheckinScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user, refreshProfile } = useAuth();

  const [nearbyStores, setNearbyStores] = useState<NearbyStore[]>([]);
  const [selectedStore, setSelectedStore] = useState<NearbyStore | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'location' | 'store' | 'photo' | 'review' | 'done'>('location');

  // Request location permission
  const requestLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('checkin.locationRequired'), t('checkin.locationPermission'));
      return;
    }
    setSearching(true);
    const loc = await Location.getCurrentPositionAsync({});
    await searchNearbyStores(loc);
    setSearching(false);
  };

  // Search nearby McDonald's using reverse geocode + hardcoded search
  const searchNearbyStores = async (loc: Location.LocationObject) => {
    setSearching(true);
    try {
      // Use reverse geocode to get address, then find McDonald's
      const geocoded = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      // For demo, generate mock nearby stores based on current location
      // In production, use a real POI API (Amap/Apple MapKit)
      const mockStores: NearbyStore[] = [
        {
          id: '1',
          name: "McDonald's - 市中心店",
          address: geocoded[0]?.street || 'Main Street 123',
          lat: loc.coords.latitude + 0.002,
          lng: loc.coords.longitude + 0.001,
        },
        {
          id: '2',
          name: "McDonald's - 购物中心店",
          address: geocoded[0]?.street || 'Shopping Mall',
          lat: loc.coords.latitude - 0.001,
          lng: loc.coords.longitude + 0.003,
        },
        {
          id: '3',
          name: "McDonald's - 火车站店",
          address: geocoded[0]?.street || 'Station Square',
          lat: loc.coords.latitude + 0.003,
          lng: loc.coords.longitude - 0.002,
        },
      ];

      setNearbyStores(mockStores);
      setStep('store');
    } catch (error) {
      console.error('Error searching stores:', error);
      Alert.alert(t('common.error'), t('checkin.noNearbyStores'));
    }
    setSearching(false);
  };

  // Pick photo from camera or gallery
  const pickPhoto = async (useCamera: boolean) => {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow access to continue');
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          quality: 0.8,
          allowsEditing: true,
          aspect: [4, 3],
        })
      : await ImagePicker.launchImageLibraryAsync({
          quality: 0.8,
          allowsEditing: true,
          aspect: [4, 3],
        });

    if (!result.canceled && result.assets[0]) {
      setPhotos(prev => [...prev, result.assets[0].uri]);
    }
  };

  const showPhotoPicker = () => {
    Alert.alert(t('checkin.takePhoto'), '', [
      { text: t('checkin.takePhoto'), onPress: () => pickPhoto(true) },
      { text: t('checkin.pickFromGallery'), onPress: () => pickPhoto(false) },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  // Submit checkin
  const handleSubmit = async () => {
    if (!selectedStore || !user) return;
    if (rating === 0) {
      Alert.alert('', t('checkin.rating'));
      return;
    }

    setSubmitting(true);
    try {
      // Upload photos to Supabase Storage
      const photoUrls: string[] = [];
      for (const photoUri of photos) {
        const photoId = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const response = await fetch(photoUri);
        const blob = await response.blob();
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('checkin-photos')
          .upload(photoId, blob, { contentType: 'image/jpeg' });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }
        const { data: urlData } = supabase.storage
          .from('checkin-photos')
          .getPublicUrl(photoId);
        if (urlData) {
          photoUrls.push(urlData.publicUrl);
        }
      }

      // Insert checkin record
      const { data: checkin, error: checkinError } = await supabase
        .from('checkins')
        .insert({
          user_id: user.id,
          store_id: selectedStore.id,
          store_name: selectedStore.name,
          address: selectedStore.address,
          lat: selectedStore.lat,
          lng: selectedStore.lng,
          photo_urls: photoUrls,
          rating,
          review: review.trim() || null,
          points_earned: 0, // Will be calculated by Edge Function
        })
        .select()
        .single();

      if (checkinError) throw checkinError;

      // Create a post for the feed
      await supabase.from('posts').insert({
        user_id: user.id,
        checkin_id: checkin.id,
        content: review.trim() || null,
      });

      await refreshProfile();
      setStep('done');
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    }
    setSubmitting(false);
  };

  const resetCheckin = () => {
    setSelectedStore(null);
    setPhotos([]);
    setRating(0);
    setReview('');
    setStep('location');
    setNearbyStores([]);
  };

  // Step: Location
  if (step === 'location') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.stepContainer}>
          <Text style={styles.stepEmoji}>📍</Text>
          <Text style={styles.stepTitle}>{t('checkin.findStore')}</Text>
          <Text style={styles.stepDesc}>{t('checkin.locationPermission')}</Text>
          <TouchableOpacity
            style={[styles.primaryButton, searching && styles.buttonDisabled]}
            onPress={requestLocation}
            disabled={searching}
          >
            {searching ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.primaryButtonText}>
                {t('checkin.findStore')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Step: Select Store
  if (step === 'store') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('checkin.nearbyStores')}</Text>
        </View>
        <ScrollView style={styles.storeList}>
          {nearbyStores.map(store => (
            <TouchableOpacity
              key={store.id}
              style={[
                styles.storeCard,
                selectedStore?.id === store.id && styles.storeCardSelected,
              ]}
              onPress={() => {
                setSelectedStore(store);
                setStep('photo');
              }}
            >
              <Text style={styles.storeIcon}>🏪</Text>
              <View style={styles.storeInfo}>
                <Text style={styles.storeName}>{store.name}</Text>
                <Text style={styles.storeAddress}>{store.address}</Text>
              </View>
              <Text style={styles.storeArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  // Step: Photo
  if (step === 'photo') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.stepContainer}>
          <Text style={styles.stepEmoji}>📸</Text>
          <Text style={styles.stepTitle}>{t('checkin.takePhoto')}</Text>
          <Text style={styles.stepDesc}>
            Take a photo of your burger to earn bonus points!
          </Text>

          {photos.length > 0 ? (
            <View style={styles.photoPreviewContainer}>
              {photos.map((uri, i) => (
                <Image key={i} source={{ uri }} style={styles.photoPreview} />
              ))}
            </View>
          ) : null}

          <View style={styles.photoButtons}>
            <TouchableOpacity style={styles.photoButton} onPress={showPhotoPicker}>
              <Text style={styles.photoButtonIcon}>📷</Text>
              <Text style={styles.photoButtonText}>
                {photos.length > 0 ? t('checkin.takePhoto') : t('checkin.takePhoto')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.navButtons}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep('store')}>
              <Text style={styles.secondaryButtonText}>{t('common.back')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setStep('review')}
            >
              <Text style={styles.primaryButtonText}>{t('common.next')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Step: Review & Submit
  if (step === 'review') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView style={styles.reviewContainer}>
          <Text style={styles.stepEmoji}>⭐</Text>
          <Text style={styles.stepTitle}>{t('checkin.rating')}</Text>

          {/* Rating Stars */}
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map(star => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Text style={[styles.star, star <= rating && styles.starActive]}>
                  ★
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Review Text */}
          <TextInput
            style={styles.reviewInput}
            placeholder={t('checkin.reviewPlaceholder')}
            placeholderTextColor={colors.textTertiary}
            value={review}
            onChangeText={setReview}
            multiline
            numberOfLines={4}
          />

          {/* Summary */}
          {selectedStore && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>{selectedStore.name}</Text>
              <Text style={styles.summaryAddress}>{selectedStore.address}</Text>
              <Text style={styles.summaryPhotos}>
                📸 {photos.length} photo{photos.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}

          <View style={styles.navButtons}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep('photo')}>
              <Text style={styles.secondaryButtonText}>{t('common.back')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, submitting && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text style={styles.primaryButtonText}>{t('checkin.submitCheckin')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Step: Done
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.stepContainer}>
        <Text style={styles.successEmoji}>🎉</Text>
        <Text style={styles.stepTitle}>{t('checkin.checkinSuccess')}</Text>
        <Text style={styles.pointsEarned}>+50 {t('rewards.pointsPrefix')}</Text>
        <TouchableOpacity style={[styles.primaryButton, { marginTop: 32 }]} onPress={resetCheckin}>
          <Text style={styles.primaryButtonText}>{t('checkin.title')}</Text>
        </TouchableOpacity>
      </View>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  stepEmoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  successEmoji: {
    fontSize: 80,
    marginBottom: spacing.lg,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  stepDesc: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    minWidth: 200,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  // Store list
  storeList: {
    flex: 1,
    padding: spacing.lg,
  },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  storeCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FFFDF0',
  },
  storeIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  storeAddress: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  storeArrow: {
    fontSize: 24,
    color: colors.textTertiary,
  },
  // Photo
  photoPreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: 32,
  },
  photoButton: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    minWidth: 120,
  },
  photoButtonIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  photoButtonText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  // Review
  reviewContainer: {
    flex: 1,
    padding: spacing.xxl,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: 32,
    marginTop: spacing.lg,
  },
  star: {
    fontSize: 40,
    color: colors.starInactive,
  },
  starActive: {
    color: colors.starActive,
  },
  reviewInput: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    fontSize: 16,
    color: colors.textPrimary,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  summaryCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  summaryAddress: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  summaryPhotos: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  navButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
  },
  pointsEarned: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.accent,
    marginTop: spacing.md,
  },
});
