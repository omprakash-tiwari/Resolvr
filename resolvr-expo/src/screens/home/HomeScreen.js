/**
 * Home Screen
 * Dashboard with overview and quick actions
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { issueAPI, incidentAPI, projectAPI } from '../../services/api';

const HomeScreen = ({ navigation }) => {
  const { user, toggleOnCall } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    myIssues: 0,
    activeIncidents: 0,
    projectCount: 0,
  });
  const [recentIssues, setRecentIssues] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      // Load statistics - get all issues where user is reporter or assignee
      const [issuesRes, incidentsRes, projectsRes] = await Promise.all([
        issueAPI.getAll(),
        incidentAPI.getAll({ status: 'active' }),
        projectAPI.getAll(),
      ]);

      // Filter issues where user is reporter or assignee
      const myIssues = issuesRes.data.issues.filter(
        issue => 
          issue.reporter?._id === user._id || 
          issue.assignee?._id === user._id
      );

      setStats({
        myIssues: myIssues.length,
        activeIncidents: incidentsRes.data.count,
        projectCount: projectsRes.data.count,
      });

      setRecentIssues(myIssues.slice(0, 5));
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOnCall = async () => {
    const result = await toggleOnCall();
    if (result.success) {
      Alert.alert(
        'On-Call Status',
        `You are now ${result.isOnCall ? 'ON CALL' : 'OFF CALL'}`
      );
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#27ae60',
      medium: '#f39c12',
      high: '#e67e22',
      critical: '#e74c3c',
    };
    return colors[priority] || '#95a5a6';
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadData} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user.name}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.onCallBadge,
            user.isOnCall && styles.onCallBadgeActive,
          ]}
          onPress={handleToggleOnCall}
        >
          <Icon
            name={user.isOnCall ? 'phone-in-talk' : 'phone-off'}
            size={20}
            color="#fff"
          />
          <Text style={styles.onCallText}>
            {user.isOnCall ? 'ON CALL' : 'OFF'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: '#3498db' }]}
          onPress={() => navigation.navigate('Issues')}
        >
          <Icon name="clipboard-text" size={32} color="#fff" />
          <Text style={styles.statNumber}>{stats.myIssues}</Text>
          <Text style={styles.statLabel}>My Issues</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: '#e74c3c' }]}
          onPress={() => navigation.navigate('Incidents')}
        >
          <Icon name="alert-circle" size={32} color="#fff" />
          <Text style={styles.statNumber}>{stats.activeIncidents}</Text>
          <Text style={styles.statLabel}>Active Incidents</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: '#9b59b6' }]}
          onPress={() => navigation.navigate('Projects')}
        >
          <Icon name="folder" size={32} color="#fff" />
          <Text style={styles.statNumber}>{stats.projectCount}</Text>
          <Text style={styles.statLabel}>Projects</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('CreateIssue')}
          >
            <Icon name="plus-circle" size={24} color="#3498db" />
            <Text style={styles.actionText}>New Issue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Incidents')}
          >
            <Icon name="alert" size={24} color="#e74c3c" />
            <Text style={styles.actionText}>View Incidents</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Projects')}
          >
            <Icon name="folder-multiple" size={24} color="#9b59b6" />
            <Text style={styles.actionText}>My Projects</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Icon name="bell" size={24} color="#f39c12" />
            <Text style={styles.actionText}>Notifications</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Issues */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Issues</Text>
        {recentIssues.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="clipboard-check" size={48} color="#95a5a6" />
            <Text style={styles.emptyText}>No issues assigned to you</Text>
          </View>
        ) : (
          recentIssues.map((issue) => (
            <TouchableOpacity
              key={issue._id}
              style={styles.issueCard}
              onPress={() =>
                navigation.navigate('IssueDetail', { issueId: issue._id })
              }
            >
              <View style={styles.issueHeader}>
                <Text style={styles.issueKey}>{issue.key}</Text>
                <View
                  style={[
                    styles.priorityBadge,
                    { backgroundColor: getPriorityColor(issue.priority) },
                  ]}
                >
                  <Text style={styles.priorityText}>
                    {issue.priority.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.issueTitle}>{issue.title}</Text>
              <View style={styles.issueFooter}>
                <Text style={styles.issueProject}>
                  {issue.project?.name || 'Unknown'}
                </Text>
                <Text style={styles.issueStatus}>
                  {issue.status.replace('-', ' ').toUpperCase()}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ecf0f1',
  },
  header: {
    backgroundColor: '#2c3e50',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    color: '#95a5a6',
    fontSize: 14,
  },
  userName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  onCallBadge: {
    backgroundColor: '#7f8c8d',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  onCallBadgeActive: {
    backgroundColor: '#27ae60',
  },
  onCallText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 5,
    fontSize: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 15,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  statNumber: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 5,
  },
  statLabel: {
    color: '#fff',
    fontSize: 12,
    marginTop: 5,
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 15,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionText: {
    color: '#2c3e50',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 10,
    alignItems: 'center',
  },
  emptyText: {
    color: '#95a5a6',
    marginTop: 10,
    fontSize: 14,
  },
  issueCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  issueKey: {
    color: '#3498db',
    fontSize: 12,
    fontWeight: '700',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  issueTitle: {
    color: '#2c3e50',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  issueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  issueProject: {
    color: '#7f8c8d',
    fontSize: 12,
  },
  issueStatus: {
    color: '#95a5a6',
    fontSize: 12,
  },
});

export default HomeScreen;

