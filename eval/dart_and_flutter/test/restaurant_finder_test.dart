// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// ignore_for_file: avoid_print

import 'package:flutter_test/flutter_test.dart';

import 'test_infra/restaurant_finder.dart';

void main() {
  setUpAll(() async {
    final restaurantFinderClient = TestRestaurantFinderClient();
    addTearDown(restaurantFinderClient.dispose);
    await restaurantFinderClient.startAndVerify();
  });

  test('Restaurant finder can answer questions.', () {});
}
