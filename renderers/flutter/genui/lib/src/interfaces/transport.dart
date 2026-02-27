// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'dart:async';

import '../model/a2ui_message.dart';
import '../model/chat_message.dart';

/// An interface for transporting messages between GenUI and an AI service.
///
/// This unifies the concept of incoming streams (text chunks and A2UI messages)
/// and outgoing requests.
abstract interface class Transport {
  /// A stream of raw text chunks received from the AI service.
  ///
  /// This is typically used for "streaming" responses where the text is built
  /// up over time.
  Stream<String> get incomingText;

  /// A stream of parsed [A2uiMessage]s received from the AI service.
  Stream<A2uiMessage> get incomingMessages;

  /// Sends a request to the AI service.
  Future<void> sendRequest(ChatMessage message);

  /// Disposes of any resources used by this transport.
  void dispose();
}
