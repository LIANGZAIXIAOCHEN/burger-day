import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/AppNavigator';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Register'>;
};

export default function RegisterScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('common.error'), t('auth.emailPlaceholder'));
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('auth.confirmPassword'));
      return;
    }
    if (password.length < 6) {
      Alert.alert(t('common.error'), 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const result = await signUp(email.trim(), password);
      if (result === 'auto-login') {
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      } else {
        Alert.alert(
          t('auth.register'),
          'Verification email sent. Please check your inbox.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={[colors.background, colors.backgroundSecondary, colors.backgroundTertiary]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.graphicSection}>
        <View style={styles.floatingBadge}>
          <Text style={styles.burgerEmoji}>🍔</Text>
        </View>
        <Text style={styles.title}>{t('auth.registerTitle')}</Text>
        <Text style={styles.subtitle}>{t('auth.registerSubtitle')}</Text>
      </View>

      <View style={styles.formCard}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder={t('auth.emailPlaceholder')}
            placeholderTextColor={colors.textTertiary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder={t('auth.passwordPlaceholder')}
            placeholderTextColor={colors.textTertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{t('auth.confirmPassword')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('auth.confirmPassword')}
            placeholderTextColor={colors.textTertiary}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitGrad}
          >
            {loading ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.submitText}>{t('auth.register')}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.linkText}>
            {t('auth.hasAccount')}{' '}
            <Text style={styles.linkHighlight}>{t('auth.loginNow')}</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  graphicSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  floatingBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.floating,
  },
  burgerEmoji: {
    fontSize: 38,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    ...shadows.card,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 15,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  submitBtn: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginTop: spacing.sm,
    ...shadows.button,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitGrad: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitText: {
    color: colors.textInverse,
    fontSize: 17,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xxl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderLight,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    color: colors.textTertiary,
    fontSize: 13,
  },
  linkBtn: {
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  linkHighlight: {
    color: colors.accent,
    fontWeight: '700',
  },
});
