import { Component, inject } from '@angular/core';
import { ModelProcessor } from './processor';
import { Surface } from '../catalog/surface';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  imports: [Surface],
})
export class App {
  protected processor = inject(ModelProcessor);

  protected makeRequest() {
    this.processor.makeRequest('Top 5 Chinese restaurants in New York.');
  }
}
