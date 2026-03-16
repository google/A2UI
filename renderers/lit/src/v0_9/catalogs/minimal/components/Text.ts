import { html } from "lit";
import { createLitComponent } from "../../../adapter.js";
import { TextApi } from "@a2ui/web_core/v0_9/basic_catalog";

export const A2uiText = createLitComponent(TextApi, ({ props }) => {
  const variant = props.variant ?? "body";
  // Basic implementation without markdown parser for minimal catalog
  // Basic catalog would add markdown support
  
  const tagMap: Record<string, string> = {
    h1: "h1",
    h2: "h2",
    h3: "h3",
    h4: "h4",
    h5: "h5",
    caption: "span",
    body: "p"
  };
  const tag = tagMap[variant as string] || "p";

  // Note: Lit html doesn't allow dynamic tag names directly like html`<${tag}>`, 
  // so we have to use static templates or unsafeHTML. Static templates are safer.
  switch (variant) {
    case "h1": return html`<h1>${props.text}</h1>`;
    case "h2": return html`<h2>${props.text}</h2>`;
    case "h3": return html`<h3>${props.text}</h3>`;
    case "h4": return html`<h4>${props.text}</h4>`;
    case "h5": return html`<h5>${props.text}</h5>`;
    case "caption": return html`<span class="caption">${props.text}</span>`;
    default: return html`<p>${props.text}</p>`;
  }
});