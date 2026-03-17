'use client'

import { createTheme } from '@mui/material/styles'

export function createAppTheme(mode: 'light' | 'dark') {
  const isDark = mode === 'dark'

  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#1976d2',
        light: '#42a5f5',
        dark: '#1565c0',
      },
      secondary: {
        main: '#9c27b0',
        light: '#ba68c8',
        dark: '#7b1fa2',
      },
      success: {
        main: '#2e7d32',
      },
      warning: {
        main: '#ed6c02',
      },
      error: {
        main: '#d32f2f',
      },
      background: {
        default: isDark ? '#0f172a' : '#f5f5f5',
        paper: isDark ? '#1e293b' : '#ffffff',
      },
      text: {
        primary: isDark ? '#f1f5f9' : 'rgba(0, 0, 0, 0.87)',
        secondary: isDark ? '#94a3b8' : 'rgba(0, 0, 0, 0.6)',
      },
      divider: isDark ? '#334155' : 'rgba(0, 0, 0, 0.12)',
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
        letterSpacing: '-0.02em',
      },
      h2: {
        fontWeight: 700,
        letterSpacing: '-0.02em',
      },
      h3: {
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      h4: {
        fontWeight: 700,
        letterSpacing: '-0.02em',
      },
      h5: {
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      h6: {
        fontWeight: 600,
      },
      body1: {
        lineHeight: 1.6,
      },
      body2: {
        lineHeight: 1.5,
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            transition: 'all 0.2s ease',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            boxShadow: isDark
              ? '0 2px 8px rgba(0,0,0,0.3)'
              : '0 2px 8px rgba(0,0,0,0.08)',
            transition: 'box-shadow 0.2s ease, transform 0.2s ease, background-color 0.3s ease',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            transition: 'box-shadow 0.2s ease, background-color 0.3s ease',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottomColor: isDark ? '#334155' : 'rgba(224, 224, 224, 1)',
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? '#475569' : 'rgba(0, 0, 0, 0.23)',
              transition: 'border-color 0.3s ease',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? '#64748b' : 'rgba(0, 0, 0, 0.87)',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            ...(isDark && {
              borderColor: '#475569',
            }),
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            ...(isDark && {
              backgroundColor: undefined,
            }),
          },
        },
      },
    },
  })
}

// Backward compatibility: export the light theme as default
export const theme = createAppTheme('light')

export default theme
