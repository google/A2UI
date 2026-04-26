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

import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:genui/genui.dart';
import 'package:genui_a2a/genui_a2a.dart';
import 'package:logging/logging.dart';

const String defaultServerUrl = 'http://localhost:10002';

const List<String> _loadingTexts = [
  'Finding restaurants...',
  'Checking reviews...',
  'Almost there...',
];

class RestaurantSession extends ChangeNotifier {
  RestaurantSession({String serverUrl = defaultServerUrl}) {
    final List<Catalog> catalogs = [BasicCatalogItems.asCatalog()];
    _connector = A2uiAgentConnector(url: Uri.parse(serverUrl));
    _surfaceController = SurfaceController(catalogs: catalogs);
    _init();
  }

  late final A2uiAgentConnector _connector;
  late final SurfaceController _surfaceController;

  SurfaceHost get surfaceHost => _surfaceController;

  bool _isRequesting = false;
  bool get isRequesting => _isRequesting;

  bool _hasSentMessage = false;
  bool get hasSentMessage => _hasSentMessage;

  int _loadingTextIndex = 0;
  String get loadingText => _loadingTexts[_loadingTextIndex];

  String? _error;
  String? get error => _error;

  Iterable<String> get activeSurfaceIds => _surfaceController.activeSurfaceIds;

  final _logger = Logger('RestaurantSession');
  Timer? _loadingTimer;

  late final StreamSubscription<A2uiMessage> _a2uiSub;
  late final StreamSubscription<String> _textSub;
  late final StreamSubscription<ChatMessage> _submitSub;
  late final StreamSubscription<Object> _errorSub;
  late final StreamSubscription<SurfaceUpdate> _surfaceSub;

  void _init() {
    _a2uiSub = _connector.stream.listen(_handleUiFromAgent);
    _textSub = _connector.textStream.listen(_handleTextFromAgent);
    _submitSub = _surfaceController.onSubmit.listen(_handleSubmitFromSurface);
    _errorSub = _connector.errorStream.listen(_handleError);
    _surfaceSub = _surfaceController.surfaceUpdates.listen(_onSurfaceChanged);
  }

  void _handleSubmitFromSurface(ChatMessage message) {
    print('!!! Submit from surface: $message');
    // _sendMessageToAgent(message);
  }

  void _handleUiFromAgent(A2uiMessage message) {
    print('!!! UI from agent: $message');
    _surfaceController.handleMessage(message);
  }

  void _handleTextFromAgent(String text) {
    print('!!! Text from agent: $text');
    _logger.info('Text from agent: $text');
  }

  void _handleError(Object err) {
    print('!!! Error from agent: $err');
    _error = err.toString();
    _logger.severe('Error from agent', err, StackTrace.current);
    notifyListeners();
  }

  void _onSurfaceChanged(SurfaceUpdate _) {
    notifyListeners();
  }

  void _startLoadingAnimation() {
    print('!!! Starting loading animation');
    _loadingTextIndex = 0;
    _loadingTimer = Timer.periodic(const Duration(seconds: 2), (_) {
      _loadingTextIndex = (_loadingTextIndex + 1) % _loadingTexts.length;
      notifyListeners();
    });
  }

  void _stopLoadingAnimation() {
    print('!!! Stopping loading animation');
    _loadingTimer?.cancel();
    _loadingTimer = null;
  }

  Future<void> sendMessage(String text) async {
    print('!!! Sending message: $text');
    if (text.isEmpty) return;
    await _sendMessageToAgent(ChatMessage.user(text));
  }

  Future<void> _sendMessageToAgent(ChatMessage message) async {
    // Clear existing surfaces on each new request, like lit/shell does.
    for (final String id in [..._surfaceController.activeSurfaceIds]) {
      _surfaceController.handleMessage(DeleteSurface(surfaceId: id));
    }
    _hasSentMessage = true;
    _isRequesting = true;
    _error = null;
    _startLoadingAnimation();
    notifyListeners();
    try {
      await _connector.connectAndSend(
        message,
        clientCapabilities: _surfaceController.clientCapabilities,
      );
    } catch (e, st) {
      _error = e.toString();
      _logger.severe('Error sending message', e, st);
    } finally {
      _isRequesting = false;
      _stopLoadingAnimation();
      notifyListeners();
    }
  }

  @override
  void dispose() {
    _a2uiSub.cancel();
    _textSub.cancel();
    _submitSub.cancel();
    _errorSub.cancel();
    _surfaceSub.cancel();
    _loadingTimer?.cancel();
    _surfaceController.dispose();
    _connector.dispose();
    super.dispose();
  }
}
