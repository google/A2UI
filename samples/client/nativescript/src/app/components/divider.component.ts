import { Component, ChangeDetectionStrategy, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { DynamicComponent } from '@a2ui/nativescript';
import { Types, SimpleNode } from '../../a2ui-lit-types';

@Component({
  selector: 'a2ui-divider',
  standalone: true,
  imports: [NativeScriptCommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <StackLayout 
      class="a2ui-divider"
      [class.vertical]="orientation === 'vertical'"
      [height]="orientation === 'horizontal' ? 1 : '100%'"
      [width]="orientation === 'vertical' ? 1 : '100%'">
    </StackLayout>
  `,
  styles: [`
    .a2ui-divider {
      background-color: #2a2a4a;
      margin: 8 0;
    }
    
    .a2ui-divider.vertical {
      margin: 0 8;
    }
  `],
  schemas: [NO_ERRORS_SCHEMA],
})
export class DividerComponent extends DynamicComponent<any> {
  get orientation(): 'horizontal' | 'vertical' {
    const node = this.node as SimpleNode;
    return node?.orientation ?? 'horizontal';
  }
}
