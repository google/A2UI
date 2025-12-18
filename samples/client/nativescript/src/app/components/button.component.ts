import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { Types } from '@a2ui/lit/0.8';
import { DynamicComponent } from '@a2ui/nativescript';
import { NativeScriptCommonModule } from '@nativescript/angular';

@Component({
  selector: 'ns-button',
  template: `
    <Button [text]="component().text" (tap)="onTap()"></Button>
  `,
  imports: [NativeScriptCommonModule],
  schemas: [NO_ERRORS_SCHEMA]
})
export class ButtonComponent extends DynamicComponent<Types.ButtonComponent> {
  onTap() {
    console.log('Button tapped:', this.component().action);
    if (this.component().action) {
      this.sendAction(this.component().action!);
    }
  }
}
