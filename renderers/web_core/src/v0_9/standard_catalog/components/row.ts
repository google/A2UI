
import { ComponentContext } from '../../rendering/component-context.js';
import { ContainerComponent, ContainerRenderProps } from '../shared/container-component.js';
import { z } from 'zod';
import { CommonTypes, annotated } from '../../catalog/schema_types.js';

const rowSchema = z.object({
  children: annotated(CommonTypes.ChildList, "Defines the children. Use an array of strings for a fixed set of children, or a template object to generate children from a data list. Children cannot be defined inline, they must be referred to by ID."),
  justify: z.enum(["center", "end", "spaceAround", "spaceBetween", "spaceEvenly", "start", "stretch"]).optional().describe("Defines the arrangement of children along the main axis (horizontally). Use 'spaceBetween' to push items to the edges, or 'start'/'end'/'center' to pack them together."),
  align: z.enum(["start", "center", "end", "stretch"]).optional().describe("Defines the alignment of children along the cross axis (vertically). This is similar to the CSS 'align-items' property, but uses camelCase values (e.g., 'start')."),
  weight: CommonTypes.Weight.optional()
});

export class RowComponent<T> extends ContainerComponent<T> {
  constructor(renderer: (props: ContainerRenderProps<T>, context: ComponentContext<T>) => T) {
    super('Row', rowSchema, 'row', renderer);
  }
}
