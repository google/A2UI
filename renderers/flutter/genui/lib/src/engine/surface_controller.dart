// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'dart:async';
import 'dart:convert';

import 'package:collection/collection.dart';
import 'package:flutter/foundation.dart';

import '../interfaces/a2ui_message_sink.dart';
import '../interfaces/surface_context.dart';
import '../interfaces/surface_host.dart';
import '../model/a2ui_client_capabilities.dart';
import '../model/a2ui_message.dart';
import '../model/catalog.dart';
import '../model/chat_message.dart';
import '../model/data_model.dart';
import '../model/ui_models.dart';
import '../primitives/constants.dart';
import '../primitives/logging.dart';

import 'data_model_store.dart';
import 'surface_registry.dart' as surface_reg;

/// The runtime controller for the GenUI system.
///
/// Orchestrates the lifecycle of UI surfaces, manages communication with the
/// AI service, and handles data model updates.
interface class SurfaceController implements SurfaceHost, A2uiMessageSink {
  /// Creates a [SurfaceController].
  ///
  /// The [catalogs] parameter defines the set of component catalogs available
  /// for use by surfaces managed by this controller.
  ///
  /// The [pendingUpdateTimeout] specifies how long to wait for a surface
  /// creation message before discarding buffered updates for that surface.
  SurfaceController({
    required this.catalogs,
    this.pendingUpdateTimeout = const Duration(minutes: 1),
  });

  /// The catalogs available to surfaces in this engine.
  final Iterable<Catalog> catalogs;

  /// The timeout for pending updates waiting for a surface creation.
  final Duration pendingUpdateTimeout;

  late final surface_reg.SurfaceRegistry _registry =
      surface_reg.SurfaceRegistry();
  late final DataModelStore _store = DataModelStore();

  final _onSubmit = StreamController<ChatMessage>.broadcast();
  final _pendingUpdates = <String, List<A2uiMessage>>{};
  final _pendingUpdateTimers = <String, Timer>{};

  // Expose registry events as surface updates
  @override
  Stream<SurfaceUpdate> get surfaceUpdates => _registry.events.map(
    (e) => switch (e) {
      surface_reg.SurfaceAdded(:final surfaceId, :final definition) =>
        SurfaceAdded(surfaceId, definition),
      surface_reg.SurfaceUpdated(:final surfaceId, :final definition) =>
        ComponentsUpdated(surfaceId, definition),
      surface_reg.SurfaceRemoved(:final surfaceId) => SurfaceRemoved(surfaceId),
    },
  );

  /// A stream of messages to be submitted to the AI service.
  ///
  /// This includes user actions and validation errors.
  Stream<ChatMessage> get onSubmit => _onSubmit.stream;

  /// The IDs of the currently active surfaces.
  Iterable<String> get activeSurfaceIds => _registry.surfaceOrder;

  /// Evaluates and returns the client capabilities for the catalogs managed
  /// by this controller.
  A2UiClientCapabilities get clientCapabilities =>
      A2UiClientCapabilities.fromCatalogs(catalogs);

  @override
  SurfaceContext contextFor(String surfaceId) {
    return _ControllerContext(this, surfaceId);
  }

  /// The registry of surfaces managed by this controller.
  surface_reg.SurfaceRegistry get registry => _registry;

  /// The store of data models managed by this controller.
  DataModelStore get store => _store;

  /// Process an [message] from the AI service.
  ///
  /// Decodes the message and updates the state of the relevant surface,
  /// provided the message passes validation.
  ///
  /// If validation fails, a [A2uiValidationException] is caught and logged,
  /// and an error message is sent back via [onSubmit].
  @override
  void handleMessage(A2uiMessage message) {
    genUiLogger.info(
      'SurfaceController.handleMessage received: ${message.runtimeType}',
    );

    try {
      _handleMessageInternal(message);
    } on A2uiValidationException catch (e) {
      genUiLogger.warning('Validation failed for surface ${e.surfaceId}: $e');
      reportError(e, StackTrace.current);
    } catch (exception, stackTrace) {
      genUiLogger.severe(
        'Error handling message: $message',
        exception,
        stackTrace,
      );
      reportError(exception, stackTrace);
    }
  }

  /// Reports an error to the AI service.
  void reportError(Object error, StackTrace? stack) {
    var errorCode = 'RUNTIME_ERROR';
    var message = error.toString();
    String? surfaceId;
    String? path;

    if (error is A2uiValidationException) {
      errorCode = 'VALIDATION_FAILED';
      message = error.message;
      surfaceId = error.surfaceId;
      path = error.path;
    }

    final Map<String, Object> errorMsg = {
      'version': 'v0.9',
      'error': {
        'code': errorCode,
        'surfaceId': ?surfaceId,
        'path': ?path,
        'message': message,
      },
    };
    _onSubmit.add(
      ChatMessage.user(
        '',
        parts: [UiInteractionPart.create(jsonEncode(errorMsg))],
      ),
    );
  }

