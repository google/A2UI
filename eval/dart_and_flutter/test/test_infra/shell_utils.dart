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
  List<ShellProbe> probes,
) async {
  final process = await Process.start('bash', ['-c', command]);
  for (final probe in probes) {
    probe.validate();
  }
  return process;
}
