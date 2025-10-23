import { Directive, inject, input } from '@angular/core';
import { v0_8 } from '@a2ui/web-lib';
import { ModelProcessor } from '../../app/processor';

@Directive()
export abstract class DynamicComponent {
  protected processor = inject(ModelProcessor);
  readonly surfaceId = input.required<v0_8.Types.SurfaceID | null>();
  readonly component = input.required<v0_8.Types.AnyComponentNode>();

  protected async sendAction(action: v0_8.Types.Action) {
    const component = this.component();
    const context: Record<string, unknown> = {};

    if (action.context) {
      for (const item of action.context) {
        if (item.value.literalBoolean) {
          context[item.key] = item.value.literalBoolean;
        } else if (item.value.literalNumber) {
          context[item.key] = item.value.literalNumber;
        } else if (item.value.literalString) {
          context[item.key] = item.value.literalString;
        } else if (item.value.path) {
          const path = this.processor.resolvePath(item.value.path, component.dataContextPath);
          const value = this.processor.getData(component, path, this.surfaceId() ?? undefined);
          context[item.key] = value;
        }
      }
    }

    const message: v0_8.Types.A2UIClientEventMessage = {
      userAction: {
        actionName: action.action,
        sourceComponentId: component.id,
        timestamp: new Date().toISOString(),
        context,
      },
    };

    await this.processor.makeRequest(message);
  }

  protected resolvePrimitive(value: v0_8.Primitives.StringValue | null): string | null;
  protected resolvePrimitive(value: v0_8.Primitives.BooleanValue | null): boolean | null;
  protected resolvePrimitive(value: v0_8.Primitives.NumberValue | null): number | null;
  protected resolvePrimitive(
    value:
      | v0_8.Primitives.StringValue
      | v0_8.Primitives.BooleanValue
      | v0_8.Primitives.NumberValue
      | null
  ) {
    const component = this.component();
    const surfaceId = this.surfaceId();

    if (!value || typeof value !== 'object') {
      return null;
    } else if (value.literal != null) {
      return value.literal;
    } else if (value.path) {
      return this.processor.getData(component, value.path, surfaceId ?? undefined);
    } else if ('literalString' in value) {
      return value.literalString;
    } else if ('literalNumber' in value) {
      return value.literalNumber;
    } else if ('literalBoolean' in value) {
      return value.literalBoolean;
    }

    return null;
  }
}
