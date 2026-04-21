// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// ignore_for_file: avoid_print

import 'package:flutter_test/flutter_test.dart';

import 'test_infra/restaurant_finder.dart';
// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:genui/genui.dart';
import 'package:genui_a2a/genui_a2a.dart';
import 'package:logging/logging.dart';

void main() {
  setUpAll(() async {
    final restaurantFinderClient = TestRestaurantFinderClient();
    addTearDown(restaurantFinderClient.dispose);
    await restaurantFinderClient.startAndVerify();
  });

  test('Restaurant finder can answer questions.', () {});
}

/// A class that manages the chat session state and logic.
class ChatSession extends ChangeNotifier {
  ChatSession({required String agentUrl}) {
    _connector = A2uiAgentConnector(url: Uri.parse(agentUrl));
    _surfaceController = SurfaceController(
      catalogs: [BasicCatalogItems.asCatalog()],
    );
    _init();
  }

  late final A2uiAgentConnector _connector;
  late final SurfaceController _surfaceController;

  SurfaceHost get surfaceController => _surfaceController;

  bool _isProcessing = false;
  bool get isProcessing => _isProcessing;

  final Logger _logger = Logger('ChatSession');

  late final StreamSubscription<A2uiMessage> _a2uiSubscription;
  late final StreamSubscription<String> _textSubscription;
  late final StreamSubscription<ChatMessage> _submitSubscription;
  late final StreamSubscription<Object> _errorSubscription;

  void _init() {
    // Predefine a surface.
    _surfaceController.handleMessage(
      const CreateSurface(catalogId: 'basic', surfaceId: 'main'),
    );
    _a2uiSubscription = _connector.stream.listen(_handleA2uiMessage);

    _textSubscription = _connector.textStream.listen(_updateAiMessage);

    _submitSubscription = _surfaceController.onSubmit.listen(_sendChatMessage);

    _errorSubscription = _connector.errorStream.listen((error) {
      _logger.severe('A2A error', error);
      notifyListeners();
    });
  }

  String? _currentAiMessage;

  void _handleA2uiMessage(A2uiMessage message) {
    _surfaceController.handleMessage(message);
  }

  void _updateAiMessage(String chunk) {
    _currentAiMessage = (_currentAiMessage ?? '') + chunk;
    notifyListeners();
  }

  Future<void> sendMessage(String text) async {
    if (text.isEmpty) return;
    _currentAiMessage = null;
    await _sendChatMessage(ChatMessage.user(text));
  }

  Future<void> _sendChatMessage(ChatMessage message) async {
    _isProcessing = true;
    notifyListeners();
    try {
      await _connector.connectAndSend(message);
    } catch (error, stackTrace) {
      _logger.severe('Error sending message', error, stackTrace);
      notifyListeners();
    } finally {
      _isProcessing = false;
      notifyListeners();
    }
  }

  @override
  void dispose() {
    _a2uiSubscription.cancel();
    _textSubscription.cancel();
    _submitSubscription.cancel();
    _errorSubscription.cancel();
    _surfaceController.dispose();
    _connector.dispose();
    super.dispose();
  }
}
