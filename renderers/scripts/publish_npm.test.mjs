#!/usr/bin/env node
/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { runPublish } from './publish_npm.mjs';

describe('publish_npm script integration test', () => {
  it('should correctly topologically sort and execute dry-run publishing logic', async () => {
    const executedCommands = [];

    // Mock command runner
    function mockRunCommand(cmd, args, options) {
      executedCommands.push(`${cmd} ${args.join(' ')} (in ${options?.cwd ? options.cwd.split('/').pop() : 'root'})`);
    }

    // Mock execSync for npm view
    function mockExecSync(cmd) {
      if (cmd.includes('npm view')) {
        // Return older versions so pre-flight check passes
        if (cmd.includes('@a2ui/web_core')) return '0.0.1\n';
        if (cmd.includes('@a2ui/lit')) return '0.0.1\n';
      }
      return '';
    }

    // Run the script with --yes, --skip-tests (no --dry-run so we can record commands)
    // We target web_core and lit. lit depends on web_core, so web_core MUST be processed first.
    await runPublish(
      ['--packages=lit,web_core', '--yes', '--skip-tests'],
      mockRunCommand,
      mockExecSync,
      null // readline not needed with --yes
    );

    // Verify topological order in preparation phase
    const webCoreInstallIndex = executedCommands.findIndex(cmd => cmd.includes('install') && cmd.includes('web_core'));
    const litInstallIndex = executedCommands.findIndex(cmd => cmd.includes('install') && cmd.includes('lit'));

    assert.ok(webCoreInstallIndex > -1, 'Should install web_core');
    assert.ok(litInstallIndex > -1, 'Should install lit');
    assert.ok(webCoreInstallIndex < litInstallIndex, 'web_core must be prepared before lit (topological sort)');

    // Verify topological order in publish phase
    const webCorePublishIndex = executedCommands.findIndex(cmd => cmd.includes('publish:package') && cmd.includes('web_core'));
    const litPublishIndex = executedCommands.findIndex(cmd => cmd.includes('publish:package') && cmd.includes('lit'));

    assert.ok(webCorePublishIndex > -1, 'Should publish web_core');
    assert.ok(litPublishIndex > -1, 'Should publish lit');
    assert.ok(webCorePublishIndex < litPublishIndex, 'web_core must be published before lit');
  });
});