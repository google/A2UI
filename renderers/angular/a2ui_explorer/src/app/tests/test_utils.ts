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
export async function loadExample(exampleName: string, extraProviders: any[] = []) {
  await TestBed.configureTestingModule({
    imports: [DemoComponent],
    providers: [
      provideMarkdownRenderer(),
      ...extraProviders
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(DemoComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();

  const example = EXAMPLES.find(ex => ex.name === exampleName);
  expect(example).toBeTruthy();

  component.selectExample(example!);
  fixture.detectChanges();
  
  // Wait for async operations (like agent stub playback) to complete
  await wait(50);
  fixture.detectChanges();

  return fixture;
}

/**
 * Helper function to wait for a given number of milliseconds.
 */
export function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
