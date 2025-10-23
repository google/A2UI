import { Component, input, signal } from '@angular/core';
import { DynamicComponent } from './rendering/dynamic-component';
import { v0_8 } from '@a2ui/web-lib';
import { Renderer } from './rendering/renderer';

@Component({
  selector: 'a2ui-tabs',
  imports: [Renderer],
  template: `
    @let tabs = this.tabs();
  
    @for (tab of tabs; track tab) {
      <button 
        (click)="selectedIndex.set($index)"
        [disabled]="selectedIndex() === $index">{{resolvePrimitive(tab.title)}}</button>
    }

    <a2ui-renderer [surfaceId]="surfaceId()!" [component]="tabs[selectedIndex()].child"/>
  `,
})
export class Tabs extends DynamicComponent {
  protected selectedIndex = signal(0);
  readonly tabs = input.required<v0_8.Types.ResolvedTabItem[]>();
}
