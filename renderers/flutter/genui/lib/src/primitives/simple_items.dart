// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'package:uuid/uuid.dart';

/// A map of key-value pairs representing a JSON object.
typedef JsonMap = Map<String, Object?>;

/// Key used in schema definition to specify the component ID.
const String surfaceIdKey = 'surfaceId';

/// Generates a unique ID (UUID v4).
String generateId() => const Uuid().v4();
