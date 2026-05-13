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

import {TestBed} from '@angular/core/testing';
import {DemoComponent} from '../demo.component';
import {EXAMPLES} from '../generated/examples-bundle';
import {provideMarkdownRenderer} from '../../../../src/v0_9/core/markdown';

/**
 * Helper function to load an example in the DemoComponent for testing.
 * Resolves after the example is selected and initial async rendering has time to complete.
 */
export async function loadExample(exampleName: string) {
  await TestBed.configureTestingModule({
    imports: [DemoComponent],
    providers: [provideMarkdownRenderer()],
  });

  const fixture = TestBed.createComponent(DemoComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();

  const example = EXAMPLES.find(ex => ex.name === exampleName);
  expect(example).withContext(`Example not found: ${exampleName}`).toBeTruthy();

  component.selectExample(example!);
  fixture.detectChanges();

  await whenSettled();

  return fixture;
}

/**
 * Returns a promise that resolves when the renderer is settled.
 */
async function whenSettled(): Promise<void> {
  // In a zoneless application, we cannot rely on NgZone.onStable.
  // Yielding to the macrotask queue ensures that all pending microtasks
  // (like Preact signal listeners and Angular CD cycles) are executed.
  const MACROTASKS_TO_FLUSH = 20;

  for (let i = 0; i < MACROTASKS_TO_FLUSH; i++) {
    await wait(0);
  }
}

/**
 * Helper function to wait for a given number of milliseconds.
 */
export function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getCanvas(): HTMLDivElement {
  return document.querySelector('.canvas-frame')!;
}
