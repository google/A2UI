// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'package:rxdart/rxdart.dart';

import '../model/data_model.dart';
import '../primitives/simple_items.dart';
import '../widgets/widget_utilities.dart';

/// A validation error with a message.
class ValidationError {
  /// Creates a [ValidationError] with the given [message].
  ValidationError(this.message);

  /// The error message.
  final String message;

  @override
  String toString() => 'ValidationError: $message';
}

/// A helper class for handling reactive validation logic.
class ValidationHelper {
  /// Validates a value against a list of checks.
  ///
  /// Returns a [Stream] that emits an error message if any check fails, or null
  /// if all checks pass.
  ///
  /// The [checks] list should contain maps with 'condition' and optional
  /// 'message' keys.
  static Stream<String?> validateStream(
    List<JsonMap>? checks,
    DataContext? context,
  ) {
    if (checks == null || checks.isEmpty || context == null) {
      return Stream.value(null);
    }

    final List<Stream<(bool, String)>> streams = [];
    for (final JsonMap check in checks) {
      final String message = check['message'] as String? ?? 'Invalid value';
      streams.add(
        context
            .evaluateConditionStream(check['condition'])
            .map((isValid) => (isValid, message)),
      );
    }

    return CombineLatestStream.list(streams).map((results) {
      for (final (isValid, msg) in results) {
        if (!isValid) return msg;
      }
      return null;
    });
  }

  /// Validates a value against a schema, resolving any expressions in the
  /// schema.
  Future<List<ValidationError>> validate(
    Object? value,
    JsonMap schema,
    DataContext dataContext,
  ) async {
    final List<ValidationError> errors = [];

    // Resolve schema constraints that might be expressions
    final JsonMap resolvedSchema = await resolveContext(dataContext, schema);

    // simple validation for now, delegating to json_schema_builder would be
    // ideal, but for now we just check basic constraints we support in genui

    if (resolvedSchema.containsKey('type')) {
      final Object? type = resolvedSchema['type'];
      if (type == 'string' && value is! String) {
        errors.add(
          ValidationError('Expected string, got ${value.runtimeType}'),
        );
      } else if (type == 'number' && value is! num) {
        errors.add(
          ValidationError('Expected number, got ${value.runtimeType}'),
        );
      } else if (type == 'boolean' && value is! bool) {
        errors.add(
          ValidationError('Expected boolean, got ${value.runtimeType}'),
        );
      }
    }

    if (resolvedSchema.containsKey('required') && value is Map) {
      final required = resolvedSchema['required'] as List;
      for (final key in required) {
        if (!value.containsKey(key)) {
          errors.add(ValidationError('Missing required key: $key'));
        }
      }
    }

    // TODO: Add more validation logic as needed, potentially using a library

    return errors;
  }
}
