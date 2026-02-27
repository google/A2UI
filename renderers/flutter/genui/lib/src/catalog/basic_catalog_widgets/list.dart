// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'package:flutter/material.dart';
import 'package:json_schema_builder/json_schema_builder.dart';

import '../../model/a2ui_schemas.dart';
import '../../model/catalog_item.dart';
import '../../model/data_model.dart';
import '../../primitives/logging.dart';
import '../../primitives/simple_items.dart';
import 'widget_helpers.dart';

final _schema = S.object(
  description: 'A scrollable list of child widgets.',
  properties: {
    'children': A2uiSchemas.componentArrayReference(),
    'direction': S.string(enumValues: ['vertical', 'horizontal']),
    'align': S.string(enumValues: ['start', 'center', 'end', 'stretch']),
  },
  required: ['children'],
);

extension type _ListData.fromMap(JsonMap _json) {
  factory _ListData({
    required Object? children,
    String? direction,
    String? align,
  }) => _ListData.fromMap({
    'children': children,
    'direction': direction,
    'align': align,
  });

  Object? get children => _json['children'];
  String? get direction => _json['direction'] as String?;
  String? get align => _json['align'] as String?;
}

/// A scrollable list of child widgets.
///
/// This widget is analogous to Flutter's [ListView] widget. It can display
/// children in either a vertical or horizontal direction.
///
/// ## Parameters:
///
/// - `children`: A list of child widget IDs to display in the list.
/// - `direction`: The direction of the list. Can be `vertical` or `horizontal`.
///   Defaults to `vertical`.
/// - `align`: The alignment of children along the cross axis. One of `start`,
///   `center`, `end`, `stretch`.
final list = CatalogItem(
  name: 'List',
  dataSchema: _schema,
  widgetBuilder: (itemContext) {
    final listData = _ListData.fromMap(itemContext.data as JsonMap);
    final Axis direction = listData.direction == 'horizontal'
        ? Axis.horizontal
        : Axis.vertical;

    final CrossAxisAlignment crossAxisAlignment = switch (listData.align) {
      'start' => .start,
      'center' => .center,
      'end' => .end,
      'stretch' => .stretch,
      _ => .center,
    };

    Widget buildList(List<Widget> children) {
      return SingleChildScrollView(
        scrollDirection: direction,
        child: Flex(
          direction: direction,
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: crossAxisAlignment,
          children: children,
        ),
      );
    }

    return ComponentChildrenBuilder(
      childrenData: listData.children,
      dataContext: itemContext.dataContext,
      buildChild: itemContext.buildChild,
      getComponent: itemContext.getComponent,
      explicitListBuilder: (childIds, buildChild, getComponent, dataContext) {
        return buildList(
          childIds.map((id) {
            return buildChild(id, dataContext);
          }).toList(),
        );
      },
      templateListWidgetBuilder:
          (context, Object? data, componentId, dataBinding) {
            final List<Object?> values;
            final List<String> keys;

            if (data is List) {
              values = data;
              keys = List.generate(data.length, (index) => index.toString());
            } else if (data is Map) {
              values = data.values.toList();
              keys = data.keys.map((k) => k.toString()).toList();
            } else {
              genUiLogger.warning(
                'List: invalid data type for template list: '
                '${data.runtimeType}',
              );
              return const SizedBox.shrink();
            }

            return buildList(
              List.generate(values.length, (index) {
                final nestedPath = '$dataBinding/${keys[index]}';

                final DataContext itemDataContext = itemContext.dataContext
                    .nested(DataPath(nestedPath));
                final Widget child = itemContext.buildChild(
                  componentId,
                  itemDataContext,
                );
                return KeyedSubtree(key: ValueKey(keys[index]), child: child);
              }),
            );
          },
    );
  },
  exampleData: [
    () => '''
      [
        {
          "id": "root",
          "component": "List",
          "children": [
            "text1",
            "text2"
          ]
        },
        {
          "id": "text1",
          "component": "Text",
          "text": "First"
        },
        {
          "id": "text2",
          "component": "Text",
          "text": "Second"
        }
      ]
    ''',
  ],
  isImplicitlyFlexible: true,
);
