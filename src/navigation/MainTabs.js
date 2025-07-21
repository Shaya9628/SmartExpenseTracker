import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Import screens
import DashboardScreen from '../screens/DashboardScreen';
import HistoryScreen from '../screens/HistoryScreen';

const Tab = createBottomTabNavigator();

const MainTabs = () => {
  // Apply marginBottom only on Android SDK 35
  const tabBarMarginBottom = Platform.OS === 'android' && Platform.Version === 35 ? 50 : 0;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#6200ee',
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          marginBottom: tabBarMarginBottom,
        },
      }}>
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="view-dashboard" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={HistoryScreen}
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="history" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabs;
