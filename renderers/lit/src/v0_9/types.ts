import { ResolveA2uiProps, ComponentApi, ComponentContext } from "@a2ui/web_core/v0_9";

export type ChildBuilder = (id: string, overrideBasePath?: string) => unknown;

export interface LitComponentImplementation<T = any> extends ComponentApi {
  render(args: {
    props: ResolveA2uiProps<T>;
    buildChild: ChildBuilder;
    context: ComponentContext;
  }): unknown;
}