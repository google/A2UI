// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'package:flutter_test/flutter_test.dart';
import 'package:genui/src/utils/json_block_parser.dart';

void main() {
  group('JsonBlockParser', () {
    test('parses simple JSON block', () {
      const text = 'Here is some JSON:\n```json\n{"foo": "bar"}\n```';
      final Object? result = JsonBlockParser.parseFirstJsonBlock(text);
      expect(result, equals({'foo': 'bar'}));
    });

    test('parses multi-line JSON block', () {
      const text = '''
Here is some JSON:
```json
{
  "foo": "bar",
  "baz": [
    1,
    2,
    3
  ]
}
```
''';
      final Object? result = JsonBlockParser.parseFirstJsonBlock(text);
      expect(
        result,
        equals({
          'foo': 'bar',
          'baz': [1, 2, 3],
        }),
      );
    });

    test('parses JSON block without language tag', () {
      const text = '```\n{"foo": "bar"}\n```';
      final Object? result = JsonBlockParser.parseFirstJsonBlock(text);
      expect(result, equals({'foo': 'bar'}));
    });

    test('parses raw JSON in text', () {
      const text = 'Some text {"foo": "bar"} more text';
      final Object? result = JsonBlockParser.parseFirstJsonBlock(text);
      expect(result, equals({'foo': 'bar'}));
    });

    test('parses raw JSON with newlines', () {
      const text = 'Some text {\n"foo": "bar"\n} more text';
      final Object? result = JsonBlockParser.parseFirstJsonBlock(text);
      expect(result, equals({'foo': 'bar'}));
    });

    test('parses raw JSON array', () {
      const text = 'Some text ["foo", "bar"] more text';
      final Object? result = JsonBlockParser.parseFirstJsonBlock(text);
      expect(result, equals(['foo', 'bar']));
    });

    test('parses JSON block containing string with brackets and braces', () {
      const text = 'Some text {"foo": "[{test}]"} more text';
      final Object? result = JsonBlockParser.parseFirstJsonBlock(text);
      expect(result, equals({'foo': '[{test}]'}));
    });
  });
}
