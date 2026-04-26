// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// ignore_for_file: avoid_print

import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:genui/genui.dart';
import 'package:genui_a2a/genui_a2a.dart';
import 'package:logging/logging.dart';

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
    'GenUI SDK can talk to restaurant finder.',
    () async {
      final chatSession = _Session(
        baseUrl: TestRestaurantFinderClient().baseUrl,
      );
      await chatSession.sendTextToAgent(
        'Find me 3 italian restaurants in New York.',
      );

      // TODO(polina-c): check the response of the service.
    },
    timeout: const Timeout(Duration(minutes: 5)),
  );
}

/// A class that manages the chat session state and logic.
class _Session extends ChangeNotifier {
  _Session({required String baseUrl}) {
    _connector = A2uiAgentConnector(url: Uri.parse(baseUrl));
    final List<Catalog> catalogs = [
      BasicCatalogItems.asCatalog().copyWith(
        catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
      ),
    ];
    _surfaceController = SurfaceController(catalogs: catalogs);
    _clientCapabilities = A2UiClientCapabilities.fromCatalogs(catalogs);
    _init();
  }

  late final A2UiClientCapabilities _clientCapabilities;

  late final A2uiAgentConnector _connector;
  late final SurfaceController _surfaceController;

  // ignore: unreachable_from_main
  SurfaceHost get surfaceController => _surfaceController;

  bool _isProcessing = false;
  // ignore: unreachable_from_main
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
    _a2uiSubscription = _connector.stream.listen(_handleUiStreamFromAgent);

    _textSubscription = _connector.textStream.listen(
      _handleTextStreamFromAgent,
    );

    _submitSubscription = _surfaceController.onSubmit.listen(
      _sendMessageToAgent,
    );

    _errorSubscription = _connector.errorStream.listen(_handleError);
  }

  String? _currentAiMessage;

  void _handleError(Object error) {
    print('Received error from agent: $error');
    notifyListeners();
  }

  void _handleUiStreamFromAgent(A2uiMessage message) {
    print('Received UI stream from agent: $message');
    _surfaceController.handleMessage(message);
  }

  void _handleTextStreamFromAgent(String chunk) {
    print('Received text chunk from agent: $chunk');
    _currentAiMessage = (_currentAiMessage ?? '') + chunk;
    notifyListeners();
  }

  Future<void> sendTextToAgent(String text) async {
    if (text.isEmpty) return;
    _currentAiMessage = null;
    await _sendMessageToAgent(ChatMessage.user(text));
  }

  Future<void> _sendMessageToAgent(ChatMessage message) async {
    print('Sending text to agent: $message');
    _isProcessing = true;
    notifyListeners();
    try {
      await _connector.connectAndSend(
        message,
        clientCapabilities: _clientCapabilities,
      );
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
