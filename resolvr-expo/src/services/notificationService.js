/**
 * Notification Service (Expo Version - Disabled for Expo Go)
 * Handles push notifications setup and management
 */

// import * as Notifications from 'expo-notifications';
// import * as Device from 'expo-device';
import { Platform } from 'react-native';

let expoPushToken = null;

/**
 * Setup push notifications for Expo (disabled for Expo Go compatibility)
 */
export const setupNotifications = async () => {
  console.log('Notifications disabled in Expo Go');
  return null;
  /* Commented out for Expo Go compatibility
  try {
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return null;
    }

    // Request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied');
      return null;
    }

    // Get Expo push token
    expoPushToken = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Expo Push Token:', expoPushToken);

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });

      await Notifications.setNotificationChannelAsync('incidents', {
        name: 'Incident Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
        lightColor: '#e74c3c',
      });
    }

    return expoPushToken;
  } catch (error) {
    console.error('Error setting up notifications:', error);
    return null;
  }
  */
};

/**
 * Get current push token
 */
export const getPushToken = () => null; // expoPushToken;

/**
 * Get FCM/Expo Push Token (disabled for Expo Go)
 */
export const getFCMToken = async () => {
  return null; // Disabled for Expo Go compatibility
};

/**
 * Show local notification (disabled for Expo Go)
 */
export const showLocalNotification = async (title, body, data = {}) => {
  console.log('Local notification:', title, body);
  return null;
  /* Commented out for Expo Go
  await Notifications.scheduleNotificationAsync({
    content: {
      title: title || 'Resolvr',
      body: body || 'New notification',
      data: data,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null, // Show immediately
  });
  */
};

/**
 * Clear all notifications (disabled for Expo Go)
 */
export const clearAllNotifications = async () => {
  console.log('Clear notifications (disabled)');
  return null;
  // await Notifications.dismissAllNotificationsAsync();
};

/**
 * Get notification badge count (disabled for Expo Go)
 */
export const getBadgeCount = async () => {
  return 0;
  // return await Notifications.getBadgeCountAsync();
};

/**
 * Set notification badge count (disabled for Expo Go)
 */
export const setBadgeCount = async (count) => {
  // console.log('Set badge count (disabled):', count);
  return null;
  // await Notifications.setBadgeCountAsync(count);
};
