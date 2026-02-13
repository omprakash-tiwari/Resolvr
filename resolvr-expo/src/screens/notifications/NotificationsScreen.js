/**
 * Notifications Screen
 * Display all user notifications
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { notificationAPI } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { markAsRead } = useNotifications();

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  const loadNotifications = async () => {
    try {
      const response = await notificationAPI.getAll();
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Load notifications error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleNotificationPress = async (notification) => {
    console.log('Notification clicked:', notification);
    
    // Mark as read
    if (!notification.isRead) {
      await markAsRead(notification._id);
      // Update local state
      setNotifications(prev =>
        prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n)
      );
    }

    // Navigate based on notification type
    // Handle both ObjectId string and populated objects
    if (notification.issue) {
      const issueId = typeof notification.issue === 'string' ? notification.issue : notification.issue._id;
      console.log('Navigating to issue:', issueId);
      navigation.navigate('IssueDetail', { issueId });
    } else if (notification.incident) {
      const incidentId = typeof notification.incident === 'string' ? notification.incident : notification.incident._id;
      console.log('Navigating to incident:', incidentId);
      navigation.navigate('IncidentDetail', { incidentId });
    } else if (notification.project) {
      const projectId = typeof notification.project === 'string' ? notification.project : notification.project._id;
      console.log('Navigating to project:', projectId);
      navigation.navigate('ProjectDetail', { projectId });
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'issue_assigned':
        return 'clipboard-text';
      case 'issue_updated':
        return 'clipboard-check';
      case 'incident_alert':
      case 'incident_created':
        return 'alert-circle';
      case 'incident_acknowledged':
        return 'check-circle';
      case 'incident_resolved':
        return 'check-circle-outline';
      case 'escalation':
        return 'alert-octagon';
      case 'mention':
        return 'at';
      default:
        return 'bell';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return '#e74c3c';
      case 'high':
        return '#e67e22';
      case 'medium':
        return '#f39c12';
      case 'low':
        return '#95a5a6';
      default:
        return '#3498db';
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diff = Math.floor((now - notifDate) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return notifDate.toLocaleDateString();
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !item.isRead && styles.notificationCardUnread,
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={[styles.iconContainer, { backgroundColor: getPriorityColor(item.priority) }]}>
        <Icon name={getNotificationIcon(item.type)} size={24} color="#fff" />
      </View>

      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.notificationTime}>{formatTime(item.createdAt)}</Text>
      </View>

      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="bell-outline" size={64} color="#95a5a6" />
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptySubtitle}>You're all caught up!</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item._id}
        contentContainerStyle={notifications.length === 0 ? styles.emptyList : styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3498db"
            colors={['#3498db']}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c3e50',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2c3e50',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 20,
  },
  emptySubtitle: {
    color: '#95a5a6',
    fontSize: 16,
    marginTop: 10,
  },
  listContent: {
    padding: 15,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34495e',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
  },
  notificationCardUnread: {
    backgroundColor: '#3d5267',
    borderLeftWidth: 3,
    borderLeftColor: '#3498db',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  notificationMessage: {
    color: '#95a5a6',
    fontSize: 14,
    marginBottom: 6,
  },
  notificationTime: {
    color: '#7f8c8d',
    fontSize: 12,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3498db',
    marginLeft: 10,
  },
});

export default NotificationsScreen;