  void _handleMessageInternal(A2uiMessage message) {
    switch (message) {
      case CreateSurface(
        :final surfaceId,
        :final catalogId,
        :final theme,
        :final sendDataModel,
      ):
        if (surfaceId.isEmpty) {
          throw A2uiValidationException(
            'Surface ID cannot be empty',
            surfaceId: surfaceId,
            path: 'surfaceId',
          );
        }

        final List<A2uiMessage>? pending = _pendingUpdates.remove(surfaceId);
        _pendingUpdateTimers.remove(surfaceId)?.cancel();

        _store.getDataModel(surfaceId); // Ensure model exists

        final SurfaceDefinition? existing = _registry.getSurface(surfaceId);
        final SurfaceDefinition newDefinition =
            (existing ?? SurfaceDefinition(surfaceId: surfaceId)).copyWith(
              catalogId: catalogId,
              theme: theme,
            );

        if (sendDataModel) {
          _store.attachSurface(surfaceId);
        } else {
          _store.detachSurface(surfaceId);
        }

        _registry.updateSurface(
          surfaceId,
          newDefinition,
          isNew: existing == null,
        );

        final Catalog? catalog = _findCatalogForDefinition(newDefinition);
        if (catalog != null) {
          newDefinition.validate(catalog.definition);
        }

        if (pending != null) {
          for (final A2uiMessage msg in pending) {
            _handleMessageInternal(msg);
          }
        }

      case UpdateComponents(:final surfaceId, :final components):
        if (!_registry.hasSurface(surfaceId)) {
          _bufferMessage(surfaceId, message);
          return;
        }

        final SurfaceDefinition current = _registry.getSurface(surfaceId)!;
        final Map<String, Component> newComponents = Map.of(current.components);
        for (final component in components) {
          newComponents[component.id] = component;
        }

        _registry.updateSurface(
          surfaceId,
          current.copyWith(components: newComponents),
        );

        final SurfaceDefinition updatedDefinition = _registry.getSurface(
          surfaceId,
        )!;
        final Catalog? catalog = _findCatalogForDefinition(updatedDefinition);
        if (catalog != null) {
          updatedDefinition.validate(catalog.definition);
        }

      case UpdateDataModel(:final surfaceId, :final path, :final value):
        if (!_registry.hasSurface(surfaceId)) {
          _bufferMessage(surfaceId, message);
          return;
        }

        final DataModel model = _store.getDataModel(surfaceId);
        model.update(path, value);

        // Trigger generic update on surface to refresh UI
        final SurfaceDefinition current = _registry.getSurface(surfaceId)!;
        _registry.updateSurface(surfaceId, current);

      case DeleteSurface(:final surfaceId):
        _pendingUpdates.remove(surfaceId);
        _pendingUpdateTimers.remove(surfaceId)?.cancel();
        _registry.removeSurface(surfaceId);
        _store.removeDataModel(surfaceId);
    }
  }

  void _bufferMessage(String surfaceId, A2uiMessage message) {
    _pendingUpdates.putIfAbsent(surfaceId, () => []).add(message);
    if (!_pendingUpdateTimers.containsKey(surfaceId)) {
      _pendingUpdateTimers[surfaceId] = Timer(pendingUpdateTimeout, () {
        _pendingUpdates.remove(surfaceId);
        _pendingUpdateTimers.remove(surfaceId);
      });
    }
  }

  /// Handles a UI event from a surface.
  ///
  /// Converts the event into a [ChatMessage] and adds it to the [onSubmit]
  /// stream.
  void handleUiEvent(UiEvent event) {
    if (event is! UserActionEvent) return;
    _onSubmit.add(
      ChatMessage.user(
        '',
        parts: [
          UiInteractionPart.create(
            jsonEncode({'version': 'v0.9', 'action': event.toMap()}),
          ),
        ],
      ),
    );
  }

  Catalog? _findCatalogForDefinition(SurfaceDefinition definition) {
    genUiLogger.fine(
      'Finding catalog for ${definition.catalogId} in '
      '${catalogs.map((c) => c.catalogId).toList()}',
    );
    return catalogs.firstWhereOrNull(
      (catalog) => catalog.catalogId == definition.catalogId,
    );
  }

  /// Disposes of the controller and releases all resources.
  ///
  /// Closes the [onSubmit] stream and cancels any pending timers.
  void dispose() {
    _registry.dispose();
    _store.dispose();
    _onSubmit.close();
    for (final Timer timer in _pendingUpdateTimers.values) {
      timer.cancel();
    }
  }
}

class _ControllerContext implements SurfaceContext {
  _ControllerContext(this._controller, this.surfaceId);
  final SurfaceController _controller;

  @override
  final String surfaceId;

  @override
  ValueListenable<SurfaceDefinition?> get definition =>
      _controller.registry.watchSurface(surfaceId);

  @override
  DataModel get dataModel => _controller.store.getDataModel(surfaceId);

  @override
  Catalog? get catalog {
    final ValueListenable<SurfaceDefinition?> definitions = _controller.registry
        .watchSurface(surfaceId);
    final SurfaceDefinition? definition = definitions.value;
    final String catalogId = definition?.catalogId ?? basicCatalogId;
    return _controller.catalogs.firstWhereOrNull(
      (catalog) => catalog.catalogId == catalogId,
    );
  }

  @override
  void handleUiEvent(UiEvent event) {
    _controller.handleUiEvent(event);
  }

  @override
  void reportError(Object error, StackTrace? stack) {
    _controller.reportError(error, stack);
  }
}
