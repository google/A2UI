/**
 * A2UI Image Component
 *
 * Renders images with loading states and error handling.
 */

import React, { useState } from 'react';
import {
  Image as RNImage,
  View,
  ActivityIndicator,
  StyleSheet,
  ImageStyle,
} from 'react-native';
import type { ImageComponent, BoundValue } from '../types/a2ui-types';
import { resolveValue, resolveStyleValues } from '../state/data-model-store';

export interface A2UIImageProps {
  component: ImageComponent;
  dataModel: Record<string, unknown>;
}

export const A2UIImage: React.FC<A2UIImageProps> = ({ component, dataModel }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Resolve src - could be string or BoundValue
  const src = resolveValue(component.src, dataModel);

  // Resolve dimensions
  const width = component.width !== undefined
    ? resolveValue(component.width, dataModel) as number
    : undefined;

  const height = component.height !== undefined
    ? resolveValue(component.height, dataModel) as number
    : undefined;

  // Resolve alt text
  const alt = component.alt !== undefined
    ? String(resolveValue(component.alt, dataModel) ?? '')
    : undefined;

  // Resolve visibility
  const visible = component.visible !== undefined
    ? resolveValue(component.visible, dataModel)
    : true;

  if (!visible) {
    return null;
  }

  // Build image style
  const imageStyle: ImageStyle = {};

  if (width !== undefined) {
    imageStyle.width = width;
  }

  if (height !== undefined) {
    imageStyle.height = height;
  }

  // Resolve any custom style BoundValues
  const customStyle = resolveStyleValues(
    component.style as Record<string, BoundValue | string | number> | undefined,
    dataModel
  );

  // Handle resize mode
  const resizeMode = component.resizeMode || 'cover';

  // Validate src
  if (!src || typeof src !== 'string') {
    return (
      <View style={[styles.placeholder, imageStyle, customStyle]}>
        <ActivityIndicator size="small" color="#8E8E93" />
      </View>
    );
  }

  return (
    <View style={[styles.container, imageStyle, customStyle]}>
      {loading && !error && (
        <View style={[styles.loadingOverlay, imageStyle]}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      )}

      {error ? (
        <View style={[styles.errorContainer, imageStyle]}>
          <RNImage
            source={require('./placeholder.png')}
            style={[styles.image, imageStyle]}
            resizeMode="contain"
          />
        </View>
      ) : (
        <RNImage
          source={{ uri: src }}
          style={[styles.image, imageStyle]}
          resizeMode={resizeMode}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
          accessibilityLabel={alt}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default A2UIImage;
