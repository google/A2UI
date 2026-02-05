
import { LitElement, html, TemplateResult, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { SurfaceContext, DataContext, ComponentContext } from '@a2ui/web_core/v0_9';

@customElement('a2ui-surface-v0-9')
export class Surface extends LitElement {
    @property({ attribute: false })
    accessor context: SurfaceContext | undefined;

    // We rely on the update callback from ComponentContext to trigger re-renders.
    // When data changes, ComponentContext calls this.requestUpdate().

    protected override createRenderRoot() {
        // Render into light DOM? Or shadow?
        // Using shadow DOM is standard.
        return this.attachShadow({ mode: 'open' });
    }

    render() {
        if (!this.context) {
            return html`<div>No Context</div>`;
        }
        const rootId = this.context.rootComponentId;
        if (!rootId) {
            return html`<div>Empty Surface</div>`;
        }

        const rootDef = this.context.getComponentDefinition(rootId);
        if (!rootDef) {
            return html`<div>Root component not found</div>`;
        }

        const component = this.context.catalog.getComponent(rootDef.type);
        if (!component) {
            return html`<div>Unknown component type: ${rootDef.type}</div>`;
        }

        // Create a new ComponentContext for the root.
        // Spec says: "The A2uiMessageProcessor has already calculated the correct data path"
        // For root, it's usually '/'.
        const dataContext = new DataContext(this.context.dataModel, '/');

        // We bind requestUpdate to ensure any data change triggers a re-render.
        // Optimization: We could try to use signals or fine-grained updates, 
        // but for v0.9 prototype, full surface re-render on data change is acceptable 
        // given Lit is fast.
        const compContext = new ComponentContext<TemplateResult>(
            rootId,
            rootDef.properties || {},
            dataContext,
            this.context,
            () => this.requestUpdate()
        );

        return component.render(compContext);
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'a2ui-surface-v0-9': Surface;
    }
}
