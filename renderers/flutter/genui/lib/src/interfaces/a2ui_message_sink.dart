// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import '../model/a2ui_message.dart';

/// An interface for a message sink that accepts [A2uiMessage]s.
abstract interface class A2uiMessageSink {
  /// Handles a message from the client.
  void handleMessage(A2uiMessage message);
}
