// Placeholder screens for complete navigation
// These can be expanded based on requirements

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export { default as ProjectsScreen } from './projects/ProjectsScreen';

export { default as ProjectDetailScreen } from './projects/ProjectDetailScreen';

export { default as IssuesScreen } from './issues/IssuesScreen';

export { default as IssueDetailScreen } from './issues/IssueDetailScreen';

export { default as CreateIssueScreen } from './issues/CreateIssueScreen';

export const KanbanScreen = ({ route }) => (
  <ScrollView style={styles.scrollContainer}>
    <View style={styles.content}>
      <Icon name="view-column" size={64} color="#3498db" />
      <Text style={styles.title}>Kanban Board</Text>
      <Text style={styles.subtitle}>Drag and drop issues between columns</Text>
    </View>
  </ScrollView>
);

export { default as IncidentDetailScreen } from './incidents/IncidentDetailScreen';

export { default as NotificationsScreen } from './notifications/NotificationsScreen';

export const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  
  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.content}>
        <Icon name="account-circle" size={80} color="#3498db" />
        <Text style={styles.title}>{user?.name}</Text>
        <Text style={styles.subtitle}>{user?.email}</Text>
        <Text style={styles.subtitle}>Role: {user?.role}</Text>
        
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={logout}
        >
          <Icon name="logout" size={20} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
    padding: 20,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#ecf0f1',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 10,
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 30,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
});

