// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'package:flutter_test/flutter_test.dart';
import 'package:genui/genui.dart';

void main() {
  group('SurfaceDefinition', () {
    test('toJson() serializes correctly', () {
      final definition = SurfaceDefinition(
        surfaceId: 'testSurface',
        catalogId: 'test_catalog',
        components: {
          'root': const Component(
            id: 'root',
            type: 'Text',
            properties: {'text': 'Hello'},
          ),
        },
      );

      final JsonMap json = definition.toJson();

      expect(json[surfaceIdKey], 'testSurface');
      expect(json['components'], {
        'root': {'id': 'root', 'component': 'Text', 'text': 'Hello'},
      });
    });
  });
}
