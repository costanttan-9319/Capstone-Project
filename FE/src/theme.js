import { createTheme } from '@mui/material/styles';

// Brand colors from your app (extracted from pages.css)
const brandColors = {
  pink: '#d81473',
  darkPink: '#9e064f',
  lightPink: '#fff0f6',
  gold: '#ffbe1b',
  darkGold: '#ff8c00',
  success: '#65da0c',
  warning: '#ff9800',
  error: '#f61201',
  purple: '#6f42c1',
  orange: '#fd7e14',
  white: '#ffffff',
  black: '#333333',
  gray: '#666666',
  lightGray: '#999999',
  bgGray: '#f5f5f5',
  borderGray: '#eee',
  dropdownShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  cardShadow: '0 2.8px 8.4px rgba(0,0,0,0.05)',
  cardHoverShadow: '0 8.4px 21px rgba(216, 20, 115, 0.2)',
};

// Layout constants - UNIFIED
export const layout = {
  maxWidth: '1200px',
  containerPadding: '2rem',
  containerPaddingMobile: '1rem',
  cardBorderRadius: '17.5px',
  searchBorderRadius: '20px',
  inputBorderRadius: '12px',
  buttonBorderRadius: '12px',
  gridGap: '2rem',
  gridGapMobile: '1.5rem',
  sectionMarginBottom: '4rem',
  sectionMarginBottomMobile: '3rem',
};

// Breakpoints from pages.css
export const breakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200,
};

const theme = createTheme({
  palette: {
    primary: {
      main: brandColors.pink,
      light: brandColors.lightPink,
      dark: brandColors.darkPink,
      contrastText: '#ffffff',
    },
    secondary: {
      main: brandColors.gold,
      light: '#fff3e0',
      dark: brandColors.darkGold,
      contrastText: '#ffffff',
    },
    success: { main: brandColors.success },
    warning: { main: brandColors.warning },
    error: { main: brandColors.error },
    info: { main: brandColors.purple },
    background: {
      default: brandColors.bgGray,
      paper: brandColors.white,
    },
    text: {
      primary: brandColors.black,
      secondary: brandColors.gray,
      disabled: brandColors.lightGray,
    },
  },

  typography: {
    fontFamily: "'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', sans-serif",
    h1: {
      fontSize: '2rem',
      fontWeight: 600,
      color: brandColors.black,
    },
    h2: {
      fontSize: '1.8rem',
      fontWeight: 700,
      color: brandColors.pink,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.2rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
      color: brandColors.black,
    },
    body2: {
      fontSize: '0.875rem',
      color: brandColors.gray,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
    // From pages.css tier-title
    tierTitle: {
      fontSize: '1.8rem',
      fontWeight: 700,
      color: brandColors.pink,
      letterSpacing: '1px',
      whiteSpace: 'nowrap',
    },
    // From pages.css tier-subtitle
    tierSubtitle: {
      fontSize: '1rem',
      color: brandColors.lightGray,
      textAlign: 'center',
    },
  },

  shape: {
    borderRadius: 12,
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: layout.buttonBorderRadius,
          padding: '10px 20px',
          fontWeight: 600,
          '&:hover': {
            transform: 'translateY(-2px)',
            transition: 'transform 0.2s ease',
          },
        },
        containedPrimary: {
          backgroundColor: brandColors.pink,
          '&:hover': { backgroundColor: brandColors.darkPink },
        },
        containedSecondary: {
          backgroundColor: brandColors.gold,
          '&:hover': { backgroundColor: brandColors.darkGold },
        },
        outlinedPrimary: {
          borderColor: brandColors.pink,
          color: brandColors.pink,
          '&:hover': { backgroundColor: brandColors.lightPink },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 17.5,
          boxShadow: layout.cardShadow,
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-7px)',
            boxShadow: layout.cardHoverShadow,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: brandColors.white,
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
          color: brandColors.black,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: brandColors.pink,
          '&:hover': { backgroundColor: brandColors.lightPink },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { width: 280, backgroundColor: brandColors.white },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: brandColors.lightPink,
            borderLeft: `3px solid ${brandColors.pink}`,
            color: brandColors.pink,
          },
          '&:hover': { backgroundColor: brandColors.lightPink },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 12 },
        colorPrimary: {
          backgroundColor: brandColors.lightPink,
          color: brandColors.pink,
        },
        colorSecondary: {
          backgroundColor: '#fff3e0',
          color: brandColors.gold,
        },
      },
    },
    MuiRating: {
      styleOverrides: {
        iconFilled: { color: brandColors.pink },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          '&.Mui-selected': { color: brandColors.pink },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { backgroundColor: brandColors.pink },
      },
    },
  },

  breakpoints: {
    values: {
      xs: 0,
      sm: breakpoints.mobile,
      md: breakpoints.tablet,
      lg: breakpoints.desktop,
      xl: 1536,
    },
  },
});

// UNIFIED CONTAINER RULES - Apply these in your global CSS or inline styles
export const containerStyles = {
  // All containers share same max-width
  '.results-container, .tier-container, .random-store-container, .favourite-container, .top-picks-page, .profile-container, .reset-container, .signup-container, .admin-requests-container': {
    maxWidth: layout.maxWidth,
    width: '100%',
    margin: '0 auto',
  },
  // Grid: 2 cards desktop, 1 card mobile
  '.store-grid, .top-picks-grid': {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: layout.gridGap,
    width: '100%',
  },
  [`@media (max-width: ${breakpoints.mobile}px)`]: {
    '.store-grid, .top-picks-grid': {
      gridTemplateColumns: '1fr',
      gap: layout.gridGapMobile,
    },
  },
};

// Status pill colors from pages.css
export const statusColors = {
  open: brandColors.success,
  'closing-soon': brandColors.warning,
  closed: brandColors.error,
  red: brandColors.error,
  green: brandColors.success,
  orange: brandColors.orange,
  purple: brandColors.purple,
};

// Export brand colors
export const colors = brandColors;

export default theme;