/**
 * A2UI Modal Component
 *
 * Displays content in a modal dialog overlay.
 */

import React, { useState, useCallback } from 'react';
import {
  Modal as RNModal,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Text,
} from 'react-native';
import type { ModalComponent, ActionPayload, BoundValue } from '../types/a2ui-types';
import { resolveValue, resolveStyleValues } from '../state/data-model-store';

export interface A2UIModalProps {
  component: ModalComponent;
  dataModel: Record<string, unknown>;
  surfaceId: string;
  onAction?: (payload: ActionPayload) => void;
  renderChild: (childId: string) => React.ReactNode;
}

export const A2UIModal: React.FC<A2UIModalProps> = ({
  component,
  dataModel,
  surfaceId,
  onAction,
  renderChild,
}) => {
  const [visible, setVisible] = useState(false);

  // Handle opening modal
  const handleOpen = useCallback(() => {
    setVisible(true);
  }, []);

  // Handle closing modal
  const handleClose = useCallback(() => {
    setVisible(false);
    if (onAction && component.onDismissAction) {
      onAction({
        actionId: component.onDismissAction,
        surfaceId,
        componentId: component.id,
      });
    }
  }, [onAction, component.onDismissAction, component.id, surfaceId]);

  // Handle backdrop press
  const handleBackdropPress = useCallback(() => {
    handleClose();
  }, [handleClose]);

  // Resolve visibility
  const componentVisible = component.visible !== undefined
    ? resolveValue(component.visible, dataModel)
    : true;

  if (!componentVisible) {
    return null;
  }

  // Resolve custom styles
  const customStyle = resolveStyleValues(
    component.style as Record<string, BoundValue | string | number> | undefined,
    dataModel
  );

  return (
    <>
      {/* Entry point - what user clicks to open modal */}
      <TouchableOpacity onPress={handleOpen} activeOpacity={0.7}>
        {component.entryPoint && renderChild(component.entryPoint)}
      </TouchableOpacity>

      {/* Modal */}
      <RNModal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <View style={styles.backdrop}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContainer, customStyle]}>
                {/* Close button */}
                <View style={styles.header}>
                  <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>

                {/* Modal content */}
                <View style={styles.content}>
                  {component.content && renderChild(component.content)}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </RNModal>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    minWidth: 280,
    maxWidth: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 8,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
    lineHeight: 28,
  },
  content: {
    padding: 16,
    paddingTop: 0,
  },
});

export default A2UIModal;
