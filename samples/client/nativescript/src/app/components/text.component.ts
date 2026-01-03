import { Component, Input, ChangeDetectionStrategy, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { DynamicComponent } from '@a2ui/nativescript';
import { Types, SimpleNode } from '../../a2ui-lit-types';

@Component({
  selector: 'a2ui-text',
  imports: [NativeScriptCommonModule],
  schemas: [NO_ERRORS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <Label 
      class="a2ui-text"
      [class]="textClass"
      [text]="textContent"
      textWrap="true">
    </Label>
  `,
  styles: [`
    .a2ui-text {
      color: #ffffff;
      font-size: 15;
    }
    
    .text-title {
      font-size: 24;
      font-weight: bold;
      margin-bottom: 8;
    }
    
    .text-subtitle {
      font-size: 18;
      font-weight: 600;
      color: #d1d5db;
      margin-bottom: 4;
    }
    
    .text-body {
      font-size: 15;
      line-height: 3;
    }
    
    .text-caption {
      font-size: 12;
      color: #9ca3af;
    }
    
    .text-code {
      font-family: monospace;
      font-size: 13;
      background-color: #1e1e3f;
      padding: 8;
      border-radius: 4;
    }
  `]
})
export class TextComponent extends DynamicComponent<any> {
  get textClass(): string {
    const node = this.node as SimpleNode;
    const style = node?.textStyle || 'body';
    return `text-${style}`;
  }

  get textContent(): string {
    const node = this.node as SimpleNode;
    return node?.text || '';
  }
}
