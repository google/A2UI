// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:rxdart/rxdart.dart';

import '../primitives/logging.dart';
import '../primitives/simple_items.dart';
import 'client_function.dart' as cf;

import 'data_path.dart';

export 'data_path.dart';

/// A contextual view of the main DataModel, used by widgets to resolve
/// relative and absolute paths.
class DataContext implements cf.ExecutionContext {
  /// Creates a [DataContext] for the given [path].
  DataContext(
    this._dataModel,
    this.path, {
    Iterable<cf.ClientFunction>? functions,
  }) : _functions = {
         if (functions != null)
           for (final f in functions) f.name: f,
       };

  DataContext._(this._dataModel, this.path, this._functions);

  final DataModel _dataModel;

  /// The path associated with this context.
  @override
  final DataPath path;

  final Map<String, cf.ClientFunction> _functions;

  /// The underlying data model for this context.
  DataModel get dataModel => _dataModel;

  /// Retrieves a function by name from this context.
  @override
  cf.ClientFunction? getFunction(String name) => _functions[name];

  /// Subscribes to a path, resolving it against the current context.
  @override
  ValueNotifier<T?> subscribe<T>(DataPath path) {
    final DataPath absolutePath = resolvePath(path);
    return _dataModel.subscribe<T>(absolutePath);
  }

  /// Subscribes to a path and returns a [Stream].
  @override
  Stream<T?> subscribeStream<T>(DataPath path) {
    late StreamController<T?> controller;
    ValueNotifier<T?>? notifier;

    void listener() {
      if (!controller.isClosed) {
        controller.add(notifier!.value);
      }
    }

    controller = StreamController<T?>(
      onListen: () {
        notifier = subscribe<T>(path);
        controller.add(notifier!.value);
        notifier!.addListener(listener);
      },
      onCancel: () {
        notifier?.removeListener(listener);
        notifier?.dispose();
        notifier = null;
        controller.close();
      },
    );
    return controller.stream;
  }

  /// Gets a value, resolving the path against the current context.
  @override
  T? getValue<T>(DataPath path) => _dataModel.getValue<T>(resolvePath(path));

  /// Updates the data model, resolving the path against the current context.
  @override
  void update(DataPath path, Object? contents) =>
      _dataModel.update(resolvePath(path), contents);

  /// Creates a new, nested DataContext for a child widget.
  ///
  /// Used by list/template widgets to create a context for their children.
  @override
  DataContext nested(DataPath relativePath) =>
      DataContext._(_dataModel, resolvePath(relativePath), _functions);

  /// Resolves a path against the current context's path.
  @override
  DataPath resolvePath(DataPath pathToResolve) =>
      pathToResolve.isAbsolute ? pathToResolve : path.join(pathToResolve);

  /// Resolves any dynamic values (bindings or function calls) in the given
  /// value.
  ///
  /// String values are treated as literals (no interpolation).
  /// Maps with a 'path' key are resolved to the value at that path.
  /// Maps with a 'call' key are executed as functions.
  @override
  Stream<Object?> resolve(Object? value) => _evaluateStream(value);

  Stream<Object?> _evaluateStream(Object? value) {
    if (value is Map) {
      if (value.containsKey('path')) {
        return subscribeStream(DataPath(value['path'] as String));
      }
      if (value.containsKey('call')) {
        return _evaluateFunctionCall(value as JsonMap);
      }
    }
    if (value is Stream) return value.cast<Object?>();
    return Stream.value(value);
  }

  Stream<Object?> _evaluateFunctionCall(JsonMap callDefinition) {
    final name = callDefinition['call'] as String?;
    if (name == null) {
      return Stream.value(null);
    }

    final cf.ClientFunction? func = getFunction(name);
    if (func == null) {
      genUiLogger.warning('Function not found: $name');
      return Stream.value(null);
    }

    // Resolve arguments
    final Map<String, Object?> args = {};
    final Object? argsJson = callDefinition['args'];

    if (argsJson is Map) {
      for (final Object? key in argsJson.keys) {
        final argName = key.toString();
        final Object? val = argsJson[key];
        args[argName] = _evaluateStream(val);
      }
    }

    final List<String> keys = args.keys.toList();
    final List<Stream<Object?>> streams = keys.map((key) {
      return args[key]! as Stream<Object?>;
    }).toList();

    final Stream<List<Object?>> combinedStream = streams.isEmpty
        ? Stream.value([])
        : CombineLatestStream.list(streams);

    return combinedStream.switchMap((List<Object?> values) {
      final Map<String, Object?> combinedArgs = {};
      for (var i = 0; i < keys.length; i++) {
        combinedArgs[keys[i]] = values[i];
      }
      return func.execute(combinedArgs, this);
    });
  }

  /// Evaluates a dynamic boolean condition and returns a [Stream<bool>].
  @override
  Stream<bool> evaluateConditionStream(Object? condition) {
    if (condition == null) return Stream.value(false);
    if (condition is bool) return Stream.value(condition);

    final Stream<Object?> resultStream = _evaluateStream(condition);
    return resultStream.map((v) {
      if (v is bool) return v;
      return v != null;
    });
  }
}

