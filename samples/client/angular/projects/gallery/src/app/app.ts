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
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LibraryComponent } from './features/library/library.component';
import { GalleryComponent } from './features/gallery/gallery.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styles: [`
    .app-container { display: flex; height: 100vh; overflow: hidden; }
    .main-sidebar {
      width: 200px;
      background: #2d2d2d;
      color: white;
      display: flex;
      flex-direction: column;
      padding: 20px 0;
    }
    .app-title {
      padding: 0 20px 20px;
      margin: 0;
      font-size: 20px;
      border-bottom: 1px solid #444;
    }
    .nav-buttons { display: flex; flex-direction: column; padding: 10px 0; }
    .nav-btn {
      padding: 15px 20px;
      cursor: pointer;
      transition: background 0.2s;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .nav-btn:hover { background: #3d3d3d; }
    .nav-btn.active { background: #007bff; }
    .content-area { flex: 1; overflow: hidden; background: #f5f5f5; }
  `],
  imports: [CommonModule, LibraryComponent, GalleryComponent],
})
export class App {
  currentView: 'library' | 'gallery' = 'library';

  setView(view: 'library' | 'gallery') {
    this.currentView = view;
  }
}
