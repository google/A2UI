// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'package:flutter_test/flutter_test.dart';
import 'package:genui/genui.dart';

void main() {
  group('PromptBuilder', () {
    const instructions = 'These are some instructions.';
    final catalog = const Catalog([]); // Empty catalog for testing.

    test('includes instructions when provided', () {
      final builder = PromptBuilder.chat(
        catalog: catalog,
        instructions: instructions,
      );

      expect(builder.systemPrompt, contains(instructions));
    });

    test('includes warning about surfaceId', () {
      final builder = PromptBuilder.chat(catalog: catalog);

      expect(builder.systemPrompt, contains('IMPORTANT: When you generate UI'));
      expect(builder.systemPrompt, contains('surfaceId'));
    });

    test('includes A2UI schema', () {
      final builder = PromptBuilder.chat(catalog: catalog);

      expect(builder.systemPrompt, contains('<a2ui_schema>'));
      expect(builder.systemPrompt, contains('</a2ui_schema>'));
    });

    test('includes basic catalog rules', () {
      final builder = PromptBuilder.chat(catalog: catalog);

      expect(
        builder.systemPrompt,
        contains(BasicCatalogEmbed.basicCatalogRules),
      );
    });

    test('includes basic chat prompt fragment', () {
      final builder = PromptBuilder.chat(catalog: catalog);

      expect(builder.systemPrompt, contains('# Outputting UI information'));
    });
  });
}
