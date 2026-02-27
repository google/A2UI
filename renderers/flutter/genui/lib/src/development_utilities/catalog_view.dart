// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'dart:async' show StreamSubscription;
import 'dart:convert';

import 'package:collection/collection.dart';
import 'package:flutter/material.dart';

import '../engine/surface_controller.dart';
import '../model/a2ui_message.dart';
import '../model/catalog.dart';
import '../model/catalog_item.dart';
import '../model/chat_message.dart';
import '../model/ui_models.dart';
import '../primitives/logging.dart';
import '../primitives/simple_items.dart';
import '../widgets/surface.dart';

/// A widget that displays a catalog of GenUI components.
///
/// This widget is intended for development and debugging purposes.
///
/// In order for a catalog item to be displayed, it must have example data
/// defined.
class DebugCatalogView extends StatefulWidget {
  const DebugCatalogView({
    super.key,
    this.onSubmit,
    required this.catalog,
    this.itemHeight,
  });

  /// The catalog of widgets to display.
  final Catalog catalog;

  /// A callback for when a user submits an action.
  final ValueChanged<ChatMessage>? onSubmit;

  /// If provided, constrains each item to the given height.
  final double? itemHeight;

  @override
  State<DebugCatalogView> createState() => _DebugCatalogViewState();
}

class _DebugCatalogViewState extends State<DebugCatalogView> {
  late final SurfaceController _surfaceController;
  final surfaceIds = <String>[];
  late final StreamSubscription<ChatMessage>? _subscription;

  @override
  void initState() {
    super.initState();
    final Catalog catalog = widget.catalog;

    _surfaceController = SurfaceController(catalogs: [widget.catalog]);
    if (widget.onSubmit != null) {
      _subscription = _surfaceController.onSubmit.listen(widget.onSubmit);
    } else {
      _subscription = null;
    }

    for (final CatalogItem item in catalog.items) {
      for (var i = 0; i < item.exampleData.length; i++) {
        final ExampleBuilderCallback exampleBuilder = item.exampleData[i];
        final indexPart = item.exampleData.length > 1 ? '-$i' : '';
        final surfaceId = '${item.name}$indexPart';

        final String exampleJsonString = exampleBuilder();

        try {
          final exampleData = jsonDecode(exampleJsonString) as List<Object?>;

          final List<Component> components = exampleData
              .map((e) => Component.fromJson(e as JsonMap))
              .toList();

          Component? rootComponent;
          rootComponent = components.firstWhereOrNull((c) => c.id == 'root');

          if (rootComponent == null) {
            genUiLogger.info(
              'Skipping example for ${item.name} because it is missing a root '
              'component.',
            );
            continue;
          }

          _surfaceController.handleMessage(
            UpdateComponents(surfaceId: surfaceId, components: components),
          );
          _surfaceController.handleMessage(
            CreateSurface(surfaceId: surfaceId, catalogId: catalog.catalogId!),
          );
          surfaceIds.add(surfaceId);
        } catch (exception, stackTrace) {
          genUiLogger.severe(
            'Failed to load example for "${item.name}":\n'
            '$exception\n$stackTrace',
          );
          throw Exception(
            'Failed to load example for "${item.name}". Check logs for '
            'details.',
          );
        }
      }
    }
  }

  @override
  void dispose() {
    _subscription?.cancel();
    _surfaceController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: surfaceIds.length,
      itemBuilder: (BuildContext context, int index) {
        final String surfaceId = surfaceIds[index];
        final surfaceWidget = Surface(
          surfaceContext: _surfaceController.contextFor(surfaceId),
        );
        return Card(
          color: Theme.of(context).colorScheme.secondaryContainer,
          child: Padding(
            padding: const EdgeInsets.all(8.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: <Widget>[
                Text(surfaceId, style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 8.0),
                SizedBox(height: widget.itemHeight, child: surfaceWidget),
              ],
            ),
          ),
        );
      },
    );
  }
}
