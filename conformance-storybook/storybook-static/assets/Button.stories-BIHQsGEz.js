import{r,s as i}from"./a2ui-story-wrapper-CvQ-30RQ.js";import"./lit-element-CZsjY6Q-.js";const I={title:"Components/Button"},n={render:()=>r(i("btn-primary",[{id:"btn",component:{Button:{child:"txt",primary:!0,action:{name:"click"}}}},{id:"txt",component:{Text:{text:{literalString:"Primary Button"}}}}]))},t={render:()=>r(i("btn-outlined",[{id:"btn",component:{Button:{child:"txt",outlined:!0,action:{name:"click"}}}},{id:"txt",component:{Text:{text:{literalString:"Outlined Button"}}}}]))},e={render:()=>r(i("btn-text",[{id:"btn",component:{Button:{child:"txt",action:{name:"click"}}}},{id:"txt",component:{Text:{text:{literalString:"Text Button"}}}}]))},o={render:()=>r(i("btn-icon",[{id:"btn",component:{Button:{child:"ico",variant:"icon",action:{name:"click"}}}},{id:"ico",component:{Icon:{name:{literalString:"favorite"}}}}]))};var c,a,m;n.parameters={...n.parameters,docs:{...(c=n.parameters)==null?void 0:c.docs,source:{originalSource:`{
  render: () => renderA2UI(simpleComponent("btn-primary", [{
    id: "btn",
    component: {
      Button: {
        child: "txt",
        primary: true,
        action: {
          name: "click"
        }
      }
    }
  }, {
    id: "txt",
    component: {
      Text: {
        text: {
          literalString: "Primary Button"
        }
      }
    }
  }]))
}`,...(m=(a=n.parameters)==null?void 0:a.docs)==null?void 0:m.source}}};var d,s,l;t.parameters={...t.parameters,docs:{...(d=t.parameters)==null?void 0:d.docs,source:{originalSource:`{
  render: () => renderA2UI(simpleComponent("btn-outlined", [{
    id: "btn",
    component: {
      Button: {
        child: "txt",
        outlined: true,
        action: {
          name: "click"
        }
      }
    }
  }, {
    id: "txt",
    component: {
      Text: {
        text: {
          literalString: "Outlined Button"
        }
      }
    }
  }]))
}`,...(l=(s=t.parameters)==null?void 0:s.docs)==null?void 0:l.source}}};var p,u,x;e.parameters={...e.parameters,docs:{...(p=e.parameters)==null?void 0:p.docs,source:{originalSource:`{
  render: () => renderA2UI(simpleComponent("btn-text", [{
    id: "btn",
    component: {
      Button: {
        child: "txt",
        action: {
          name: "click"
        }
      }
    }
  }, {
    id: "txt",
    component: {
      Text: {
        text: {
          literalString: "Text Button"
        }
      }
    }
  }]))
}`,...(x=(u=e.parameters)==null?void 0:u.docs)==null?void 0:x.source}}};var B,b,g;o.parameters={...o.parameters,docs:{...(B=o.parameters)==null?void 0:B.docs,source:{originalSource:`{
  render: () => renderA2UI(simpleComponent("btn-icon", [{
    id: "btn",
    component: {
      Button: {
        child: "ico",
        variant: "icon",
        action: {
          name: "click"
        }
      }
    }
  }, {
    id: "ico",
    component: {
      Icon: {
        name: {
          literalString: "favorite"
        }
      }
    }
  }]))
}`,...(g=(b=o.parameters)==null?void 0:b.docs)==null?void 0:g.source}}};const h=["Primary","Outlined","TextVariant","IconButton"];export{o as IconButton,t as Outlined,n as Primary,e as TextVariant,h as __namedExportsOrder,I as default};