/// Exception thrown when a value in the [DataModel] is not of the expected
/// type.
class DataModelTypeException implements Exception {
  /// Creates a [DataModelTypeException].
  DataModelTypeException({
    required this.path,
    required this.expectedType,
    required this.actualType,
  });

  /// The path where the type mismatch occurred.
  final DataPath path;

  /// The expected type.
  final Type expectedType;

  /// The actual type found.
  final Type actualType;

  @override
  String toString() {
    return 'DataModelTypeException: Expected $expectedType at $path, '
        'but found $actualType';
  }
}

/// Manages the application's data model and provides a subscription-based
/// mechanism for reactive UI updates.
abstract interface class DataModel {
  /// Updates the data model at a specific absolute path and notifies all
  /// relevant subscribers.
  ///
  /// If [absolutePath] is root, the entire data model is replaced
  /// (if contents is a Map).
  void update(DataPath absolutePath, Object? contents);

  /// Subscribes to a specific absolute path in the data model.
  ValueNotifier<T?> subscribe<T>(DataPath absolutePath);

  /// Binds an external state [source] to a [path] in the DataModel.
  ///
  /// **Side Effect:** Calling this method immediately performs a synchronous
  /// `update()` on the DataModel at the specified [path] using the current
  /// value of the [source].
  ///
  /// If [twoWay] is true, changes in the DataModel at [path] will also
  /// update the [source] (assuming [source] is a [ValueNotifier]).
  ///
  /// Returns a function that disposes the binding.
  void Function() bindExternalState<T>({
    required DataPath path,
    required ValueListenable<T> source,
    bool twoWay = false,
  });

  /// Disposes resources and bindings.
  void dispose();

  /// Retrieves a static, one-time value from the data model at the
  /// specified absolute path without creating a subscription.
  T? getValue<T>(DataPath absolutePath);
}

/// Standard in-memory implementation of [DataModel].
class InMemoryDataModel implements DataModel {
  JsonMap _data = {};
  final Map<DataPath, _RefCountedValueNotifier<Object?>> _subscriptions = {};

  final List<VoidCallback> _cleanupCallbacks = [];

  @override
  void update(DataPath absolutePath, Object? contents) {
    genUiLogger.info(
      'DataModel.update: path=$absolutePath, contents='
      '${const JsonEncoder.withIndent('  ').convert(contents)}',
    );

    if (absolutePath == DataPath.root) {
      if (contents is Map) {
        _data = Map<String, Object?>.from(contents);
      } else {
        genUiLogger.warning(
          'DataModel.update: contents for root path is not a Map: $contents',
        );
        if (contents == null) {
          _data = {};
        }
      }
      _notifySubscribers(DataPath.root);
      return;
    }

    _updateValue(_data, absolutePath.segments, contents);
    _notifySubscribers(absolutePath);
  }

  @override
  ValueNotifier<T?> subscribe<T>(DataPath absolutePath) {
    genUiLogger.finer('DataModel.subscribe: path=$absolutePath');
    if (_subscriptions.containsKey(absolutePath)) {
      final notifier =
          _subscriptions[absolutePath]! as _RefCountedValueNotifier<T?>;
      notifier.incrementRef();
      return notifier;
    }

    final T? initialValue = getValue<T>(absolutePath);
    final notifier = _RefCountedValueNotifier<T?>(
      initialValue,
      onDispose: () {
        _subscriptions.remove(absolutePath);
      },
    );
    _subscriptions[absolutePath] = notifier;
    return notifier;
  }

  final List<VoidCallback> _externalSubscriptions = [];

  @override
  void Function() bindExternalState<T>({
    required DataPath path,
    required ValueListenable<T> source,
    bool twoWay = false,
  }) {
    update(path, source.value);

    void onSourceChanged() {
      final T newValue = source.value;
      final T? currentValue = getValue<T>(path);
      if (currentValue != newValue) {
        update(path, newValue);
      }
    }

    source.addListener(onSourceChanged);
    void removeSourceListener() => source.removeListener(onSourceChanged);
    _externalSubscriptions.add(removeSourceListener);

    VoidCallback? removeModelListener;
    if (twoWay) {
      if (source is! ValueNotifier<T>) {
        genUiLogger.warning(
          'bindExternalState: twoWay is true but source is not a '
          'ValueNotifier.',
        );
      } else {
        final ValueNotifier<T> notifier = source;
        final ValueNotifier<T?> subscription = subscribe<T>(path);

        void onModelChanged() {
          final T? modelValue = subscription.value;
          if (modelValue != null && modelValue != notifier.value) {
            notifier.value = modelValue;
          }
        }

        subscription.addListener(onModelChanged);
        removeModelListener = () {
          subscription.removeListener(onModelChanged);
          // When we are done with the subscription, we should dispose it to
          // decrement ref count.
          subscription.dispose();
        };
        _externalSubscriptions.add(removeModelListener);
      }
    }

    return () {
      removeSourceListener();
      _externalSubscriptions.remove(removeSourceListener);

      if (removeModelListener != null) {
        removeModelListener();
        _externalSubscriptions.remove(removeModelListener);
      }
    };
  }

