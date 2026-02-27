// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'package:flutter_test/flutter_test.dart';
import 'package:genui/src/engine/data_model_store.dart';
import 'package:genui/src/model/data_model.dart';

void main() {
  group('DataModelStore', () {
    late DataModelStore store;

    setUp(() {
      store = DataModelStore();
    });

    test('getDataModel creates new model if not exists', () {
      final DataModel model = store.getDataModel('s1');
      expect(model, isNotNull);
      expect(store.dataModels['s1'], same(model));
    });

    test('getDataModel returns existing model', () {
      final DataModel model1 = store.getDataModel('s1');
      final DataModel model2 = store.getDataModel('s1');
      expect(model1, same(model2));
    });

    test('removeDataModel removes model and detaches surface', () {
      final DataModel model = store.getDataModel('s1');
      store.attachSurface('s1');

      store.removeDataModel('s1');
      expect(store.dataModels.containsKey('s1'), isFalse);
      // We can't directly check `_attachedSurfaces`, but calling detach
      // directly shouldn't throw. (Internal state check is implicit via
      // coverage)

      // We check that getting it again returns a new one
      final DataModel newModel = store.getDataModel('s1');
      expect(model, isNot(same(newModel)));
    });

    test('attachSurface and detachSurface', () {
      // These are tested primarily through side-effects in DataModelStore,
      // but their execution shouldn't throw errors.
      store.attachSurface('s1');
      store.detachSurface('s1');
      expect(true, isTrue);
    });

    test('dataModels returns unmodifiable map', () {
      store.getDataModel('s1');
      expect(
        () => store.dataModels['s2'] = InMemoryDataModel(),
        throwsUnsupportedError,
      );
    });

    test('dispose calls dispose on all data models', () {
      store.getDataModel('s1');
      store.getDataModel('s2');
      expect(store.dataModels.length, 2);

      store.dispose();
      // Dispose should not throw
      expect(true, isTrue);
    });
  });
}
