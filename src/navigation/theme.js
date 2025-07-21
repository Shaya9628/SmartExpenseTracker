import { MD3LightTheme } from 'react-native-paper';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2D3748',
    primaryContainer: '#4A5568',
    secondary: '#4C6FFF',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceVariant: '#F1F5F9',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: '#1A202C',
    onSurface: '#1A202C',
    error: '#E53E3E',
    success: '#38A169',
    warning: '#DD6B20',
  },
  roundness: 8,
  dark: false,
};

export default theme;
