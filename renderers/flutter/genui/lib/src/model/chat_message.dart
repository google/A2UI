// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'package:genai_primitives/genai_primitives.dart';

export 'package:genai_primitives/genai_primitives.dart';

// Re-export UI helpers
export 'parts/ui.dart';

/// Extension to help with `UserMessage` usages if needed,
/// or just helper factories.
extension ChatMessageFactories on ChatMessage {
  /// Creates a text message from a user.
  static ChatMessage userText(String text) => ChatMessage.user(text);

  /// Creates a text message from the model.
  static ChatMessage modelText(String text) => ChatMessage.model(text);
}
