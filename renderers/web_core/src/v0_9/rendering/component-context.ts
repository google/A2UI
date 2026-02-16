
import { DataContext } from './data-context.js';
import { ComponentModel } from '../state/component-model.js';

/**
 * Context provided to components during rendering.
 * It provides access to the component's model, the data context, and a way to dispatch actions.
 */
export class ComponentContext {
  constructor(
    readonly componentModel: ComponentModel,
    readonly dataContext: DataContext,
    private readonly actionDispatcher: (action: any) => Promise<void>
  ) { }

  dispatchAction(action: any): Promise<void> {
    return this.actionDispatcher(action);
  }
}
