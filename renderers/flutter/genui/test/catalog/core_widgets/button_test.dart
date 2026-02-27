// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:genui/genui.dart';
import 'package:genui/src/model/client_function.dart';
import 'package:json_schema_builder/json_schema_builder.dart';

void main() {
  testWidgets('Button widget renders and handles taps', (
    WidgetTester tester,
  ) async {
    ChatMessage? message;
    final surfaceController = SurfaceController(
      catalogs: [
        Catalog([
          BasicCatalogItems.button,
          BasicCatalogItems.text,
        ], catalogId: 'test_catalog'),
      ],
    );
    surfaceController.onSubmit.listen((event) => message = event);
    const surfaceId = 'testSurface';
    final components = [
      const Component(
        id: 'root',
        type: 'Button',
        properties: {
          'child': 'button_text',
          'action': {
            'event': {'name': 'testAction'},
          },
        },
      ),
      const Component(
        id: 'button_text',
        type: 'Text',
        properties: {'text': 'Click Me'},
      ),
    ];
    surfaceController.handleMessage(
      UpdateComponents(surfaceId: surfaceId, components: components),
    );
    surfaceController.handleMessage(
      const CreateSurface(surfaceId: surfaceId, catalogId: 'test_catalog'),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Surface(
            surfaceContext: surfaceController.contextFor(surfaceId),
          ),
        ),
      ),
    );

    final Finder buttonFinder = find.byType(ElevatedButton);
    expect(buttonFinder, findsOneWidget);
    expect(
      find.descendant(of: buttonFinder, matching: find.text('Click Me')),
      findsOneWidget,
    );

    expect(message, null);
    await tester.tap(find.byType(ElevatedButton));
    expect(message, isNotNull);
  });

  testWidgets('Button widget handles stream errors gracefully', (
    WidgetTester tester,
  ) async {
    ChatMessage? message;
    // Create a stream controller that we can use to emit errors
    final streamController = StreamController<Object?>.broadcast();

    final mockFunction = MockFunction(
      name: 'throwError',
      onExecute: (args, context) => streamController.stream,
    );

    final surfaceController = SurfaceController(
      catalogs: [
        Catalog(
          [BasicCatalogItems.button, BasicCatalogItems.text],
          catalogId: 'test_catalog',
          functions: [mockFunction],
        ),
      ],
    );
    surfaceController.onSubmit.listen((event) => message = event);

    const surfaceId = 'testSurface';
    final components = [
      const Component(
        id: 'root',
        type: 'Button',
        properties: {
          'child': 'button_text',
          'action': {'call': 'throwError'},
        },
      ),
      const Component(
        id: 'button_text',
        type: 'Text',
        properties: {'text': 'Click Me'},
      ),
    ];
    surfaceController.handleMessage(
      UpdateComponents(surfaceId: surfaceId, components: components),
    );
    surfaceController.handleMessage(
      const CreateSurface(surfaceId: surfaceId, catalogId: 'test_catalog'),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Surface(
            surfaceContext: surfaceController.contextFor(surfaceId),
          ),
        ),
      ),
    );

    await tester.pumpAndSettle();

    // Tap the button to trigger the function call
    await tester.tap(find.byType(ElevatedButton));

    // Emit an error from the stream
    streamController.addError(Exception('Stream error'));

    // Pump to process the error
    await tester.pump();

    // Wait for the message to be received, pumping the widget tree
    var retries = 0;
    while (message == null && retries < 50) {
      await tester.pump(const Duration(milliseconds: 10));
      retries++;
    }

    // Verify error was reported
    expect(message, isNotNull);

    // The test passes if no unhandled exception crashes the test.
    await streamController.close();
    surfaceController.dispose();
  });

  testWidgets(
    'Button widget is disabled when checks fail and enabled when they pass',
    (WidgetTester tester) async {
      ChatMessage? message;
      final surfaceController = SurfaceController(
        catalogs: [
          BasicCatalogItems.asCatalog().copyWith(catalogId: 'test_catalog'),
        ],
      );
      addTearDown(surfaceController.dispose);
      surfaceController.onSubmit.listen((event) => message = event);

      const surfaceId = 'validationTest';
      // Initialize with a value that fails the check
      surfaceController.handleMessage(
        UpdateDataModel(
          surfaceId: surfaceId,
          path: DataPath('/count'),
          value: 0,
        ),
      );

      final components = [
        const Component(
          id: 'root',
          type: 'Button',
          properties: {
            'child': 'button_text',
            'action': {
              'event': {'name': 'testAction'},
            },
            'checks': [
              {
                'message': 'Cannot click when count is 0',
                'condition': {
                  'call': 'numeric',
                  'args': {
                    'value': {'path': '/count'},
                    'min': 1,
                  },
                },
              },
            ],
          },
        ),
        const Component(
          id: 'button_text',
          type: 'Text',
          properties: {'text': 'Click Me'},
        ),
      ];

      surfaceController.handleMessage(
        UpdateComponents(surfaceId: surfaceId, components: components),
      );
      surfaceController.handleMessage(
        const CreateSurface(surfaceId: surfaceId, catalogId: 'test_catalog'),
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Surface(
              surfaceContext: surfaceController.contextFor(surfaceId),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      final Finder buttonFinder = find.byType(ElevatedButton);
      expect(buttonFinder, findsOneWidget);

      // Button should be disabled -> onPressed is null
      ElevatedButton buttonElem = tester.widget<ElevatedButton>(buttonFinder);
      expect(buttonElem.onPressed, isNull);

      // Try tapping, nothing should happen
      expect(message, isNull);
      await tester.tap(buttonFinder);
      await tester.pumpAndSettle();
      expect(message, isNull);

      // Update data model to pass the check
      surfaceController.handleMessage(
        UpdateDataModel(
          surfaceId: surfaceId,
          path: DataPath('/count'),
          value: 1,
        ),
      );
      await tester.pumpAndSettle();

      // Button should now be enabled
      ElevatedButton buttonElemAfter = tester.widget<ElevatedButton>(
        buttonFinder,
      );
      expect(buttonElemAfter.onPressed, isNotNull);

      // Try tapping, action should fire
      await tester.tap(buttonFinder);
      await tester.pumpAndSettle();
      expect(message, isNotNull);
    },
  );
}

class MockFunction implements ClientFunction {
  MockFunction({required this.name, required this.onExecute});

  @override
  final String name;

  @override
  String get description => 'A mock function for testing.';

  @override
  ClientFunctionReturnType get returnType => ClientFunctionReturnType.any;

  final Stream<Object?> Function(JsonMap args, ExecutionContext context)
  onExecute;

  @override
  Schema get argumentSchema => Schema.object();

  @override
  Stream<Object?> execute(JsonMap args, ExecutionContext context) {
    return onExecute(args, context);
  }
}
