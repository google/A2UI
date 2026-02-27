// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:genui/genui.dart';

void main() {
  group('SurfaceController Validation', () {
    test('CreateSurface fails validation with empty surfaceId', () async {
      final controller = SurfaceController(catalogs: []);

      // Expect an error message on the submit stream
      final Future<void> future = expectLater(
        controller.onSubmit,
        emits(
          predicate((ChatMessage message) {
            final UiInteractionPart part =
                message.parts.uiInteractionParts.first;
            final json = jsonDecode(part.interaction) as Map<String, dynamic>;
            final error = json['error'] as Map<String, dynamic>;
            return error['code'] == 'VALIDATION_FAILED' &&
                error['path'] == 'surfaceId';
          }),
        ),
      );

      controller.handleMessage(
        const CreateSurface(surfaceId: '', catalogId: 'default'),
      );

      await future;
    });

    test(
      'CreateSurface fails schema validation for invalid component',
      () async {
        final controller = SurfaceController(
          catalogs: [BasicCatalogItems.asCatalog()],
        );

        final Future<void> future = expectLater(
          controller.onSubmit,
          emits(
            predicate((ChatMessage message) {
              final UiInteractionPart part =
                  message.parts.uiInteractionParts.first;
              final json = jsonDecode(part.interaction) as Map<String, dynamic>;
              final error = json['error'] as Map<String, dynamic>;
              return error['code'] == 'VALIDATION_FAILED' &&
                  error['path'] == '/components/badText';
            }),
          ),
        );

        controller.handleMessage(
          const CreateSurface(surfaceId: 'surf1', catalogId: basicCatalogId),
        );

        controller.handleMessage(
          const UpdateComponents(
            surfaceId: 'surf1',
            components: [
              Component(
                id: 'badText',
                type: 'Text',
                properties: {},
              ), // Missing 'text' property
            ],
          ),
        );

        await future;
      },
    );
  });
}
