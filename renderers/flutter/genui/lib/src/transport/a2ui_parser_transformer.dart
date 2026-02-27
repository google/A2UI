// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'dart:async';
import 'dart:convert';

import '../model/a2ui_message.dart';
import '../model/generation_events.dart';
import '../model/ui_models.dart';

/// Transforms a stream of text chunks into a stream of logical
/// [GenerationEvent]s.
///
/// It handles buffering split tokens, extracting JSON blocks, and sanitizing
/// text.
class A2uiParserTransformer
    extends StreamTransformerBase<String, GenerationEvent> {
  /// Creating a const constructor for the transformer.
  const A2uiParserTransformer();

  @override
  Stream<GenerationEvent> bind(Stream<String> stream) {
    return _A2uiParserStream(stream).stream;
  }
}

class _A2uiParserStream {
  _A2uiParserStream(Stream<String> input) {
    _controller = StreamController<GenerationEvent>(
      onListen: () {
        _subscription = input.listen(
          _onData,
          onError: _controller.addError,
          onDone: _onDone,
          cancelOnError: false,
        );
      },
      onPause: () => _subscription?.pause(),
      onResume: () => _subscription?.resume(),
      onCancel: () => _subscription?.cancel(),
    );
  }

  late final StreamController<GenerationEvent> _controller;
  StreamSubscription<String>? _subscription;
  String _buffer = '';

  Stream<GenerationEvent> get stream => _controller.stream;

  void _onData(String chunk) {
    _buffer += chunk;
    _processBuffer();
  }

  void _onDone() {
    // If there's anything left in the buffer that looks like text, emit it.
    if (_buffer.isNotEmpty) {
      _emitText(_buffer);
      _buffer = '';
    }
    _controller.close();
  }

  void _processBuffer() {
    while (_buffer.isNotEmpty) {
      // 1. Check for Markdown JSON block
      final _Match? markdownMatch = _findMarkdownJson(_buffer);
      if (markdownMatch != null) {
        try {
          final Object? decoded = jsonDecode(markdownMatch.content);
          if (decoded != null) {
            _emitBefore(markdownMatch.start);
            _emitMessage(decoded);
            _buffer = _buffer.substring(markdownMatch.end);
            continue;
          }
        } on FormatException {
          // Invalid JSON in markdown block.
          // Emit as text immediately so we don't get stuck in a loop
          // where the fallback logic waits for more data indefinitely.
          _emitBefore(markdownMatch.start);
          _emitText(markdownMatch.original);
          _buffer = _buffer.substring(markdownMatch.end);
          continue;
        }
      }

      // 2. Check for Balanced JSON
      final _Match? jsonMatch = _findBalancedJson(_buffer);
      if (jsonMatch != null) {
        // Prioritize markdown if it starts BEFORE the balanced JSON logic would
        // pick it up.
        if (markdownMatch != null && markdownMatch.start <= jsonMatch.start) {
          // We already tried markdown and failed (otherwise we continued).
          // Fall through.
        }

        try {
          final Object? decoded = jsonDecode(jsonMatch.content);
          if (decoded != null) {
            _emitBefore(jsonMatch.start);
            _emitMessage(decoded);
            _buffer = _buffer.substring(jsonMatch.end);
            continue;
          }
        } on FormatException catch (_) {
          // Invalid JSON.
          // Emit as text immediately to avoid stalling.
          _emitBefore(jsonMatch.start);
          _emitText(jsonMatch.original);
          _buffer = _buffer.substring(jsonMatch.end);
          continue;
        }
      }

      // 3. Fallback / Wait logic
      final int markdownStart = _buffer.indexOf('```');
      final int braceStart = _buffer.indexOf('{');

      var firstPotentialStart = -1;
      if (markdownStart != -1 && braceStart != -1) {
        firstPotentialStart = markdownStart < braceStart
            ? markdownStart
            : braceStart;
      } else if (markdownStart != -1) {
        firstPotentialStart = markdownStart;
      } else {
        firstPotentialStart = braceStart;
      }

      if (firstPotentialStart == -1) {
        // No potential JSON start. Emit all.
        if (_buffer.isNotEmpty) {
          _emitText(_buffer);
          _buffer = '';
        }
        break;
      } else {
        // Found a potential start at `firstPotentialStart`.
        // Emit text BEFORE it.
        if (firstPotentialStart > 0) {
          _emitText(_buffer.substring(0, firstPotentialStart));
          _buffer = _buffer.substring(firstPotentialStart);
        }
        // Now buffer starts with potential JSON.
        // Since we already tried to parse and failed (if we are here),
        // we must wait for more data.
        break;
      }
    }
  }

  void _emitBefore(int index) {
    if (index > 0) {
      _emitText(_buffer.substring(0, index));
    }
  }

  void _emitText(String text) {
    // Clean up protocol tags that might leak into text stream
    final String cleanText = text
        .replaceAll('<a2ui_message>', '')
        .replaceAll('</a2ui_message>', '');

    if (cleanText.isNotEmpty) {
      _controller.add(TextEvent(cleanText));
    }
  }

  void _emitMessage(Object json) {
    if (json is Map<String, Object?>) {
      try {
        _controller.add(A2uiMessageEvent(A2uiMessage.fromJson(json)));
      } on A2uiValidationException catch (e) {
        _controller.addError(e);
      } catch (_) {
        // Failed to parse A2UI message structure (e.g. invalid type
        // discriminator)
        _controller.add(TextEvent(jsonEncode(json)));
      }
    } else if (json is List) {
      for (final Object? item in json) {
        if (item is Map<String, Object?>) {
          try {
            _controller.add(A2uiMessageEvent(A2uiMessage.fromJson(item)));
          } on A2uiValidationException catch (e) {
            _controller.addError(e);
          } catch (_) {
            _controller.add(TextEvent(jsonEncode(item)));
          }
        }
      }
    }
  }

  _Match? _findMarkdownJson(String text) {
    final regex = RegExp(r'```(?:json)?\s*([\s\S]*?)\s*```');
    final RegExpMatch? match = regex.firstMatch(text);
    if (match != null) {
      return _Match(
        match.start,
        match.end,
        match.group(1) ?? '',
        match.group(0) ?? '',
      );
    }
    return null;
  }

  _Match? _findBalancedJson(String input) {
    if (!input.startsWith('{')) return null;

    var balance = 0;
    var inString = false;
    var isEscaped = false;

    for (var i = 0; i < input.length; i++) {
      final String char = input[i];

      if (isEscaped) {
        isEscaped = false;
        continue;
      }
      if (char == '\\') {
        isEscaped = true;
        continue;
      }
      if (char == '"') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char == '{') {
          balance++;
        } else if (char == '}') {
          balance--;
          if (balance == 0) {
            final String text = input.substring(0, i + 1);
            return _Match(0, i + 1, text, text);
          }
        }
      }
    }
    return null;
  }
}

class _Match {
  _Match(this.start, this.end, this.content, this.original);
  final int start;
  final int end;
  final String content;
  final String original;
}
