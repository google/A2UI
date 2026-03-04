import{r as p,c as i}from"./a2ui-story-wrapper-CvQ-30RQ.js";import"./lit-element-CZsjY6Q-.js";const c={title:"Components/Slider"},e={render:()=>p(i("slider-basic",[{id:"s1",component:"Slider",label:"Volume",min:0,max:100,step:1,value:{path:"/form/vol"}}],"/form",{vol:50}))},r={render:()=>p(i("slider-range",[{id:"s1",component:"Slider",label:"Temperature (°F)",min:60,max:90,step:1,value:{path:"/form/temp"}}],"/form",{temp:72}))};var n,a,o;e.parameters={...e.parameters,docs:{...(n=e.parameters)==null?void 0:n.docs,source:{originalSource:`{
  render: () => renderA2UI(componentWithData("slider-basic", [{
    id: "s1",
    component: "Slider",
    label: "Volume",
    min: 0,
    max: 100,
    step: 1,
    value: {
      path: "/form/vol"
    }
  }], "/form", {
    vol: 50
  }))
}`,...(o=(a=e.parameters)==null?void 0:a.docs)==null?void 0:o.source}}};var t,m,s;r.parameters={...r.parameters,docs:{...(t=r.parameters)==null?void 0:t.docs,source:{originalSource:`{
  render: () => renderA2UI(componentWithData("slider-range", [{
    id: "s1",
    component: "Slider",
    label: "Temperature (°F)",
    min: 60,
    max: 90,
    step: 1,
    value: {
      path: "/form/temp"
    }
  }], "/form", {
    temp: 72
  }))
}`,...(s=(m=r.parameters)==null?void 0:m.docs)==null?void 0:s.source}}};const u=["Basic","WithRange"];export{e as Basic,r as WithRange,u as __namedExportsOrder,c as default};
