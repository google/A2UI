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

import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

/**
 * Custom Breathability Badge component for showing air-purifying scores
 */
@customElement("botanist-breathability-badge")
export class BreathabilityBadge extends LitElement {
  @property({ type: Number })
  accessor score = 0;

  static styles = css`
    :host {
      display: inline-flex;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      color: white;
    }

    .badge.high {
      background: linear-gradient(135deg, #4caf50, #2e7d32);
    }

    .badge.medium {
      background: linear-gradient(135deg, #ffc107, #ff9800);
    }

    .badge.low {
      background: linear-gradient(135deg, #ff5722, #f44336);
    }

    .g-icon {
      font-size: 14px;
    }
  `;

  render() {
    const level = this.score > 80 ? "high" : this.score > 50 ? "medium" : "low";
    return html`
      <div class="badge ${level}">
        <span class="g-icon material-symbols-outlined">air</span>
        <span>${this.score}%</span>
      </div>
    `;
  }
}

/**
 * Custom Plant Card component with enhanced styling
 */
@customElement("botanist-plant-card")
export class BotanistPlantCard extends LitElement {
  @property({ type: String })
  accessor commonName = "";

  @property({ type: String })
  accessor scientificName = "";

  @property({ type: String })
  accessor category = "";

  @property({ type: String })
  accessor imageUrl = "";

  @property({ type: Number })
  accessor breathabilityScore = 0;

  // Track if image failed to load
  private _imageError = false;

  static styles = css`
    :host {
      display: block;
    }

    .card {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(46, 125, 50, 0.15);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(46, 125, 50, 0.2);
    }

    .image-container {
      width: 100%;
      height: 160px;
      overflow: hidden;
      background: #e8f5e9;
    }

    .image-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .image-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
    }

    .image-placeholder .g-icon {
      font-size: 64px;
      color: #81c784;
    }

    .content {
      padding: 16px;
    }

    .common-name {
      margin: 0 0 4px;
      font-size: 18px;
      font-weight: 700;
      color: #1b5e20;
    }

    .scientific-name {
      margin: 0 0 8px;
      font-size: 14px;
      font-style: italic;
      color: #558b2f;
    }

    .category {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      background: #e8f5e9;
      border-radius: 12px;
      font-size: 12px;
      color: #2e7d32;
    }

    .category .g-icon {
      font-size: 14px;
    }
  `;

  private _handleImageError() {
    this._imageError = true;
    this.requestUpdate();
  }

  private _renderImage() {
    // Show placeholder if no imageUrl or if image failed to load
    if (!this.imageUrl || this._imageError) {
      return html`
        <div class="image-placeholder">
          <span class="g-icon material-symbols-outlined">local_florist</span>
        </div>
      `;
    }

    return html`<img 
      src="${this.imageUrl}" 
      alt="${this.commonName}"
      @error=${this._handleImageError}
    />`;
  }

  render() {
    return html`
      <div class="card">
        <div class="image-container">
          ${this._renderImage()}
        </div>
        <div class="content">
          <h3 class="common-name">${this.commonName || "Unknown Plant"}</h3>
          <p class="scientific-name">${this.scientificName || "Species unknown"}</p>
          ${this.category
        ? html`
                <span class="category">
                  <span class="g-icon material-symbols-outlined">eco</span>
                  ${this.category}
                </span>
              `
        : ""}
          ${this.breathabilityScore > 0
        ? html`<botanist-breathability-badge score="${this.breathabilityScore}"></botanist-breathability-badge>`
        : ""}
        </div>
      </div>
    `;
  }
}

/**
 * Register all custom botanist components
 */
export function registerBotanistComponents() {
  // Components are auto-registered via @customElement decorator
  console.log("🌱 Botanist custom components registered");
}
