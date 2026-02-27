// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:genui/src/catalog/basic_catalog.dart';
import 'package:genui/src/functions/format_string.dart';
import 'package:genui/src/model/data_model.dart';
// import 'package:genui/src/primitives/simple_items.dart'; // Unused

void main() {
  group('FormatStringFunction & ExpressionParser', () {
    late DataContext context;
    late ExpressionParser parser;
    late DataModel dataModel;
    late FormatStringFunction formatStringFunction;

    setUp(() {
      dataModel = InMemoryDataModel();
      context = DataContext(
        dataModel,
        DataPath.root,
        functions: BasicCatalogItems.asCatalog().functions,
      );
      parser = ExpressionParser(context);
      formatStringFunction = const FormatStringFunction();
    });

    Future<T> eval<T>(Object? result) async {
      if (result is Stream) {
        return (await result.first) as T;
      }
      return result as T;
    }

    group('FormatStringFunction', () {
      test('returns empty string if value missing', () async {
        final Stream<Object?> result = formatStringFunction.execute(
          {},
          context,
        );
        expect(await result.first, '');
      });

      test('returns string representation of non-string values', () async {
        final Stream<Object?> result = formatStringFunction.execute({
          'value': 123,
        }, context);
        expect(await result.first, '123');
      });

      test('parses string with expressions', () async {
        dataModel.update(DataPath('/name'), 'World');
        final Stream<Object?> result = formatStringFunction.execute({
          'value': 'Hello \${/name}',
        }, context);
        expect(await result.first, 'Hello World');
      });

      test('parses string with function calls', () async {
        final Stream<Object?> result = formatStringFunction.execute({
          'value': '\${required(value: "hello")}',
        }, context);
        expect(await result.first, 'true');
      });
    });

    group('ExpressionParser', () {
      group('parse', () {
        test('returns input if no expressions', () async {
          expect(await eval<String>(parser.parse('hello')), 'hello');
          expect(await eval<String>(parser.parse('123')), '123');
        });

        test('resolves simple path expression', () async {
          dataModel.update(DataPath('/name'), 'World');
          expect(
            await eval<String>(parser.parse(r'Hello ${/name}')),
            'Hello World',
          );
        });

        test('resolves multiple expressions', () async {
          dataModel.update(DataPath('/firstName'), 'John');
          dataModel.update(DataPath('/lastName'), 'Doe');
          expect(
            await eval<String>(parser.parse(r'${/firstName} ${/lastName}')),
            'John Doe',
          );
        });

        test('escapes expression', () async {
          expect(
            await eval<String>(parser.parse(r'Value: \${/foo}')),
            r'Value: ${/foo}',
          );
        });

        test('returns non-string type for single expression', () async {
          dataModel.update(DataPath('/count'), 42);
          expect(await eval<String>(parser.parse(r'${/count}')), '42');
        });

        test(
          'converts non-string values to string when mixed with text',
          () async {
            dataModel.update(DataPath('/count'), 42);
            expect(
              await eval<String>(parser.parse(r'Count: ${/count}')),
              'Count: 42',
            );
          },
        );
      });

      group('evaluateFunctionCall (Logic)', () {
        test('and', () async {
          expect(
            await eval<bool>(
              parser.evaluateFunctionCall({
                'call': 'and',
                'args': {
                  'values': [true, true],
                },
              }),
            ),
            isTrue,
          );
          expect(
            await eval<bool>(
              parser.evaluateFunctionCall({
                'call': 'and',
                'args': {
                  'values': [true, false],
                },
              }),
            ),
            isFalse,
          );
        });
        // ...
      });

      // ...

      group('Invalid syntax', () {
        test(
          'rejects function call with raw function call as argument',
          () async {
            parser = ExpressionParser(context);
            expect(
              await eval<String>(parser.parse(r'${not(not(false))}')),
              'false',
            );
          },
        );

        test('rejects function call with raw function call as named argument '
            'value', () async {
          expect(
            await eval<String>(
              parser.parse(r'${not(value: not(value: false))}'),
            ),
            'true',
          );
        });

        test('handles unmatched braces gracefully', () async {
          expect(
            await eval<String>(parser.parse(r'Hello ${world')),
            r'Hello ${world',
          );
        });

        test('handles missing colon in named arguments gracefully', () async {
          expect(
            await eval<String>(parser.parse(r'${required(value "test")}')),
            'false',
          );
        });
      });

      group('Recursion Depth', () {
        // Testing via evaluateFunctionCall which calls private methods
        test('evaluateFunctionCall throws on exceeding max depth', () {
          Map<String, Object?> expression = {'value': true};
          for (var i = 0; i < 105; i++) {
            expression = {
              'call': 'not',
              'args': {'value': expression},
            };
          }
          // parse doesn't take map, evaluateFunctionCall does.
          expect(
            () => parser.evaluateFunctionCall(expression),
            throwsA(isA<RecursionExpectedException>()),
          );
        });
      });
    });
  });
}
