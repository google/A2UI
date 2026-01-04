import { Component, ChangeDetectionStrategy, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { DynamicComponent, Types } from '@a2ui/nativescript';
import { SimpleNode, Action } from '../../a2ui-types';

@Component({
  selector: 'a2ui-textfield',
  imports: [NativeScriptCommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <StackLayout class="a2ui-textfield-container">
      <Label 
        *ngIf="fieldLabel"
        class="textfield-label"
        [text]="fieldLabel">
      </Label>
      
      <TextField 
        class="a2ui-textfield"
        [hint]="fieldPlaceholder"
        [text]="fieldValue"
        [secure]="isSecure"
        [keyboardType]="keyboardType"
        (textChange)="onTextChange($event)">
      </TextField>
      
      <Label 
        *ngIf="fieldHelper"
        class="textfield-helper"
        [text]="fieldHelper">
      </Label>
    </StackLayout>
  `,
  styles: [`
    .a2ui-textfield-container {
      margin: 8 0;
    }
    
    .textfield-label {
      font-size: 13;
      font-weight: 500;
      color: #9ca3af;
      margin-bottom: 6;
    }
    
    .a2ui-textfield {
      font-size: 16;
      color: #ffffff;
      background-color: #1e1e3f;
      border-radius: 8;
      border-width: 1;
      border-color: #2a2a4a;
      padding: 12 16;
      placeholder-color: #999;
    }
    
    .a2ui-textfield:focus {
      border-color: #6366f1;
    }
    
    .textfield-helper {
      font-size: 12;
      color: #6b7280;
      margin-top: 4;
    }
  `],
  schemas: [NO_ERRORS_SCHEMA],
})
export class TextFieldComponent extends DynamicComponent<any> {
  get fieldLabel(): string {
    const node = this.node as SimpleNode;
    return node?.label || '';
  }
  
  get fieldPlaceholder(): string {
    const node = this.node as SimpleNode;
    return node?.placeholder || '';
  }
  
  get fieldValue(): string {
    const node = this.node as SimpleNode;
    return node?.value || '';
  }
  
  get fieldHelper(): string {
    const node = this.node as SimpleNode;
    return node?.helperText || '';
  }
  
  get isSecure(): boolean {
    const node = this.node as any;
    return node?.type === 'password';
  }
  
  get keyboardType(): 'email' | 'number' | 'phone' | 'url' | 'datetime' {
    const node = this.node as any;
    switch (node?.inputType) {
      case 'email': return 'email';
      case 'number': return 'number';
      case 'tel': return 'phone';
      case 'url': return 'url';
      default: return 'email'; // default behavior
    }
  }
  
  onTextChange(event: any): void {
    const value = event.value;
    const node = this.node as SimpleNode;
    // Could emit an action with the value
    if (node?.id) {
      this.sendAction({
        name: `${node.id}:change`,
        payload: { value },
      } as Action);
    }
  }
}
