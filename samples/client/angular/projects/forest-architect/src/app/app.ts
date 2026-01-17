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

import { MessageProcessor, Surface } from '@a2ui/angular';
import { Types } from '@a2ui/lit/0.8';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Client } from './client';

@Component({
    selector: 'app-root',
    templateUrl: './app.html',
    styleUrl: 'app.css',
    imports: [Surface, FormsModule],
})
export class App {
    protected client = inject(Client);
    protected processor = inject(MessageProcessor);

    protected hasData = signal(false);
    protected budget = signal(500000);
    protected area = signal(10000);

    protected async handleSubmit(event: SubmitEvent) {
        event.preventDefault();

        if (!(event.target instanceof HTMLFormElement)) {
            return;
        }

        const data = new FormData(event.target);
        const body = data.get('body') ?? null;

        if (body) {
            const message = body as string;
            await this.client.makeRequest(message);
            this.hasData.set(true);
        }
    }

    protected async designForest() {
        const message = `Design a micro-forest for ${this.area()} sq ft with a budget of ₹${this.budget()}`;
        await this.client.makeRequest(message);
        this.hasData.set(true);
    }

    protected async quickAction(action: string) {
        await this.client.makeRequest(action);
        this.hasData.set(true);
    }

    protected handleReset() {
        this.processor.clearSurfaces();
        this.hasData.set(false);
        this.budget.set(500000);
        this.area.set(10000);
    }

    protected formatBudget(value: number): string {
        if (value >= 100000) {
            return `₹${(value / 100000).toFixed(1)} Lakhs`;
        }
        return `₹${value.toLocaleString()}`;
    }
}
