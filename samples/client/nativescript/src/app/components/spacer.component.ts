import { Component, ChangeDetectionStrategy, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { DynamicComponent } from '@a2ui/nativescript';
import { Types, SimpleNode } from '../../a2ui-lit-types';

@Component({
  selector: 'a2ui-spacer',
  imports: [NativeScriptCommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <StackLayout 
      class="a2ui-spacer"
      [height]="spacerHeight"
      [width]="spacerWidth">
    </StackLayout>
  `,
  styles: [`
    .a2ui-spacer {
      background-color: transparent;
    }
  `],
  schemas: [NO_ERRORS_SCHEMA],
})
export class SpacerComponent extends DynamicComponent<any> {
  get spacerHeight(): number {
    const node = this.node as SimpleNode;
    return node?.height ?? 16;
  }
  
  get spacerWidth(): number | string {
    const node = this.node as SimpleNode;
    return node?.width ?? 'auto';
  }
}
