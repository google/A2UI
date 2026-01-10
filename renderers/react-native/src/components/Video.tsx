/**
 * A2UI Video Component
 *
 * Video player component.
 * Note: For production, integrate with expo-av or react-native-video.
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
import type { VideoComponent, ActionPayload, BoundValue } from '../types/a2ui-types';
import { resolveValue, resolveStyleValues } from '../state/data-model-store';

export interface A2UIVideoProps {
  component: VideoComponent;
  dataModel: Record<string, unknown>;
  surfaceId: string;
  onAction?: (payload: ActionPayload) => void;
}

export const A2UIVideo: React.FC<A2UIVideoProps> = ({
  component,
  dataModel,
  surfaceId,
  onAction,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resolve URL
  const url = String(resolveValue(component.url, dataModel) ?? '');

  // Handle play - open in external player as fallback
  const handlePlay = useCallback(async () => {
    if (!url) {
      setError('No video URL provided');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Try to open video externally
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        setError('Cannot open video URL');
      }
    } catch (err) {
      setError('Failed to open video');
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
  }, [url, onAction, component.onPlayAction, component.id, surfaceId]);

  // Resolve visibility
  const visible = component.visible !== undefined
    ? resolveValue(component.visible, dataModel)
    : true;

  if (!visible) {
    return null;
  }

  // Resolve poster image
  const poster = component.poster
    ? String(resolveValue(component.poster, dataModel) ?? '')
    : null;

  // Resolve custom styles
  const customStyle = resolveStyleValues(
    component.style as Record<string, BoundValue | string | number> | undefined,
    dataModel
  );

  return (
    <View style={[styles.container, customStyle]}>
      <View style={styles.videoContainer}>
        {/* Placeholder/poster */}
        <View style={styles.placeholder}>
          {poster ? (
            // Could render Image here with poster
            <View style={styles.posterPlaceholder}>
              <Text style={styles.posterText}>🎬</Text>
            </View>
          ) : (
            <View style={styles.defaultPoster}>
              <Text style={styles.videoIcon}>🎬</Text>
            </View>
          )}

          {/* Play button overlay */}
          <TouchableOpacity
            style={styles.playButton}
            onPress={handlePlay}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : (
              <View style={styles.playIconContainer}>
                <Text style={styles.playIcon}>▶</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Error message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Video info */}
        {url && (
          <Text style={styles.urlText} numberOfLines={1}>
            {url}
          </Text>
        )}
      </View>

      {/* Note about native video */}
      <Text style={styles.noteText}>
        Tap to open video externally.
        For embedded playback, install expo-av.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  videoContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  placeholder: {
    aspectRatio: 16 / 9,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  posterPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  posterText: {
    fontSize: 48,
  },
  defaultPoster: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoIcon: {
    fontSize: 64,
    opacity: 0.5,
  },
  playButton: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconContainer: {
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 32,
    color: '#fff',
    marginLeft: 4, // Visual centering for play icon
  },
  errorContainer: {
    padding: 8,
    backgroundColor: '#ffebee',
  },
  errorText: {
    color: '#c62828',
    fontSize: 12,
    textAlign: 'center',
  },
  urlText: {
    padding: 8,
    fontSize: 12,
    color: '#999',
    backgroundColor: '#111',
  },
  noteText: {
    marginTop: 4,
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default A2UIVideo;
