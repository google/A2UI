import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { PageRouterOutlet } from '@nativescript/angular';
import { Renderer, Theme } from '@a2ui/nativescript';
import { Types } from '@a2ui/lit/0.8';

@Component({
  selector: 'ns-app',
  templateUrl: './app.html',
  imports: [PageRouterOutlet, Renderer],
  schemas: [NO_ERRORS_SCHEMA],
})
export class App {
  surfaceId = 'main' as Types.SurfaceID;
  component: Types.AnyComponentNode = {
    type: 'button',
    id: 'btn1',
    text: 'Hello from A2UI NativeScript!',
    action: {
      type: 'click',
      handler: 'console.log("Clicked!")',
    },
  } as any; // Cast to any for now as we might not have full types setup
}
