/**
 * Resolvr Expo App
 * Main entry point
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
// import * as Notifications from 'expo-notifications';
import { AuthProvider } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import AppNavigator from './src/navigation/AppNavigator';

// Configure notification behavior (commented out for Expo Go compatibility)
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//   }),
// });

function App() {
  // useEffect(() => {
  //   // Request notification permissions for Expo
  //   (async () => {
  //     const { status } = await Notifications.requestPermissionsAsync();
  //     if (status !== 'granted') {
  //       console.log('Notification permissions not granted');
  //     }
  //   })();
  // }, []);
  return (
    <AuthProvider>
      <NotificationProvider>
        <NavigationContainer>
          <StatusBar barStyle="light-content" backgroundColor="#2c3e50" />
          <AppNavigator />
        </NavigationContainer>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
