// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'package:flutter/material.dart';
import 'package:json_schema_builder/json_schema_builder.dart';

import '../../model/catalog_item.dart';
import '../../primitives/simple_items.dart';

final _schema = S.object(
  description: 'A thin horizontal or vertical line used to separate content.',
  properties: {
    'axis': S.string(enumValues: ['horizontal', 'vertical']),
  },
);

extension type _DividerData.fromMap(JsonMap _json) {
  factory _DividerData({String? axis}) => _DividerData.fromMap({'axis': axis});

  String? get axis => _json['axis'] as String?;
}

/// A thin horizontal or vertical line used to separate content.
///
/// This widget displays a thin line to separate content, either horizontally
/// or vertically.
///
/// ## Parameters:
///
/// - `axis`: The direction of the divider. Can be `horizontal` or `vertical`.
///   Defaults to `horizontal`.
final divider = CatalogItem(
  name: 'Divider',
  dataSchema: _schema,
  widgetBuilder: (itemContext) {
    final dividerData = _DividerData.fromMap(itemContext.data as JsonMap);
    if (dividerData.axis == 'vertical') {
      return const VerticalDivider();
    }
    return const Divider();
  },
  exampleData: [
    () => '''
      [
        {
          "id": "root",
          "component": "Divider"
        }
      ]
    ''',
  ],
);
