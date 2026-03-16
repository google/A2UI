import { ReactiveController, LitElement } from "lit";
import { GenericBinder, ComponentContext, ComponentApi, ResolveA2uiProps } from "@a2ui/web_core/v0_9";
import { ChildBuilder, LitComponentImplementation } from "./types.js";

export class A2uiController<T> implements ReactiveController {
  public props: ResolveA2uiProps<T>;
  private binder: GenericBinder<T>;
  private subscription?: { unsubscribe: () => void };

  constructor(private host: LitElement & { context: ComponentContext }, api: ComponentApi) {
    this.binder = new GenericBinder(this.host.context, api.schema);
    this.props = this.binder.snapshot as ResolveA2uiProps<T>;
    this.host.addController(this);
  }

  hostConnected() {
    this.subscription = this.binder.subscribe((newProps) => {
      this.props = newProps as ResolveA2uiProps<T>;
      this.host.requestUpdate();
    });
  }

  hostDisconnected() {
    this.subscription?.unsubscribe();
  }

  dispose() {
    this.binder.dispose();
  }
}

import { z } from "zod";

export function createLitComponent<T = any>(
  api: ComponentApi,
  renderFn: (args: { props: ResolveA2uiProps<T>; buildChild: ChildBuilder; context: ComponentContext }) => unknown
): LitComponentImplementation<T> {
  return {
    ...api,
    render: renderFn,
  };
}