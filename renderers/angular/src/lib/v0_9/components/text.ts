/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  ViewEncapsulation,
  effect,
  signal,
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { DynamicComponent } from '../rendering/dynamic-component';
import * as Primitives from '@a2ui/web_core/types/primitives';
import * as Styles from '@a2ui/web_core/styles/index';
import { Types } from '../types';
import { MarkdownRenderer } from '../data/markdown';

interface HintedStyles {
  h1: Record<string, string>;
  h2: Record<string, string>;
  h3: Record<string, string>;
  h4: Record<string, string>;
  h5: Record<string, string>;
  body: Record<string, string>;
  caption: Record<string, string>;
}

@Component({
  selector: 'a2ui-text',
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <section
      [class]="classes()"
      [style]="additionalStyles()"
      [innerHTML]="resolvedTextSignal() | async"
    ></section>
  `,
  encapsulation: ViewEncapsulation.None,
  imports: [AsyncPipe],
  styles: `
    a2ui-text {
      display: block;
      flex: var(--weight);
    }

    a2ui-text h1,
    a2ui-text h2,
    a2ui-text h3,
    a2ui-text h4,
    a2ui-text h5 {
      line-height: inherit;
      font: inherit;
    }
  `,
})
export class Text extends DynamicComponent {
  private markdownRenderer = inject(MarkdownRenderer);
  readonly text = input.required<Primitives.StringValue | null>();
  readonly variant = input<string | null>(null);

  protected resolvedTextSignal = signal<Promise<string>>(Promise.resolve('(empty)'));

  constructor() {
    super();
    effect((onCleanup) => {
      const textVal = this.text();
      const variant = this.variant();
      const context = this.getContext();

      if (!context || !textVal) {
        this.resolvedTextSignal.set(Promise.resolve('(empty)'));
        return;
      }

      const sub = context.subscribeDynamicValue<any>(textVal as any, (value: any) => {
        this.resolvedTextSignal.set(this.processTextValue(value, variant));
      });

      if (sub.value !== undefined) {
        this.resolvedTextSignal.set(this.processTextValue(sub.value, variant));
      }

      onCleanup(() => sub.unsubscribe());
    });
  }

  private processTextValue(value: any, variant: string | null): Promise<string> {
    if (value == null) {
      return Promise.resolve('(empty)');
    }

    let markdown = String(this.resolvePrimitive(value) ?? '');
    switch (variant) {
      case 'h1':
        markdown = `# ${markdown}`;
        break;
      case 'h2':
        markdown = `## ${markdown}`;
        break;
      case 'h3':
        markdown = `### ${markdown}`;
        break;
      case 'h4':
        markdown = `#### ${markdown}`;
        break;
      case 'h5':
        markdown = `##### ${markdown}`;
        break;
      case 'caption':
        markdown = `*${markdown}*`;
        break;
    }

    return this.markdownRenderer.render(markdown, {
      tagClassMap: Styles.appendToAll(this.theme['markdown'], ['ol', 'ul', 'li'], {}),
    });
  }

  protected overrideThemeStyles = computed(() => {
    const override = this.themeOverride();
    if (override && override.components && override.components.Text) {
        return override.components.Text;
    }
    return null;
  });

  protected overrideAdditionalStyles = computed(() => {
    const override = this.themeOverride();
    if (override && override.additionalStyles && override.additionalStyles.Text) {
        return override.additionalStyles.Text;
    }
    return null;
  });

  protected classes = computed(() => {
    const variant = this.variant();
    const baseTextTheme = this.theme['components']?.Text;
    const overrideTextTheme = this.overrideThemeStyles();

    let textTheme = baseTextTheme;

    if (overrideTextTheme) {
        if (!baseTextTheme) {
            textTheme = overrideTextTheme;
        } else if (typeof baseTextTheme === 'string' || Array.isArray(baseTextTheme)) {
            textTheme = Styles.merge(baseTextTheme as any, overrideTextTheme as any);
        } else {
            textTheme = {
                ...baseTextTheme,
                all: Styles.merge(baseTextTheme.all || {}, overrideTextTheme as any)
            };
        }
    }

    if (!textTheme) {
      return {};
    }

    if (typeof textTheme === 'string' || Array.isArray(textTheme)) {
      return textTheme;
    }

    return Styles.merge(
      textTheme.all,
      variant ? textTheme[variant] : {},
    );
  });

  protected additionalStyles = computed(() => {
    const variant = this.variant();
    const baseStyles = this.theme['additionalStyles']?.Text;
    const overrideStyles = this.overrideAdditionalStyles();

    let additionalStyles: Record<string, string> = {};

    if (baseStyles) {
        if (this.areHintedStyles(baseStyles)) {
            additionalStyles = baseStyles[(variant ?? 'body') as keyof HintedStyles] || {};
        } else {
            additionalStyles = baseStyles;
        }
    }

    if (overrideStyles) {
        additionalStyles = { ...additionalStyles, ...overrideStyles } as Record<string, string>;
    }

    return Object.keys(additionalStyles).length > 0 ? additionalStyles : null;
  });

  private areHintedStyles(styles: unknown): styles is HintedStyles {
    if (typeof styles !== 'object' || !styles || Array.isArray(styles)) {
      return false;
    }

    const expected = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'caption', 'body'];
    return expected.every((v) => v in styles);
  }
}
