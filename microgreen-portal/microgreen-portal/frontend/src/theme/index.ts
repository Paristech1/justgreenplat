import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    greenLight: Palette['primary'];
    greenDark: Palette['primary'];
    soil: Palette['primary'];
  }
  
  interface PaletteOptions {
    greenLight?: PaletteOptions['primary'];
    greenDark?: PaletteOptions['primary'];
    soil?: PaletteOptions['primary'];
  }
}

// Create a theme with custom colors that reflect the microgreens business
const theme = createTheme({
  palette: {
    primary: {
      main: '#4CAF50', // Bright green
      light: '#81C784',
      dark: '#388E3C',
    },
    secondary: {
      main: '#8BC34A', // Light green
      light: '#AED581',
      dark: '#689F38',
    },
    greenLight: {
      main: '#E8F5E9', // Very light green
      light: '#F1F8E9',
      dark: '#C8E6C9',
    },
    greenDark: {
      main: '#2E7D32', // Dark green
      light: '#388E3C',
      dark: '#1B5E20',
    },
    soil: {
      main: '#795548', // Brown for soil
      light: '#A1887F',
      dark: '#5D4037',
    },
    background: {
      default: '#F9FBF9', // Very light green/white
      paper: '#FFFFFF',
    },
    error: {
      main: '#E53935',
    },
    warning: {
      main: '#FFA000',
    },
    info: {
      main: '#29B6F6',
    },
    success: {
      main: '#43A047',
    },
    text: {
      primary: '#263238', // Dark gray with slight blue tint
      secondary: '#546E7A',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'Oxygen',
      'Ubuntu',
      'Cantarell',
      '"Fira Sans"',
      '"Droid Sans"',
      '"Helvetica Neue"',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.01562em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      letterSpacing: '-0.00833em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      letterSpacing: '0em',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: '0.00735em',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      letterSpacing: '0em',
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      letterSpacing: '0.0075em',
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 600,
      letterSpacing: '0.00938em',
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      letterSpacing: '0.00714em',
    },
    body1: {
      fontSize: '1rem',
      letterSpacing: '0.00938em',
    },
    body2: {
      fontSize: '0.875rem',
      letterSpacing: '0.01071em',
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 600,
      letterSpacing: '0.02857em',
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          },
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: '#3B8E3E',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: '16px 20px',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '16px 20px',
          '&:last-child': {
            paddingBottom: 16,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '16px 20px',
        },
        head: {
          backgroundColor: '#F5F7F6',
          color: '#263238',
          fontWeight: 600,
        },
      },
    },
  },
});

export default theme; 