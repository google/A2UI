// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'dart:async';

import '../model/ui_models.dart';
import 'surface_context.dart';

/// An interface for a host that manages UI surfaces.
///
/// This host provides updates when surfaces are added, removed, or changed.
/// It also acts as a factory for [SurfaceContext]s, which provide access to the
/// state of minimal, individual surfaces.
abstract interface class SurfaceHost {
  /// A stream of updates for the surfaces managed by this host.
  ///
  /// Implementations may choose to filter redundant updates. Consumers should
  /// rely on [contextFor] to get the context for a specific surface.
  Stream<SurfaceUpdate> get surfaceUpdates;

  /// Returns a [SurfaceContext] for the surface with the given [surfaceId].
  SurfaceContext contextFor(String surfaceId);
}
