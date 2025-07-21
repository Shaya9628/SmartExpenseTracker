import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OnboardingScreen = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Welcome!',
      description: 'Track your expenses automatically through SMS notifications',
      icon: '📱',
    },
    {
      title: 'Smart Parsing',
      description: 'We automatically categorize your transactions',
      icon: '🤖',
    },
    {
      title: 'Insights',
      description: 'Get detailed analytics of your spending habits',
      icon: '📊',
    },
  ];

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await AsyncStorage.setItem('hasOnboarded', 'true');
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }]
      });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.icon}>{steps[currentStep].icon}</Text>
        <Text variant="headlineMedium" style={styles.title}>
          {steps[currentStep].title}
        </Text>
        <Text variant="bodyLarge" style={styles.description}>
          {steps[currentStep].description}
        </Text>
      </ScrollView>
      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={handleNext}
          style={styles.button}
        >
          {currentStep < steps.length - 1 ? 'Next' : 'Get Started'}
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  icon: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    textAlign: 'center',
    opacity: 0.7,
  },
  footer: {
    padding: 24,
  },
  button: {
    width: '100%',marginBottom:50
  },
});

export default OnboardingScreen;
