import { Component, computed, input } from '@angular/core';
import { v0_8 } from '@a2ui/web-lib';
import { DynamicComponent } from './rendering/dynamic-component';

@Component({
  selector: 'a2ui-heading',
  template: `<h1>{{ resolvedText() }}</h1>`,
})
export class Heading extends DynamicComponent {
  readonly text = input.required<v0_8.Primitives.StringValue | null>();
  readonly level = input.required<string | undefined>();
  protected resolvedText = computed(() => super.resolvePrimitive(this.text()) ?? '');
}
