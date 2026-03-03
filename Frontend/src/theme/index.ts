export const Colors = {
  // Primary palette (Deep Slate/Teal from reference)
  primary: '#2E4C50', // The deep teal used for buttons and the tab bar
  primaryDark: '#1A2F33', // Darker variant for pressed states or headers
  primaryLight: '#4A6B6F',
  primaryGhost: '#2E4C5015', // Super light tint for active states

  // Secondary / Accent
  accent: '#E6F0F2',  // Light grayish teal for secondary backgrounds (like search bar)
  accentLight: '#F5F9FA', // Very light tint for backgrounds

  // Neutrals (Clean, minimal palette)
  background: '#FFFFFF', // Clean white background
  headerBg: '#FFFFFF',
  surface: '#FFFFFF', // White surfaces for cards
  card: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceBorder: '#F0F0F0', // Very light gray borders for structure
  cardBorder: '#EAEAEA',

  // Text
  textPrimary: '#111518', // Near black for strong readability
  textSecondary: '#6B7A80', // Slate gray for secondary text
  textMuted: '#9BA9AF',     // Lighter gray for placeholders/inactive
  textInverse: '#FFFFFF',   // White text on primary backgrounds

  // Status
  success: '#2E7D32',
  warning: '#ED6C02',
  error: '#D32F2F',
  info: '#0288D1',

  // Misc
  white: '#FFFFFF',
  black: '#000000',
  gold: '#FFD700',
  overlay: 'rgba(0, 0, 0, 0.4)',
  divider: '#EBEBEB',
  transparent: 'transparent',
};

export const Typography = {
  // Font families (using system default, but weights will be clean)
  fontRegular: 'System',
  fontMedium: 'System',
  fontSemiBold: 'System',
  fontBold: 'System',

  // Sizes for a modern scale
  xs: 11,
  sm: 13,
  base: 15, // Slightly larger base for modern feel
  md: 17,
  lg: 19,
  xl: 22,
  xxl: 26,
  xxxl: 32,
  display: 40,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16, // Typical padding
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const BorderRadius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20, // For average cards
  xl: 26, // For larger cards or the search bar
  xxl: 36, // For fully pill-shaped items like the tab bar
  full: 9999,
};

export const Shadows = {
  sm: { // Soft, barely visible shadow for subtle depth
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  md: { // Standard soft shadow for cards
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: { // Pronounced soft shadow for floating elements (like tab bar)
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
};

const theme = { Colors, Typography, Spacing, BorderRadius, Shadows };
export default theme;
