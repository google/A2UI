/**
 * A2UI AudioPlayer Component
 *
 * Audio playback component.
 * Note: For production, integrate with expo-av or react-native-track-player.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import type { AudioPlayerComponent, ActionPayload, BoundValue } from '../types/a2ui-types';
import { resolveValue, resolveStyleValues } from '../state/data-model-store';

export interface A2UIAudioPlayerProps {
  component: AudioPlayerComponent;
  dataModel: Record<string, unknown>;
  surfaceId: string;
  onAction?: (payload: ActionPayload) => void;
}

export const A2UIAudioPlayer: React.FC<A2UIAudioPlayerProps> = ({
  component,
  dataModel,
  surfaceId,
  onAction,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resolve URL
  const url = String(resolveValue(component.url, dataModel) ?? '');

  // Handle play/pause
  const handlePlayPause = useCallback(async () => {
    if (!url) {
      setError('No audio URL provided');
      return;
    }

    if (isPlaying) {
      // In a real implementation, this would pause the audio
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fallback: Open audio externally
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        setIsPlaying(true);
      } else {
        setError('Cannot open audio URL');
      }
    } catch (err) {
      setError('Failed to play audio');
    } finally {
      setIsLoading(false);
    }

    // Fire action if provided
    if (onAction && component.onPlayAction) {
      onAction({
        actionId: component.onPlayAction,
        surfaceId,
        componentId: component.id,
      });
    }
  }, [url, isPlaying, onAction, component.onPlayAction, component.id, surfaceId]);

  // Resolve visibility
  const visible = component.visible !== undefined
    ? resolveValue(component.visible, dataModel)
    : true;

  if (!visible) {
    return null;
  }

  // Resolve title
  const title = component.title
    ? String(resolveValue(component.title, dataModel) ?? '')
    : null;

  // Resolve custom styles
  const customStyle = resolveStyleValues(
    component.style as Record<string, BoundValue | string | number> | undefined,
    dataModel
  );

  return (
    <View style={[styles.container, customStyle]}>
      <View style={styles.playerContainer}>
        {/* Album art / placeholder */}
        <View style={styles.artContainer}>
          <Text style={styles.artIcon}>🎵</Text>
        </View>

        {/* Controls and info */}
        <View style={styles.infoContainer}>
          {title && (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          )}

          {/* Playback controls */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handlePlayPause}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#007AFF" size="small" />
              ) : (
                <Text style={styles.controlIcon}>
                  {isPlaying ? '⏸️' : '▶️'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Progress bar placeholder */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '0%' }]} />
            </View>
            <Text style={styles.duration}>0:00 / --:--</Text>
          </View>
        </View>
      </View>

      {/* Error message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Note about native audio */}
      <Text style={styles.noteText}>
        Tap to open audio externally.
        For embedded playback, install expo-av.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  playerContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  artContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  artIcon: {
    fontSize: 28,
  },
  infoContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  controlIcon: {
    fontSize: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  duration: {
    fontSize: 11,
    color: '#999',
    minWidth: 65,
  },
  errorContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#ffebee',
    borderRadius: 4,
  },
  errorText: {
    color: '#c62828',
    fontSize: 12,
    textAlign: 'center',
  },
  noteText: {
    marginTop: 4,
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default A2UIAudioPlayer;
