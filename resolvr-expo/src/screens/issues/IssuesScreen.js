/**
 * Issues Screen
 * Display all issues with filtering
 */

import React, { useState, useEffect, useCallback } from 'react';
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
import { issueAPI } from '../../services/api';
import { useFocusEffect } from '@react-navigation/native';

const IssuesScreen = ({ navigation }) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadIssues();
    }, [])
  );

  const loadIssues = async () => {
    try {
      const response = await issueAPI.getAll();
      setIssues(response.data.issues || []);
    } catch (error) {
      console.error('Load issues error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadIssues();
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

  const getTypeIcon = (type) => {
    switch (type) {
      case 'bug':
        return 'bug';
      case 'feature':
        return 'star';
      case 'incident':
        return 'alert-circle';
      default:
        return 'checkbox-marked-circle';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return '#3498db';
      case 'in-progress':
        return '#f39c12';
      case 'resolved':
        return '#27ae60';
      case 'closed':
        return '#95a5a6';
      case 'blocked':
        return '#e74c3c';
      default:
        return '#3498db';
    }
  };

  const renderIssue = ({ item }) => (
    <TouchableOpacity
      style={styles.issueCard}
      onPress={() => navigation.navigate('IssueDetail', { issueId: item._id })}
    >
      <View style={styles.issueHeader}>
        <View style={styles.issueKeyContainer}>
          <Icon name={getTypeIcon(item.type)} size={16} color={getPriorityColor(item.priority)} />
          <Text style={styles.issueKey}>{item.key}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <Text style={styles.issueTitle}>{item.title}</Text>

      {item.description && (
        <Text style={styles.issueDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.issueFooter}>
        <View style={styles.issueInfo}>
          <Icon name="folder" size={14} color="#95a5a6" />
          <Text style={styles.infoText}>{item.project?.name || 'No Project'}</Text>
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
          <Text style={styles.priorityText}>{item.priority}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading issues...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {issues.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="clipboard-list" size={64} color="#95a5a6" />
          <Text style={styles.emptyTitle}>No Issues</Text>
          <Text style={styles.emptySubtitle}>Create your first issue to get started</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('CreateIssue')}
          >
            <Icon name="plus-circle" size={20} color="#fff" />
            <Text style={styles.createButtonText}>Create Issue</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={issues}
          renderItem={renderIssue}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#3498db"
              colors={['#3498db']}
            />
          }
        />
      )}

      {issues.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('CreateIssue')}
        >
          <Icon name="plus" size={28} color="#fff" />
        </TouchableOpacity>
      )}
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
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27ae60',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 30,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  listContent: {
    padding: 15,
  },
  issueCard: {
    backgroundColor: '#34495e',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  issueKeyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  issueKey: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  issueTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  issueDescription: {
    color: '#95a5a6',
    fontSize: 14,
    marginBottom: 12,
  },
  issueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  issueInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    color: '#95a5a6',
    fontSize: 12,
    marginLeft: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  priorityText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#27ae60',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default IssuesScreen;
