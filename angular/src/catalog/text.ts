import { Component, computed, input } from '@angular/core';
import { v0_8 } from '@a2ui/web-lib';
import { DynamicComponent } from './rendering/dynamic-component';

@Component({
  selector: 'a2ui-text',
  template: `{{ resolvedText() }}`,
})
export class Text extends DynamicComponent {
  readonly text = input.required<v0_8.Primitives.StringValue | null>();

  protected resolvedText = computed(() => {
    // TODO: Markdown?
    return super.resolvePrimitive(this.text()) ?? '(empty)';
  });
}
