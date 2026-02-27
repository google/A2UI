// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'dart:convert';

import 'package:flutter/widgets.dart';
import 'package:genai_primitives/genai_primitives.dart';

import '../../primitives/simple_items.dart';
import '../ui_models.dart';

final class _Json {
  static const definition = 'definition';
  static const surfaceId = 'surfaceId';
  static const interaction = 'interaction';
}

/// Constants for UI related parts.
abstract final class UiPartConstants {
  /// MIME type for UI definition parts.
  static const uiMimeType = 'application/vnd.genui.ui+json';

  /// MIME type for UI interaction parts.
  static const interactionMimeType = 'application/vnd.genui.interaction+json';
}

/// Helper extension to interact with UI parts.
extension UiPartExtension on StandardPart {
  /// Whether this part is a UI part.
  bool get isUiPart =>
      this is DataPart &&
      (this as DataPart).mimeType == UiPartConstants.uiMimeType;

  /// Whether this part is a UI interaction part.
  bool get isUiInteractionPart =>
      this is DataPart &&
      (this as DataPart).mimeType == UiPartConstants.interactionMimeType;

  /// Returns this part as a [UiPart] view, if generic type checks out.
  ///
  /// Functionally equivalent to parsing the [DataPart].
  UiPart? get asUiPart {
    if (!isUiPart) return null;
    return UiPart.fromDataPart(this as DataPart);
  }

  /// Returns this part as a [UiInteractionPart] view.
  UiInteractionPart? get asUiInteractionPart {
    if (!isUiInteractionPart) return null;
    return UiInteractionPart.fromDataPart(this as DataPart);
  }
}

extension UiPartListExtension on Iterable<StandardPart> {
  /// Filters the list for UI parts and returns them as [UiPart] views.
  Iterable<UiPart> get uiParts =>
      where((p) => p.isUiPart).map((p) => p.asUiPart!);

  /// Filters the list for UI interaction parts.
  Iterable<UiInteractionPart> get uiInteractionParts =>
      where((p) => p.isUiInteractionPart).map((p) => p.asUiInteractionPart!);
}

/// A view over a [DataPart] representing a UI definition.
@immutable
final class UiPart {
  /// Creates a [DataPart] compatible with GenUI.
  static DataPart create({
    required SurfaceDefinition definition,
    String? surfaceId,
  }) {
    final Map<String, Object?> json = {
      _Json.definition: definition.toJson(),
      _Json.surfaceId: surfaceId ?? generateId(),
    };
    return DataPart(
      utf8.encode(jsonEncode(json)),
      mimeType: UiPartConstants.uiMimeType,
    );
  }

  /// Creates a view from a [DataPart].
  factory UiPart.fromDataPart(DataPart part) {
    if (part.mimeType != UiPartConstants.uiMimeType) {
      throw ArgumentError('Part is not a UI part');
    }
    final json = jsonDecode(utf8.decode(part.bytes)) as Map<String, Object?>;
    return UiPart._(
      definition: SurfaceDefinition.fromJson(
        json[_Json.definition] as Map<String, Object?>,
      ),
      surfaceId: json[_Json.surfaceId] as String?,
    );
  }

  const UiPart._({required this.definition, required this.surfaceId});

  /// The JSON definition of the UI.
  final SurfaceDefinition definition;

  /// The unique ID for this UI surface.
  final String? surfaceId;
}

/// A view over a [DataPart] representing a UI interaction.
@immutable
final class UiInteractionPart {
  /// Creates a [DataPart] representing a UI interaction.
  static DataPart create(String interaction) {
    final Map<String, Object?> json = {_Json.interaction: interaction};
    return DataPart(
      utf8.encode(jsonEncode(json)),
      mimeType: UiPartConstants.interactionMimeType,
    );
  }

  /// Creates a view from a [DataPart].
  factory UiInteractionPart.fromDataPart(DataPart part) {
    if (part.mimeType != UiPartConstants.interactionMimeType) {
      throw ArgumentError('Part is not a UI interaction part');
    }
    final json = jsonDecode(utf8.decode(part.bytes)) as Map<String, Object?>;
    return UiInteractionPart._(json[_Json.interaction] as String);
  }

  const UiInteractionPart._(this.interaction);

  /// The interaction data (JSON string).
  final String interaction;
}
