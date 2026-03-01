export const Colors = {
  // Primary palette
  primary: '#6C63FF',
  primaryDark: '#4B44CC',
  primaryLight: '#A89FFF',
  primaryGhost: '#6C63FF18',

  // Accent
  accent: '#FF4D6D',
  accentLight: '#FF4D6D22',

  // Neutrals
  background: '#0F0F1A',
  headerBg: '#0D0D1A',
  surface: '#1A1A2E',
  card: '#1C1C2E',
  surfaceElevated: '#22223A',
  surfaceBorder: '#2E2E4A',
  cardBorder: '#2A2A3E',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0C0',
  textMuted: '#606080',
  textInverse: '#0F0F1A',

  // Status
  success: '#4CAF82',
  warning: '#FFB74D',
  error: '#FF5252',
  info: '#29B6F6',

  // Stores
  amazon: '#FF9900',
  flipkart: '#2874F0',
  myntra: '#FF3F6C',
  meesho: '#9B26B9',
  ajio: '#E91E63',
  snapdeal: '#E40046',

  // Misc
  white: '#FFFFFF',
  black: '#000000',
  overlay: '#00000088',
  divider: '#FFFFFF10',
  gold: '#FFD700',
};

export const Typography = {
  // Font families (set up vector fonts, fallback to system)
  fontRegular: 'System',
  fontMedium: 'System',
  fontSemiBold: 'System',
  fontBold: 'System',

  // Sizes
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 36,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 999,
};

export const Shadows = {
  sm: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
};

const theme = { Colors, Typography, Spacing, BorderRadius, Shadows };
export default theme;
