/**
 * Issue Detail Screen
 * Shows issue information and allows updates
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { issueAPI } from '../../services/api';

const IssueDetailScreen = ({ route, navigation }) => {
  const { issueId } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [issue, setIssue] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadIssueDetails();
    }, [issueId])
  );

  const loadIssueDetails = async () => {
    try {
      console.log('Loading issue with ID:', issueId);
      const response = await issueAPI.getById(issueId);
      setIssue(response.data.issue || response.data);
    } catch (error) {
      console.error('Load issue details error:', error);
      console.error('Issue ID:', issueId);
      console.error('Error response:', error.response?.data);
      Alert.alert('Error', error.response?.data?.error || 'Failed to load issue details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadIssueDetails();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return '#e74c3c';
      case 'high': return '#e67e22';
      case 'medium': return '#f39c12';
      case 'low': return '#95a5a6';
      default: return '#3498db';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return '#3498db';
      case 'in-progress': return '#f39c12';
      case 'resolved': return '#27ae60';
      case 'closed': return '#95a5a6';
      case 'blocked': return '#e74c3c';
      default: return '#3498db';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'bug': return 'bug';
      case 'feature': return 'star';
      case 'incident': return 'alert-circle';
      default: return 'checkbox-marked-circle';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading issue...</Text>
      </View>
    );
  }

  if (!issue) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={64} color="#e74c3c" />
        <Text style={styles.errorText}>Issue not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#3498db"
          colors={['#3498db']}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.keyRow}>
          <Icon name={getTypeIcon(issue.type)} size={24} color={getPriorityColor(issue.priority)} />
          <Text style={styles.issueKey}>{issue.key}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(issue.status) }]}>
          <Text style={styles.statusText}>{issue.status}</Text>
        </View>
      </View>

      {/* Title */}
      <View style={styles.section}>
        <Text style={styles.title}>{issue.title}</Text>
      </View>

      {/* Description */}
      {issue.description && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Description</Text>
          <Text style={styles.description}>{issue.description}</Text>
        </View>
      )}

      {/* Details */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Details</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Type:</Text>
          <View style={styles.detailValue}>
            <Icon name={getTypeIcon(issue.type)} size={16} color="#95a5a6" />
            <Text style={styles.detailText}>{issue.type}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Priority:</Text>
          <View style={[styles.badge, { backgroundColor: getPriorityColor(issue.priority) }]}>
            <Text style={styles.badgeText}>{issue.priority}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Severity:</Text>
          <Text style={styles.detailText}>{issue.severity}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Project:</Text>
          <TouchableOpacity onPress={() => issue.project && navigation.navigate('ProjectDetail', { projectId: issue.project._id })}>
            <Text style={styles.linkText}>{issue.project?.name || 'N/A'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Reporter:</Text>
          <Text style={styles.detailText}>{issue.reporter?.name || issue.reporter?.email || 'N/A'}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Assignee:</Text>
          <Text style={styles.detailText}>{issue.assignee?.name || issue.assignee?.email || 'Unassigned'}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Created:</Text>
          <Text style={styles.detailText}>{formatDate(issue.createdAt)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Updated:</Text>
          <Text style={styles.detailText}>{formatDate(issue.updatedAt)}</Text>
        </View>
      </View>
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2c3e50',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 18,
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#34495e',
  },
  keyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  issueKey: {
    color: '#3498db',
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#34495e',
  },
  sectionLabel: {
    color: '#95a5a6',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  description: {
    color: '#ecf0f1',
    fontSize: 16,
    lineHeight: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  detailLabel: {
    color: '#95a5a6',
    fontSize: 14,
    fontWeight: '600',
    width: 100,
  },
  detailValue: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    color: '#ecf0f1',
    fontSize: 14,
    marginLeft: 5,
    flex: 1,
    textAlign: 'right',
  },
  linkText: {
    color: '#3498db',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});

export default IssueDetailScreen;