  @override
  void dispose() {
    for (final VoidCallback callback in _cleanupCallbacks) {
      callback();
    }
    _cleanupCallbacks.clear();

    for (final VoidCallback callback in _externalSubscriptions) {
      callback();
    }
    _externalSubscriptions.clear();

    // The DataModel does not own the refcounts of the returned notifiers.
    // They are owned by the subscribers who called subscribe().
    // We only need to clear our cache. Let the subscribers dispose them.
    _subscriptions.clear();
  }

  @override
  T? getValue<T>(DataPath absolutePath) {
    if (absolutePath == DataPath.root) {
      _checkType<T>(_data, absolutePath);
      return _data as T?;
    }
    final Object? value = _getValue(_data, absolutePath.segments);
    _checkType<T>(value, absolutePath);
    return value as T?;
  }

  void _checkType<T>(Object? value, DataPath path) {
    if (value != null && value is! T) {
      throw DataModelTypeException(
        path: path,
        expectedType: T,
        actualType: value.runtimeType,
      );
    }
  }

  Object? _getValue(Object? current, List<String> segments) {
    if (segments.isEmpty) {
      return current;
    }

    final String segment = segments.first;
    final List<String> remaining = segments.sublist(1);

    if (current is Map) {
      return _getValue(current[segment], remaining);
    } else if (current is List) {
      final int? index = int.tryParse(segment);
      if (index != null && index >= 0 && index < current.length) {
        return _getValue(current[index], remaining);
      }
    }
    return null;
  }

  void _updateValue(Object? current, List<String> segments, Object? value) {
    if (segments.isEmpty) {
      return;
    }

    final String segment = segments.first;
    final List<String> remaining = segments.sublist(1);

    if (current is Map) {
      if (remaining.isEmpty) {
        if (value == null) {
          current.remove(segment);
        } else {
          current[segment] = value;
        }
        return;
      }

      Object? nextNode = current[segment];
      if (nextNode == null) {
        if (value == null) {
          return;
        }

        final String nextSegment = remaining.first;
        final isNextSegmentListIndex = int.tryParse(nextSegment) != null;
        nextNode = isNextSegmentListIndex ? <dynamic>[] : <String, dynamic>{};
        current[segment] = nextNode;
      }
      _updateValue(nextNode, remaining, value);
    } else if (current is List) {
      final int? index = int.tryParse(segment);
      if (index != null && index >= 0) {
        if (remaining.isEmpty) {
          if (index < current.length) {
            if (value == null) {
              current[index] = value;
            } else {
              current[index] = value;
            }
          } else if (index == current.length) {
            if (value != null) current.add(value);
          }
        } else {
          if (index < current.length) {
            _updateValue(current[index], remaining, value);
          } else if (index == current.length) {
            final String nextSegment = remaining.first;
            final isNextSegmentListIndex = int.tryParse(nextSegment) != null;
            final Object newItem = isNextSegmentListIndex
                ? <dynamic>[]
                : <String, dynamic>{};
            current.add(newItem);
            _updateValue(newItem, remaining, value);
          }
        }
      }
    }
  }

  void _notifySubscribers(DataPath path) {
    if (_subscriptions.containsKey(path)) {
      _subscriptions[path]!.value = getValue(path);
    }

    var parent = path;
    while (!parent.isAbsolute || parent.segments.isNotEmpty) {
      if (parent == DataPath.root) break;
      if (!parent.isAbsolute && parent.segments.isEmpty) break;
      parent = parent.dirname;
      if (_subscriptions.containsKey(parent)) {
        _subscriptions[parent]!.value = getValue(parent);
      }
    }
    if (path != DataPath.root && _subscriptions.containsKey(DataPath.root)) {
      _subscriptions[DataPath.root]!.value = getValue(DataPath.root);
    }
    for (final DataPath p in _subscriptions.keys) {
      if (p.startsWith(path) && p != path) {
        _subscriptions[p]!.value = getValue(p);
      }
    }
  }
}

class _RefCountedValueNotifier<T> extends ValueNotifier<T> {
  _RefCountedValueNotifier(super.value, {this.onDispose});

  final VoidCallback? onDispose;
  int _refCount = 1;
  bool _isDisposed = false;

  void incrementRef() {
    _refCount++;
  }

  @override
  void dispose() {
    if (_isDisposed) {
      genUiLogger.warning(
        'Attempt to dispose of already disposed notifier',
        '_RefCountedValueNotifier.dispose Error',
        StackTrace.current,
      );
      return;
    }
    _refCount--;
    if (_refCount <= 0) {
      _isDisposed = true;
      onDispose?.call();
      super.dispose();
    }
  }
}
