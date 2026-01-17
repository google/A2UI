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
import { Component, inject, signal, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Client } from './client';

type ScreenState = 'welcome' | 'upload' | 'loading' | 'results';

@Component({
    selector: 'app-root',
    templateUrl: './app.html',
    styleUrl: 'app.css',
    imports: [Surface, FormsModule],
})
export class App {
    @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

    protected client = inject(Client);
    protected processor = inject(MessageProcessor);

    protected currentScreen = signal<ScreenState>('welcome');
    protected uploadedImage = signal<string | null>(null);
    protected uploadedFileName = signal<string>('');
    protected loadingMessage = signal<string>('Connecting to landscape design agent...');

    // Start new project - go to upload screen
    protected startNewProject() {
        this.currentScreen.set('upload');
    }

    // Explore ideas - quick action
    protected async exploreIdeas() {
        this.currentScreen.set('loading');
        this.loadingMessage.set('Fetching design inspiration...');
        try {
            await this.client.makeRequest('Show me landscape design inspiration and ideas for outdoor spaces');
            this.currentScreen.set('results');
        } catch (err) {
            console.error('Error exploring ideas:', err);
            this.loadingMessage.set('Error connecting to agent. Please try again.');
            setTimeout(() => this.currentScreen.set('welcome'), 3000);
        }
    }

    // Trigger file input click
    protected triggerFileUpload() {
        this.fileInput.nativeElement.click();
    }

    // Handle file upload
    protected async handleFileUpload(event: Event) {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const file = input.files[0];
        this.uploadedFileName.set(file.name);

        // Convert to base64 for preview
        const reader = new FileReader();
        reader.onload = async (e) => {
            const imageData = e.target?.result as string;
            this.uploadedImage.set(imageData);

            // Auto-submit after upload
            await this.analyzePhoto(imageData);
        };
        reader.readAsDataURL(file);
    }

    // Analyze the uploaded photo
    protected async analyzePhoto(imageData: string) {
        this.currentScreen.set('loading');
        this.loadingMessage.set('Analyzing your outdoor space...');

        try {
            // Send the photo for analysis - the agent will generate a dynamic questionnaire
            const message = `USER_SUBMITTED_PHOTO: I have uploaded a photo of my backyard/garden. Please analyze the landscape features you can see in this image and generate a customized questionnaire to understand my design preferences. Base your questions on what you observe in the photo.`;

            await this.client.makeRequest(message);
            this.currentScreen.set('results');
        } catch (err) {
            console.error('Error analyzing photo:', err);
            this.loadingMessage.set('Error connecting to agent. Please try again.');
            setTimeout(() => this.currentScreen.set('upload'), 3000);
        }
    }

    // Handle going back
    protected handleBack() {
        const current = this.currentScreen();
        if (current === 'upload') {
            this.currentScreen.set('welcome');
        } else if (current === 'results') {
            this.processor.clearSurfaces();
            this.currentScreen.set('upload');
            this.uploadedImage.set(null);
            this.uploadedFileName.set('');
        }
    }

    // Reset to welcome
    protected handleReset() {
        this.processor.clearSurfaces();
        this.currentScreen.set('welcome');
        this.uploadedImage.set(null);
        this.uploadedFileName.set('');
    }

    // Check if there's A2UI data
    protected hasResults(): boolean {
        return this.processor.getSurfaces().size > 0;
    }
}
