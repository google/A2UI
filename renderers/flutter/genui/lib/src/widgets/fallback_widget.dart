// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'package:flutter/material.dart';

/// A widget that displays a fallback UI for error or loading states.
///
/// This is typically used to handle errors during content generation or UI
/// rendering, or to show a loading indicator while waiting for content.
class FallbackWidget extends StatelessWidget {
  /// Creates a [FallbackWidget] widget.
  const FallbackWidget({
    super.key,
    this.error,
    this.stackTrace,
    this.onRetry,
    this.loadingMessage,
    this.isLoading = false,
  });

  /// The error object, if any.
  final Object? error;

  /// The stack trace associated with the error, if any.
  final StackTrace? stackTrace;

  /// A callback to trigger a retry operation.
  final VoidCallback? onRetry;

  /// A message to display while loading.
  final String? loadingMessage;

  /// Whether the widget is in a loading state.
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(),
            if (loadingMessage != null) ...[
              const SizedBox(height: 16),
              Text(loadingMessage!),
            ],
          ],
        ),
      );
    }

    if (error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, color: Colors.red, size: 48),
              const SizedBox(height: 16),
              Text(
                'An error occurred',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              Text(
                error.toString(),
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              if (onRetry != null) ...[
                const SizedBox(height: 16),
                FilledButton.icon(
                  onPressed: onRetry,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Retry'),
                ),
              ],
            ],
          ),
        ),
      );
    }

    return const SizedBox.shrink();
  }
}
