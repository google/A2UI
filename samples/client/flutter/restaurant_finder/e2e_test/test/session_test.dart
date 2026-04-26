// Copyright 2025 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// ignore_for_file: avoid_print

import 'package:flutter_test/flutter_test.dart';
import 'package:restaurant_finder_client/session.dart';

import 'test_infra/restaurant_finder.dart';

void main() {
  setUp(() async {
    final restaurantFinderClient = TestRestaurantFinderClient();
    addTearDown(restaurantFinderClient.dispose);
    await restaurantFinderClient.startAndVerify();
  });

  tearDown(() {
    print('Teared down the test.');
  });

  test(
    'RestaurantSession can talk to restaurant finder.',
    () async {
      final session = RestaurantSession(
        serverUrl: TestRestaurantFinderClient().baseUrl,
      );
      addTearDown(session.dispose);

      expect(session.isRequesting, isFalse);
      expect(session.hasSentMessage, isFalse);
      expect(session.activeSurfaceIds, isEmpty);

      await session.sendMessage('Find me 3 italian restaurants in New York.');

      expect(session.hasSentMessage, isTrue);
      expect(session.isRequesting, isFalse);
      expect(session.error, isNull);

      // TODO(polina-c): check the response of the service.
    },
    timeout: const Timeout(Duration(minutes: 5)),
  );
}
