// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'package:flutter/material.dart';
import 'package:json_schema_builder/json_schema_builder.dart';

import '../../model/a2ui_schemas.dart';
import '../../model/catalog_item.dart';
import '../../primitives/simple_items.dart';

final _schema = S.object(
  description: 'A visual container (card) that groups a single child widget.',
  properties: {'child': A2uiSchemas.componentReference()},
  required: ['child'],
);

extension type _CardData.fromMap(JsonMap _json) {
  factory _CardData({required String child}) =>
      _CardData.fromMap({'child': child});

  String get child {
    final Object? val = _json['child'];
    if (val is String) return val;
    throw ArgumentError('Invalid child: $val');
  }
}

/// A Material Design card.
///
/// This widget displays a card, which is a container for a single `child`
/// widget. Cards often have rounded corners and a shadow, and are used to group
/// related content.
///
/// ## Parameters:
///
/// - `child`: The ID of a child widget to display inside the card.
final card = CatalogItem(
  name: 'Card',
  dataSchema: _schema,
  widgetBuilder: (itemContext) {
    final cardData = _CardData.fromMap(itemContext.data as JsonMap);
    return Card(
      color: Theme.of(itemContext.buildContext).colorScheme.surface,
      child: Padding(
        padding: const EdgeInsets.all(8.0),
        child: itemContext.buildChild(cardData.child),
      ),
    );
  },
  exampleData: [
    () => '''
      [
        {
          "id": "root",
          "component": "Card",
          "child": "text"
        },
        {
          "id": "text",
          "component": "Text",
          "text": "This is a card."
        }
      ]
    ''',
  ],
);
