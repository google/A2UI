/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import { ModelConfiguration } from './models';

interface UsageRecord {
  timestamp: number;
  tokensUsed: number;
}

interface ModelRateLimitState {
  usageRecords: UsageRecord[];
}

export class RateLimiter {
  private modelStates: Map<string, ModelRateLimitState> = new Map();
  private _waitingCount = 0;

  get waitingCount(): number {
    return this._waitingCount;
  }

  private getModelState(modelName: string): ModelRateLimitState {
    if (!this.modelStates.has(modelName)) {
      this.modelStates.set(modelName, { usageRecords: [] });
    }
    return this.modelStates.get(modelName)!;
  }

  private cleanUpRecords(state: ModelRateLimitState): void {
    const minuteAgo = Date.now() - 60 * 1000;
    state.usageRecords = state.usageRecords.filter(
      (record) => record.timestamp > minuteAgo
    );
  }

  async acquirePermit(modelConfig: ModelConfiguration): Promise<void> {
    this._waitingCount++;
    try {
      const { name, requestsPerMinute, tokensPerMinute } = modelConfig;
      if (!requestsPerMinute && !tokensPerMinute) {
        return; // No limits
      }

      const state = this.getModelState(name);

      // Loop to re-check after waiting, as multiple limits might be in play
      while (true) {
        this.cleanUpRecords(state);
        const currentNow = Date.now();
        let rpmWait = 0;
        let tpmWait = 0;

        // Check RPM
        if (
          requestsPerMinute &&
          state.usageRecords.length >= requestsPerMinute
        ) {
          const oldestTimestamp = state.usageRecords[0].timestamp;
          rpmWait = Math.max(0, oldestTimestamp + 60 * 1000 - currentNow);
        }

        // Check TPM
        if (tokensPerMinute) {
          let currentTokens = 0;
          state.usageRecords.forEach((r) => (currentTokens += r.tokensUsed));

          if (currentTokens >= tokensPerMinute) {
            // Check if we are ALREADY over limit for the next call
            let tokensToShed = currentTokens - tokensPerMinute + 1; // How many tokens need to expire
            let cumulativeTokens = 0;
            for (const record of state.usageRecords) {
              cumulativeTokens += record.tokensUsed;
              if (cumulativeTokens >= tokensToShed) {
                tpmWait = Math.max(
                  tpmWait,
                  record.timestamp + 60 * 1000 - currentNow
                );
                break;
              }
            }
          }
        }

        const requiredWait = Math.max(rpmWait, tpmWait);
        if (requiredWait <= 0) {
          break; // Permit acquired
        }

        console.warn(
          `Rate limiting ${name}: Waiting ${requiredWait}ms (RPM wait: ${rpmWait}ms, TPM wait: ${tpmWait}ms)`
        );
        await new Promise((resolve) => setTimeout(resolve, requiredWait));
      }
    } finally {
      this._waitingCount--;
    }
  }

  recordUsage(modelConfig: ModelConfiguration, tokensUsed: number): void {
    if (tokensUsed > 0) {
      const state = this.getModelState(modelConfig.name);
      state.usageRecords.push({ timestamp: Date.now(), tokensUsed });
    }
  }
}

export const rateLimiter = new RateLimiter();
