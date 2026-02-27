// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:genui/src/model/data_model.dart';

void main() {
  group('DataModel Edge Cases', () {
    late DataModel dataModel;

    setUp(() {
      dataModel = InMemoryDataModel();
    });

    test('Implicit Structure: Creates nested maps by default', () {
      dataModel.update(DataPath('/a/b/c'), 1);
      final int? value = dataModel.getValue<int>(DataPath('/a/b/c'));
      expect(value, 1);

      final Map<Object?, Object?>? mapA = dataModel
          .getValue<Map<Object?, Object?>>(DataPath('/a'));
      expect(mapA, isA<Map<Object?, Object?>>());
      expect(mapA?['b'], isA<Map<Object?, Object?>>());
      expect((mapA?['b'] as Map<Object?, Object?>)['c'], 1);
    });

    test('Implicit Structure: Creates list if next segment is integer', () {
      dataModel.update(DataPath('/list/0/item'), 'first');

      final List<Object?>? list = dataModel.getValue<List<Object?>>(
        DataPath('/list'),
      );
      expect(list, isA<List<Object?>>());
      expect(list?.length, 1);

      final Object? item0 = list?[0];
      expect(item0, isA<Map<Object?, Object?>>());
      expect((item0 as Map<Object?, Object?>)['item'], 'first');
    });

    test('Implicit Structure: Creates list of lists', () {
      dataModel.update(DataPath('/matrix/0/0'), 1);

      final List<Object?>? matrix = dataModel.getValue<List<Object?>>(
        DataPath('/matrix'),
      );
      expect(matrix, isA<List<Object?>>());
      expect(matrix?[0], isA<List<Object?>>());
      expect((matrix?[0] as List<Object?>)[0], 1);
    });

    test('Type Mismatch: Overwriting primitive with map fails silently', () {
      // Setup: /a is a String
      dataModel.update(DataPath('/a'), 'hello');

      // Attempt to write /a/b (treating /a as map)
      // Implementation check: _updateValue checks "if (current is Map)".
      // If current is String, it does nothing.
      dataModel.update(DataPath('/a/b'), 'world');

      // Verify /a is still 'hello'
      expect(dataModel.getValue<String>(DataPath('/a')), 'hello');
      // Verify /a/b is unresolvable (null)
      expect(dataModel.getValue<String>(DataPath('/a/b')), isNull);
    });

    test('Type Mismatch: Overwriting map with primitive clobbers', () {
      // Setup: /a/b = 1
      dataModel.update(DataPath('/a/b'), 1);

      // Overwrite /a with primitive
      dataModel.update(DataPath('/a'), 'clobbered');

      expect(dataModel.getValue<String>(DataPath('/a')), 'clobbered');
      expect(dataModel.getValue<int>(DataPath('/a/b')), isNull);
    });

    test('List Boundaries: Append works (index == length)', () {
      dataModel.update(DataPath('/list/0'), 'a');
      dataModel.update(DataPath('/list/1'), 'b');

      expect(dataModel.getValue<List<Object?>>(DataPath('/list')), ['a', 'b']);
    });

    test('List Boundaries: Out of bounds (index > length) is ignored', () {
      dataModel.update(DataPath('/list/0'), 'a');

      // Try to write to index 2 (skipping 1)
      dataModel.update(DataPath('/list/2'), 'c');

      expect(dataModel.getValue<List<Object?>>(DataPath('/list')), ['a']);
      // Verify length is still 1
      final List<Object?>? list = dataModel.getValue<List<Object?>>(
        DataPath('/list'),
      );
      expect(list?.length, 1);
    });

    test('Null Handling: Setting map key to null removes it', () {
      dataModel.update(DataPath('/map'), {'a': 1, 'b': 2});
      dataModel.update(DataPath('/map/a'), null);

      final Map<Object?, Object?>? map = dataModel
          .getValue<Map<Object?, Object?>>(DataPath('/map'));
      expect(map?.containsKey('a'), isFalse);
      expect(map?['b'], 2);
    });

    test('Null Handling: Setting list index to null sets it to null '
        '(does not remove)', () {
      dataModel.update(DataPath('/list/0'), 'a');
      dataModel.update(DataPath('/list/0'), null);

      final List<Object?>? list = dataModel.getValue<List<Object?>>(
        DataPath('/list'),
      );
      expect(list?.length, 1);
      expect(list?[0], isNull);
    });

    test('Subscription: Notified when parent structure changes', () {
      // Subscribe to /a/b
      dataModel.update(DataPath('/a/b'), 1);
      final ValueNotifier<int?> notifier = dataModel.subscribe<int>(
        DataPath('/a/b'),
      );

      int? lastValue;
      notifier.addListener(() => lastValue = notifier.value);

      // Update /a (parent), removing b
      dataModel.update(DataPath('/a'), {'c': 3});

      // Notifier should fire and value should be null
      expect(lastValue, isNull);
      expect(notifier.value, isNull);
    });

    test('Subscription: Notified when structure created under it', () {
      final ValueNotifier<String?> notifier = dataModel.subscribe<String>(
        DataPath('/a/b'),
      );
      String? lastValue;
      notifier.addListener(() => lastValue = notifier.value);

      // Create properties
      dataModel.update(DataPath('/a/b'), 'created');

      expect(lastValue, 'created');
    });
  });
}
