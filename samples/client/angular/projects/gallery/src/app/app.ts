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
