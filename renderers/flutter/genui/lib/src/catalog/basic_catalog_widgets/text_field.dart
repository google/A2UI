// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:json_schema_builder/json_schema_builder.dart';

import '../../model/a2ui_schemas.dart';
import '../../model/catalog_item.dart';
import '../../model/data_model.dart';
import '../../model/ui_models.dart';
import '../../primitives/simple_items.dart';
import '../../utils/validation_helper.dart';
import '../../widgets/widget_utilities.dart';

final _schema = S.object(
  description: 'A text input field.',
  properties: {
    'value': A2uiSchemas.stringReference(
      description: 'The value of the text field.',
    ),
    'label': A2uiSchemas.stringReference(),
    'variant': S.string(
      enumValues: ['shortText', 'longText', 'number', 'obscured'],
    ),
    'checks': A2uiSchemas.checkable(),
    'validationRegexp': S.string(),
    'onSubmittedAction': A2uiSchemas.action(),
  },
);

extension type _TextFieldData.fromMap(JsonMap _json) {
  factory _TextFieldData({
    Object? value,
    Object? label,
    List<JsonMap>? checks,
    String? variant,
    String? validationRegexp,
    JsonMap? onSubmittedAction,
  }) => _TextFieldData.fromMap({
    'value': value,
    'label': label,
    'checks': checks,
    'variant': variant,
    'validationRegexp': validationRegexp,
    'onSubmittedAction': onSubmittedAction,
  });

  Object? get value => _json['value'];
  Object? get label => _json['label'];
  List<JsonMap>? get checks => (_json['checks'] as List?)?.cast<JsonMap>();
  String? get variant => _json['variant'] as String?;
  String? get validationRegexp => _json['validationRegexp'] as String?;
  JsonMap? get onSubmittedAction => _json['onSubmittedAction'] as JsonMap?;
}

class _TextField extends StatefulWidget {
  const _TextField({
    required this.initialValue,
    this.label,
    this.checks,
    this.context,
    this.textFieldType,
    this.validationRegexp,
    required this.onChanged,
    required this.onSubmitted,
  });

  final String initialValue;
  final String? label;
  final List<JsonMap>? checks;
  final DataContext? context;
  final String? textFieldType;
  final String? validationRegexp;
  final void Function(String) onChanged;
  final void Function(String) onSubmitted;

  @override
  State<_TextField> createState() => _TextFieldState();
}

class _TextFieldState extends State<_TextField> {
  late final TextEditingController _controller;
  String? _errorText;
  StreamSubscription<String?>? _validationSubscription;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.initialValue);
    _setupValidation();
  }

  @override
  void didUpdateWidget(_TextField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialValue != _controller.text) {
      _controller.text = widget.initialValue;
      // No need to manually calculate error here, stream should handle it if
      // related to value.
    }
    if (widget.checks != oldWidget.checks ||
        widget.context != oldWidget.context) {
      _setupValidation();
    }
  }

  void _setupValidation() {
    _validationSubscription?.cancel();
    _validationSubscription = null;

    if (widget.checks == null ||
        widget.checks!.isEmpty ||
        widget.context == null) {
      if (_errorText != null && mounted) {
        setState(() => _errorText = null);
      }
      return;
    }

    _validationSubscription =
        ValidationHelper.validateStream(widget.checks, widget.context).listen((
          String? newError,
        ) {
          if (newError != _errorText && mounted) {
            setState(() => _errorText = newError);
          }
        });
  }

  @override
  void dispose() {
    _controller.dispose();
    _validationSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: _controller,
      decoration: InputDecoration(
        labelText: widget.label,
        errorText: _errorText,
      ),
      obscureText: widget.textFieldType == 'obscured',
      keyboardType: switch (widget.textFieldType) {
        'number' => .number,
        'longText' => .multiline,
        _ => .text,
      },
      onChanged: (val) {
        widget.onChanged(val);
        // Validation is handled via data model updates + stream
      },
      onSubmitted: (val) {
        // Validation is handled via data model updates + stream
        // But we check current error state before submitting.
        if (_errorText == null) {
          widget.onSubmitted(val);
        }
      },
    );
  }
}

/// A Material Design text field.
///
/// This widget allows the user to enter and edit text. The `text` parameter
/// bidirectionally binds the field's content to the data model. This is
/// analogous to Flutter's [TextField] widget.
///
/// ## Parameters:
///
/// - `text`: The initial value of the text field.
/// - `label`: The text to display as the label for the text field.
/// - `textFieldType`: The type of text field. Can be `shortText`, `longText`,
///   `number`, `date`, or `obscured`.
/// - `validationRegexp`: A regular expression to validate the input.
/// - `onSubmittedAction`: The action to perform when the user submits the
///   text field.
final textField = CatalogItem(
  name: 'TextField',
  isImplicitlyFlexible: true,
  dataSchema: _schema,
  exampleData: [
    () => '''
      [
        {
          "id": "root",
          "component": "TextField",
          "value": "Hello World",
          "label": "Greeting"
        }
      ]
    ''',
    () => '''
      [
        {
          "id": "root",
          "component": "TextField",
          "value": "password123",
          "label": "Password",
          "textFieldType": "obscured"
        }
      ]
    ''',
  ],
  widgetBuilder: (itemContext) {
    final textFieldData = _TextFieldData.fromMap(itemContext.data as JsonMap);
    final Object? valueRef = textFieldData.value;
    final path = (valueRef is Map && valueRef.containsKey('path'))
        ? valueRef['path'] as String
        : '${itemContext.id}.value';
    return BoundString(
      dataContext: itemContext.dataContext,
      value: {'path': path},
      builder: (context, currentValue) {
        return BoundString(
          dataContext: itemContext.dataContext,
          value: textFieldData.label,
          builder: (context, label) {
            final String? effectiveValue =
                currentValue?.toString() ??
                (valueRef is String ? valueRef : null);

            return _TextField(
              initialValue: effectiveValue ?? '',
              label: label,
              checks: textFieldData.checks,
              context: itemContext.dataContext,
              textFieldType: textFieldData.variant,
              validationRegexp: textFieldData.validationRegexp,
              onChanged: (newValue) {
                if (textFieldData.variant == 'number') {
                  final num? numberValue = num.tryParse(newValue);
                  if (numberValue != null) {
                    itemContext.dataContext.update(DataPath(path), numberValue);
                    return;
                  }
                }
                itemContext.dataContext.update(DataPath(path), newValue);
              },
              onSubmitted: (newValue) async {
                final JsonMap? actionData = textFieldData.onSubmittedAction;
                if (actionData == null) {
                  return;
                }

                if (actionData.containsKey('event')) {
                  final eventMap = actionData['event'] as JsonMap;
                  final actionName = eventMap['name'] as String;
                  final contextDefinition = eventMap['context'] as JsonMap?;
                  final JsonMap resolvedContext = await resolveContext(
                    itemContext.dataContext,
                    contextDefinition,
                  );
                  itemContext.dispatchEvent(
                    UserActionEvent(
                      name: actionName,
                      sourceComponentId: itemContext.id,
                      context: resolvedContext,
                    ),
                  );
                } else if (actionData.containsKey('functionCall')) {
                  final funcMap = actionData['functionCall'] as JsonMap;
                  final callName = funcMap['call'] as String;
                  if (callName == 'closeModal') {
                    if (itemContext.buildContext.mounted) {
                      Navigator.of(itemContext.buildContext).pop();
                    }
                    return;
                  }
                  final Stream<Object?> resultStream = itemContext.dataContext
                      .resolve(funcMap);
                  await resultStream.first;
                }
              },
            );
          },
        );
      },
    );
  },
);
