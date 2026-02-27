// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import '../model/data_model.dart';

/// Manages the data models for surfaces.
class DataModelStore {
  final Map<String, DataModel> _dataModels = {};
  final Set<String> _attachedSurfaces = {};

  /// Retrieves the data model for the given [surfaceId], creating it if it
  /// does not exist.
  DataModel getDataModel(String surfaceId) {
    return _dataModels.putIfAbsent(surfaceId, InMemoryDataModel.new);
  }

  /// Removes the data model for the given [surfaceId] and detaches the surface.
  void removeDataModel(String surfaceId) {
    final DataModel? model = _dataModels.remove(surfaceId);
    model?.dispose();
    _attachedSurfaces.remove(surfaceId);
  }

  /// Marks the surface with the given [surfaceId] as attached.
  void attachSurface(String surfaceId) {
    _attachedSurfaces.add(surfaceId);
  }

  /// Marks the surface with the given [surfaceId] as detached.
  void detachSurface(String surfaceId) {
    _attachedSurfaces.remove(surfaceId);
  }

  /// An unmodifiable map of all registered data models.
  Map<String, DataModel> get dataModels => Map.unmodifiable(_dataModels);

  /// Disposes of all data models in this store.
  void dispose() {
    for (final DataModel model in _dataModels.values) {
      model.dispose();
    }
  }
}
