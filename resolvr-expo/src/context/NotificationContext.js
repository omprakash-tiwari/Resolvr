/**
 * Notification Context
 * Manages real-time notifications and WebSocket events
 */

import React, { createContext, useState, useEffect, useContext } from 'react';
import { notificationAPI } from '../services/api';
import socketService from '../services/socketService';
import { showLocalNotification, setBadgeCount } from '../services/notificationService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Load notifications when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
      setupSocketListeners();
    }

    return () => {
      removeSocketListeners();
    };
  }, [isAuthenticated]);

  // Update badge count
  useEffect(() => {
    setBadgeCount(unreadCount);
  }, [unreadCount]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getAll({ limit: 50 });
      setNotifications(response.data.notifications);
      setUnreadCount(Number(response.data.unreadCount) || 0);
    } catch (error) {
      console.error('Load notifications error:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    // Listen for new notifications
    socketService.on('notification', handleNewNotification);

    // Listen for incident alerts
    socketService.on('incident_alert', handleIncidentAlert);

    // Listen for escalation alerts
    socketService.on('escalation_alert', handleEscalationAlert);

    // Listen for issue updates
    socketService.on('issue_updated', handleIssueUpdate);
  };

  const removeSocketListeners = () => {
    socketService.off('notification', handleNewNotification);
    socketService.off('incident_alert', handleIncidentAlert);
    socketService.off('escalation_alert', handleEscalationAlert);
    socketService.off('issue_updated', handleIssueUpdate);
  };

  const handleNewNotification = (notification) => {
    console.log('New notification:', notification);
    
    // Add to list
    setNotifications((prev) => [notification, ...prev]);
    setUnreadCount((prev) => Number(prev) + 1);

    // Show local notification if app is in foreground
    showLocalNotification({
      notification: {
        title: notification.title,
        body: notification.message,
      },
      data: {
        type: notification.type,
        issueId: notification.issue,
        incidentId: notification.incident,
      },
    });
  };

  const handleIncidentAlert = (data) => {
    console.log('🚨 Incident alert:', data);
    
    const { incident, notification } = data;

    // Show critical notification with special sound
    showLocalNotification({
      notification: {
        title: '🚨 CRITICAL INCIDENT',
        body: incident.alertMessage,
      },
      data: {
        type: 'incident',
        incidentId: incident._id,
        issueId: incident.issue,
      },
    });

    // Add to notifications
    if (notification) {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => Number(prev) + 1);
    }
  };

  const handleEscalationAlert = (notification) => {
    console.log('⚠️ Escalation alert:', notification);
    
    showLocalNotification({
      notification: {
        title: notification.title,
        body: notification.message,
      },
      data: {
        type: 'escalation',
        incidentId: notification.incident,
      },
    });

    setNotifications((prev) => [notification, ...prev]);
    setUnreadCount((prev) => Number(prev) + 1);
  };

  const handleIssueUpdate = (issue) => {
    console.log('Issue updated:', issue);
    // Can trigger UI refresh here
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, isRead: true } : n
        )
      );
      
      setUnreadCount((prev) => Math.max(0, Number(prev) - 1));
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Mark all as read error:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await notificationAPI.delete(notificationId);
      
      const notification = notifications.find((n) => n._id === notificationId);
      if (notification && !notification.isRead) {
        setUnreadCount((prev) => Math.max(0, Number(prev) - 1));
      }
      
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
    } catch (error) {
      console.error('Delete notification error:', error);
    }
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export default NotificationContext;
