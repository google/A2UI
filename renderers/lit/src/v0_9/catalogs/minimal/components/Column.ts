import { html } from "lit";
import { map } from "lit/directives/map.js";
import { styleMap } from "lit/directives/style-map.js";
import { createLitComponent } from "../../../adapter.js";
import { ColumnApi } from "@a2ui/web_core/v0_9/basic_catalog";

export const A2uiColumn = createLitComponent(ColumnApi, ({ props, buildChild }) => {
  const childrenArray = Array.isArray(props.children) ? props.children : [];
  
  const styles = {
    display: "flex",
    flexDirection: "column",
    justifyContent: mapJustify(props.justify),
    alignItems: mapAlign(props.align),
    flex: props.weight !== undefined ? String(props.weight) : "initial",
  };

  return html`
    <div class="a2ui-column" style=${styleMap(styles as Record<string, string>)}>
      ${map(childrenArray, (child: any) => {
        if (typeof child === 'string') return buildChild(child);
        return buildChild(child.id, child.basePath);
      })}
    </div>
  `;
});

function mapJustify(justify: string | undefined): string {
  switch (justify) {
    case "start": return "flex-start";
    case "center": return "center";
    case "end": return "flex-end";
    case "spaceBetween": return "space-between";
    case "spaceAround": return "space-around";
    case "spaceEvenly": return "space-evenly";
    case "stretch": return "stretch";
    default: return "flex-start";
  }
}

function mapAlign(align: string | undefined): string {
  switch (align) {
    case "start": return "flex-start";
    case "center": return "center";
    case "end": return "flex-end";
    case "stretch": return "stretch";
    default: return "stretch";
  }
}