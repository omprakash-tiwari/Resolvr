/**
 * Notification Service
 * Handles push notifications and SMS alerts
 */

// Firebase Admin SDK for push notifications
let admin;
try {
  admin = require('firebase-admin');
  const serviceAccount = require('../../firebase-service-account.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin SDK initialized');
} catch (error) {
  console.warn('⚠️ Firebase Admin SDK not configured. Push notifications will not work.');
  console.warn('To enable push notifications:');
  console.warn('1. Create a Firebase project');
  console.warn('2. Download service account JSON');
  console.warn('3. Save as firebase-service-account.json in backend root');
}

// Twilio for SMS (optional)
let twilioClient;
try {
  const twilio = require('twilio');
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    console.log('✅ Twilio SMS service initialized');
  }
} catch (error) {
  console.warn('⚠️ Twilio not configured. SMS alerts will not work.');
}

/**
 * Send push notification via Firebase Cloud Messaging
 */
async function sendPushNotification(fcmToken, payload) {
  if (!admin) {
    console.warn('Firebase not configured. Skipping push notification.');
    return { success: false, error: 'Firebase not configured' };
  }

  try {
    const message = {
      token: fcmToken,
      notification: {
        title: payload.title || 'Resolvr',
        body: payload.body || 'New notification'
      },
      data: payload.data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'incidents'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    const response = await admin.messaging().send(message);
    console.log('✅ Push notification sent:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('❌ Push notification error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send SMS alert via Twilio
 */
async function sendSMS(phoneNumber, message) {
  if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
    console.warn('Twilio not configured. Skipping SMS.');
    return { success: false, error: 'Twilio not configured' };
  }

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    console.log('✅ SMS sent:', result.sid);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('❌ SMS error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send email notification (placeholder)
 */
async function sendEmail(email, subject, body) {
  // TODO: Implement email service (e.g., SendGrid, AWS SES)
  console.log(`📧 Email would be sent to ${email}: ${subject}`);
  return { success: true };
}

module.exports = {
  sendPushNotification,
  sendSMS,
  sendEmail
};
