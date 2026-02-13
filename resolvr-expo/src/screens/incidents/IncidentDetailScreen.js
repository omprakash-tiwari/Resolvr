/**
 * Incident Detail Screen
 * Shows full incident information
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
import { incidentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const IncidentDetailScreen = ({ route, navigation }) => {
  const { incidentId } = route.params;
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [incident, setIncident] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadIncidentDetails();
    }, [incidentId])
  );

  const loadIncidentDetails = async () => {
    try {
      console.log('Loading incident with ID:', incidentId);
      const response = await incidentAPI.getById(incidentId);
      setIncident(response.data.incident || response.data);
    } catch (error) {
      console.error('Load incident details error:', error);
      console.error('Incident ID:', incidentId);
      console.error('Error response:', error.response?.data);
      Alert.alert('Error', error.response?.data?.error || 'Failed to load incident details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadIncidentDetails();
  };

  const handleAcknowledge = async () => {
    Alert.alert(
      'Acknowledge Incident',
      'Are you taking responsibility for this incident?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Acknowledge',
          onPress: async () => {
            try {
              const response = await incidentAPI.acknowledge(incidentId);
              Alert.alert(
                'Incident Acknowledged',
                `Response time: ${response.data.responseTime} seconds`,
                [{ text: 'OK', onPress: loadIncidentDetails }]
              );
            } catch (error) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to acknowledge');
            }
          },
        },
      ]
    );
  };

  const handleResolve = async () => {
    Alert.alert(
      'Mark as Resolved',
      'Are you sure you have resolved this incident?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Resolved',
          onPress: async () => {
            try {
              await incidentAPI.resolve(incidentId, '');
              Alert.alert('Success', 'Incident resolved successfully', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to resolve');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#e74c3c';
      case 'escalated': return '#c0392b';
      case 'acknowledged': return '#f39c12';
      case 'resolved': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return 'alert-circle';
      case 'escalated': return 'alert-octagon';
      case 'acknowledged': return 'check-circle';
      case 'resolved': return 'check-circle-outline';
      default: return 'help-circle';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
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
        <Text style={styles.loadingText}>Loading incident...</Text>
      </View>
    );
  }

  if (!incident) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={64} color="#e74c3c" />
        <Text style={styles.errorText}>Incident not found</Text>
      </View>
    );
  }

  const isActive = incident.status === 'active' || incident.status === 'escalated';
  const canAcknowledge = isActive && incident.acknowledgedBy?._id !== user._id;
  const isAcknowledgedByMe = incident.acknowledgedBy?._id === user._id;

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
      <View style={[styles.header, { backgroundColor: getStatusColor(incident.status) }]}>
        <Icon name={getStatusIcon(incident.status)} size={48} color="#fff" />
        <Text style={styles.statusLabel}>{incident.status.toUpperCase()}</Text>
        {incident.escalationLevel > 0 && (
          <View style={styles.escalationBadge}>
            <Icon name="arrow-up-bold" size={16} color="#fff" />
            <Text style={styles.escalationText}>Level {incident.escalationLevel}</Text>
          </View>
        )}
      </View>

      {/* Alert Message */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Alert</Text>
        <Text style={styles.alertText}>{incident.alertMessage || incident.description}</Text>
      </View>

      {/* Related Issue */}
      {incident.issue && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Related Issue</Text>
          <TouchableOpacity
            style={styles.issueCard}
            onPress={() => navigation.navigate('IssueDetail', { issueId: incident.issue._id })}
          >
            <Text style={styles.issueKey}>{incident.issue.key}</Text>
            <Text style={styles.issueTitle}>{incident.issue.title}</Text>
            <Icon name="chevron-right" size={20} color="#3498db" />
          </TouchableOpacity>
        </View>
      )}

      {/* Details */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Details</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Severity:</Text>
          <View style={styles.severityBadge}>
            <Text style={styles.severityText}>{incident.severity}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Triggered By:</Text>
          <Text style={styles.detailText}>
            {incident.triggeredBy?.name || incident.triggeredBy?.email || 'System'}
          </Text>
        </View>

        {incident.acknowledgedBy && (
          <>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Acknowledged By:</Text>
              <Text style={styles.detailText}>
                {incident.acknowledgedBy.name || incident.acknowledgedBy.email}
                {isAcknowledgedByMe && ' (You)'}
              </Text>
            </View>

            {incident.acknowledgedAt && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Acknowledged At:</Text>
                <Text style={styles.detailText}>{formatDate(incident.acknowledgedAt)}</Text>
              </View>
            )}

            {incident.responseTime && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Response Time:</Text>
                <Text style={styles.successText}>{incident.responseTime}s</Text>
              </View>
            )}
          </>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Created:</Text>
          <Text style={styles.detailText}>{formatDate(incident.createdAt)}</Text>
        </View>
      </View>

      {/* Actions */}
      {canAcknowledge && (
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.acknowledgeButton} onPress={handleAcknowledge}>
            <Icon name="hand-right" size={20} color="#fff" />
            <Text style={styles.buttonText}>Acknowledge Incident</Text>
          </TouchableOpacity>
        </View>
      )}

      {isAcknowledgedByMe && incident.status !== 'resolved' && (
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.resolveButton} onPress={handleResolve}>
            <Icon name="check-circle" size={20} color="#fff" />
            <Text style={styles.buttonText}>Mark as Resolved</Text>
          </TouchableOpacity>
        </View>
      )}
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
    alignItems: 'center',
    padding: 30,
  },
  statusLabel: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 10,
  },
  escalationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 15,
  },
  escalationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 5,
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
  alertText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
  },
  issueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34495e',
    padding: 15,
    borderRadius: 8,
  },
  issueKey: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '700',
    marginRight: 10,
  },
  issueTitle: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
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
    width: 140,
  },
  detailText: {
    color: '#ecf0f1',
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  successText: {
    color: '#27ae60',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  severityBadge: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  severityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  actionsSection: {
    padding: 20,
  },
  acknowledgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f39c12',
    padding: 15,
    borderRadius: 8,
  },
  resolveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27ae60',
    padding: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
});

export default IncidentDetailScreen;
