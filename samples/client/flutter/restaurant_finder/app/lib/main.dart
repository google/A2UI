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

import 'package:flutter/material.dart';
import 'package:genui/genui.dart';
import 'package:logging/logging.dart';

import 'session.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  Logger.root.level = Level.ALL;
  Logger.root.onRecord.listen((record) {
    debugPrint('${record.level.name}: ${record.time}: ${record.message}');
  });
  runApp(const RestaurantFinderApp());
}

class RestaurantFinderApp extends StatefulWidget {
  const RestaurantFinderApp({super.key});

  @override
  State<RestaurantFinderApp> createState() => _RestaurantFinderAppState();
}

class _RestaurantFinderAppState extends State<RestaurantFinderApp> {
  ThemeMode _themeMode = ThemeMode.system;

  void _toggleTheme() {
    setState(() {
      _themeMode =
          _themeMode == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    });
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = ColorScheme.fromSeed(seedColor: Colors.orange);
    return MaterialApp(
      title: 'Restaurant Finder',
      themeMode: _themeMode,
      theme: ThemeData(colorScheme: colorScheme, useMaterial3: true),
      darkTheme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.orange,
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
      ),
      home: RestaurantScreen(
        onToggleTheme: _toggleTheme,
        themeMode: _themeMode,
      ),
    );
  }
}

class RestaurantScreen extends StatefulWidget {
  const RestaurantScreen({
    super.key,
    required this.onToggleTheme,
    required this.themeMode,
  });

  final VoidCallback onToggleTheme;
  final ThemeMode themeMode;

  @override
  State<RestaurantScreen> createState() => _RestaurantScreenState();
}

class _RestaurantScreenState extends State<RestaurantScreen> {
  final TextEditingController _textController = TextEditingController(
    text: 'Find me 3 Italian restaurants in New York.',
  );
  final ScrollController _scrollController = ScrollController();
  late final RestaurantSession _session;

  @override
  void initState() {
    super.initState();
    _session = RestaurantSession();
    _session.addListener(_scrollToBottom);
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: _session,
      builder:
          (context, _) => Scaffold(
            body: SafeArea(
              child: Stack(
                children: [
                  Center(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 640),
                      child: _buildContent(),
                    ),
                  ),
                  Positioned(
                    top: 8,
                    right: 16,
                    child: _ThemeToggleButton(
                      themeMode: widget.themeMode,
                      onToggle: widget.onToggleTheme,
                    ),
                  ),
                ],
              ),
            ),
          ),
    );
  }

  Widget _buildContent() {
    if (_session.isRequesting) {
      return Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(),
          const SizedBox(height: 16),
          Text(
            _session.loadingText,
            style: Theme.of(context).textTheme.bodyLarge,
          ),
        ],
      );
    }

    if (!_session.hasSentMessage) {
      return _buildForm();
    }

    return _buildSurfaces();
  }

  Widget _buildForm() {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 48, 16, 16),
      child: Column(
        children: [
          const Icon(Icons.restaurant, size: 80, color: Colors.orange),
          const SizedBox(height: 16),
          Text(
            'Restaurant Finder',
            style: Theme.of(
              context,
            ).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 32),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _textController,
                  decoration: InputDecoration(
                    hintText: 'Find me 3 Italian restaurants in New York.',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(32),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 16,
                    ),
                  ),
                  onSubmitted: (_) => _sendMessage(),
                ),
              ),
              const SizedBox(width: 8),
              FilledButton(
                onPressed: _sendMessage,
                style: FilledButton.styleFrom(
                  shape: const CircleBorder(),
                  padding: const EdgeInsets.all(16),
                ),
                child: const Icon(Icons.send),
              ),
            ],
          ),
          if (_session.error != null) ...[
            const SizedBox(height: 16),
            _ErrorBanner(message: _session.error!),
          ],
        ],
      ),
    );
  }

  Widget _buildSurfaces() {
    final surfaceIds = _session.activeSurfaceIds.toList();
    return Column(
      children: [
        if (_session.error != null)
          _ErrorBanner(message: _session.error!),
        Expanded(
          child:
              surfaceIds.isEmpty
                  ? const Center(child: CircularProgressIndicator())
                  : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(12),
                    itemCount: surfaceIds.length,
                    itemBuilder:
                        (context, i) => Surface(
                          surfaceContext: _session.surfaceHost.contextFor(
                            surfaceIds[i],
                          ),
                        ),
                  ),
        ),
      ],
    );
  }

  Future<void> _sendMessage() async {
    final text = _textController.text.trim();
    if (text.isEmpty) return;
    await _session.sendMessage(text);
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _session.dispose();
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }
}

class _ThemeToggleButton extends StatelessWidget {
  const _ThemeToggleButton({required this.themeMode, required this.onToggle});

  final ThemeMode themeMode;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      icon: Icon(
        themeMode == ThemeMode.dark ? Icons.light_mode : Icons.dark_mode,
      ),
      onPressed: onToggle,
      style: IconButton.styleFrom(
        backgroundColor: Theme.of(context).colorScheme.surface,
        shape: const CircleBorder(),
      ),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.errorContainer,
          border: Border.all(
            color: Theme.of(context).colorScheme.error.withValues(alpha: 0.5),
          ),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          message,
          style: TextStyle(color: Theme.of(context).colorScheme.onErrorContainer),
        ),
      ),
    );
  }
}
