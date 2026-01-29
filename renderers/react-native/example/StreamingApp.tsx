/**
 * A2UI Streaming Example
 *
 * Demonstrates using useA2UIStream hook for real-time UI updates.
 */

import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { A2UIRenderer, useA2UIStream } from '../src';

interface StreamingAppProps {
  /** URL of the A2UI streaming server */
  serverUrl?: string;
}

export default function StreamingApp({ serverUrl = 'http://localhost:3000/stream' }: StreamingAppProps) {
  const {
    spec,
    isLoading,
    isConnected,
    error,
    connect,
    disconnect,
    sendAction,
    reset,
  } = useA2UIStream({
    url: serverUrl,
    autoConnect: false,
    onError: (err) => {
      console.error('A2UI Stream Error:', err);
    },
    onConnectionChange: (connected) => {
      console.log('Connection status:', connected);
    },
  });

  const handleAction = async (payload: typeof import('../src').ActionPayload extends infer T ? T : never) => {
    console.log('Action triggered:', payload);
    await sendAction(payload);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusIndicator}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isConnected ? '#4CAF50' : '#f44336' },
            ]}
          />
          <Text style={styles.statusText}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>

        <View style={styles.buttonGroup}>
          {!isConnected ? (
            <TouchableOpacity
              style={[styles.button, styles.connectButton]}
              onPress={connect}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Connect</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.disconnectButton]}
              onPress={disconnect}
            >
              <Text style={styles.buttonText}>Disconnect</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, styles.resetButton]}
            onPress={reset}
          >
            <Text style={styles.buttonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error.message}</Text>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        {isLoading && !isConnected && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Connecting to agent...</Text>
          </View>
        )}

        {!isLoading && !spec && !error && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No UI Loaded</Text>
            <Text style={styles.emptyText}>
              Press "Connect" to stream UI from the agent server.
            </Text>
          </View>
        )}

        {spec && <A2UIRenderer spec={spec} onAction={handleAction} />}
      </View>

      {/* Debug Info */}
      {spec && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>Surface: {spec.surfaceId}</Text>
          <Text style={styles.debugText}>
            Components: {spec.components.length}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  connectButton: {
    backgroundColor: '#007AFF',
  },
  disconnectButton: {
    backgroundColor: '#f44336',
  },
  resetButton: {
    backgroundColor: '#757575',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  errorContainer: {
    margin: 12,
    padding: 12,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  debugContainer: {
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderTopWidth: 1,
    borderTopColor: '#90caf9',
  },
  debugTitle: {
    fontWeight: '600',
    color: '#1565c0',
  },
  debugText: {
    fontSize: 12,
    color: '#1976d2',
  },
});
