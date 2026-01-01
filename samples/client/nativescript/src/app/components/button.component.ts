import { Component, NO_ERRORS_SCHEMA, ChangeDetectionStrategy, Input } from '@angular/core';
import { Types, SimpleNode } from '../../a2ui-lit-types';
import { DynamicComponent } from '@a2ui/nativescript';
import { NativeScriptCommonModule } from '@nativescript/angular';

@Component({
  selector: 'a2ui-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <Button 
      class="a2ui-button"
      [class]="buttonClass"
      [text]="buttonText" 
      (tap)="onTap()">
    </Button>
  `,
  styles: [`
    .a2ui-button {
      font-size: 15;
      font-weight: 500;
      padding: 12 24;
      border-radius: 12;
      text-transform: none;
    }
    
    .btn-primary {
      background-color: #6366f1;
      color: #ffffff;
    }
    
    .btn-secondary {
      background-color: transparent;
      color: #6366f1;
      border-width: 1;
      border-color: #6366f1;
    }
    
    .btn-tertiary {
      background-color: transparent;
      color: #6366f1;
    }
  `],
  imports: [NativeScriptCommonModule],
  schemas: [NO_ERRORS_SCHEMA]
})
export class ButtonComponent extends DynamicComponent<any> {
  
  get buttonText(): string {
    const node = this.node as SimpleNode;
    // Try to get text from child node
    if (node?.child?.text) {
      return node.child.text;
    }
    // Fallback to label or id
    return node?.label || node?.id || 'Button';
  }

  get buttonClass(): string {
    const node = this.node as SimpleNode;
    const variant = node?.variant || 'primary';
    return `btn-${variant}`;
  }

  onTap(): void {
    const node = this.node as SimpleNode;
    const action = node?.action || node?.actions?.[0];
    console.log('Button tapped:', action);
    if (action) {
      this.sendAction(action);
    }
  }
}
