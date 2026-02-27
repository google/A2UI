// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:genui/genui.dart';
import 'package:genui/src/model/client_function.dart';
import 'package:json_schema_builder/json_schema_builder.dart';
import 'package:logging/logging.dart';

void main() {
  group('Error Reporting Tests', () {
    late Logger logger;
    late List<LogRecord> logs;

    setUp(() {
      logs = [];
      hierarchicalLoggingEnabled = true;
      logger = Logger('genui');
      logger.level = Level.ALL;
      logger.onRecord.listen((record) => logs.add(record));
    });

    test(
      'A2uiMessage.fromJson throws A2uiValidationException for unknown message '
      'type',
      () {
        final json = <String, Object?>{
          'version': 'v0.9',
          'unknownAction': <String, Object?>{},
        };

        try {
          A2uiMessage.fromJson(json);
          fail('Should have thrown A2uiValidationException');
        } on A2uiValidationException catch (e) {
          expect(e.message, contains('Unknown A2UI message type'));
        }
      },
    );

    testWidgets('Surface reports error when catalog item is missing', (
      tester,
    ) async {
      final dataModel = InMemoryDataModel();
      final context = MockSurfaceContext('test_surface', dataModel);

      final definition = SurfaceDefinition(
        surfaceId: 'test_surface',
        catalogId: 'test_catalog',
        components: {
          'root': const Component(
            id: 'root',
            type: 'NonExistentComponent',
            properties: {},
          ),
        },
      );

      context.updateDefinition(definition);

      await tester.pumpWidget(
        MaterialApp(home: Surface(surfaceContext: context)),
      );

      // Should show FallbackWidget
      expect(find.byType(FallbackWidget), findsOneWidget);
      expect(context.reportedErrors, isNotEmpty);
      expect(
        context.reportedErrors.first.toString(),
        contains('NonExistentComponent'),
      );
    });

    testWidgets('Surface reports error when Function throws', (tester) async {
      final dataModel = InMemoryDataModel();
      // Provide a catalog with a failing function
      final context = MockSurfaceContext('test_surface', dataModel);

      final definition = SurfaceDefinition(
        surfaceId: 'test_surface',
        catalogId: 'test_catalog',
        components: {
          'root': const Component(
            id: 'root',
            type: 'Text',
            properties: <String, Object?>{
              'text': {'call': 'failFunc', 'args': <String, Object?>{}},
            },
          ),
        },
      );

      context.updateDefinition(definition);

      await tester.pumpWidget(
        MaterialApp(home: Surface(surfaceContext: context)),
      );
      await tester.pump();

      // Verify FallbackWidget and reported error
      expect(find.byType(FallbackWidget), findsOneWidget);
      expect(context.reportedErrors, isNotEmpty);
      expect(
        context.reportedErrors.first.toString(),
        contains('Function failed explicitly'),
      );
    });
  });
}

class MockSurfaceContext implements SurfaceContext {
  MockSurfaceContext(this.surfaceId, this.dataModel);

  @override
  final String surfaceId;

  @override
  final DataModel dataModel;

  final ValueNotifier<SurfaceDefinition?> _definition = ValueNotifier(null);

  @override
  ValueListenable<SurfaceDefinition?> get definition => _definition;

  void updateDefinition(SurfaceDefinition def) {
    _definition.value = def;
  }

  @override
  Catalog? get catalog => _testCatalog;

  final List<Object> reportedErrors = [];

  @override
  void reportError(Object error, StackTrace? stack) {
    reportedErrors.add(error);
  }

  @override
  void handleUiEvent(UiEvent event) {}
}

class FailFunction extends SynchronousClientFunction {
  const FailFunction();

  @override
  String get name => 'failFunc';

  @override
  String get description => 'Fails the test.';

  @override
  ClientFunctionReturnType get returnType => ClientFunctionReturnType.empty;

  // This function is for internal testing only, so description matters less.
  // But we must implement the interface.
  @override
  Schema get argumentSchema => S.object();

  @override
  Object? executeSync(JsonMap args, ExecutionContext _) {
    throw Exception('Function failed explicitly');
  }
}

// Minimal catalog for testing
final Catalog _testCatalog = Catalog(
  catalogId: 'test_catalog',
  [
    CatalogItem(
      name: 'Text',
      dataSchema: S.object(),
      widgetBuilder: (ctx) {
        try {
          final Object? text = (ctx.data as Map<String, Object?>?)?['text'];
          if (text is Map && text.containsKey('call')) {
            final Object result = ctx.dataContext.resolve(text);
            if (result is Stream) {
              return StreamBuilder(
                stream: result,
                builder: (context, snapshot) {
                  if (snapshot.hasError) {
                    final Object error = snapshot.error!;
                    ctx.reportError.call(error, snapshot.stackTrace);
                    return FallbackWidget(error: error);
                  }
                  if (!snapshot.hasData) {
                    return const SizedBox();
                  }
                  return const Text('Placeholder');
                },
              );
            }
          }
        } catch (e) {
          rethrow;
        }
        return const Text('Placeholder');
      },
    ),
  ],
  functions: [const FailFunction()],
);
