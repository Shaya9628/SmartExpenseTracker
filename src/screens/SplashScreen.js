import React, { useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestSMSPermission } from '../services/smsReader';
import { initDatabase } from '../db/queries';

const SplashScreen = ({ navigation }) => {
  const [error, setError] = React.useState(null);
  useEffect(() => {
    let isMounted = true;
    let timeoutId;

    const initialize = async () => {
      try {
        // Initialize database first
        await initDatabase();
        console.log('Database initialized successfully');

        // Request SMS permission
        const smsPermissionGranted = await requestSMSPermission();
        console.log('SMS permission:', smsPermissionGranted ? 'granted' : 'denied');

        // Check onboarding status
        const hasOnboarded = await AsyncStorage.getItem('hasOnboarded');
        console.log('Onboarding status:', hasOnboarded ? 'completed' : 'pending');

        // Add 2 second delay before navigation
        timeoutId = setTimeout(() => {
          if (isMounted) {
            // Navigate based on onboarding status
            navigation.replace(hasOnboarded ? 'MainTabs' : 'Onboarding');
          }
        }, 2000);
      } catch (error) {
        console.error('Initialization error:', error);
        if (isMounted) {
          setError(error.message);
        }
      }
    };

    initialize();

    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text variant="displayLarge">💰</Text>
      <Text variant="headlineLarge" style={styles.title}>
        Smart Expense Tracker
      </Text>
      {error && (
        <Text variant="bodyMedium" style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    marginTop: 16,
  },
  error: {
    marginTop: 16,
    color: '#B00020',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default SplashScreen;
