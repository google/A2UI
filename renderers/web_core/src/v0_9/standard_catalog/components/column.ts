
import { ComponentContext } from '../../rendering/component-context.js';
import { ContainerComponent, ContainerRenderProps } from '../shared/container-component.js';
import { z } from 'zod';
import { CommonTypes, annotated } from '../../catalog/schema_types.js';
import { CatalogCommon } from '../schema_shared.js';

const columnSchema = z.object({
  children: annotated(CommonTypes.ChildList, "Defines the children. Use an array of strings for a fixed set of children, or a template object to generate children from a data list. Children cannot be defined inline, they must be referred to by ID."),
  justify: z.enum(["start", "center", "end", "spaceBetween", "spaceAround", "spaceEvenly", "stretch"]).optional().describe("Defines the arrangement of children along the main axis (vertically). Use 'spaceBetween' to push items to the edges (e.g. header at top, footer at bottom), or 'start'/'end'/'center' to pack them together."),
  align: z.enum(["center", "end", "start", "stretch"]).optional().describe("Defines the alignment of children along the cross axis (horizontally). This is similar to the CSS 'align-items' property."),
  weight: CatalogCommon.Weight.optional()
});

export class ColumnComponent<T> extends ContainerComponent<T> {
  constructor(renderer: (props: ContainerRenderProps<T>, context: ComponentContext<T>) => T) {
    super('Column', columnSchema, 'column', renderer);
  }
}
