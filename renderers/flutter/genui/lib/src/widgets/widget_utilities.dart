// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import '../model/data_model.dart';
import '../primitives/logging.dart';
import '../primitives/simple_items.dart';

/// A builder widget that simplifies handling of nullable `ValueListenable`s.
///
/// This widget listens to a `ValueListenable<T?>` and rebuilds its child
/// whenever the value changes. If the value is `null`, it returns a
/// `SizedBox.shrink()`, effectively hiding the child. If the value is not
/// `null`, it calls the `builder` function with the non-nullable value.
class OptionalValueBuilder<T> extends StatelessWidget {
  /// The `ValueListenable` to listen to.
  final ValueListenable<T?> listenable;

  /// The builder function to call when the value is not `null`.
  final Widget Function(BuildContext context, T value) builder;

  /// Creates an `OptionalValueBuilder`.
  const OptionalValueBuilder({
    super.key,
    required this.listenable,
    required this.builder,
  });

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<T?>(
      valueListenable: listenable,
      builder: (context, value, _) {
        if (value == null) return const SizedBox.shrink();
        return builder(context, value);
      },
    );
  }
}

/// A widget that binds to a value in the [DataContext] and rebuilds when it
/// changes.
///
/// This widget handles the lifecycle of the underlying [ValueNotifier],
/// ensuring it is disposed when the widget is unmounted.
abstract class BoundValue<T> extends StatefulWidget {
  /// Creates a [BoundValue].
  const BoundValue({
    super.key,
    required this.dataContext,
    required this.value,
    required this.builder,
  });

  /// The [DataContext] to resolve the value against.
  final DataContext dataContext;

  /// The value definition (literal, path, or function call).
  final Object? value;

  /// The builder function to call when the value changes.
  final Widget Function(BuildContext context, T? value) builder;

  @override
  State<BoundValue<T>> createState();
}

/// State class for [BoundValue].
abstract class BoundValueState<T, W extends BoundValue<T>> extends State<W> {
  ValueNotifier<T?>? _notifier;

  @override
  void initState() {
    super.initState();
    _initNotifier();
  }

  @override
  void didUpdateWidget(W oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.value != oldWidget.value ||
        widget.dataContext != oldWidget.dataContext) {
      _disposeNotifier();
      _initNotifier();
    }
  }

  @override
  void dispose() {
    _disposeNotifier();
    super.dispose();
  }

  void _initNotifier() {
    _notifier = createNotifier();
  }

  void _disposeNotifier() {
    _notifier?.dispose();
    _notifier = null;
  }

  /// Subclasses implement this to create the specific notifier type.
  ValueNotifier<T?> createNotifier();

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<T?>(
      valueListenable: _notifier!,
      builder: (context, value, child) {
        return widget.builder(context, value);
      },
    );
  }
}

/// Binds to a [String] value.
class BoundString extends BoundValue<String> {
  /// Creates a [BoundString].
  const BoundString({
    super.key,
    required super.dataContext,
    required super.value,
    required super.builder,
  });

  @override
  State<BoundString> createState() => _BoundStringState();
}

class _BoundStringState extends BoundValueState<String, BoundString> {
  @override
  ValueNotifier<String?> createNotifier() {
    return switch (widget.value) {
      {'path': String path} => _ToStringNotifier(
        widget.dataContext.subscribe<Object?>(DataPath(path)),
      ),
      {'call': _} => _StreamToValueNotifier<String?>(
        widget.dataContext.resolve(widget.value).map((v) => v?.toString()),
      ),
      Object? value => ValueNotifier<String?>(value?.toString()),
    };
  }
}

/// Binds to a [bool] value.
class BoundBool extends BoundValue<bool> {
  /// Creates a [BoundBool].
  const BoundBool({
    super.key,
    required super.dataContext,
    required super.value,
    required super.builder,
  });

  @override
  State<BoundBool> createState() => _BoundBoolState();
}

class _BoundBoolState extends BoundValueState<bool, BoundBool> {
  @override
  ValueNotifier<bool?> createNotifier() {
    return switch (widget.value) {
      {'path': String path} => _ToBoolNotifier(
        widget.dataContext.subscribe<Object?>(DataPath(path)),
      ),
      {'call': _} => _StreamToValueNotifier<bool?>(
        widget.dataContext.resolve(widget.value).map((v) {
          if (v is bool) return v;
          return v != null;
        }),
      ),
      bool value => ValueNotifier<bool?>(value),
      _ => ValueNotifier<bool?>(null),
    };
  }
}

/// Binds to a [num] value.
class BoundNumber extends BoundValue<num> {
  /// Creates a [BoundNumber].
  const BoundNumber({
    super.key,
    required super.dataContext,
    required super.value,
    required super.builder,
  });

  @override
  State<BoundNumber> createState() => _BoundNumberState();
}

