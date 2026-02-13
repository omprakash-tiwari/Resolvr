/**
 * Projects Screen
 * Display all projects
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
import { projectAPI } from '../../services/api';
import { useFocusEffect } from '@react-navigation/native';

const ProjectsScreen = ({ navigation }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadProjects();
    }, [])
  );

  const loadProjects = async () => {
    try {
      const response = await projectAPI.getAll();
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Load projects error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProjects();
  };

  const getProjectColor = (key) => {
    const colors = ['#3498db', '#9b59b6', '#e74c3c', '#27ae60', '#f39c12', '#1abc9c'];
    const index = key.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const renderProject = ({ item }) => (
    <TouchableOpacity
      style={styles.projectCard}
      onPress={() => navigation.navigate('ProjectDetail', { projectId: item._id })}
    >
      <View style={[styles.projectIcon, { backgroundColor: getProjectColor(item.key) }]}>
        <Text style={styles.projectKeyText}>{item.key}</Text>
      </View>

      <View style={styles.projectInfo}>
        <Text style={styles.projectName}>{item.name}</Text>
        {item.description && (
          <Text style={styles.projectDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.projectMeta}>
          <View style={styles.metaItem}>
            <Icon name="account-multiple" size={14} color="#95a5a6" />
            <Text style={styles.metaText}>
              {item.members?.length || 0} members
            </Text>
          </View>
        </View>
      </View>

      <Icon name="chevron-right" size={24} color="#95a5a6" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading projects...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {projects.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="folder-multiple" size={64} color="#95a5a6" />
          <Text style={styles.emptyTitle}>No Projects</Text>
          <Text style={styles.emptySubtitle}>
            Projects will appear here when they are created
          </Text>
        </View>
      ) : (
        <FlatList
          data={projects}
          renderItem={renderProject}
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
  listContent: {
    padding: 15,
  },
  projectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34495e',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
  },
  projectIcon: {
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  projectKeyText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  projectDescription: {
    color: '#95a5a6',
    fontSize: 14,
    marginBottom: 8,
  },
  projectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  metaText: {
    color: '#95a5a6',
    fontSize: 12,
    marginLeft: 4,
  },
});

export default ProjectsScreen;
