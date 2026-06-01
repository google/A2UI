/*
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {html, css, LitElement} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {ComponentContext} from '@a2ui/web_core/v0_9';

@customElement('a2ui-weather-widget')
export class A2uiWeatherWidget extends LitElement {
  @property({type: Object}) accessor context!: ComponentContext;

  static styles = css`
    :host {
      display: block;
      padding: 32px;
      background: linear-gradient(135deg, #1e1b4b 0%, #311042 100%);
      color: white;
      border: none;
      border-radius: 0;
      font-family: 'Outfit', system-ui, sans-serif;
      box-sizing: border-box;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .location h3 {
      margin: 0;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .location p {
      margin: 4px 0 0 0;
      font-size: 13px;
      color: #a5b4fc;
      opacity: 0.9;
    }
    .temp-section {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 24px;
    }
    .temp {
      font-size: 48px;
      font-weight: 800;
      letter-spacing: -1px;
      background: linear-gradient(to bottom, #ffffff, #e0e7ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .condition {
      font-size: 16px;
      font-weight: 500;
      color: #e0e7ff;
    }
    .forecast-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      padding: 16px;
      border-radius: 16px;
      margin-bottom: 24px;
    }
    .forecast-day {
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .day-name {
      font-size: 12px;
      font-weight: 600;
      color: #a5b4fc;
      text-transform: uppercase;
    }
    .day-temp {
      font-size: 14px;
      font-weight: 700;
    }
    button {
      width: 100%;
      background: white;
      color: #764ba2;
      border: none;
      padding: 12px 20px;
      font-size: 14px;
      font-weight: 600;
      border-radius: 30px;
      cursor: pointer;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    button:hover {
      background: #f3e8ff;
      transform: scale(1.02);
      box-shadow: 0 6px 15px rgba(0,0,0,0.15);
    }
    button:active {
      transform: scale(0.98);
    }
  `;

  render() {
    return html`
      <div class="header">
        <div class="location">
          <h3>Local Weather Forecast</h3>
          <p>San Francisco, CA</p>
        </div>
        <span style="font-size: 28px;">☀️</span>
      </div>
      <div class="temp-section">
        <div class="temp">72°F</div>
        <div class="condition">Partly Cloudy</div>
      </div>
      <div class="forecast-grid">
        <div class="forecast-day">
          <span class="day-name">Fri</span>
          <span style="font-size: 18px;">☀️</span>
          <span class="day-temp">74° / 55°</span>
        </div>
        <div class="forecast-day">
          <span class="day-name">Sat</span>
          <span style="font-size: 18px;">🌤️</span>
          <span class="day-temp">68° / 54°</span>
        </div>
        <div class="forecast-day">
          <span class="day-name">Sun</span>
          <span style="font-size: 18px;">🌧️</span>
          <span class="day-temp">62° / 50°</span>
        </div>
      </div>
      <button @click=${this.triggerAction}>Refresh Local Weather</button>
    `;
  }

  triggerAction() {
    if (this.context && this.context.dispatchAction) {
      this.context.dispatchAction({
        event: {
          name: 'refresh_weather',
          context: {
            timestamp: new Date().toISOString(),
            location: 'San Francisco, CA'
          }
        }
      });
    }
  }
}

export const WeatherWidget = {
  name: 'WeatherWidget',
  tagName: 'a2ui-weather-widget',
  schema: { parse: (v: any) => v }
};
