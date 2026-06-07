// ── 堡了么 Design System ──
// Warm, modern, scrapbook-inspired aesthetic

export const colors = {
  // Brand colors
  primary: '#FFC72C', // McDonald's Yellow — warm, energetic
  primaryDark: '#E5B028',
  primaryLight: '#FFF3CC',
  accent: '#DA291C', // McDonald's Red — bold accent
  accentDark: '#B82218',
  accentLight: '#FFE0DD',

  // Backgrounds — warm off-whites
  background: '#FFFAF5',     // warm cream
  backgroundSecondary: '#FFF5ED', // warmer tint
  backgroundTertiary: '#FFEDE0',
  card: '#FFFFFF',
  cardWarm: '#FFFDFA',

  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#8B7355',   // warm brown-gray
  textTertiary: '#B8A58A',    // lighter warm
  textInverse: '#FFFFFF',

  // UI
  border: '#F0E6D8',
  borderLight: '#F5EDE2',
  divider: '#F5EDE2',

  // Feedback
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Shadows — warm tint
  shadow: '#000000',
  shadowLight: 'rgba(180, 120, 60, 0.08)',
  shadowCard: 'rgba(0, 0, 0, 0.06)',

  // Tab bar
  tabActive: '#DA291C',
  tabInactive: '#C4B59E',

  // Gradients
  gradientStart: '#FFC72C',
  gradientMid: '#F5A623',
  gradientEnd: '#DA291C',

  // Rating stars
  starActive: '#FFC72C',
  starInactive: '#EDE0D4',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.4)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const borderRadius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 24,
  full: 9999,
};

export const shadows = {
  card: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHover: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  button: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  floating: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
};
