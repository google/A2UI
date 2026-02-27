// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:genui/src/catalog/basic_catalog.dart';
import 'package:genui/src/model/a2ui_message.dart';
import 'package:genui/src/model/catalog.dart';
import 'package:genui/src/model/data_model.dart';
import 'package:genui/src/model/ui_models.dart';
import 'package:genui/src/primitives/simple_items.dart';
import 'package:json_schema_builder/src/schema/schema.dart';

void main() {
  group('A2uiMessage', () {
    // ... existing tests ...
    test('CreateSurface.fromJson parses correctly', () {
      final Map<String, Object> json = {
        'version': 'v0.9',
        'createSurface': {
          surfaceIdKey: 's1',
          'catalogId': 'catalog1',
          'theme': {'color': 'blue'},
          'sendDataModel': true,
        },
      };

      final message = A2uiMessage.fromJson(json);
      expect(message, isA<CreateSurface>());
      final create = message as CreateSurface;
      expect(create.surfaceId, 's1');
      expect(create.catalogId, 'catalog1');
      expect(create.theme, {'color': 'blue'});
      expect(create.sendDataModel, isTrue);
    });

    test('UpdateComponents.fromJson parses correctly', () {
      final Map<String, Object> json = {
        'version': 'v0.9',
        'updateComponents': {
          surfaceIdKey: 's1',
          'components': [
            {'id': 'c1', 'component': 'Text', 'text': 'Hello'},
          ],
        },
      };

      final message = A2uiMessage.fromJson(json);
      expect(message, isA<UpdateComponents>());
      final update = message as UpdateComponents;
      expect(update.surfaceId, 's1');
      expect(update.components.length, 1);
      expect(update.components.first.id, 'c1');
      expect(update.components.first.type, 'Text');
    });

    test('UpdateDataModel.fromJson parses correctly', () {
      final Map<String, Object> json = {
        'version': 'v0.9',
        'updateDataModel': {
          surfaceIdKey: 's1',
          'path': '/user/name',
          'value': 'Alice',
        },
      };

      final message = A2uiMessage.fromJson(json);
      expect(message, isA<UpdateDataModel>());
      final update = message as UpdateDataModel;
      expect(update.surfaceId, 's1');
      expect(update.path, DataPath('/user/name'));
      expect(update.value, 'Alice');
    });

    test('DeleteSurface.fromJson parses correctly', () {
      final Map<String, Object> json = {
        'version': 'v0.9',
        'deleteSurface': {surfaceIdKey: 's1'},
      };

      final message = A2uiMessage.fromJson(json);
      expect(message, isA<DeleteSurface>());
      final delete = message as DeleteSurface;
      expect(delete.surfaceId, 's1');
    });

    test('CreateSurface.toJson includes version', () {
      const message = CreateSurface(surfaceId: 's1', catalogId: 'c1');
      expect(message.toJson(), containsPair('version', 'v0.9'));
    });

    test('UpdateComponents.toJson includes version', () {
      const message = UpdateComponents(surfaceId: 's1', components: []);
      expect(message.toJson(), containsPair('version', 'v0.9'));
    });

    test('UpdateDataModel.toJson includes version', () {
      const message = UpdateDataModel(surfaceId: 's1');
      expect(message.toJson(), containsPair('version', 'v0.9'));
    });

    test('DeleteSurface.toJson includes version', () {
      const message = DeleteSurface(surfaceId: 's1');
      expect(message.toJson(), containsPair('version', 'v0.9'));
    });

    test('fromJson throws on unknown message type', () {
      final json = <String, Object>{'version': 'v0.9', 'unknown': {}};
      expect(
        () => A2uiMessage.fromJson(json),
        throwsA(
          isA<A2uiValidationException>().having(
            (e) => e.message,
            'message',
            contains('Unknown A2UI message type'),
          ),
        ),
      );
    });

    test('fromJson throws on missing or invalid version', () {
      final json = <String, Object>{
        'createSurface': {surfaceIdKey: 's1', 'catalogId': 'c1'},
      };
      expect(
        () => A2uiMessage.fromJson(json),
        throwsA(
          isA<A2uiValidationException>().having(
            (e) => e.message,
            'message',
            contains('A2UI message must have version "v0.9"'),
          ),
        ),
      );
    });

    test('a2uiMessageSchema requires version field', () {
      final Catalog catalog = BasicCatalogItems.asCatalog();
      final Schema schema = A2uiMessage.a2uiMessageSchema(catalog);
      final json = jsonDecode(schema.toJson()) as Map<String, Object?>;

      // Structure is combined -> allOf -> [object]
      expect(json['allOf'], isA<List<Object?>>());
      final allOf = json['allOf'] as List<Object?>;
      expect(allOf, isNotEmpty);
      final mainSchema = allOf.first as Map<String, Object?>;

      final properties = mainSchema['properties'] as Map<String, Object?>;
      expect(properties, contains('version'));

      final required = mainSchema['required'] as List<Object?>;
      expect(required, contains('version'));

      final versionSchema = properties['version'] as Map<String, Object?>;
      // Depending on json_schema_builder version, it might be 'const' or 'enum'
      // But we expect it to enforce 'v0.9'
      expect(versionSchema, containsPair('const', 'v0.9'));
    });
  });
}
