import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider } from 'react-redux';

// Import screens
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import MainTabs from './MainTabs';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import HistoryScreen from '../screens/HistoryScreen';

// Theme
import { theme } from './theme';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.primary,
            },
            headerTintColor: theme.colors.onPrimary,
          }}>
          <Stack.Screen
            name="Splash"
            component={SplashScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{
              title: 'Smart Expense Tracker',
            }}
          />
          <Stack.Screen
            name="AddExpense"
            component={AddExpenseScreen}
            options={{ title: 'Add Expense' }}
          />
          <Stack.Screen
            name="History"
            component={HistoryScreen}
            options={{ title: 'Transaction History' }}
          />
        </Stack.Navigator>
      </GestureHandlerRootView>
    </NavigationContainer>
  );
};

export const AppWithNavigation = ({ store }) => (
  <Provider store={store}>
    <PaperProvider theme={theme}>
      <AppNavigator />
    </PaperProvider>
  </Provider>
);
