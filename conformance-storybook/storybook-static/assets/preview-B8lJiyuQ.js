import{d as P}from"./index-DrFu-skq.js";const{useEffect:_,useMemo:h}=__STORYBOOK_MODULE_PREVIEW_API__,{global:j}=__STORYBOOK_MODULE_GLOBAL__,{logger:X}=__STORYBOOK_MODULE_CLIENT_LOGGER__;var p="backgrounds",U={light:{name:"light",value:"#F8F8F8"},dark:{name:"dark",value:"#333"}},{document:b,window:O}=j,D=()=>{var r;return!!((r=O==null?void 0:O.matchMedia("(prefers-reduced-motion: reduce)"))!=null&&r.matches)},A=r=>{(Array.isArray(r)?r:[r]).forEach(N)},N=r=>{var t;let e=b.getElementById(r);e&&((t=e.parentElement)==null||t.removeChild(e))},F=(r,e)=>{let t=b.getElementById(r);if(t)t.innerHTML!==e&&(t.innerHTML=e);else{let o=b.createElement("style");o.setAttribute("id",r),o.innerHTML=e,b.head.appendChild(o)}},Y=(r,e,t)=>{var a;let o=b.getElementById(r);if(o)o.innerHTML!==e&&(o.innerHTML=e);else{let d=b.createElement("style");d.setAttribute("id",r),d.innerHTML=e;let i=`addon-backgrounds-grid${t?`-docs-${t}`:""}`,n=b.getElementById(i);n?(a=n.parentElement)==null||a.insertBefore(d,n):b.head.appendChild(d)}},W={cellSize:100,cellAmount:10,opacity:.8},w="addon-backgrounds",R="addon-backgrounds-grid",q=D()?"":"transition: background-color 0.3s;",J=(r,e)=>{let{globals:t,parameters:o,viewMode:a,id:d}=e,{options:i=U,disable:n,grid:s=W}=o[p]||{},c=t[p]||{},u=c.value,l=u?i[u]:void 0,$=(l==null?void 0:l.value)||"transparent",f=c.grid||!1,y=!!l&&!n,m=a==="docs"?`#anchor--${d} .docs-story`:".sb-show-main",E=a==="docs"?`#anchor--${d} .docs-story`:".sb-show-main",H=o.layout===void 0||o.layout==="padded",L=a==="docs"?20:H?16:0,{cellAmount:k,cellSize:g,opacity:x,offsetX:v=L,offsetY:S=L}=s,B=a==="docs"?`${w}-docs-${d}`:`${w}-color`,G=a==="docs"?d:null;_(()=>{let M=`
    ${m} {
      background: ${$} !important;
      ${q}
      }`;if(!y){A(B);return}Y(B,M,G)},[m,B,G,y,$]);let T=a==="docs"?`${R}-docs-${d}`:`${R}`;return _(()=>{if(!f){A(T);return}let M=[`${g*k}px ${g*k}px`,`${g*k}px ${g*k}px`,`${g}px ${g}px`,`${g}px ${g}px`].join(", "),K=`
        ${E} {
          background-size: ${M} !important;
          background-position: ${v}px ${S}px, ${v}px ${S}px, ${v}px ${S}px, ${v}px ${S}px !important;
          background-blend-mode: difference !important;
          background-image: linear-gradient(rgba(130, 130, 130, ${x}) 1px, transparent 1px),
           linear-gradient(90deg, rgba(130, 130, 130, ${x}) 1px, transparent 1px),
           linear-gradient(rgba(130, 130, 130, ${x/2}) 1px, transparent 1px),
           linear-gradient(90deg, rgba(130, 130, 130, ${x/2}) 1px, transparent 1px) !important;
        }
      `;F(T,K)},[k,g,E,T,f,v,S,x]),r()},Q=(r,e=[],t)=>{if(r==="transparent")return"transparent";if(e.find(a=>a.value===r)||r)return r;let o=e.find(a=>a.name===t);if(o)return o.value;if(t){let a=e.map(d=>d.name).join(", ");X.warn(P`
        Backgrounds Addon: could not find the default color "${t}".
        These are the available colors for your story based on your configuration:
        ${a}.
      `)}return"transparent"},Z=(r,e)=>{var u;let{globals:t,parameters:o}=e,a=(u=t[p])==null?void 0:u.value,d=o[p],i=h(()=>d.disable?"transparent":Q(a,d.values,d.default),[d,a]),n=h(()=>i&&i!=="transparent",[i]),s=e.viewMode==="docs"?`#anchor--${e.id} .docs-story`:".sb-show-main",c=h(()=>`
      ${s} {
        background: ${i} !important;
        ${D()?"":"transition: background-color 0.3s;"}
      }
    `,[i,s]);return _(()=>{let l=e.viewMode==="docs"?`addon-backgrounds-docs-${e.id}`:"addon-backgrounds-color";if(!n){A(l);return}Y(l,c,e.viewMode==="docs"?e.id:null)},[n,c,e]),r()},V=(r,e)=>{var y;let{globals:t,parameters:o}=e,a=o[p].grid,d=((y=t[p])==null?void 0:y.grid)===!0&&a.disable!==!0,{cellAmount:i,cellSize:n,opacity:s}=a,c=e.viewMode==="docs",u=o.layout===void 0||o.layout==="padded"?16:0,l=a.offsetX??(c?20:u),$=a.offsetY??(c?20:u),f=h(()=>{let m=e.viewMode==="docs"?`#anchor--${e.id} .docs-story`:".sb-show-main",E=[`${n*i}px ${n*i}px`,`${n*i}px ${n*i}px`,`${n}px ${n}px`,`${n}px ${n}px`].join(", ");return`
      ${m} {
        background-size: ${E} !important;
        background-position: ${l}px ${$}px, ${l}px ${$}px, ${l}px ${$}px, ${l}px ${$}px !important;
        background-blend-mode: difference !important;
        background-image: linear-gradient(rgba(130, 130, 130, ${s}) 1px, transparent 1px),
         linear-gradient(90deg, rgba(130, 130, 130, ${s}) 1px, transparent 1px),
         linear-gradient(rgba(130, 130, 130, ${s/2}) 1px, transparent 1px),
         linear-gradient(90deg, rgba(130, 130, 130, ${s/2}) 1px, transparent 1px) !important;
      }
    `},[n]);return _(()=>{let m=e.viewMode==="docs"?`addon-backgrounds-grid-docs-${e.id}`:"addon-backgrounds-grid";if(!d){A(m);return}F(m,f)},[d,f,e]),r()},C,ae=(C=globalThis.FEATURES)!=null&&C.backgroundsStoryGlobals?[J]:[V,Z],I,oe={[p]:{grid:{cellSize:20,opacity:.5,cellAmount:5},disable:!1,...!((I=globalThis.FEATURES)!=null&&I.backgroundsStoryGlobals)&&{values:Object.values(U)}}},ee={[p]:{value:void 0,grid:!1}},z,de=(z=globalThis.FEATURES)!=null&&z.backgroundsStoryGlobals?ee:{[p]:null};export{ae as decorators,de as initialGlobals,oe as parameters};
