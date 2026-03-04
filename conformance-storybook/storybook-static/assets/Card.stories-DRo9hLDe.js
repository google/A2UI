import{r as i,s}from"./a2ui-story-wrapper-CvQ-30RQ.js";import"./lit-element-CZsjY6Q-.js";const p={title:"Components/Card"},e={render:()=>i(s("card-basic",[{id:"card1",component:"Card",child:"col1"},{id:"col1",component:"Column",children:["t1","t2"]},{id:"t1",component:"Text",text:"Card Title",variant:"h3"},{id:"t2",component:"Text",text:"Card body content goes here.",variant:"body"}]))},n={render:()=>i(s("card-header",[{id:"card1",component:"Card",child:"content",header:"header_row"},{id:"header_row",component:"Row",children:["header_icon","header_text"],align:"center"},{id:"header_icon",component:"Icon",name:"info"},{id:"header_text",component:"Text",text:"Card Header",variant:"h4"},{id:"content",component:"Text",text:"This card has a header section.",variant:"body"}]))};var t,r,o;e.parameters={...e.parameters,docs:{...(t=e.parameters)==null?void 0:t.docs,source:{originalSource:`{
  render: () => renderA2UI(simpleComponent("card-basic", [{
    id: "card1",
    component: "Card",
    child: "col1"
  }, {
    id: "col1",
    component: "Column",
    children: ["t1", "t2"]
  }, {
    id: "t1",
    component: "Text",
    text: "Card Title",
    variant: "h3"
  }, {
    id: "t2",
    component: "Text",
    text: "Card body content goes here.",
    variant: "body"
  }]))
}`,...(o=(r=e.parameters)==null?void 0:r.docs)==null?void 0:o.source}}};var a,d,c;n.parameters={...n.parameters,docs:{...(a=n.parameters)==null?void 0:a.docs,source:{originalSource:`{
  render: () => renderA2UI(simpleComponent("card-header", [{
    id: "card1",
    component: "Card",
    child: "content",
    header: "header_row"
  }, {
    id: "header_row",
    component: "Row",
    children: ["header_icon", "header_text"],
    align: "center"
  }, {
    id: "header_icon",
    component: "Icon",
    name: "info"
  }, {
    id: "header_text",
    component: "Text",
    text: "Card Header",
    variant: "h4"
  }, {
    id: "content",
    component: "Text",
    text: "This card has a header section.",
    variant: "body"
  }]))
}`,...(c=(d=n.parameters)==null?void 0:d.docs)==null?void 0:c.source}}};const l=["Basic","WithHeader"];export{e as Basic,n as WithHeader,l as __namedExportsOrder,p as default};
