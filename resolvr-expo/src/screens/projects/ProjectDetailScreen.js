/**
 * Project Detail Screen
 * Shows project information and issues
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
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { projectAPI, issueAPI } from '../../services/api';

const ProjectDetailScreen = ({ route, navigation }) => {
  const { projectId } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [project, setProject] = useState(null);
  const [issues, setIssues] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadProjectDetails();
    }, [projectId])
  );

  const loadProjectDetails = async () => {
    try {
      const [projectRes, issuesRes] = await Promise.all([
        projectAPI.getById(projectId),
        issueAPI.getAll(),
      ]);

      setProject(projectRes.data.project || projectRes.data);
      
      // Filter issues for this project
      const projectIssues = (issuesRes.data.issues || []).filter(
        issue => issue.project?._id === projectId
      );
      setIssues(projectIssues);
    } catch (error) {
      console.error('Load project details error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProjectDetails();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return '#3498db';
      case 'in-progress': return '#f39c12';
      case 'resolved': return '#27ae60';
      case 'closed': return '#95a5a6';
      default: return '#3498db';
    }
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading project...</Text>
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={64} color="#e74c3c" />
        <Text style={styles.errorText}>Project not found</Text>
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
      {/* Project Info */}
      <View style={styles.projectHeader}>
        <View style={styles.projectKeyBadge}>
          <Text style={styles.projectKeyText}>{project.key}</Text>
        </View>
        <Text style={styles.projectName}>{project.name}</Text>
        {project.description && (
          <Text style={styles.projectDescription}>{project.description}</Text>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{issues.length}</Text>
          <Text style={styles.statLabel}>Total Issues</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>
            {issues.filter(i => i.status === 'open' || i.status === 'in-progress').length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{project.members?.length || 0}</Text>
          <Text style={styles.statLabel}>Members</Text>
        </View>
      </View>

      {/* Issues List */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Issues</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateIssue')}
          >
            <Icon name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {issues.length === 0 ? (
          <View style={styles.emptyIssues}>
            <Icon name="clipboard-outline" size={48} color="#95a5a6" />
            <Text style={styles.emptyText}>No issues yet</Text>
          </View>
        ) : (
          issues.map((issue) => (
            <TouchableOpacity
              key={issue._id}
              style={styles.issueCard}
              onPress={() => navigation.navigate('IssueDetail', { issueId: issue._id })}
            >
              <View style={styles.issueHeader}>
                <Text style={styles.issueKey}>{issue.key}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(issue.status) }]}>
                  <Text style={styles.statusText}>{issue.status}</Text>
                </View>
              </View>
              <Text style={styles.issueTitle}>{issue.title}</Text>
              <View style={styles.issueFooter}>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(issue.priority) }]}>
                  <Text style={styles.priorityText}>{issue.priority}</Text>
                </View>
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
  projectHeader: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#34495e',
  },
  projectKeyBadge: {
    backgroundColor: '#3498db',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 15,
  },
  projectKeyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  projectName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  projectDescription: {
    color: '#95a5a6',
    fontSize: 16,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 15,
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  statLabel: {
    color: '#95a5a6',
    fontSize: 14,
    marginTop: 5,
  },
  section: {
    padding: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  addButton: {
    backgroundColor: '#27ae60',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIssues: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#95a5a6',
    fontSize: 16,
    marginTop: 10,
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
    marginBottom: 8,
  },
  issueKey: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  issueTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  issueFooter: {
    flexDirection: 'row',
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
});

export default ProjectDetailScreen;
