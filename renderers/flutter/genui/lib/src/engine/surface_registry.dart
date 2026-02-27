// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'dart:async';

import 'package:flutter/foundation.dart';

import '../model/ui_models.dart';
import '../primitives/logging.dart';

/// Events emitted by the [SurfaceRegistry].
sealed class RegistryEvent {}

/// An event indicating that a new surface has been added.
class SurfaceAdded extends RegistryEvent {
  /// Creates a [SurfaceAdded] event.
  SurfaceAdded(this.surfaceId, this.definition);
  final String surfaceId;
  final SurfaceDefinition definition;
}

/// An event indicating that a surface has been removed.
class SurfaceRemoved extends RegistryEvent {
  /// Creates a [SurfaceRemoved] event.
  SurfaceRemoved(this.surfaceId);
  final String surfaceId;
}

/// An event indicating that a surface has been updated.
class SurfaceUpdated extends RegistryEvent {
  /// Creates a [SurfaceUpdated] event.
  SurfaceUpdated(this.surfaceId, this.definition);
  final String surfaceId;
  final SurfaceDefinition definition;
}

/// Manages the lifecycle and storage of [SurfaceDefinition]s.
class SurfaceRegistry {
  final Map<String, ValueNotifier<SurfaceDefinition?>> _surfaces = {};
  // Track creation/update order for cleanup policies
  final List<String> _surfaceOrder = [];
  final StreamController<RegistryEvent> _eventController =
      StreamController.broadcast();

  /// The stream of registry events.
  Stream<RegistryEvent> get events => _eventController.stream;

  /// The list of surface IDs in the order they were created or updated.
  ///
  /// This is used by cleanup strategies to determine which surfaces to remove.
  List<String> get surfaceOrder => List.unmodifiable(_surfaceOrder);

  /// Returns a [ValueListenable] that tracks the definition of the surface
  /// with the given [surfaceId].
  ///
  /// If the surface does not exist, a new notifier is created with a null
  /// value.
  ValueListenable<SurfaceDefinition?> watchSurface(String surfaceId) {
    if (!_surfaces.containsKey(surfaceId)) {
      genUiLogger.fine('Adding new surface $surfaceId');
    } else {
      genUiLogger.fine('Fetching surface notifier for $surfaceId');
    }
    return _surfaces.putIfAbsent(
      surfaceId,
      () => ValueNotifier<SurfaceDefinition?>(null),
    );
  }

  /// Updates the definition of a surface.
  ///
  /// If [isNew] is true, a [SurfaceAdded] event is emitted. Otherwise, a
  /// [SurfaceUpdated] event is emitted.
  void updateSurface(
    String surfaceId,
    SurfaceDefinition definition, {
    bool isNew = false,
  }) {
    final ValueNotifier<SurfaceDefinition?> notifier = _surfaces.putIfAbsent(
      surfaceId,
      () => ValueNotifier(null),
    );
    notifier.value = definition;

    _surfaceOrder.remove(surfaceId);
    _surfaceOrder.add(surfaceId);

    if (isNew) {
      genUiLogger.info('Created new surface $surfaceId');
      _eventController.add(SurfaceAdded(surfaceId, definition));
    } else {
      // genUiLogger.info('Updated surface $surfaceId'); // Optional logging
      _eventController.add(SurfaceUpdated(surfaceId, definition));
    }
  }

  /// Removes a surface from the registry.
  ///
  /// Emits a [SurfaceRemoved] event if the surface existed.
  void removeSurface(String surfaceId) {
    if (_surfaces.containsKey(surfaceId)) {
      genUiLogger.info('Deleting surface $surfaceId');
      final ValueNotifier<SurfaceDefinition?>? notifier = _surfaces.remove(
        surfaceId,
      );
      notifier?.dispose();
      _surfaceOrder.remove(surfaceId);
      _eventController.add(SurfaceRemoved(surfaceId));
    }
  }

  /// Returns true if the registry contains a surface with the given
  /// [surfaceId].
  bool hasSurface(String surfaceId) => _surfaces.containsKey(surfaceId);

  /// Returns the current definition of the surface with the given [surfaceId],
  /// or null if it doesn't exist.
  SurfaceDefinition? getSurface(String surfaceId) =>
      _surfaces[surfaceId]?.value;

  /// Disposes of the registry and all its resources.
  void dispose() {
    _eventController.close();
    for (final ValueNotifier<SurfaceDefinition?> notifier in _surfaces.values) {
      notifier.dispose();
    }
  }
}
