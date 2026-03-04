import{r as c,s as m}from"./a2ui-story-wrapper-CvQ-30RQ.js";import"./lit-element-CZsjY6Q-.js";const l={title:"Components/List"},t={render:()=>c(m("list-basic",[{id:"list1",component:"List",children:["item1","item2","item3"]},{id:"item1",component:"Text",text:"Item 1",variant:"body"},{id:"item2",component:"Text",text:"Item 2",variant:"body"},{id:"item3",component:"Text",text:"Item 3",variant:"body"}]))},n={render:()=>c(m("list-cards",[{id:"list1",component:"List",children:["card1","card2"]},{id:"card1",component:"Card",child:"t1"},{id:"t1",component:"Text",text:"Card in a list",variant:"body"},{id:"card2",component:"Card",child:"t2"},{id:"t2",component:"Text",text:"Another card",variant:"body"}]))};var e,r,i;t.parameters={...t.parameters,docs:{...(e=t.parameters)==null?void 0:e.docs,source:{originalSource:`{
  render: () => renderA2UI(simpleComponent("list-basic", [{
    id: "list1",
    component: "List",
    children: ["item1", "item2", "item3"]
  }, {
    id: "item1",
    component: "Text",
    text: "Item 1",
    variant: "body"
  }, {
    id: "item2",
    component: "Text",
    text: "Item 2",
    variant: "body"
  }, {
    id: "item3",
    component: "Text",
    text: "Item 3",
    variant: "body"
  }]))
}`,...(i=(r=t.parameters)==null?void 0:r.docs)==null?void 0:i.source}}};var o,d,a;n.parameters={...n.parameters,docs:{...(o=n.parameters)==null?void 0:o.docs,source:{originalSource:`{
  render: () => renderA2UI(simpleComponent("list-cards", [{
    id: "list1",
    component: "List",
    children: ["card1", "card2"]
  }, {
    id: "card1",
    component: "Card",
    child: "t1"
  }, {
    id: "t1",
    component: "Text",
    text: "Card in a list",
    variant: "body"
  }, {
    id: "card2",
    component: "Card",
    child: "t2"
  }, {
    id: "t2",
    component: "Text",
    text: "Another card",
    variant: "body"
  }]))
}`,...(a=(d=n.parameters)==null?void 0:d.docs)==null?void 0:a.source}}};const x=["Basic","WithCards"];export{t as Basic,n as WithCards,x as __namedExportsOrder,l as default};