class _BoundNumberState extends BoundValueState<num, BoundNumber> {
  @override
  ValueNotifier<num?> createNotifier() {
    return switch (widget.value) {
      {'path': String path} => _ToNumberNotifier(
        widget.dataContext.subscribe<Object?>(DataPath(path)),
      ),
      {'call': _} => _StreamToValueNotifier<num?>(
        widget.dataContext.resolve(widget.value).map((v) {
          if (v is num) return v;
          if (v is String) return num.tryParse(v);
          return null;
        }),
      ),
      num value => ValueNotifier<num?>(value),
      _ => ValueNotifier<num?>(null),
    };
  }
}

/// Binds to a [List] of objects.
class BoundList extends BoundValue<List<Object?>> {
  /// Creates a [BoundList].
  const BoundList({
    super.key,
    required super.dataContext,
    required super.value,
    required super.builder,
  });

  @override
  State<BoundList> createState() => _BoundListState();
}

class _BoundListState extends BoundValueState<List<Object?>, BoundList> {
  @override
  ValueNotifier<List<Object?>?> createNotifier() {
    return switch (widget.value) {
      {'path': String path} => widget.dataContext.subscribe<List<Object?>>(
        DataPath(path),
      ),
      {'call': _} => _StreamToValueNotifier<List<Object?>?>(
        widget.dataContext.resolve(widget.value).map((v) {
          if (v is List) return v.cast<Object?>();
          return null;
        }),
      ),
      List<dynamic> value => ValueNotifier<List<Object?>?>(
        value.cast<Object?>(),
      ),
      _ => ValueNotifier<List<Object?>?>(null),
    };
  }
}

/// Binds to any [Object] value.
class BoundObject extends BoundValue<Object> {
  /// Creates a [BoundObject].
  const BoundObject({
    super.key,
    required super.dataContext,
    required super.value,
    required super.builder,
  });

  @override
  State<BoundObject> createState() => _BoundObjectState();
}

class _BoundObjectState extends BoundValueState<Object, BoundObject> {
  @override
  ValueNotifier<Object?> createNotifier() {
    return switch (widget.value) {
      {'path': String path} => widget.dataContext.subscribe<Object?>(
        DataPath(path),
      ),
      {'call': _} => _StreamToValueNotifier<Object?>(
        widget.dataContext.resolve(widget.value),
      ),
      Object? value => ValueNotifier<Object?>(value),
    };
  }
}

class _StreamToValueNotifier<T> extends ValueNotifier<T?> {
  _StreamToValueNotifier(Stream<T?> stream, [T? initialValue])
    : super(initialValue) {
    _subscription = stream.listen(
      (value) => this.value = value,
      onError: (Object error) {
        // We log the error but don't crash.
        // ValueNotifier doesn't support error state.
        genUiLogger.warning(
          'Error in stream subscription for ValueNotifier',
          error,
        );
      },
    );
  }

  StreamSubscription<T?>? _subscription;

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}

class _ToStringNotifier extends ValueNotifier<String?> {
  _ToStringNotifier(this._source) : super(_source.value?.toString()) {
    _source.addListener(_update);
  }

  final ValueNotifier<Object?> _source;

  void _update() {
    super.value = _source.value?.toString();
  }

  @override
  void dispose() {
    _source.removeListener(_update);
    _source.dispose();
    super.dispose();
  }
}

class _ToBoolNotifier extends ValueNotifier<bool?> {
  _ToBoolNotifier(this._source) : super(_convert(_source.value)) {
    _source.addListener(_update);
  }

  final ValueNotifier<Object?> _source;

  static bool? _convert(Object? value) {
    if (value is bool) return value;
    if (value is String) {
      if (value.toLowerCase() == 'true') return true;
      if (value.toLowerCase() == 'false') return false;
    }
    if (value is num) return value != 0;
    return null;
  }

  void _update() {
    super.value = _convert(_source.value);
  }

  @override
  void dispose() {
    _source.removeListener(_update);
    _source.dispose();
    super.dispose();
  }
}

class _ToNumberNotifier extends ValueNotifier<num?> {
  _ToNumberNotifier(this._source) : super(_convert(_source.value)) {
    _source.addListener(_update);
  }

  final ValueNotifier<Object?> _source;

  static num? _convert(Object? value) {
    if (value is num) return value;
    if (value is String) return num.tryParse(value);
    return null;
  }

  void _update() {
    super.value = _convert(_source.value);
  }

  @override
  void dispose() {
    _source.removeListener(_update);
    _source.dispose();
    super.dispose();
  }
}

/// Resolves a context map definition against a [DataContext].
///
Future<JsonMap> resolveContext(
  DataContext dataContext,
  JsonMap? contextDefinition,
) async {
  final resolved = <String, Object?>{};
  if (contextDefinition == null) return resolved;

  for (final MapEntry<String, Object?> entry in contextDefinition.entries) {
    final String key = entry.key;
    final Object? value = entry.value;
    resolved[key] = await dataContext.resolve(value).first;
  }
  return resolved;
}
