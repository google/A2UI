// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'package:flutter/material.dart';
import 'package:logging/logging.dart';

import 'chat_session.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  Logger.root.level = Level.SEVERE;
  Logger.root.onRecord.listen((record) {
    debugPrint('${record.level.name}: ${record.time}: ${record.message}');
  });
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    final colorScheme = ColorScheme.fromSeed(seedColor: Colors.blue);
    return MaterialApp(
      title: 'Restaurant Booker',
      theme: ThemeData(colorScheme: colorScheme),
      darkTheme: ThemeData(
        colorScheme: colorScheme.copyWith(brightness: Brightness.dark),
      ),
      home: const ChatScreen(),
    );
  }
}

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _textController = TextEditingController(
    text: 'Top 5 Chinese restaurants in New York.',
  );
  final ScrollController _scrollController = ScrollController();
  late final ChatSession _chatSession;

  @override
  void initState() {
    super.initState();
    _chatSession = ChatSession(agentUrl: 'http://localhost:10002');
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: _chatSession,
      builder: (context, _) {
        return Scaffold(
          appBar: AppBar(title: const Text('Restaurant Booker')),
          body: SafeArea(
            child: Column(
              children: [
                const Text('Hello'),

                if (_chatSession.isProcessing)
                  const Padding(
                    padding: EdgeInsets.all(8.0),
                    child: CircularProgressIndicator(),
                  ),

                Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _textController,
                          decoration: const InputDecoration(
                            hintText: 'Type your message...',
                          ),
                          enabled: !_chatSession.isProcessing,
                          onSubmitted: (_) => _sendMessage(),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.send),
                        onPressed: _chatSession.isProcessing
                            ? null
                            : _sendMessage,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _sendMessage() async {
    final String text = _textController.text;
    if (text.isEmpty) return;
    _textController.clear();
    await _chatSession.sendMessage(text);
  }

  @override
  void dispose() {
    _chatSession.dispose();
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }
}
