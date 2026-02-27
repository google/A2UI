// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'package:flutter/foundation.dart';

import '../model/catalog.dart';
import '../model/data_model.dart';
import '../model/ui_models.dart';

/// An interface for a specific UI surface context.
///
/// This provides access to the state and definition of a single surface.
abstract interface class SurfaceContext {
  /// The ID of the surface this context is bound to.
  String get surfaceId;

  /// The current definition of the UI for this surface.
  ValueListenable<SurfaceDefinition?> get definition;

  /// The data model for this surface.
  DataModel get dataModel;

  /// The catalog this surface is bound to.
  Catalog? get catalog;

  /// Handles a UI event from this surface.
  void handleUiEvent(UiEvent event);

  /// Reports an error capable of being sent back to the AI.
  void reportError(Object error, StackTrace? stack);
}
