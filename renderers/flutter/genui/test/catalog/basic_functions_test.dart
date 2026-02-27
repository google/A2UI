// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:genui/src/catalog/basic_functions.dart';
import 'package:genui/src/model/client_function.dart';
import 'package:genui/src/model/data_model.dart';

void main() {
  group('BasicFunctions', () {
    late DataContext context;
    late DataModel dataModel;

    setUp(() {
      dataModel = InMemoryDataModel();
      context = DataContext(dataModel, DataPath.root);
    });

    Future<T> run<T>(ClientFunction func, Map<String, Object?> args) async {
      final Stream<Object?> result = func.execute(args, context);
      return (await result.first) as T;
    }

    test('required', () async {
      final RequiredFunction func = BasicFunctions.requiredFunction;
      expect(await run<bool>(func, {'value': 'foo'}), isTrue);
      expect(await run<bool>(func, {'value': ''}), isFalse);
      expect(await run<bool>(func, {'value': null}), isFalse);
      expect(await run<bool>(func, {'value': []}), isFalse);
      expect(
        await run<bool>(func, {
          'value': ['a'],
        }),
        isTrue,
      );
    });

    test('regex', () async {
      final RegexFunction func = BasicFunctions.regexFunction;
      expect(
        await run<bool>(func, {'value': 'hello', 'pattern': '^h.*o\$'}),
        isTrue,
      );
      expect(
        await run<bool>(func, {'value': 'hello', 'pattern': '^w.*d\$'}),
        isFalse,
      );
      expect(
        await run<bool>(func, {'value': null, 'pattern': '.*'}),
        isFalse, // null value doesn't match
      );
    });

    test('length', () async {
      final LengthFunction func = BasicFunctions.lengthFunction;
      expect(await run<int>(func, {'value': 'hello'}), 5);
      expect(
        await run<int>(func, {
          'value': [1, 2, 3],
        }),
        3,
      );
      expect(
        await run<int>(func, {
          'value': {'a': 1, 'b': 2},
        }),
        2,
      );
      expect(await run<int>(func, {'value': null}), 0);
    });

    test('and', () async {
      final AndFunction func = BasicFunctions.andFunction;
      expect(
        await run<bool>(func, {
          'values': [true, true],
        }),
        isTrue,
      );
      expect(
        await run<bool>(func, {
          'values': [true, false],
        }),
        isFalse,
      );
    });

    test('or', () async {
      final OrFunction func = BasicFunctions.orFunction;
      expect(
        await run<bool>(func, {
          'values': [false, false],
        }),
        isFalse,
      );
      expect(
        await run<bool>(func, {
          'values': [false, true],
        }),
        isTrue,
      );
    });

    test('not', () async {
      final NotFunction func = BasicFunctions.notFunction;
      expect(await run<bool>(func, {'value': true}), isFalse);
      expect(await run<bool>(func, {'value': false}), isTrue);
    });
  });
}
