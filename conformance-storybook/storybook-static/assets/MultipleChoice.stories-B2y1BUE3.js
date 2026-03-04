import{r as a,s as t}from"./a2ui-story-wrapper-CvQ-30RQ.js";import"./lit-element-CZsjY6Q-.js";const v={title:"Components/ChoicePicker (MultipleChoice)"},e={render:()=>a(t("mc-exclusive",[{id:"mc1",component:{MultipleChoice:{selections:{path:"/pref"},options:[{label:{literalString:"Email"},value:"email"},{label:{literalString:"Phone"},value:"phone"},{label:{literalString:"SMS"},value:"sms"}]}}}]))},n={render:()=>a(t("mc-multi",[{id:"mc1",component:{MultipleChoice:{selections:{path:"/langs"},options:[{label:{literalString:"JavaScript"},value:"js"},{label:{literalString:"Python"},value:"py"},{label:{literalString:"Rust"},value:"rs"}]}}}]))},l={render:()=>a(t("mc-chips",[{id:"mc1",component:{MultipleChoice:{selections:{path:"/size"},variant:"chips",options:[{label:{literalString:"Small"},value:"s"},{label:{literalString:"Medium"},value:"m"},{label:{literalString:"Large"},value:"l"}]}}}]))};var r,i,s;e.parameters={...e.parameters,docs:{...(r=e.parameters)==null?void 0:r.docs,source:{originalSource:`{
  render: () => renderA2UI(simpleComponent("mc-exclusive", [{
    id: "mc1",
    component: {
      MultipleChoice: {
        selections: {
          path: "/pref"
        },
        options: [{
          label: {
            literalString: "Email"
          },
          value: "email"
        }, {
          label: {
            literalString: "Phone"
          },
          value: "phone"
        }, {
          label: {
            literalString: "SMS"
          },
          value: "sms"
        }]
      }
    }
  }]))
}`,...(s=(i=e.parameters)==null?void 0:i.docs)==null?void 0:s.source}}};var o,c,p;n.parameters={...n.parameters,docs:{...(o=n.parameters)==null?void 0:o.docs,source:{originalSource:`{
  render: () => renderA2UI(simpleComponent("mc-multi", [{
    id: "mc1",
    component: {
      MultipleChoice: {
        selections: {
          path: "/langs"
        },
        options: [{
          label: {
            literalString: "JavaScript"
          },
          value: "js"
        }, {
          label: {
            literalString: "Python"
          },
          value: "py"
        }, {
          label: {
            literalString: "Rust"
          },
          value: "rs"
        }]
      }
    }
  }]))
}`,...(p=(c=n.parameters)==null?void 0:c.docs)==null?void 0:p.source}}};var m,u,S;l.parameters={...l.parameters,docs:{...(m=l.parameters)==null?void 0:m.docs,source:{originalSource:`{
  render: () => renderA2UI(simpleComponent("mc-chips", [{
    id: "mc1",
    component: {
      MultipleChoice: {
        selections: {
          path: "/size"
        },
        variant: "chips",
        options: [{
          label: {
            literalString: "Small"
          },
          value: "s"
        }, {
          label: {
            literalString: "Medium"
          },
          value: "m"
        }, {
          label: {
            literalString: "Large"
          },
          value: "l"
        }]
      }
    }
  }]))
}`,...(S=(u=l.parameters)==null?void 0:u.docs)==null?void 0:S.source}}};const g=["MutuallyExclusive","MultiSelect","Chips"];export{l as Chips,n as MultiSelect,e as MutuallyExclusive,g as __namedExportsOrder,v as default};
