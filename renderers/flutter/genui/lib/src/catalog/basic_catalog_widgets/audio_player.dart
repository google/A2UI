// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'package:flutter/material.dart';
import 'package:json_schema_builder/json_schema_builder.dart';

import '../../model/a2ui_schemas.dart';
import '../../model/catalog_item.dart';
import '../../primitives/simple_items.dart';
import '../../widgets/widget_utilities.dart';

final _schema = S.object(
  description: 'An audio player component that plays audio from a given URL.',
  properties: {
    'url': A2uiSchemas.stringReference(
      description: 'The URL of the audio to play.',
    ),
    'description': A2uiSchemas.stringReference(
      description: 'A description of the audio, such as a title or summary.',
    ),
  },
  required: ['url'],
);

/// A catalog item for an audio player.
///
/// This widget displays a placeholder for an audio player, used to represent
/// a component capable of playing audio from a given URL.
///
/// ## Parameters:
///
/// - `url`: The URL of the audio to play.
final audioPlayer = CatalogItem(
  name: 'AudioPlayer',
  dataSchema: _schema,
  widgetBuilder: (itemContext) {
    final Object? description = (itemContext.data as JsonMap)['description'];
    return BoundString(
      dataContext: itemContext.dataContext,
      value: description,
      builder: (context, value) {
        return Semantics(label: value, child: const Icon(Icons.audiotrack));
      },
    );
  },
  exampleData: [
    () => '''
      [
        {
          "id": "root",
          "component": "AudioPlayer",
          "url": "https://example.com/audio.mp3"
        }
      ]
    ''',
  ],
);
