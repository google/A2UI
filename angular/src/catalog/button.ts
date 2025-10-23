import { Component, computed, input } from '@angular/core';
import { v0_8 } from '@a2ui/web-lib';
import { DynamicComponent } from './rendering/dynamic-component';

@Component({
  selector: 'button[a2ui-button]',
  template: `{{ resolvedLabel() }}`,
  host: {
    '(click)': 'handleClick()',
  },
})
export class Button extends DynamicComponent {
  readonly label = input.required<v0_8.Primitives.StringValue | null>();
  readonly action = input.required<v0_8.Types.Action | null>();
  protected resolvedLabel = computed(() => super.resolvePrimitive(this.label()) ?? '(empty)');

  protected handleClick() {
    const action = this.action();

    if (action) {
      super.sendAction(action);
    }
  }
}
