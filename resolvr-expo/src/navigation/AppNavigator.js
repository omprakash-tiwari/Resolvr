/**
 * App Navigator
 * Main navigation structure
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main Screens
import HomeScreen from '../screens/home/HomeScreen';
import IncidentsScreen from '../screens/incidents/IncidentsScreen';
import {
  ProjectsScreen,
  ProjectDetailScreen,
  IssuesScreen,
  IssueDetailScreen,
  CreateIssueScreen,
  KanbanScreen,
  IncidentDetailScreen,
  NotificationsScreen,
  ProfileScreen,
} from '../screens/index';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Bar Badge Component
const TabBarBadge = ({ count }) => {
  if (count === 0) return null;
  
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
};

// Main Tab Navigator
const MainTabs = () => {
  const { unreadCount } = useNotifications();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Projects') {
            iconName = focused ? 'folder' : 'folder-outline';
          } else if (route.name === 'Incidents') {
            iconName = focused ? 'alert-circle' : 'alert-circle-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'bell' : 'bell-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3498db',
        tabBarInactiveTintColor: '#95a5a6',
        headerStyle: {
          backgroundColor: '#2c3e50',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '700',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Projects" component={ProjectsScreen} />
      <Tab.Screen 
        name="Incidents" 
        component={IncidentsScreen}
        options={{
          tabBarBadge: unreadCount || undefined,
        }}
      />
      <Tab.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{
          tabBarBadge: unreadCount || undefined,
        }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Auth Stack Navigator
const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

// Main Stack Navigator
const MainStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2c3e50',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '700',
        },
      }}
    >
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Issues" 
        component={IssuesScreen}
        options={{ title: 'All Issues' }}
      />
      <Stack.Screen 
        name="ProjectDetail" 
        component={ProjectDetailScreen}
        options={{ title: 'Project Details' }}
      />
      <Stack.Screen 
        name="IssueDetail" 
        component={IssueDetailScreen}
        options={{ title: 'Issue Details' }}
      />
      <Stack.Screen 
        name="CreateIssue" 
        component={CreateIssueScreen}
        options={{ title: 'Create Issue' }}
      />
      <Stack.Screen 
        name="Kanban" 
        component={KanbanScreen}
        options={{ title: 'Kanban Board' }}
      />
      <Stack.Screen 
        name="IncidentDetail" 
        component={IncidentDetailScreen}
        options={{ title: 'Incident Details' }}
      />
    </Stack.Navigator>
  );
};

// Root Navigator
const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  const auth = isAuthenticated === true;
  const isLoading = loading === true;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Resolvr...</Text>
      </View>
    );
  }

  return auth ? <MainStack /> : <AuthStack />;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2c3e50',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});

export default AppNavigator;
