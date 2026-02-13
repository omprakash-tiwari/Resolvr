/**
 * Create Issue Screen
 * Form to create new issues
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { issueAPI, projectAPI } from '../../services/api';

const CreateIssueScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'task',
    priority: 'medium',
    projectId: '',
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await projectAPI.getAll();
      setProjects(response.data.projects || []);
      if (response.data.projects?.length > 0) {
        setFormData({ ...formData, projectId: response.data.projects[0]._id });
      }
    } catch (error) {
      console.error('Load projects error:', error);
      Alert.alert('Error', 'Failed to load projects');
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter an issue title');
      return;
    }

    if (!formData.projectId) {
      Alert.alert('Error', 'Please select a project');
      return;
    }

    setLoading(true);
    try {
      console.log('Creating issue with data:', {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        priority: formData.priority,
        projectId: formData.projectId,
      });
      
      const response = await issueAPI.create({
        title: formData.title,
        description: formData.description,
        type: formData.type,
        priority: formData.priority,
        projectId: formData.projectId,
      });
      
      console.log('Issue created successfully:', response.data);

      Alert.alert('Success', 'Issue created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Create issue error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      Alert.alert('Error', error.response?.data?.error || error.message || 'Failed to create issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter issue title"
          placeholderTextColor="#95a5a6"
          value={formData.title}
          onChangeText={(text) => setFormData({ ...formData, title: text })}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Enter issue description"
          placeholderTextColor="#95a5a6"
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Type</Text>
        <View style={styles.optionsContainer}>
          {['task', 'bug', 'feature'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.optionButton,
                formData.type === type && styles.optionButtonActive,
              ]}
              onPress={() => setFormData({ ...formData, type })}
            >
              <Text
                style={[
                  styles.optionText,
                  formData.type === type && styles.optionTextActive,
                ]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Priority</Text>
        <View style={styles.optionsContainer}>
          {['low', 'medium', 'high', 'critical'].map((priority) => (
            <TouchableOpacity
              key={priority}
              style={[
                styles.optionButton,
                formData.priority === priority && styles.optionButtonActive,
              ]}
              onPress={() => setFormData({ ...formData, priority })}
            >
              <Text
                style={[
                  styles.optionText,
                  formData.priority === priority && styles.optionTextActive,
                ]}
              >
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Project *</Text>
        {projects.length === 0 ? (
          <Text style={styles.noProjectsText}>
            No projects available. Create a project first.
          </Text>
        ) : (
          <View style={styles.projectsContainer}>
            {projects.map((project) => (
              <TouchableOpacity
                key={project._id}
                style={[
                  styles.projectButton,
                  formData.projectId === project._id && styles.projectButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, projectId: project._id })}
              >
                <Text
                  style={[
                    styles.projectText,
                    formData.projectId === project._id && styles.projectTextActive,
                  ]}
                >
                  {project.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Creating...' : 'Create Issue'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c3e50',
  },
  content: {
    padding: 20,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 15,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#34495e',
    color: '#fff',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  optionButton: {
    backgroundColor: '#34495e',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 10,
  },
  optionButtonActive: {
    backgroundColor: '#3498db',
  },
  optionText: {
    color: '#95a5a6',
    fontSize: 14,
    fontWeight: '700',
  },
  optionTextActive: {
    color: '#fff',
  },
  projectsContainer: {
    marginTop: 5,
  },
  projectButton: {
    backgroundColor: '#34495e',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  projectButtonActive: {
    backgroundColor: '#9b59b6',
  },
  projectText: {
    color: '#95a5a6',
    fontSize: 16,
    fontWeight: '700',
  },
  projectTextActive: {
    color: '#fff',
  },
  noProjectsText: {
    color: '#95a5a6',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 10,
  },
  submitButton: {
    backgroundColor: '#27ae60',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#7f8c8d',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CreateIssueScreen;
