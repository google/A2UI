// Copyright 2025 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import 'dart:io';

/// A function that checks the response of the service.
///
/// Throws error if the response is not valid.
typedef ResponseChecker = void Function(String response);

class ShellProbe {
  final String command;
  final ResponseChecker responseChecker;
  final Duration timeout;

  ShellProbe({
    required this.command,
    required this.responseChecker,
    this.timeout = const Duration(seconds: 10),
  });

  /// Validates the response of the service.
  ///
  /// Runs [command], checks the response and throws error if the response is not valid.
  void validate() {
    final response = runCommandSync(command);
    responseChecker(response);
  }
}

String runCommandSync(String command) {
  final result = Process.runSync('bash', ['-c', command]);
  if (result.exitCode != 0) {
    throw Exception(
      'Command failed with exit code ${result.exitCode}: $command\n${result.stderr}',
    );
  }
  return result.stdout as String;
}

Future<Process> startAndVerifyService(
  String command,
  List<ShellProbe> probes, {
  bool printCommandOutput = true,
}) async {
  final process = await Process.start('bash', ['-c', command]);

  for (final probe in probes) {
    probe.validate();
  }
  return process;
}
