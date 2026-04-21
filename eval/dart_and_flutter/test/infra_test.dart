// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// ignore_for_file: avoid_print

import 'package:flutter_test/flutter_test.dart';

import 'test_infra/ai_client.dart';
import 'test_infra/api_key.dart';
import 'test_infra/shell_utils.dart';

const _restaurantFinderCurlMessage = r'''
curl http://localhost:10002 \
  -H 'Content-Type: application/json' \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "message/send",
    "params": {
      "message": {
        "role": "user",
        "parts": [{"text": "Find me an Italian restaurant"}],
        "messageId": "1"
      }
    }
  }'
''';

void main() {
  test('test can read api key "$geminiApiKeyName"', () {
    final String key = apiKeyForEval();
    expect(key, isNotEmpty);
    print('API Key: ${key.substring(0, 1)}...${key.substring(key.length - 1)}');
  });

  test('test can talk with AI', () async {
    final aiClient = DartanticAiClient();
    addTearDown(aiClient.dispose);

    final String result =
        (await aiClient
                .sendStream('Please, tell me a joke.', history: [])
                .toList())
            .join(' ');
    expect(result, isNotEmpty);
    print('Result: $result');
  });

  /// Tests [start instructions](../../samples/agent/adk/restaurant_finder/README.md)
  test('test can start restaurant_finder', () async {
    final process = await startService(
      '(cd ../../samples/agent/adk/restaurant_finder && uv run .)',
      [
        ShellProbe(
          command: 'curl http://localhost:10002/.well-known/agent-card.json',
          responseChecker: (response) {
            expect(response, contains('capabilities'));
            expect(response, contains('A2UI'));
          },
        ),
        ShellProbe(
          command: _restaurantFinderCurlMessage,
          responseChecker: (response) {
            expect(response, contains('"parts":[{"kind":'));
          },
        ),
      ],
    );
    addTearDown(process.kill);
  });
}
