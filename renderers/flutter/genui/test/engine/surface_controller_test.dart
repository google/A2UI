// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:genui/genui.dart';
import 'package:json_schema_builder/json_schema_builder.dart';

void main() {
  group('$SurfaceController', () {
    late SurfaceController controller;

    setUp(() {
      controller = SurfaceController(catalogs: [BasicCatalogItems.asCatalog()]);
    });

    tearDown(() {
      controller.dispose();
    });

    test('can be initialized with multiple catalogs', () {
      final catalog1 = const Catalog([], catalogId: 'cat1');
      final catalog2 = const Catalog([], catalogId: 'cat2');
      final multiManager = SurfaceController(catalogs: [catalog1, catalog2]);
      expect(multiManager.catalogs, contains(catalog1));
      expect(multiManager.catalogs, contains(catalog2));
      expect(multiManager.catalogs.length, 2);
    });

    test('handleMessage adds a new surface and fires SurfaceAdded with '
        'definition', () async {
      const surfaceId = 's1';
      final components = [
        const Component(
          id: 'root',
          type: 'Text',
          properties: {'text': 'Hello'},
        ),
      ];

      controller.handleMessage(
        UpdateComponents(surfaceId: surfaceId, components: components),
      );

      final Future<List<SurfaceUpdate>> futureUpdates = controller
          .surfaceUpdates
          .take(2)
          .toList();
      controller.handleMessage(
        const CreateSurface(surfaceId: surfaceId, catalogId: 'test_catalog'),
      );
      final List<SurfaceUpdate> updates = await futureUpdates;

      expect(updates[0], isA<SurfaceAdded>());
      expect(updates[0].surfaceId, surfaceId);

      final SurfaceUpdate update2 = updates[1];
      expect(update2, isA<ComponentsUpdated>());
      final SurfaceDefinition definition =
          (update2 as ComponentsUpdated).definition;

      expect(definition, isNotNull);
      expect(
        definition.components['root'],
        isNotNull,
      ); // Check if root (or any component) exists
      expect(definition.catalogId, 'test_catalog');
      expect(controller.registry.getSurface(surfaceId), isNotNull);
      expect(
        controller.registry.getSurface(surfaceId)!.catalogId,
        'test_catalog',
      );
    });

    test(
      'handleMessage updates an existing surface and fires ComponentsUpdated',
      () async {
        const surfaceId = 's1';
        final oldComponents = [
          const Component(
            id: 'root',
            type: 'Text',
            properties: {'text': 'Old'},
          ),
        ];
        final newComponents = [
          const Component(
            id: 'root',
            type: 'Text',
            properties: {'text': 'New'},
          ),
        ];

        final Future<void> expectation = expectLater(
          controller.surfaceUpdates,
          emitsInOrder([
            isA<SurfaceAdded>(),
            isA<ComponentsUpdated>(),
            isA<ComponentsUpdated>(),
          ]),
        );

        controller.handleMessage(
          const CreateSurface(surfaceId: surfaceId, catalogId: 'test_catalog'),
        );
        controller.handleMessage(
          UpdateComponents(surfaceId: surfaceId, components: oldComponents),
        );
        controller.handleMessage(
          UpdateComponents(surfaceId: surfaceId, components: newComponents),
        );

        await expectation;
      },
    );

    test('handleMessage removes a surface and fires SurfaceRemoved', () async {
      const surfaceId = 's1';
      final components = [
        const Component(
          id: 'root',
          type: 'Text',
          properties: {'text': 'Hello'},
        ),
      ];
      controller.handleMessage(
        const CreateSurface(surfaceId: surfaceId, catalogId: 'test_catalog'),
      );
      controller.handleMessage(
        UpdateComponents(surfaceId: surfaceId, components: components),
      );

      final Future<SurfaceUpdate> futureUpdate =
          controller.surfaceUpdates.first;

      controller.handleMessage(const DeleteSurface(surfaceId: surfaceId));
      final SurfaceUpdate update = await futureUpdate;

      expect(update, isA<SurfaceRemoved>());
      expect(update.surfaceId, surfaceId);
      expect(controller.registry.hasSurface(surfaceId), isFalse);
    });

    test('surface() creates a new ValueNotifier if one does not exist', () {
      final ValueListenable<SurfaceDefinition?> notifier1 = controller.registry
          .watchSurface('s1');
      final ValueListenable<SurfaceDefinition?> notifier2 = controller.registry
          .watchSurface('s1');
      expect(notifier1, same(notifier2));
      expect(notifier1.value, isNull);
    });

    test('dispose() closes the updates stream', () async {
      var isClosed = false;
      controller.surfaceUpdates.listen(
        null,
        onDone: () {
          isClosed = true;
        },
      );

      controller.dispose();

      await Future<void>.delayed(Duration.zero);
      expect(isClosed, isTrue);
    });

    test('can handle UI event', () async {
      controller.store
          .getDataModel('testSurface')
          .update(DataPath('/myValue'), 'testValue');
      final Future<ChatMessage> future = controller.onSubmit.first;
      final now = DateTime.now();
      final event = UserActionEvent(
        surfaceId: 'testSurface',
        name: 'testAction',
        sourceComponentId: 'testWidget',
        timestamp: now,
        context: {'key': 'value'},
      );
      controller.handleUiEvent(event);
      final ChatMessage message = await future;
      expect(message, isA<ChatMessage>());
      expect(message.role, ChatMessageRole.user);
      expect(message.parts.uiInteractionParts, hasLength(1));

      final String expectedJson = jsonEncode({
        'version': 'v0.9',
        'action': {
          'surfaceId': 'testSurface',
          'name': 'testAction',
          'sourceComponentId': 'testWidget',
          'timestamp': now.toIso8601String(),
          'context': {'key': 'value'},
        },
      });
      final UiInteractionPart part = message.parts.uiInteractionParts.first;
      // Depending on implementation, part.interaction might be the string or
      // data map. UiInteractionPart.create took jsonEncode string.
      // UiInteractionPart.interaction is String.
      expect(part.interaction, expectedJson);
    });

    test(
      'handleMessage reports validation error with correct structure',
      () async {
        // Trigger validation error by using an empty surface ID.
        final Future<ChatMessage> messageFuture = controller.onSubmit.first;
        controller.handleMessage(
          const CreateSurface(surfaceId: '', catalogId: 'test_catalog'),
        );

        final ChatMessage message = await messageFuture;
        expect(message.role, ChatMessageRole.user);
        final UiInteractionPart part = message.parts.uiInteractionParts.first;
        final errorJson = jsonDecode(part.interaction) as Map<String, dynamic>;

        expect(errorJson['version'], 'v0.9');
        final Object? errorObj = errorJson['error'];
        expect(errorObj, isA<Map<String, dynamic>>());
        final errorMap = errorObj! as Map<String, dynamic>;
        expect(errorMap['code'], 'VALIDATION_FAILED');
        expect(errorMap['surfaceId'], '');
        expect(errorMap['path'], 'surfaceId');
      },
    );

    test('drops pending updates after timeout', () async {
      // Create controller with short timeout
      final shortTimeoutController = SurfaceController(
        catalogs: [BasicCatalogItems.asCatalog()],
        pendingUpdateTimeout: const Duration(milliseconds: 100),
      );
      addTearDown(shortTimeoutController.dispose);

      const surfaceId = 'timedOutSurface';
      final components = [
        const Component(
          id: 'root',
          type: 'Text',
          properties: {'text': 'Should not be seen'},
        ),
      ];

      // 1. Send update for non-existent surface (buffered)
      shortTimeoutController.handleMessage(
        UpdateComponents(surfaceId: surfaceId, components: components),
      );

      // 2. Wait for timeout
      await Future<void>.delayed(const Duration(milliseconds: 200));

      // 3. Create surface (but first setup listener)
      final Future<List<SurfaceUpdate>> updatesFuture = shortTimeoutController
          .surfaceUpdates
          .take(1)
          .toList();
      shortTimeoutController.handleMessage(
        const CreateSurface(surfaceId: surfaceId, catalogId: 'test_catalog'),
      );

      // 4. Verify surface created but NO update applied
      // If update was applied, we'd see [SurfaceAdded, ComponentsUpdated]
      // If dropped, we only see [SurfaceAdded] (and potentially components from
      // CreateSurface if any, but default is empty)
      final List<SurfaceUpdate> updates = await updatesFuture;
      expect(updates.length, 1);
      expect(updates[0], isA<SurfaceAdded>());

      // Allow a small delay to ensure no other events come through
      // Testing emptiness of a stream is tricky, checking registry state is
      // better.
      await Future<void>.delayed(Duration.zero);

      final SurfaceDefinition? surface = shortTimeoutController.registry
          .getSurface(surfaceId);
      expect(surface, isNotNull);
      // Updates NOT applied, so components should be empty (or default)
      expect(surface!.components, isEmpty);
    });

    test(
      'handleMessage reports schema validation error for invalid component',
      () async {
        final catalog = Catalog([
          CatalogItem(
            name: 'StrictWidget',
            dataSchema: Schema.object(
              properties: {
                'component': Schema.string(enumValues: ['StrictWidget']),
                'requiredProp': Schema.string(),
              },
              required: ['component', 'requiredProp'],
            ),
            widgetBuilder: _dummyBuilder,
          ),
        ], catalogId: 'strict_catalog');
        final strictController = SurfaceController(catalogs: [catalog]);
        addTearDown(strictController.dispose);

        const surfaceId = 'strictSurface';
        strictController.handleMessage(
          const CreateSurface(
            surfaceId: surfaceId,
            catalogId: 'strict_catalog',
          ),
        );

        final Future<ChatMessage> future = strictController.onSubmit.first;

        // Send invalid component (missing requiredProp)
        strictController.handleMessage(
          const UpdateComponents(
            surfaceId: surfaceId,
            components: [
              Component(id: 'bad', type: 'StrictWidget', properties: {}),
            ],
          ),
        );

        final ChatMessage message = await future;
        final UiInteractionPart part = message.parts.uiInteractionParts.first;
        final errorJson = jsonDecode(part.interaction) as Map<String, dynamic>;

        final errorObj = errorJson['error'] as Map<String, dynamic>;
        expect(errorObj['code'], 'VALIDATION_FAILED');
        expect(errorObj['message'], contains('Missing required property'));
      },
    );
  });
}

Widget _dummyBuilder(CatalogItemContext context) => const SizedBox();
