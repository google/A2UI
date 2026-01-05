/**
 * A2UI Renderer
 *
 * The main component that renders an A2UI specification.
 * Handles component tree traversal and renders the appropriate components.
 */

import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import type {
  A2UIComponent,
  A2UIRendererProps,
  TextComponent,
  ButtonComponent,
  ImageComponent,
  RowComponent,
  ColumnComponent,
  CardComponent,
  ListComponent,
  TextFieldComponent,
} from '../types/a2ui-types';
import { A2UIText } from '../components/Text';
import { A2UIButton } from '../components/Button';
import { A2UIImage } from '../components/Image';
import { A2UIRow } from '../components/Row';
import { A2UIColumn } from '../components/Column';
import { A2UICard } from '../components/Card';
import { A2UIList } from '../components/List';
import { A2UITextField } from '../components/TextField';

interface ComponentLookup {
  [id: string]: A2UIComponent;
}

export const A2UIRenderer: React.FC<A2UIRendererProps> = ({
  spec,
  onAction,
  customComponents = {},
  loadingComponent,
  errorComponent: ErrorComponent,
}) => {
  // Build component lookup map
  const componentLookup = useMemo<ComponentLookup>(() => {
    if (!spec?.components) {
      return {};
    }

    const lookup: ComponentLookup = {};
    for (const component of spec.components) {
      lookup[component.id] = component;
    }
    return lookup;
  }, [spec?.components]);

  // Get data model
  const dataModel = useMemo(() => {
    return spec?.dataModel ?? {};
  }, [spec?.dataModel]);

  // Get surface ID
  const surfaceId = spec?.surfaceId ?? 'default';

  // Render a single component
  const renderComponent = useCallback((
    componentId: string,
    key?: string | number
  ): React.ReactNode => {
    const component = componentLookup[componentId];

    if (!component) {
      console.warn(`[A2UI] Component not found: ${componentId}`);
      return null;
    }

    // Check for custom component override
    const CustomComponent = customComponents[component.type];
    if (CustomComponent) {
      return (
        <CustomComponent
          key={key ?? component.id}
          component={component}
          dataModel={dataModel}
          surfaceId={surfaceId}
          onAction={onAction}
        />
      );
    }

    // Render children if component has them
    const renderChildren = () => {
      if (!component.children || component.children.length === 0) {
        return null;
      }

      return component.children.map((childId, index) =>
        renderComponent(childId, index)
      );
    };

    // Render based on component type
    switch (component.type) {
      case 'Text':
        return (
          <A2UIText
            key={key ?? component.id}
            component={component as TextComponent}
            dataModel={dataModel}
          />
        );

      case 'Button':
        return (
          <A2UIButton
            key={key ?? component.id}
            component={component as ButtonComponent}
            dataModel={dataModel}
            surfaceId={surfaceId}
            onAction={onAction}
          />
        );

      case 'Image':
        return (
          <A2UIImage
            key={key ?? component.id}
            component={component as ImageComponent}
            dataModel={dataModel}
          />
        );

      case 'Row':
        return (
          <A2UIRow
            key={key ?? component.id}
            component={component as RowComponent}
            dataModel={dataModel}
          >
            {renderChildren()}
          </A2UIRow>
        );

      case 'Column':
        return (
          <A2UIColumn
            key={key ?? component.id}
            component={component as ColumnComponent}
            dataModel={dataModel}
          >
            {renderChildren()}
          </A2UIColumn>
        );

      case 'Card':
        return (
          <A2UICard
            key={key ?? component.id}
            component={component as CardComponent}
            dataModel={dataModel}
          >
            {renderChildren()}
          </A2UICard>
        );

      case 'List': {
        const listComponent = component as ListComponent;
        return (
          <A2UIList
            key={key ?? component.id}
            component={listComponent}
            dataModel={dataModel}
            surfaceId={surfaceId}
            onAction={onAction}
            renderItem={(_itemData, index, itemDataModel) => {
              // Render the item template with the item's data context
              if (listComponent.itemTemplate) {
                const templateComponent = componentLookup[listComponent.itemTemplate];
                if (templateComponent) {
                  return renderComponentWithDataModel(
                    templateComponent,
                    itemDataModel,
                    `item-${index}`
                  );
                }
              }
              return null;
            }}
          />
        );
      }

      case 'TextField':
        return (
          <A2UITextField
            key={key ?? component.id}
            component={component as TextFieldComponent}
            dataModel={dataModel}
            surfaceId={surfaceId}
            onAction={onAction}
          />
        );

      default:
        console.warn(`[A2UI] Unknown component type: ${component.type}`);
        return (
          <View key={key ?? component.id} style={styles.unknownComponent}>
            <Text style={styles.unknownText}>
              Unknown: {component.type}
            </Text>
          </View>
        );
    }
  }, [componentLookup, dataModel, surfaceId, onAction, customComponents]);

  // Render component with a different data model (for list items)
  const renderComponentWithDataModel = useCallback((
    component: A2UIComponent,
    itemDataModel: Record<string, unknown>,
    key: string
  ): React.ReactNode => {
    // Check for custom component override
    const CustomComponent = customComponents[component.type];
    if (CustomComponent) {
      return (
        <CustomComponent
          key={key}
          component={component}
          dataModel={itemDataModel}
          surfaceId={surfaceId}
          onAction={onAction}
        />
      );
    }

    // Render based on type with item data model
    switch (component.type) {
      case 'Text':
        return (
          <A2UIText
            key={key}
            component={component as TextComponent}
            dataModel={itemDataModel}
          />
        );

      case 'Button':
        return (
          <A2UIButton
            key={key}
            component={component as ButtonComponent}
            dataModel={itemDataModel}
            surfaceId={surfaceId}
            onAction={onAction}
          />
        );

      case 'Image':
        return (
          <A2UIImage
            key={key}
            component={component as ImageComponent}
            dataModel={itemDataModel}
          />
        );

      case 'Row':
        return (
          <A2UIRow
            key={key}
            component={component as RowComponent}
            dataModel={itemDataModel}
          >
            {component.children?.map((childId, idx) => {
              const child = componentLookup[childId];
              if (child) {
                return renderComponentWithDataModel(child, itemDataModel, `${key}-child-${idx}`);
              }
              return null;
            })}
          </A2UIRow>
        );

      case 'Column':
        return (
          <A2UIColumn
            key={key}
            component={component as ColumnComponent}
            dataModel={itemDataModel}
          >
            {component.children?.map((childId, idx) => {
              const child = componentLookup[childId];
              if (child) {
                return renderComponentWithDataModel(child, itemDataModel, `${key}-child-${idx}`);
              }
              return null;
            })}
          </A2UIColumn>
        );

      case 'Card':
        return (
          <A2UICard
            key={key}
            component={component as CardComponent}
            dataModel={itemDataModel}
          >
            {component.children?.map((childId, idx) => {
              const child = componentLookup[childId];
              if (child) {
                return renderComponentWithDataModel(child, itemDataModel, `${key}-child-${idx}`);
              }
              return null;
            })}
          </A2UICard>
        );

      case 'TextField':
        return (
          <A2UITextField
            key={key}
            component={component as TextFieldComponent}
            dataModel={itemDataModel}
            surfaceId={surfaceId}
            onAction={onAction}
          />
        );

      default:
        return null;
    }
  }, [componentLookup, surfaceId, onAction, customComponents]);

  // Handle loading state
  if (!spec) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Handle empty spec
  if (!spec.rootId || Object.keys(componentLookup).length === 0) {
    return null;
  }

  // Handle missing root component
  if (!componentLookup[spec.rootId]) {
    const error = new Error(`Root component not found: ${spec.rootId}`);

    if (ErrorComponent) {
      return <ErrorComponent error={error} />;
    }

    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Error: Root component &quot;{spec.rootId}&quot; not found
        </Text>
      </View>
    );
  }

  // Render the component tree starting from root
  return (
    <View style={styles.container}>
      {renderComponent(spec.rootId)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
    textAlign: 'center',
  },
  unknownComponent: {
    padding: 10,
    backgroundColor: '#FFF3CD',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  unknownText: {
    color: '#856404',
    fontSize: 14,
  },
});

export default A2UIRenderer;
