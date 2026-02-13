/**
 * Incidents Screen (xMatters-like)
 * Shows all critical incidents and allows acknowledgment
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
import { incidentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const IncidentsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeIncidents, setActiveIncidents] = useState([]);
  const [pastIncidents, setPastIncidents] = useState([]);
  const [selectedTab, setSelectedTab] = useState('active');

  useFocusEffect(
    useCallback(() => {
      loadIncidents();
    }, [])
  );

  const loadIncidents = async () => {
    setLoading(true);
    try {
      // Load all incidents and filter on frontend
      const response = await incidentAPI.getAll();
      const allIncidents = response.data.incidents || [];
      
      console.log('Loaded incidents:', allIncidents.length);
      
      // Filter active incidents (active, escalated, acknowledged)
      const active = allIncidents.filter(
        inc => inc.status === 'active' || inc.status === 'escalated' || inc.status === 'acknowledged'
      );
      
      // Filter resolved incidents
      const past = allIncidents.filter(inc => inc.status === 'resolved');
      
      console.log('Active incidents:', active.length);
      console.log('Past incidents:', past.length);
      
      setActiveIncidents(active);
      setPastIncidents(past);
    } catch (error) {
      console.error('Load incidents error:', error);
      console.error('Error response:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (incidentId) => {
    Alert.alert(
      'Acknowledge Incident',
      'Are you taking responsibility for this incident?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Acknowledge',
          style: 'default',
          onPress: async () => {
            try {
              const response = await incidentAPI.acknowledge(incidentId);
              Alert.alert(
                'Incident Acknowledged',
                `Response time: ${response.data.responseTime} seconds`,
                [{ text: 'OK', onPress: loadIncidents }]
              );
            } catch (error) {
              Alert.alert(
                'Error',
                error.response?.data?.error || 'Failed to acknowledge'
              );
            }
          },
        },
      ]
    );
  };

  const handleResolve = async (incidentId) => {
    Alert.alert(
      'Mark as Resolved',
      'Are you sure you have resolved this incident?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Resolved',
          style: 'default',
          onPress: async () => {
            try {
              await incidentAPI.resolve(incidentId, '');
              Alert.alert('Success', 'Incident resolved successfully', [
                { text: 'OK', onPress: loadIncidents },
              ]);
            } catch (error) {
              console.error('Resolve incident error:', error);
              Alert.alert(
                'Error',
                error.response?.data?.error || 'Failed to resolve incident'
              );
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    const colors = {
      active: '#e74c3c',
      escalated: '#c0392b',
      acknowledged: '#f39c12',
      resolved: '#27ae60',
    };
    return colors[status] || '#95a5a6';
  };

  const getStatusIcon = (status) => {
    const icons = {
      active: 'alert-circle',
      escalated: 'alert-octagon',
      acknowledged: 'check-circle',
      resolved: 'check-circle-outline',
    };
    return icons[status] || 'help-circle';
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = Math.floor((now - new Date(date)) / 1000); // seconds

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const renderIncident = (incident) => {
    const isActive =
      incident.status === 'active' || incident.status === 'escalated';
    const canAcknowledge =
      isActive && incident.acknowledgedBy?._id !== user._id;
    const isAcknowledgedByMe = incident.acknowledgedBy?._id === user._id;

    return (
      <TouchableOpacity
        key={incident._id}
        style={[
          styles.incidentCard,
          isActive && styles.incidentCardActive,
        ]}
        onPress={() =>
          navigation.navigate('IncidentDetail', { incidentId: incident._id })
        }
      >
        {/* Header */}
        <View style={styles.incidentHeader}>
          <View style={styles.incidentStatus}>
            <Icon
              name={getStatusIcon(incident.status)}
              size={20}
              color={getStatusColor(incident.status)}
            />
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(incident.status) },
              ]}
            >
              {incident.status.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.incidentTime}>
            {formatTime(incident.createdAt)}
          </Text>
        </View>

        {/* Alert Message */}
        <Text style={styles.incidentAlert}>{incident.alertMessage}</Text>

        {/* Issue Key */}
        <Text style={styles.incidentIssue}>
          Issue: {incident.issue?.key} - {incident.issue?.title}
        </Text>

        {/* Escalation Info */}
        {incident.escalationLevel > 0 && (
          <View style={styles.escalationBadge}>
            <Icon name="arrow-up-bold" size={14} color="#e74c3c" />
            <Text style={styles.escalationText}>
              Escalation Level {incident.escalationLevel}
            </Text>
          </View>
        )}

        {/* Acknowledged By */}
        {incident.acknowledgedBy && (
          <View style={styles.acknowledgedBy}>
            <Icon name="account-check" size={16} color="#27ae60" />
            <Text style={styles.acknowledgedText}>
              Acknowledged by {incident.acknowledgedBy.name}
              {isAcknowledgedByMe && ' (You)'}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        {canAcknowledge && (
          <TouchableOpacity
            style={styles.acknowledgeButton}
            onPress={() => handleAcknowledge(incident._id)}
          >
            <Icon name="hand-okay" size={20} color="#fff" />
            <Text style={styles.acknowledgeButtonText}>
              ACKNOWLEDGE INCIDENT
            </Text>
          </TouchableOpacity>
        )}

        {isAcknowledgedByMe && incident.status === 'acknowledged' && (
          <TouchableOpacity
            style={styles.resolveButton}
            onPress={() => handleResolve(incident._id)}
          >
            <Icon name="check" size={20} color="#fff" />
            <Text style={styles.resolveButtonText}>RESOLVED</Text>
          </TouchableOpacity>
        )}

        {/* Response Time (for resolved) */}
        {incident.responseTime && (
          <Text style={styles.responseTime}>
            ⏱️ Response time: {Math.floor(incident.responseTime / 60)}m{' '}
            {incident.responseTime % 60}s
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'active' && styles.tabActive]}
          onPress={() => setSelectedTab('active')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'active' && styles.tabTextActive,
            ]}
          >
            Active ({activeIncidents.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'past' && styles.tabActive]}
          onPress={() => setSelectedTab('past')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'past' && styles.tabTextActive,
            ]}
          >
            Past ({pastIncidents.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadIncidents} />
        }
      >
        {selectedTab === 'active' ? (
          activeIncidents.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="check-circle" size={64} color="#27ae60" />
              <Text style={styles.emptyTitle}>No Active Incidents</Text>
              <Text style={styles.emptySubtitle}>
                All clear! No critical issues at the moment.
              </Text>
            </View>
          ) : (
            activeIncidents.map(renderIncident)
          )
        ) : pastIncidents.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="history" size={64} color="#95a5a6" />
            <Text style={styles.emptyTitle}>No Past Incidents</Text>
            <Text style={styles.emptySubtitle}>
              Resolved incidents will appear here.
            </Text>
          </View>
        ) : (
          pastIncidents.map(renderIncident)
        )}
      </ScrollView>

      {/* Info Banner */}
      {user.isOnCall && activeIncidents.length > 0 && (
        <View style={styles.infoBanner}>
          <Icon name="phone-in-talk" size={20} color="#fff" />
          <Text style={styles.infoBannerText}>
            You're on-call! {activeIncidents.length} incident
            {activeIncidents.length !== 1 && 's'} require attention
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ecf0f1',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#3498db',
  },
  tabText: {
    color: '#7f8c8d',
    fontSize: 14,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#3498db',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 50,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginTop: 15,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#95a5a6',
    marginTop: 5,
    textAlign: 'center',
  },
  incidentCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  incidentCardActive: {
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  incidentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  incidentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 5,
  },
  incidentTime: {
    color: '#95a5a6',
    fontSize: 12,
  },
  incidentAlert: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
  },
  incidentIssue: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 10,
  },
  escalationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffe5e5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  escalationText: {
    color: '#e74c3c',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 5,
  },
  acknowledgedBy: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  acknowledgedText: {
    color: '#27ae60',
    fontSize: 12,
    marginLeft: 5,
  },
  acknowledgeButton: {
    backgroundColor: '#e74c3c',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  acknowledgeButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
  },
  resolveButton: {
    backgroundColor: '#27ae60',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  resolveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
  },
  responseTime: {
    color: '#7f8c8d',
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  infoBanner: {
    backgroundColor: '#e74c3c',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  infoBannerText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
  },
});

export default IncidentsScreen;

