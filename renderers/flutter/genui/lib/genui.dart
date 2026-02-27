// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/// The core library for the Flutter GenUI framework.
///
/// This library provides the necessary components to build generative user
/// interfaces in Flutter applications. It includes models for UI components,
/// data handling, and communication with a generative AI service.
library;

export 'src/catalog/basic_catalog.dart';
export 'src/development_utilities/catalog_view.dart';
export 'src/engine/surface_controller.dart';
export 'src/engine/surface_registry.dart' show RegistryEvent;
export 'src/facade/conversation.dart';
export 'src/facade/prompt_builder.dart';
export 'src/facade/widgets/chat_primitives.dart';
export 'src/interfaces/a2ui_message_sink.dart';
export 'src/interfaces/surface_context.dart';
export 'src/interfaces/surface_host.dart';
export 'src/interfaces/transport.dart';
export 'src/model/a2ui_client_capabilities.dart';
export 'src/model/a2ui_message.dart';
export 'src/model/a2ui_schemas.dart';
export 'src/model/basic_catalog_embed.dart';
export 'src/model/catalog.dart';
export 'src/model/catalog_item.dart';
export 'src/model/chat_message.dart';
export 'src/model/data_model.dart';
export 'src/model/generation_events.dart';
export 'src/model/ui_models.dart';
export 'src/primitives/cancellation.dart';
export 'src/primitives/constants.dart';
export 'src/primitives/logging.dart';
export 'src/primitives/simple_items.dart';
export 'src/transport/a2ui_parser_transformer.dart';
export 'src/transport/a2ui_transport_adapter.dart';
export 'src/widgets/fallback_widget.dart';
export 'src/widgets/surface.dart';
export 'src/widgets/widget_utilities.dart';
