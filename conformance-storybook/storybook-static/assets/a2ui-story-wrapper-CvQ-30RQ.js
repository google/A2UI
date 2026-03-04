var oa=Object.defineProperty;var Zu=e=>{throw TypeError(e)};var ca=(e,t,u)=>t in e?oa(e,t,{enumerable:!0,configurable:!0,writable:!0,value:u}):e[t]=u;var We=(e,t,u)=>ca(e,typeof t!="symbol"?t+"":t,u),Ku=(e,t,u)=>t.has(e)||Zu("Cannot "+u),Ju=(e,t)=>Object(t)!==t?Zu('Cannot use the "in" operator on this value'):e.has(t),A=(e,t,u)=>(Ku(e,t,"read from private field"),u?u.call(e):t.get(e)),T=(e,t,u)=>t.has(e)?Zu("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,u),N=(e,t,u,r)=>(Ku(e,t,"write to private field"),r?r.call(e,u):t.set(e,u),u),R=(e,t,u)=>(Ku(e,t,"access private method"),u);import{f as la,u as da,b as Ir,i as fa,a as ha}from"./lit-element-CZsjY6Q-.js";/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const pa=e=>(t,u)=>{u!==void 0?u.addInitializer(()=>{customElements.define(e,t)}):customElements.define(e,t)};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const ba={attribute:!0,type:String,converter:da,reflect:!1,hasChanged:la},ma=(e=ba,t,u)=>{const{kind:r,metadata:i}=u;let s=globalThis.litPropertyMetadata.get(i);if(s===void 0&&globalThis.litPropertyMetadata.set(i,s=new Map),r==="setter"&&((e=Object.create(e)).wrapped=!0),s.set(u.name,e),r==="accessor"){const{name:n}=u;return{set(a){const c=t.get.call(this);t.set.call(this,a),this.requestUpdate(n,c,e,!0,a)},init(a){return a!==void 0&&this.C(n,void 0,e,a),a}}}if(r==="setter"){const{name:n}=u;return function(a){const c=this[n];t.call(this,a),this.requestUpdate(n,c,e,!0,a)}}throw Error("Unsupported decorator location: "+r)};function wi(e){return(t,u)=>typeof u=="object"?ma(e,t,u):((r,i,s)=>{const n=i.hasOwnProperty(s);return i.constructor.createProperty(s,r),n?Object.getOwnPropertyDescriptor(i,s):void 0})(e,t,u)}/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */let _a=class extends Event{constructor(t,u,r,i){super("context-request",{bubbles:!0,composed:!0}),this.context=t,this.contextTarget=u,this.callback=r,this.subscribe=i??!1}};/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */let ga=class{get value(){return this.o}set value(t){this.setValue(t)}setValue(t,u=!1){const r=u||!Object.is(t,this.o);this.o=t,r&&this.updateObservers()}constructor(t){this.subscriptions=new Map,this.updateObservers=()=>{for(const[u,{disposer:r}]of this.subscriptions)u(this.o,r)},t!==void 0&&(this.value=t)}addCallback(t,u,r){if(!r)return void t(this.value);this.subscriptions.has(t)||this.subscriptions.set(t,{disposer:()=>{this.subscriptions.delete(t)},consumerHost:u});const{disposer:i}=this.subscriptions.get(t);t(this.value,i)}clearCallbacks(){this.subscriptions.clear()}};/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */let ya=class extends Event{constructor(t,u){super("context-provider",{bubbles:!0,composed:!0}),this.context=t,this.contextTarget=u}},ki=class extends ga{constructor(t,u,r){var i,s;super(u.context!==void 0?u.initialValue:r),this.onContextRequest=n=>{if(n.context!==this.context)return;const a=n.contextTarget??n.composedPath()[0];a!==this.host&&(n.stopPropagation(),this.addCallback(n.callback,a,n.subscribe))},this.onProviderRequest=n=>{if(n.context!==this.context||(n.contextTarget??n.composedPath()[0])===this.host)return;const a=new Set;for(const[c,{consumerHost:l}]of this.subscriptions)a.has(c)||(a.add(c),l.dispatchEvent(new _a(this.context,l,c,!0)));n.stopPropagation()},this.host=t,u.context!==void 0?this.context=u.context:this.context=u,this.attachListeners(),(s=(i=this.host).addController)==null||s.call(i,this)}attachListeners(){this.host.addEventListener("context-request",this.onContextRequest),this.host.addEventListener("context-provider",this.onProviderRequest)}hostConnected(){this.host.dispatchEvent(new ya(this.context,this.host))}};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function xa({context:e}){return(t,u)=>{const r=new WeakMap;if(typeof u=="object")return{get(){return t.get.call(this)},set(i){return r.get(this).setValue(i),t.set.call(this,i)},init(i){return r.set(this,new ki(this,{context:e,initialValue:i})),i}};{t.constructor.addInitializer((n=>{r.set(n,new ki(n,{context:e}))}));const i=Object.getOwnPropertyDescriptor(t,u);let s;if(i===void 0){const n=new WeakMap;s={get(){return n.get(this)},set(a){r.get(this).setValue(a),n.set(this,a)},configurable:!0,enumerable:!0}}else{const n=i.set;s={...i,set(a){r.get(this).setValue(a),n==null||n.call(this,a)}}}return void Object.defineProperty(t,u,s)}}}var va=Object.defineProperty,Ca=(e,t,u)=>t in e?va(e,t,{enumerable:!0,configurable:!0,writable:!0,value:u}):e[t]=u,Qu=(e,t,u)=>(Ca(e,typeof t!="symbol"?t+"":t,u),u),wa=(e,t,u)=>{if(!t.has(e))throw TypeError("Cannot "+u)},Yu=(e,t)=>{if(Object(t)!==t)throw TypeError('Cannot use the "in" operator on this value');return e.has(t)},fu=(e,t,u)=>{if(t.has(e))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(e):t.set(e,u)},$i=(e,t,u)=>(wa(e,t,"access private method"),u);/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */function ys(e,t){return Object.is(e,t)}/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */let J=null,Ut=!1,gu=1;const Eu=Symbol("SIGNAL");function ot(e){const t=J;return J=e,t}function ka(){return J}function $a(){return Ut}const ei={version:0,lastCleanEpoch:0,dirty:!1,producerNode:void 0,producerLastReadVersion:void 0,producerIndexOfThis:void 0,nextProducerIndex:0,liveConsumerNode:void 0,liveConsumerIndexOfThis:void 0,consumerAllowSignalWrites:!1,consumerIsAlwaysLive:!1,producerMustRecompute:()=>!1,producerRecomputeValue:()=>{},consumerMarkedDirty:()=>{},consumerOnSignalRead:()=>{}};function Mu(e){if(Ut)throw new Error(typeof ngDevMode<"u"&&ngDevMode?"Assertion error: signal read during notification phase":"");if(J===null)return;J.consumerOnSignalRead(e);const t=J.nextProducerIndex++;if(mt(J),t<J.producerNode.length&&J.producerNode[t]!==e&&Or(J)){const u=J.producerNode[t];ju(u,J.producerIndexOfThis[t])}J.producerNode[t]!==e&&(J.producerNode[t]=e,J.producerIndexOfThis[t]=Or(J)?Cs(e,J,t):0),J.producerLastReadVersion[t]=e.version}function Ea(){gu++}function xs(e){if(!(!e.dirty&&e.lastCleanEpoch===gu)){if(!e.producerMustRecompute(e)&&!Ta(e)){e.dirty=!1,e.lastCleanEpoch=gu;return}e.producerRecomputeValue(e),e.dirty=!1,e.lastCleanEpoch=gu}}function vs(e){if(e.liveConsumerNode===void 0)return;const t=Ut;Ut=!0;try{for(const u of e.liveConsumerNode)u.dirty||Aa(u)}finally{Ut=t}}function Da(){return(J==null?void 0:J.consumerAllowSignalWrites)!==!1}function Aa(e){var t;e.dirty=!0,vs(e),(t=e.consumerMarkedDirty)==null||t.call(e.wrapper??e)}function Sa(e){return e&&(e.nextProducerIndex=0),ot(e)}function Fa(e,t){if(ot(t),!(!e||e.producerNode===void 0||e.producerIndexOfThis===void 0||e.producerLastReadVersion===void 0)){if(Or(e))for(let u=e.nextProducerIndex;u<e.producerNode.length;u++)ju(e.producerNode[u],e.producerIndexOfThis[u]);for(;e.producerNode.length>e.nextProducerIndex;)e.producerNode.pop(),e.producerLastReadVersion.pop(),e.producerIndexOfThis.pop()}}function Ta(e){mt(e);for(let t=0;t<e.producerNode.length;t++){const u=e.producerNode[t],r=e.producerLastReadVersion[t];if(r!==u.version||(xs(u),r!==u.version))return!0}return!1}function Cs(e,t,u){var r;if(ti(e),mt(e),e.liveConsumerNode.length===0){(r=e.watched)==null||r.call(e.wrapper);for(let i=0;i<e.producerNode.length;i++)e.producerIndexOfThis[i]=Cs(e.producerNode[i],e,i)}return e.liveConsumerIndexOfThis.push(u),e.liveConsumerNode.push(t)-1}function ju(e,t){var u;if(ti(e),mt(e),typeof ngDevMode<"u"&&ngDevMode&&t>=e.liveConsumerNode.length)throw new Error(`Assertion error: active consumer index ${t} is out of bounds of ${e.liveConsumerNode.length} consumers)`);if(e.liveConsumerNode.length===1){(u=e.unwatched)==null||u.call(e.wrapper);for(let i=0;i<e.producerNode.length;i++)ju(e.producerNode[i],e.producerIndexOfThis[i])}const r=e.liveConsumerNode.length-1;if(e.liveConsumerNode[t]=e.liveConsumerNode[r],e.liveConsumerIndexOfThis[t]=e.liveConsumerIndexOfThis[r],e.liveConsumerNode.length--,e.liveConsumerIndexOfThis.length--,t<e.liveConsumerNode.length){const i=e.liveConsumerIndexOfThis[t],s=e.liveConsumerNode[t];mt(s),s.producerIndexOfThis[i]=t}}function Or(e){var t;return e.consumerIsAlwaysLive||(((t=e==null?void 0:e.liveConsumerNode)==null?void 0:t.length)??0)>0}function mt(e){e.producerNode??(e.producerNode=[]),e.producerIndexOfThis??(e.producerIndexOfThis=[]),e.producerLastReadVersion??(e.producerLastReadVersion=[])}function ti(e){e.liveConsumerNode??(e.liveConsumerNode=[]),e.liveConsumerIndexOfThis??(e.liveConsumerIndexOfThis=[])}/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */function ws(e){if(xs(e),Mu(e),e.value===zr)throw e.error;return e.value}function Ia(e){const t=Object.create(Oa);t.computation=e;const u=()=>ws(t);return u[Eu]=t,u}const Xu=Symbol("UNSET"),er=Symbol("COMPUTING"),zr=Symbol("ERRORED"),Oa={...ei,value:Xu,dirty:!0,error:null,equal:ys,producerMustRecompute(e){return e.value===Xu||e.value===er},producerRecomputeValue(e){if(e.value===er)throw new Error("Detected cycle in computations.");const t=e.value;e.value=er;const u=Sa(e);let r,i=!1;try{r=e.computation.call(e.wrapper),i=t!==Xu&&t!==zr&&e.equal.call(e.wrapper,t,r)}catch(s){r=zr,e.error=s}finally{Fa(e,u)}if(i){e.value=t;return}e.value=r,e.version++}};/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */function za(){throw new Error}let Pa=za;function Na(){Pa()}/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */function Ra(e){const t=Object.create(Ba);t.value=e;const u=()=>(Mu(t),t.value);return u[Eu]=t,u}function Ma(){return Mu(this),this.value}function ja(e,t){Da()||Na(),e.equal.call(e.wrapper,e.value,t)||(e.value=t,La(e))}const Ba={...ei,equal:ys,value:void 0};function La(e){e.version++,Ea(),vs(e)}/**
 * @license
 * Copyright 2024 Bloomberg Finance L.P.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ce=Symbol("node");var Ye;(e=>{var t,u,r,i;class s{constructor(c,l={}){fu(this,u),Qu(this,t);const o=Ra(c)[Eu];if(this[ce]=o,o.wrapper=this,l){const p=l.equals;p&&(o.equal=p),o.watched=l[e.subtle.watched],o.unwatched=l[e.subtle.unwatched]}}get(){if(!(0,e.isState)(this))throw new TypeError("Wrong receiver type for Signal.State.prototype.get");return Ma.call(this[ce])}set(c){if(!(0,e.isState)(this))throw new TypeError("Wrong receiver type for Signal.State.prototype.set");if($a())throw new Error("Writes to signals not permitted during Watcher callback");const l=this[ce];ja(l,c)}}t=ce,u=new WeakSet,e.isState=a=>typeof a=="object"&&Yu(u,a),e.State=s;class n{constructor(c,l){fu(this,i),Qu(this,r);const o=Ia(c)[Eu];if(o.consumerAllowSignalWrites=!0,this[ce]=o,o.wrapper=this,l){const p=l.equals;p&&(o.equal=p),o.watched=l[e.subtle.watched],o.unwatched=l[e.subtle.unwatched]}}get(){if(!(0,e.isComputed)(this))throw new TypeError("Wrong receiver type for Signal.Computed.prototype.get");return ws(this[ce])}}r=ce,i=new WeakSet,e.isComputed=a=>typeof a=="object"&&Yu(i,a),e.Computed=n,(a=>{var c,l,d,o;function p(v){let y,g=null;try{g=ot(null),y=v()}finally{ot(g)}return y}a.untrack=p;function h(v){var y;if(!(0,e.isComputed)(v)&&!(0,e.isWatcher)(v))throw new TypeError("Called introspectSources without a Computed or Watcher argument");return((y=v[ce].producerNode)==null?void 0:y.map(g=>g.wrapper))??[]}a.introspectSources=h;function f(v){var y;if(!(0,e.isComputed)(v)&&!(0,e.isState)(v))throw new TypeError("Called introspectSinks without a Signal argument");return((y=v[ce].liveConsumerNode)==null?void 0:y.map(g=>g.wrapper))??[]}a.introspectSinks=f;function m(v){if(!(0,e.isComputed)(v)&&!(0,e.isState)(v))throw new TypeError("Called hasSinks without a Signal argument");const y=v[ce].liveConsumerNode;return y?y.length>0:!1}a.hasSinks=m;function b(v){if(!(0,e.isComputed)(v)&&!(0,e.isWatcher)(v))throw new TypeError("Called hasSources without a Computed or Watcher argument");const y=v[ce].producerNode;return y?y.length>0:!1}a.hasSources=b;class _{constructor(y){fu(this,l),fu(this,d),Qu(this,c);let g=Object.create(ei);g.wrapper=this,g.consumerMarkedDirty=y,g.consumerIsAlwaysLive=!0,g.consumerAllowSignalWrites=!1,g.producerNode=[],this[ce]=g}watch(...y){if(!(0,e.isWatcher)(this))throw new TypeError("Called unwatch without Watcher receiver");$i(this,d,o).call(this,y);const g=this[ce];g.dirty=!1;const w=ot(g);for(const z of y)Mu(z[ce]);ot(w)}unwatch(...y){if(!(0,e.isWatcher)(this))throw new TypeError("Called unwatch without Watcher receiver");$i(this,d,o).call(this,y);const g=this[ce];mt(g);for(let w=g.producerNode.length-1;w>=0;w--)if(y.includes(g.producerNode[w].wrapper)){ju(g.producerNode[w],g.producerIndexOfThis[w]);const z=g.producerNode.length-1;if(g.producerNode[w]=g.producerNode[z],g.producerIndexOfThis[w]=g.producerIndexOfThis[z],g.producerNode.length--,g.producerIndexOfThis.length--,g.nextProducerIndex--,w<g.producerNode.length){const P=g.producerIndexOfThis[w],M=g.producerNode[w];ti(M),M.liveConsumerIndexOfThis[P]=w}}}getPending(){if(!(0,e.isWatcher)(this))throw new TypeError("Called getPending without Watcher receiver");return this[ce].producerNode.filter(g=>g.dirty).map(g=>g.wrapper)}}c=ce,l=new WeakSet,d=new WeakSet,o=function(v){for(const y of v)if(!(0,e.isComputed)(y)&&!(0,e.isState)(y))throw new TypeError("Called watch/unwatch without a Computed or State argument")},e.isWatcher=v=>Yu(l,v),a.Watcher=_;function k(){var v;return(v=ka())==null?void 0:v.wrapper}a.currentComputed=k,a.watched=Symbol("watched"),a.unwatched=Symbol("unwatched")})(e.subtle||(e.subtle={}))})(Ye||(Ye={}));/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Ua=Symbol("SignalWatcherBrand"),qa=new FinalizationRegistry((({watcher:e,signal:t})=>{e.unwatch(t)})),Ei=new WeakMap;function Va(e){return e[Ua]===!0?(console.warn("SignalWatcher should not be applied to the same class more than once."),e):class extends e{constructor(){super(...arguments),this._$St=new Ye.State(0),this._$Si=!1,this._$So=!0,this._$Sh=new Set}_$Sl(){if(this._$Su!==void 0)return;this._$Sv=new Ye.Computed((()=>{this._$St.get(),super.performUpdate()}));const t=this._$Su=new Ye.subtle.Watcher((function(){const u=Ei.get(this);u!==void 0&&(u._$Si===!1&&u.requestUpdate(),this.watch())}));Ei.set(t,this),qa.register(this,{watcher:t,signal:this._$Sv}),t.watch(this._$Sv)}_$Sp(){this._$Su!==void 0&&(this._$Su.unwatch(this._$Sv),this._$Sv=void 0,this._$Su=void 0)}performUpdate(){this.isUpdatePending&&(this._$Sl(),this._$Si=!0,this._$St.set(this._$St.get()+1),this._$Si=!1,this._$Sv.get())}update(t){try{this._$So?(this._$So=!1,super.update(t)):this._$Sh.forEach((u=>u.commit()))}finally{this.isUpdatePending=!1,this._$Sh.clear()}}requestUpdate(t,u,r){this._$So=!0,super.requestUpdate(t,u,r)}connectedCallback(){super.connectedCallback(),this.requestUpdate()}disconnectedCallback(){super.disconnectedCallback(),queueMicrotask((()=>{this.isConnected===!1&&this._$Sp()}))}_(t){this._$Sh.add(t);const u=this._$So;this.requestUpdate(),this._$So=u}m(t){this._$Sh.delete(t)}}}/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */Ye.State;Ye.Computed;/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const yu=globalThis,ui=yu.ShadowRoot&&(yu.ShadyCSS===void 0||yu.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,ri=Symbol(),Di=new WeakMap;let ks=class{constructor(t,u,r){if(this._$cssResult$=!0,r!==ri)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=u}get styleSheet(){let t=this.o;const u=this.t;if(ui&&t===void 0){const r=u!==void 0&&u.length===1;r&&(t=Di.get(u)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),r&&Di.set(u,t))}return t}toString(){return this.cssText}};const $s=e=>new ks(typeof e=="string"?e:e+"",void 0,ri),Y=(e,...t)=>{const u=e.length===1?e[0]:t.reduce((r,i,s)=>r+(n=>{if(n._$cssResult$===!0)return n.cssText;if(typeof n=="number")return n;throw Error("Value passed to 'css' function must be a 'css' function result: "+n+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+e[s+1],e[0]);return new ks(u,e,ri)},Ha=(e,t)=>{if(ui)e.adoptedStyleSheets=t.map(u=>u instanceof CSSStyleSheet?u:u.styleSheet);else for(const u of t){const r=document.createElement("style"),i=yu.litNonce;i!==void 0&&r.setAttribute("nonce",i),r.textContent=u.cssText,e.appendChild(r)}},Ai=ui?e=>e:e=>e instanceof CSSStyleSheet?(t=>{let u="";for(const r of t.cssRules)u+=r.cssText;return $s(u)})(e):e;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:Wa,defineProperty:Ga,getOwnPropertyDescriptor:Za,getOwnPropertyNames:Ka,getOwnPropertySymbols:Ja,getPrototypeOf:Qa}=Object,qe=globalThis,Si=qe.trustedTypes,Ya=Si?Si.emptyScript:"",tr=qe.reactiveElementPolyfillSupport,qt=(e,t)=>e,Du={toAttribute(e,t){switch(t){case Boolean:e=e?Ya:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,t){let u=e;switch(t){case Boolean:u=e!==null;break;case Number:u=e===null?null:Number(e);break;case Object:case Array:try{u=JSON.parse(e)}catch{u=null}}return u}},ii=(e,t)=>!Wa(e,t),Fi={attribute:!0,type:String,converter:Du,reflect:!1,useDefault:!1,hasChanged:ii};Symbol.metadata??(Symbol.metadata=Symbol("metadata")),qe.litPropertyMetadata??(qe.litPropertyMetadata=new WeakMap);let nt=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??(this.l=[])).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,u=Fi){if(u.state&&(u.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((u=Object.create(u)).wrapped=!0),this.elementProperties.set(t,u),!u.noAccessor){const r=Symbol(),i=this.getPropertyDescriptor(t,r,u);i!==void 0&&Ga(this.prototype,t,i)}}static getPropertyDescriptor(t,u,r){const{get:i,set:s}=Za(this.prototype,t)??{get(){return this[u]},set(n){this[u]=n}};return{get:i,set(n){const a=i==null?void 0:i.call(this);s==null||s.call(this,n),this.requestUpdate(t,a,r)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??Fi}static _$Ei(){if(this.hasOwnProperty(qt("elementProperties")))return;const t=Qa(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(qt("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(qt("properties"))){const u=this.properties,r=[...Ka(u),...Ja(u)];for(const i of r)this.createProperty(i,u[i])}const t=this[Symbol.metadata];if(t!==null){const u=litPropertyMetadata.get(t);if(u!==void 0)for(const[r,i]of u)this.elementProperties.set(r,i)}this._$Eh=new Map;for(const[u,r]of this.elementProperties){const i=this._$Eu(u,r);i!==void 0&&this._$Eh.set(i,u)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const u=[];if(Array.isArray(t)){const r=new Set(t.flat(1/0).reverse());for(const i of r)u.unshift(Ai(i))}else t!==void 0&&u.push(Ai(t));return u}static _$Eu(t,u){const r=u.attribute;return r===!1?void 0:typeof r=="string"?r:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){var t;this._$ES=new Promise(u=>this.enableUpdating=u),this._$AL=new Map,this._$E_(),this.requestUpdate(),(t=this.constructor.l)==null||t.forEach(u=>u(this))}addController(t){var u;(this._$EO??(this._$EO=new Set)).add(t),this.renderRoot!==void 0&&this.isConnected&&((u=t.hostConnected)==null||u.call(t))}removeController(t){var u;(u=this._$EO)==null||u.delete(t)}_$E_(){const t=new Map,u=this.constructor.elementProperties;for(const r of u.keys())this.hasOwnProperty(r)&&(t.set(r,this[r]),delete this[r]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Ha(t,this.constructor.elementStyles),t}connectedCallback(){var t;this.renderRoot??(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),(t=this._$EO)==null||t.forEach(u=>{var r;return(r=u.hostConnected)==null?void 0:r.call(u)})}enableUpdating(t){}disconnectedCallback(){var t;(t=this._$EO)==null||t.forEach(u=>{var r;return(r=u.hostDisconnected)==null?void 0:r.call(u)})}attributeChangedCallback(t,u,r){this._$AK(t,r)}_$ET(t,u){var s;const r=this.constructor.elementProperties.get(t),i=this.constructor._$Eu(t,r);if(i!==void 0&&r.reflect===!0){const n=(((s=r.converter)==null?void 0:s.toAttribute)!==void 0?r.converter:Du).toAttribute(u,r.type);this._$Em=t,n==null?this.removeAttribute(i):this.setAttribute(i,n),this._$Em=null}}_$AK(t,u){var s,n;const r=this.constructor,i=r._$Eh.get(t);if(i!==void 0&&this._$Em!==i){const a=r.getPropertyOptions(i),c=typeof a.converter=="function"?{fromAttribute:a.converter}:((s=a.converter)==null?void 0:s.fromAttribute)!==void 0?a.converter:Du;this._$Em=i;const l=c.fromAttribute(u,a.type);this[i]=l??((n=this._$Ej)==null?void 0:n.get(i))??l,this._$Em=null}}requestUpdate(t,u,r,i=!1,s){var n;if(t!==void 0){const a=this.constructor;if(i===!1&&(s=this[t]),r??(r=a.getPropertyOptions(t)),!((r.hasChanged??ii)(s,u)||r.useDefault&&r.reflect&&s===((n=this._$Ej)==null?void 0:n.get(t))&&!this.hasAttribute(a._$Eu(t,r))))return;this.C(t,u,r)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,u,{useDefault:r,reflect:i,wrapped:s},n){r&&!(this._$Ej??(this._$Ej=new Map)).has(t)&&(this._$Ej.set(t,n??u??this[t]),s!==!0||n!==void 0)||(this._$AL.has(t)||(this.hasUpdated||r||(u=void 0),this._$AL.set(t,u)),i===!0&&this._$Em!==t&&(this._$Eq??(this._$Eq=new Set)).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(u){Promise.reject(u)}const t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var r;if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??(this.renderRoot=this.createRenderRoot()),this._$Ep){for(const[s,n]of this._$Ep)this[s]=n;this._$Ep=void 0}const i=this.constructor.elementProperties;if(i.size>0)for(const[s,n]of i){const{wrapped:a}=n,c=this[s];a!==!0||this._$AL.has(s)||c===void 0||this.C(s,void 0,n,c)}}let t=!1;const u=this._$AL;try{t=this.shouldUpdate(u),t?(this.willUpdate(u),(r=this._$EO)==null||r.forEach(i=>{var s;return(s=i.hostUpdate)==null?void 0:s.call(i)}),this.update(u)):this._$EM()}catch(i){throw t=!1,this._$EM(),i}t&&this._$AE(u)}willUpdate(t){}_$AE(t){var u;(u=this._$EO)==null||u.forEach(r=>{var i;return(i=r.hostUpdated)==null?void 0:i.call(r)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&(this._$Eq=this._$Eq.forEach(u=>this._$ET(u,this[u]))),this._$EM()}updated(t){}firstUpdated(t){}};nt.elementStyles=[],nt.shadowRootOptions={mode:"open"},nt[qt("elementProperties")]=new Map,nt[qt("finalized")]=new Map,tr==null||tr({ReactiveElement:nt}),(qe.reactiveElementVersions??(qe.reactiveElementVersions=[])).push("2.1.2");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Vt=globalThis,Ti=e=>e,Au=Vt.trustedTypes,Ii=Au?Au.createPolicy("lit-html",{createHTML:e=>e}):void 0,Es="$lit$",je=`lit$${Math.random().toFixed(9).slice(2)}$`,Ds="?"+je,Xa=`<${Ds}>`,et=document,Jt=()=>et.createComment(""),Qt=e=>e===null||typeof e!="object"&&typeof e!="function",si=Array.isArray,eo=e=>si(e)||typeof(e==null?void 0:e[Symbol.iterator])=="function",ur=`[ 	
\f\r]`,St=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Oi=/-->/g,zi=/>/g,Ge=RegExp(`>|${ur}(?:([^\\s"'>=/]+)(${ur}*=${ur}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Pi=/'/g,Ni=/"/g,As=/^(?:script|style|textarea|title)$/i,to=e=>(t,...u)=>({_$litType$:e,strings:t,values:u}),D=to(1),ve=Symbol.for("lit-noChange"),O=Symbol.for("lit-nothing"),Ri=new WeakMap,Qe=et.createTreeWalker(et,129);function Ss(e,t){if(!si(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return Ii!==void 0?Ii.createHTML(t):t}const uo=(e,t)=>{const u=e.length-1,r=[];let i,s=t===2?"<svg>":t===3?"<math>":"",n=St;for(let a=0;a<u;a++){const c=e[a];let l,d,o=-1,p=0;for(;p<c.length&&(n.lastIndex=p,d=n.exec(c),d!==null);)p=n.lastIndex,n===St?d[1]==="!--"?n=Oi:d[1]!==void 0?n=zi:d[2]!==void 0?(As.test(d[2])&&(i=RegExp("</"+d[2],"g")),n=Ge):d[3]!==void 0&&(n=Ge):n===Ge?d[0]===">"?(n=i??St,o=-1):d[1]===void 0?o=-2:(o=n.lastIndex-d[2].length,l=d[1],n=d[3]===void 0?Ge:d[3]==='"'?Ni:Pi):n===Ni||n===Pi?n=Ge:n===Oi||n===zi?n=St:(n=Ge,i=void 0);const h=n===Ge&&e[a+1].startsWith("/>")?" ":"";s+=n===St?c+Xa:o>=0?(r.push(l),c.slice(0,o)+Es+c.slice(o)+je+h):c+je+(o===-2?a:h)}return[Ss(e,s+(e[u]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),r]};class Yt{constructor({strings:t,_$litType$:u},r){let i;this.parts=[];let s=0,n=0;const a=t.length-1,c=this.parts,[l,d]=uo(t,u);if(this.el=Yt.createElement(l,r),Qe.currentNode=this.el.content,u===2||u===3){const o=this.el.content.firstChild;o.replaceWith(...o.childNodes)}for(;(i=Qe.nextNode())!==null&&c.length<a;){if(i.nodeType===1){if(i.hasAttributes())for(const o of i.getAttributeNames())if(o.endsWith(Es)){const p=d[n++],h=i.getAttribute(o).split(je),f=/([.?@])?(.*)/.exec(p);c.push({type:1,index:s,name:f[2],strings:h,ctor:f[1]==="."?io:f[1]==="?"?so:f[1]==="@"?no:Bu}),i.removeAttribute(o)}else o.startsWith(je)&&(c.push({type:6,index:s}),i.removeAttribute(o));if(As.test(i.tagName)){const o=i.textContent.split(je),p=o.length-1;if(p>0){i.textContent=Au?Au.emptyScript:"";for(let h=0;h<p;h++)i.append(o[h],Jt()),Qe.nextNode(),c.push({type:2,index:++s});i.append(o[p],Jt())}}}else if(i.nodeType===8)if(i.data===Ds)c.push({type:2,index:s});else{let o=-1;for(;(o=i.data.indexOf(je,o+1))!==-1;)c.push({type:7,index:s}),o+=je.length-1}s++}}static createElement(t,u){const r=et.createElement("template");return r.innerHTML=t,r}}function _t(e,t,u=e,r){var n,a;if(t===ve)return t;let i=r!==void 0?(n=u._$Co)==null?void 0:n[r]:u._$Cl;const s=Qt(t)?void 0:t._$litDirective$;return(i==null?void 0:i.constructor)!==s&&((a=i==null?void 0:i._$AO)==null||a.call(i,!1),s===void 0?i=void 0:(i=new s(e),i._$AT(e,u,r)),r!==void 0?(u._$Co??(u._$Co=[]))[r]=i:u._$Cl=i),i!==void 0&&(t=_t(e,i._$AS(e,t.values),i,r)),t}class ro{constructor(t,u){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=u}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:u},parts:r}=this._$AD,i=((t==null?void 0:t.creationScope)??et).importNode(u,!0);Qe.currentNode=i;let s=Qe.nextNode(),n=0,a=0,c=r[0];for(;c!==void 0;){if(n===c.index){let l;c.type===2?l=new wt(s,s.nextSibling,this,t):c.type===1?l=new c.ctor(s,c.name,c.strings,this,t):c.type===6&&(l=new ao(s,this,t)),this._$AV.push(l),c=r[++a]}n!==(c==null?void 0:c.index)&&(s=Qe.nextNode(),n++)}return Qe.currentNode=et,i}p(t){let u=0;for(const r of this._$AV)r!==void 0&&(r.strings!==void 0?(r._$AI(t,r,u),u+=r.strings.length-2):r._$AI(t[u])),u++}}class wt{get _$AU(){var t;return((t=this._$AM)==null?void 0:t._$AU)??this._$Cv}constructor(t,u,r,i){this.type=2,this._$AH=O,this._$AN=void 0,this._$AA=t,this._$AB=u,this._$AM=r,this.options=i,this._$Cv=(i==null?void 0:i.isConnected)??!0}get parentNode(){let t=this._$AA.parentNode;const u=this._$AM;return u!==void 0&&(t==null?void 0:t.nodeType)===11&&(t=u.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,u=this){t=_t(this,t,u),Qt(t)?t===O||t==null||t===""?(this._$AH!==O&&this._$AR(),this._$AH=O):t!==this._$AH&&t!==ve&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):eo(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==O&&Qt(this._$AH)?this._$AA.nextSibling.data=t:this.T(et.createTextNode(t)),this._$AH=t}$(t){var s;const{values:u,_$litType$:r}=t,i=typeof r=="number"?this._$AC(t):(r.el===void 0&&(r.el=Yt.createElement(Ss(r.h,r.h[0]),this.options)),r);if(((s=this._$AH)==null?void 0:s._$AD)===i)this._$AH.p(u);else{const n=new ro(i,this),a=n.u(this.options);n.p(u),this.T(a),this._$AH=n}}_$AC(t){let u=Ri.get(t.strings);return u===void 0&&Ri.set(t.strings,u=new Yt(t)),u}k(t){si(this._$AH)||(this._$AH=[],this._$AR());const u=this._$AH;let r,i=0;for(const s of t)i===u.length?u.push(r=new wt(this.O(Jt()),this.O(Jt()),this,this.options)):r=u[i],r._$AI(s),i++;i<u.length&&(this._$AR(r&&r._$AB.nextSibling,i),u.length=i)}_$AR(t=this._$AA.nextSibling,u){var r;for((r=this._$AP)==null?void 0:r.call(this,!1,!0,u);t!==this._$AB;){const i=Ti(t).nextSibling;Ti(t).remove(),t=i}}setConnected(t){var u;this._$AM===void 0&&(this._$Cv=t,(u=this._$AP)==null||u.call(this,t))}}class Bu{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,u,r,i,s){this.type=1,this._$AH=O,this._$AN=void 0,this.element=t,this.name=u,this._$AM=i,this.options=s,r.length>2||r[0]!==""||r[1]!==""?(this._$AH=Array(r.length-1).fill(new String),this.strings=r):this._$AH=O}_$AI(t,u=this,r,i){const s=this.strings;let n=!1;if(s===void 0)t=_t(this,t,u,0),n=!Qt(t)||t!==this._$AH&&t!==ve,n&&(this._$AH=t);else{const a=t;let c,l;for(t=s[0],c=0;c<s.length-1;c++)l=_t(this,a[r+c],u,c),l===ve&&(l=this._$AH[c]),n||(n=!Qt(l)||l!==this._$AH[c]),l===O?t=O:t!==O&&(t+=(l??"")+s[c+1]),this._$AH[c]=l}n&&!i&&this.j(t)}j(t){t===O?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class io extends Bu{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===O?void 0:t}}class so extends Bu{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==O)}}class no extends Bu{constructor(t,u,r,i,s){super(t,u,r,i,s),this.type=5}_$AI(t,u=this){if((t=_t(this,t,u,0)??O)===ve)return;const r=this._$AH,i=t===O&&r!==O||t.capture!==r.capture||t.once!==r.once||t.passive!==r.passive,s=t!==O&&(r===O||i);i&&this.element.removeEventListener(this.name,this,r),s&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){var u;typeof this._$AH=="function"?this._$AH.call(((u=this.options)==null?void 0:u.host)??this.element,t):this._$AH.handleEvent(t)}}let ao=class{constructor(t,u,r){this.element=t,this.type=6,this._$AN=void 0,this._$AM=u,this.options=r}get _$AU(){return this._$AM._$AU}_$AI(t){_t(this,t)}};const oo={I:wt},rr=Vt.litHtmlPolyfillSupport;rr==null||rr(Yt,wt),(Vt.litHtmlVersions??(Vt.litHtmlVersions=[])).push("3.3.2");const ni=(e,t,u)=>{const r=(u==null?void 0:u.renderBefore)??t;let i=r._$litPart$;if(i===void 0){const s=(u==null?void 0:u.renderBefore)??null;r._$litPart$=i=new wt(t.insertBefore(Jt(),s),s,void 0,u??{})}return i._$AI(e),i};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Xe=globalThis;let Ht=class extends nt{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var u;const t=super.createRenderRoot();return(u=this.renderOptions).renderBefore??(u.renderBefore=t.firstChild),t}update(t){const u=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=ni(u,this.renderRoot,this.renderOptions)}connectedCallback(){var t;super.connectedCallback(),(t=this._$Do)==null||t.setConnected(!0)}disconnectedCallback(){var t;super.disconnectedCallback(),(t=this._$Do)==null||t.setConnected(!1)}render(){return ve}};var gs;Ht._$litElement$=!0,Ht.finalized=!0,(gs=Xe.litElementHydrateSupport)==null||gs.call(Xe,{LitElement:Ht});const ir=Xe.litElementPolyfillSupport;ir==null||ir({LitElement:Ht});(Xe.litElementVersions??(Xe.litElementVersions=[])).push("4.2.2");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const X=e=>(t,u)=>{u!==void 0?u.addInitializer(()=>{customElements.define(e,t)}):customElements.define(e,t)};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const co={attribute:!0,type:String,converter:Du,reflect:!1,hasChanged:ii},lo=(e=co,t,u)=>{const{kind:r,metadata:i}=u;let s=globalThis.litPropertyMetadata.get(i);if(s===void 0&&globalThis.litPropertyMetadata.set(i,s=new Map),r==="setter"&&((e=Object.create(e)).wrapped=!0),s.set(u.name,e),r==="accessor"){const{name:n}=u;return{set(a){const c=t.get.call(this);t.set.call(this,a),this.requestUpdate(n,c,e,!0,a)},init(a){return a!==void 0&&this.C(n,void 0,e,a),a}}}if(r==="setter"){const{name:n}=u;return function(a){const c=this[n];t.call(this,a),this.requestUpdate(n,c,e,!0,a)}}throw Error("Unsupported decorator location: "+r)};function L(e){return(t,u)=>typeof u=="object"?lo(e,t,u):((r,i,s)=>{const n=i.hasOwnProperty(s);return i.constructor.createProperty(s,r),n?Object.getOwnPropertyDescriptor(i,s):void 0})(e,t,u)}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function Pr(e){return L({...e,state:!0,attribute:!1})}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const fo=(e,t,u)=>(u.configurable=!0,u.enumerable=!0,Reflect.decorate&&typeof t!="object"&&Object.defineProperty(e,t,u),u);/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function ho(e,t){return(u,r,i)=>{const s=n=>{var a;return((a=n.renderRoot)==null?void 0:a.querySelector(e))??null};return fo(u,r,{get(){return s(this)}})}}var po=Object.defineProperty,bo=(e,t,u)=>t in e?po(e,t,{enumerable:!0,configurable:!0,writable:!0,value:u}):e[t]=u,sr=(e,t,u)=>(bo(e,typeof t!="symbol"?t+"":t,u),u),mo=(e,t,u)=>{if(!t.has(e))throw TypeError("Cannot "+u)},nr=(e,t)=>{if(Object(t)!==t)throw TypeError('Cannot use the "in" operator on this value');return e.has(t)},hu=(e,t,u)=>{if(t.has(e))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(e):t.set(e,u)},Mi=(e,t,u)=>(mo(e,t,"access private method"),u);/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */function Fs(e,t){return Object.is(e,t)}/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */let Q=null,Wt=!1,xu=1;const Su=Symbol("SIGNAL");function ct(e){const t=Q;return Q=e,t}function _o(){return Q}function go(){return Wt}const ai={version:0,lastCleanEpoch:0,dirty:!1,producerNode:void 0,producerLastReadVersion:void 0,producerIndexOfThis:void 0,nextProducerIndex:0,liveConsumerNode:void 0,liveConsumerIndexOfThis:void 0,consumerAllowSignalWrites:!1,consumerIsAlwaysLive:!1,producerMustRecompute:()=>!1,producerRecomputeValue:()=>{},consumerMarkedDirty:()=>{},consumerOnSignalRead:()=>{}};function Lu(e){if(Wt)throw new Error(typeof ngDevMode<"u"&&ngDevMode?"Assertion error: signal read during notification phase":"");if(Q===null)return;Q.consumerOnSignalRead(e);const t=Q.nextProducerIndex++;if(gt(Q),t<Q.producerNode.length&&Q.producerNode[t]!==e&&Nr(Q)){const u=Q.producerNode[t];Uu(u,Q.producerIndexOfThis[t])}Q.producerNode[t]!==e&&(Q.producerNode[t]=e,Q.producerIndexOfThis[t]=Nr(Q)?Os(e,Q,t):0),Q.producerLastReadVersion[t]=e.version}function yo(){xu++}function Ts(e){if(!(!e.dirty&&e.lastCleanEpoch===xu)){if(!e.producerMustRecompute(e)&&!ko(e)){e.dirty=!1,e.lastCleanEpoch=xu;return}e.producerRecomputeValue(e),e.dirty=!1,e.lastCleanEpoch=xu}}function Is(e){if(e.liveConsumerNode===void 0)return;const t=Wt;Wt=!0;try{for(const u of e.liveConsumerNode)u.dirty||vo(u)}finally{Wt=t}}function xo(){return(Q==null?void 0:Q.consumerAllowSignalWrites)!==!1}function vo(e){var t;e.dirty=!0,Is(e),(t=e.consumerMarkedDirty)==null||t.call(e.wrapper??e)}function Co(e){return e&&(e.nextProducerIndex=0),ct(e)}function wo(e,t){if(ct(t),!(!e||e.producerNode===void 0||e.producerIndexOfThis===void 0||e.producerLastReadVersion===void 0)){if(Nr(e))for(let u=e.nextProducerIndex;u<e.producerNode.length;u++)Uu(e.producerNode[u],e.producerIndexOfThis[u]);for(;e.producerNode.length>e.nextProducerIndex;)e.producerNode.pop(),e.producerLastReadVersion.pop(),e.producerIndexOfThis.pop()}}function ko(e){gt(e);for(let t=0;t<e.producerNode.length;t++){const u=e.producerNode[t],r=e.producerLastReadVersion[t];if(r!==u.version||(Ts(u),r!==u.version))return!0}return!1}function Os(e,t,u){var r;if(oi(e),gt(e),e.liveConsumerNode.length===0){(r=e.watched)==null||r.call(e.wrapper);for(let i=0;i<e.producerNode.length;i++)e.producerIndexOfThis[i]=Os(e.producerNode[i],e,i)}return e.liveConsumerIndexOfThis.push(u),e.liveConsumerNode.push(t)-1}function Uu(e,t){var u;if(oi(e),gt(e),typeof ngDevMode<"u"&&ngDevMode&&t>=e.liveConsumerNode.length)throw new Error(`Assertion error: active consumer index ${t} is out of bounds of ${e.liveConsumerNode.length} consumers)`);if(e.liveConsumerNode.length===1){(u=e.unwatched)==null||u.call(e.wrapper);for(let i=0;i<e.producerNode.length;i++)Uu(e.producerNode[i],e.producerIndexOfThis[i])}const r=e.liveConsumerNode.length-1;if(e.liveConsumerNode[t]=e.liveConsumerNode[r],e.liveConsumerIndexOfThis[t]=e.liveConsumerIndexOfThis[r],e.liveConsumerNode.length--,e.liveConsumerIndexOfThis.length--,t<e.liveConsumerNode.length){const i=e.liveConsumerIndexOfThis[t],s=e.liveConsumerNode[t];gt(s),s.producerIndexOfThis[i]=t}}function Nr(e){var t;return e.consumerIsAlwaysLive||(((t=e==null?void 0:e.liveConsumerNode)==null?void 0:t.length)??0)>0}function gt(e){e.producerNode??(e.producerNode=[]),e.producerIndexOfThis??(e.producerIndexOfThis=[]),e.producerLastReadVersion??(e.producerLastReadVersion=[])}function oi(e){e.liveConsumerNode??(e.liveConsumerNode=[]),e.liveConsumerIndexOfThis??(e.liveConsumerIndexOfThis=[])}/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */function zs(e){if(Ts(e),Lu(e),e.value===Rr)throw e.error;return e.value}function $o(e){const t=Object.create(Eo);t.computation=e;const u=()=>zs(t);return u[Su]=t,u}const ar=Symbol("UNSET"),or=Symbol("COMPUTING"),Rr=Symbol("ERRORED"),Eo={...ai,value:ar,dirty:!0,error:null,equal:Fs,producerMustRecompute(e){return e.value===ar||e.value===or},producerRecomputeValue(e){if(e.value===or)throw new Error("Detected cycle in computations.");const t=e.value;e.value=or;const u=Co(e);let r,i=!1;try{r=e.computation.call(e.wrapper),i=t!==ar&&t!==Rr&&e.equal.call(e.wrapper,t,r)}catch(s){r=Rr,e.error=s}finally{wo(e,u)}if(i){e.value=t;return}e.value=r,e.version++}};/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */function Do(){throw new Error}let Ao=Do;function So(){Ao()}/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */function Fo(e){const t=Object.create(Oo);t.value=e;const u=()=>(Lu(t),t.value);return u[Su]=t,u}function To(){return Lu(this),this.value}function Io(e,t){xo()||So(),e.equal.call(e.wrapper,e.value,t)||(e.value=t,zo(e))}const Oo={...ai,equal:Fs,value:void 0};function zo(e){e.version++,yo(),Is(e)}/**
 * @license
 * Copyright 2024 Bloomberg Finance L.P.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const le=Symbol("node");var De;(e=>{var t,u,r,i;class s{constructor(c,l={}){hu(this,u),sr(this,t);const o=Fo(c)[Su];if(this[le]=o,o.wrapper=this,l){const p=l.equals;p&&(o.equal=p),o.watched=l[e.subtle.watched],o.unwatched=l[e.subtle.unwatched]}}get(){if(!(0,e.isState)(this))throw new TypeError("Wrong receiver type for Signal.State.prototype.get");return To.call(this[le])}set(c){if(!(0,e.isState)(this))throw new TypeError("Wrong receiver type for Signal.State.prototype.set");if(go())throw new Error("Writes to signals not permitted during Watcher callback");const l=this[le];Io(l,c)}}t=le,u=new WeakSet,e.isState=a=>typeof a=="object"&&nr(u,a),e.State=s;class n{constructor(c,l){hu(this,i),sr(this,r);const o=$o(c)[Su];if(o.consumerAllowSignalWrites=!0,this[le]=o,o.wrapper=this,l){const p=l.equals;p&&(o.equal=p),o.watched=l[e.subtle.watched],o.unwatched=l[e.subtle.unwatched]}}get(){if(!(0,e.isComputed)(this))throw new TypeError("Wrong receiver type for Signal.Computed.prototype.get");return zs(this[le])}}r=le,i=new WeakSet,e.isComputed=a=>typeof a=="object"&&nr(i,a),e.Computed=n,(a=>{var c,l,d,o;function p(v){let y,g=null;try{g=ct(null),y=v()}finally{ct(g)}return y}a.untrack=p;function h(v){var y;if(!(0,e.isComputed)(v)&&!(0,e.isWatcher)(v))throw new TypeError("Called introspectSources without a Computed or Watcher argument");return((y=v[le].producerNode)==null?void 0:y.map(g=>g.wrapper))??[]}a.introspectSources=h;function f(v){var y;if(!(0,e.isComputed)(v)&&!(0,e.isState)(v))throw new TypeError("Called introspectSinks without a Signal argument");return((y=v[le].liveConsumerNode)==null?void 0:y.map(g=>g.wrapper))??[]}a.introspectSinks=f;function m(v){if(!(0,e.isComputed)(v)&&!(0,e.isState)(v))throw new TypeError("Called hasSinks without a Signal argument");const y=v[le].liveConsumerNode;return y?y.length>0:!1}a.hasSinks=m;function b(v){if(!(0,e.isComputed)(v)&&!(0,e.isWatcher)(v))throw new TypeError("Called hasSources without a Computed or Watcher argument");const y=v[le].producerNode;return y?y.length>0:!1}a.hasSources=b;class _{constructor(y){hu(this,l),hu(this,d),sr(this,c);let g=Object.create(ai);g.wrapper=this,g.consumerMarkedDirty=y,g.consumerIsAlwaysLive=!0,g.consumerAllowSignalWrites=!1,g.producerNode=[],this[le]=g}watch(...y){if(!(0,e.isWatcher)(this))throw new TypeError("Called unwatch without Watcher receiver");Mi(this,d,o).call(this,y);const g=this[le];g.dirty=!1;const w=ct(g);for(const z of y)Lu(z[le]);ct(w)}unwatch(...y){if(!(0,e.isWatcher)(this))throw new TypeError("Called unwatch without Watcher receiver");Mi(this,d,o).call(this,y);const g=this[le];gt(g);for(let w=g.producerNode.length-1;w>=0;w--)if(y.includes(g.producerNode[w].wrapper)){Uu(g.producerNode[w],g.producerIndexOfThis[w]);const z=g.producerNode.length-1;if(g.producerNode[w]=g.producerNode[z],g.producerIndexOfThis[w]=g.producerIndexOfThis[z],g.producerNode.length--,g.producerIndexOfThis.length--,g.nextProducerIndex--,w<g.producerNode.length){const P=g.producerIndexOfThis[w],M=g.producerNode[w];oi(M),M.liveConsumerIndexOfThis[P]=w}}}getPending(){if(!(0,e.isWatcher)(this))throw new TypeError("Called getPending without Watcher receiver");return this[le].producerNode.filter(g=>g.dirty).map(g=>g.wrapper)}}c=le,l=new WeakSet,d=new WeakSet,o=function(v){for(const y of v)if(!(0,e.isComputed)(y)&&!(0,e.isState)(y))throw new TypeError("Called watch/unwatch without a Computed or State argument")},e.isWatcher=v=>nr(l,v),a.Watcher=_;function k(){var v;return(v=_o())==null?void 0:v.wrapper}a.currentComputed=k,a.watched=Symbol("watched"),a.unwatched=Symbol("unwatched")})(e.subtle||(e.subtle={}))})(De||(De={}));/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Po=Symbol("SignalWatcherBrand"),No=new FinalizationRegistry((({watcher:e,signal:t})=>{e.unwatch(t)})),ji=new WeakMap;function Ro(e){return e[Po]===!0?(console.warn("SignalWatcher should not be applied to the same class more than once."),e):class extends e{constructor(){super(...arguments),this._$St=new De.State(0),this._$Si=!1,this._$So=!0,this._$Sh=new Set}_$Sl(){if(this._$Su!==void 0)return;this._$Sv=new De.Computed((()=>{this._$St.get(),super.performUpdate()}));const t=this._$Su=new De.subtle.Watcher((function(){const u=ji.get(this);u!==void 0&&(u._$Si===!1&&u.requestUpdate(),this.watch())}));ji.set(t,this),No.register(this,{watcher:t,signal:this._$Sv}),t.watch(this._$Sv)}_$Sp(){this._$Su!==void 0&&(this._$Su.unwatch(this._$Sv),this._$Sv=void 0,this._$Su=void 0)}performUpdate(){this.isUpdatePending&&(this._$Sl(),this._$Si=!0,this._$St.set(this._$St.get()+1),this._$Si=!1,this._$Sv.get())}update(t){try{this._$So?(this._$So=!1,super.update(t)):this._$Sh.forEach((u=>u.commit()))}finally{this.isUpdatePending=!1,this._$Sh.clear()}}requestUpdate(t,u,r){this._$So=!0,super.requestUpdate(t,u,r)}connectedCallback(){super.connectedCallback(),this.requestUpdate()}disconnectedCallback(){super.disconnectedCallback(),queueMicrotask((()=>{this.isConnected===!1&&this._$Sp()}))}_(t){this._$Sh.add(t);const u=this._$So;this.requestUpdate(),this._$So=u}m(t){this._$Sh.delete(t)}}}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const au={ATTRIBUTE:1,CHILD:2},kt=e=>(...t)=>({_$litDirective$:e,values:t});let $t=class{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,u,r){this._$Ct=t,this._$AM=u,this._$Ci=r}_$AS(t,u){return this.update(t,u)}update(t,u){return this.render(...u)}};/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{I:Mo}=oo,Bi=e=>e,jo=e=>e.strings===void 0,Li=()=>document.createComment(""),Ft=(e,t,u)=>{var s;const r=e._$AA.parentNode,i=t===void 0?e._$AB:t._$AA;if(u===void 0){const n=r.insertBefore(Li(),i),a=r.insertBefore(Li(),i);u=new Mo(n,a,e,e.options)}else{const n=u._$AB.nextSibling,a=u._$AM,c=a!==e;if(c){let l;(s=u._$AQ)==null||s.call(u,e),u._$AM=e,u._$AP!==void 0&&(l=e._$AU)!==a._$AU&&u._$AP(l)}if(n!==i||c){let l=u._$AA;for(;l!==n;){const d=Bi(l).nextSibling;Bi(r).insertBefore(l,i),l=d}}}return u},Ze=(e,t,u=e)=>(e._$AI(t,u),e),Bo={},Lo=(e,t=Bo)=>e._$AH=t,Uo=e=>e._$AH,cr=e=>{e._$AR(),e._$AA.remove()};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Gt=(e,t)=>{var r;const u=e._$AN;if(u===void 0)return!1;for(const i of u)(r=i._$AO)==null||r.call(i,t,!1),Gt(i,t);return!0},Fu=e=>{let t,u;do{if((t=e._$AM)===void 0)break;u=t._$AN,u.delete(e),e=t}while((u==null?void 0:u.size)===0)},Ps=e=>{for(let t;t=e._$AM;e=t){let u=t._$AN;if(u===void 0)t._$AN=u=new Set;else if(u.has(e))break;u.add(e),Ho(t)}};function qo(e){this._$AN!==void 0?(Fu(this),this._$AM=e,Ps(this)):this._$AM=e}function Vo(e,t=!1,u=0){const r=this._$AH,i=this._$AN;if(i!==void 0&&i.size!==0)if(t)if(Array.isArray(r))for(let s=u;s<r.length;s++)Gt(r[s],!1),Fu(r[s]);else r!=null&&(Gt(r,!1),Fu(r));else Gt(this,e)}const Ho=e=>{e.type==au.CHILD&&(e._$AP??(e._$AP=Vo),e._$AQ??(e._$AQ=qo))};class Wo extends $t{constructor(){super(...arguments),this._$AN=void 0}_$AT(t,u,r){super._$AT(t,u,r),Ps(this),this.isConnected=t._$AU}_$AO(t,u=!0){var r,i;t!==this.isConnected&&(this.isConnected=t,t?(r=this.reconnected)==null||r.call(this):(i=this.disconnected)==null||i.call(this)),u&&(Gt(this,t),Fu(this))}setValue(t){if(jo(this._$Ct))this._$Ct._$AI(t,this);else{const u=[...this._$Ct._$AH];u[this._$Ci]=t,this._$Ct._$AI(u,this,0)}}disconnected(){}reconnected(){}}/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */De.State;De.Computed;/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */let Go=class extends Event{constructor(t,u,r,i){super("context-request",{bubbles:!0,composed:!0}),this.context=t,this.contextTarget=u,this.callback=r,this.subscribe=i??!1}};/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 *//**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class Ui{constructor(t,u,r,i){if(this.subscribe=!1,this.provided=!1,this.value=void 0,this.t=(s,n)=>{this.unsubscribe&&(this.unsubscribe!==n&&(this.provided=!1,this.unsubscribe()),this.subscribe||this.unsubscribe()),this.value=s,this.host.requestUpdate(),this.provided&&!this.subscribe||(this.provided=!0,this.callback&&this.callback(s,n)),this.unsubscribe=n},this.host=t,u.context!==void 0){const s=u;this.context=s.context,this.callback=s.callback,this.subscribe=s.subscribe??!1}else this.context=u,this.callback=r,this.subscribe=i??!1;this.host.addController(this)}hostConnected(){this.dispatchRequest()}hostDisconnected(){this.unsubscribe&&(this.unsubscribe(),this.unsubscribe=void 0)}dispatchRequest(){this.host.dispatchEvent(new Go(this.context,this.host,this.t,this.subscribe))}}/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function Zo({context:e,subscribe:t}){return(u,r)=>{typeof r=="object"?r.addInitializer((function(){new Ui(this,{context:e,callback:i=>{u.set.call(this,i)},subscribe:t})})):u.constructor.addInitializer((i=>{new Ui(i,{context:e,callback:s=>{i[r]=s},subscribe:t})}))}}/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function*Ko(e,t){if(e!==void 0){let u=0;for(const r of e)yield t(r,u++)}}let lr=!1,Tu=new De.subtle.Watcher(()=>{lr||(lr=!0,queueMicrotask(()=>{lr=!1,Jo()}))});function Jo(){for(const e of Tu.getPending())e.get();Tu.watch()}function Qo(e){let t=new De.Computed(()=>e());return Tu.watch(t),t.get(),()=>{Tu.unwatch(t)}}const Ns="A2UITheme",Yo=`
  &:not([disabled]) {
    cursor: pointer;
    opacity: var(--opacity, 0);
    transition: opacity var(--speed, 0.2s) cubic-bezier(0, 0, 0.3, 1);

    &:hover,
    &:focus {
      opacity: 1;
    }
  }`,Xo=`
  ${new Array(21).fill(0).map((e,t)=>`.behavior-ho-${t*5} {
          --opacity: ${t/20};
          ${Yo}
        }`).join(`
`)}

  .behavior-o-s {
    overflow: scroll;
  }

  .behavior-o-a {
    overflow: auto;
  }

  .behavior-o-h {
    overflow: hidden;
  }

  .behavior-sw-n {
    scrollbar-width: none;
  }
`,ue=4,ec=`
  ${new Array(25).fill(0).map((e,t)=>`
        .border-bw-${t} { border-width: ${t}px; }
        .border-btw-${t} { border-top-width: ${t}px; }
        .border-bbw-${t} { border-bottom-width: ${t}px; }
        .border-blw-${t} { border-left-width: ${t}px; }
        .border-brw-${t} { border-right-width: ${t}px; }

        .border-ow-${t} { outline-width: ${t}px; }
        .border-br-${t} { border-radius: ${t*ue}px; overflow: hidden;}`).join(`
`)}

  .border-br-50pc {
    border-radius: 50%;
  }

  .border-bs-s {
    border-style: solid;
  }
`,Rs=[0,5,10,15,20,25,30,35,40,50,60,70,80,90,95,98,99,100];function ci(...e){const t={};for(const u of e)for(const[r,i]of Object.entries(u)){const s=r.split("-").with(-1,"").join("-"),n=Object.keys(t).filter(a=>a.startsWith(s));for(const a of n)delete t[a];t[r]=i}return t}function tc(e,t,...u){const r=structuredClone(e);for(const i of u)for(const s of Object.keys(i)){const n=s.split("-").with(-1,"").join("-");for(const[a,c]of Object.entries(r)){if(t.includes(a))continue;let l=!1;for(let d=0;d<c.length;d++)c[d].startsWith(n)&&(l=!0,c[d]=s);l||c.push(s)}}return r}function ke(e){return e.startsWith("nv")?`--nv-${e.slice(2)}`:`--${e[0]}-${e.slice(1)}`}const ut=e=>`
    ${e.map(t=>{const u=dr(t);return`.color-bc-${t} { border-color: light-dark(var(${ke(t)}), var(${ke(u)})); }`}).join(`
`)}

    ${e.map(t=>{const u=dr(t),r=[`.color-bgc-${t} { background-color: light-dark(var(${ke(t)}), var(${ke(u)})); }`,`.color-bbgc-${t}::backdrop { background-color: light-dark(var(${ke(t)}), var(${ke(u)})); }`];for(let i=.1;i<1;i+=.1)r.push(`.color-bbgc-${t}_${(i*100).toFixed(0)}::backdrop {
            background-color: light-dark(oklch(from var(${ke(t)}) l c h / calc(alpha * ${i.toFixed(1)})), oklch(from var(${ke(u)}) l c h / calc(alpha * ${i.toFixed(1)})) );
          }
        `);return r.join(`
`)}).join(`
`)}

  ${e.map(t=>{const u=dr(t);return`.color-c-${t} { color: light-dark(var(${ke(t)}), var(${ke(u)})); }`}).join(`
`)}
  `,dr=e=>{const t=e.match(/^([a-z]+)(\d+)$/);if(!t)return e;const[,u,r]=t,s=100-parseInt(r,10),n=Rs.reduce((a,c)=>Math.abs(c-s)<Math.abs(a-s)?c:a);return`${u}${n}`},rt=e=>Rs.map(t=>`${e}${t}`),uc=[ut(rt("p")),ut(rt("s")),ut(rt("t")),ut(rt("n")),ut(rt("nv")),ut(rt("e")),`
    .color-bgc-transparent {
      background-color: transparent;
    }

    :host {
      color-scheme: var(--color-scheme);
    }
  `],rc=`
  .g-icon {
    font-family: "Material Symbols Outlined", "Google Symbols";
    font-weight: normal;
    font-style: normal;
    font-display: optional;
    font-size: 20px;
    width: 1em;
    height: 1em;
    user-select: none;
    line-height: 1;
    letter-spacing: normal;
    text-transform: none;
    display: inline-block;
    white-space: nowrap;
    word-wrap: normal;
    direction: ltr;
    -webkit-font-feature-settings: "liga";
    -webkit-font-smoothing: antialiased;
    overflow: hidden;

    font-variation-settings: "FILL" 0, "wght" 300, "GRAD" 0, "opsz" 48,
      "ROND" 100;

    &.filled {
      font-variation-settings: "FILL" 1, "wght" 300, "GRAD" 0, "opsz" 48,
        "ROND" 100;
    }

    &.filled-heavy {
      font-variation-settings: "FILL" 1, "wght" 700, "GRAD" 0, "opsz" 48,
        "ROND" 100;
    }
  }
`,ic=`
  :host {
    ${new Array(16).fill(0).map((e,t)=>`--g-${t+1}: ${(t+1)*ue}px;`).join(`
`)}
  }

  ${new Array(49).fill(0).map((e,t)=>{const u=t-24,r=u<0?`n${Math.abs(u)}`:u.toString();return`
        .layout-p-${r} { --padding: ${u*ue}px; padding: var(--padding); }
        .layout-pt-${r} { padding-top: ${u*ue}px; }
        .layout-pr-${r} { padding-right: ${u*ue}px; }
        .layout-pb-${r} { padding-bottom: ${u*ue}px; }
        .layout-pl-${r} { padding-left: ${u*ue}px; }

        .layout-m-${r} { --margin: ${u*ue}px; margin: var(--margin); }
        .layout-mt-${r} { margin-top: ${u*ue}px; }
        .layout-mr-${r} { margin-right: ${u*ue}px; }
        .layout-mb-${r} { margin-bottom: ${u*ue}px; }
        .layout-ml-${r} { margin-left: ${u*ue}px; }

        .layout-t-${r} { top: ${u*ue}px; }
        .layout-r-${r} { right: ${u*ue}px; }
        .layout-b-${r} { bottom: ${u*ue}px; }
        .layout-l-${r} { left: ${u*ue}px; }`}).join(`
`)}

  ${new Array(25).fill(0).map((e,t)=>`
        .layout-g-${t} { gap: ${t*ue}px; }`).join(`
`)}

  ${new Array(8).fill(0).map((e,t)=>`
        .layout-grd-col${t+1} { grid-template-columns: ${"1fr ".repeat(t+1).trim()}; }`).join(`
`)}

  .layout-pos-a {
    position: absolute;
  }

  .layout-pos-rel {
    position: relative;
  }

  .layout-dsp-none {
    display: none;
  }

  .layout-dsp-block {
    display: block;
  }

  .layout-dsp-grid {
    display: grid;
  }

  .layout-dsp-iflex {
    display: inline-flex;
  }

  .layout-dsp-flexvert {
    display: flex;
    flex-direction: column;
  }

  .layout-dsp-flexhor {
    display: flex;
    flex-direction: row;
  }

  .layout-fw-w {
    flex-wrap: wrap;
  }

  .layout-al-fs {
    align-items: start;
  }

  .layout-al-fe {
    align-items: end;
  }

  .layout-al-c {
    align-items: center;
  }

  .layout-as-n {
    align-self: normal;
  }

  .layout-js-c {
    justify-self: center;
  }

  .layout-sp-c {
    justify-content: center;
  }

  .layout-sp-ev {
    justify-content: space-evenly;
  }

  .layout-sp-bt {
    justify-content: space-between;
  }

  .layout-sp-s {
    justify-content: start;
  }

  .layout-sp-e {
    justify-content: end;
  }

  .layout-ji-e {
    justify-items: end;
  }

  .layout-r-none {
    resize: none;
  }

  .layout-fs-c {
    field-sizing: content;
  }

  .layout-fs-n {
    field-sizing: none;
  }

  .layout-flx-0 {
    flex: 0 0 auto;
  }

  .layout-flx-1 {
    flex: 1 0 auto;
  }

  .layout-c-s {
    contain: strict;
  }

  /** Widths **/

  ${new Array(10).fill(0).map((e,t)=>{const u=(t+1)*10;return`.layout-w-${u} { width: ${u}%; max-width: ${u}%; }`}).join(`
`)}

  ${new Array(16).fill(0).map((e,t)=>{const u=t*ue;return`.layout-wp-${t} { width: ${u}px; }`}).join(`
`)}

  /** Heights **/

  ${new Array(10).fill(0).map((e,t)=>{const u=(t+1)*10;return`.layout-h-${u} { height: ${u}%; }`}).join(`
`)}

  ${new Array(16).fill(0).map((e,t)=>{const u=t*ue;return`.layout-hp-${t} { height: ${u}px; }`}).join(`
`)}

  .layout-el-cv {
    & img,
    & video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      margin: 0;
    }
  }

  .layout-ar-sq {
    aspect-ratio: 1 / 1;
  }

  .layout-ex-fb {
    margin: calc(var(--padding) * -1) 0 0 calc(var(--padding) * -1);
    width: calc(100% + var(--padding) * 2);
    height: calc(100% + var(--padding) * 2);
  }
`,sc=`
  ${new Array(21).fill(0).map((e,t)=>`.opacity-el-${t*5} { opacity: ${t/20}; }`).join(`
`)}
`,nc=`
  :host {
    --default-font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    --default-font-family-mono: "Courier New", Courier, monospace;
  }

  .typography-f-s {
    font-family: var(--font-family, var(--default-font-family));
    font-optical-sizing: auto;
    font-variation-settings: "slnt" 0, "wdth" 100, "GRAD" 0;
  }

  .typography-f-sf {
    font-family: var(--font-family-flex, var(--default-font-family));
    font-optical-sizing: auto;
  }

  .typography-f-c {
    font-family: var(--font-family-mono, var(--default-font-family));
    font-optical-sizing: auto;
    font-variation-settings: "slnt" 0, "wdth" 100, "GRAD" 0;
  }

  .typography-v-r {
    font-variation-settings: "slnt" 0, "wdth" 100, "GRAD" 0, "ROND" 100;
  }

  .typography-ta-s {
    text-align: start;
  }

  .typography-ta-c {
    text-align: center;
  }

  .typography-fs-n {
    font-style: normal;
  }

  .typography-fs-i {
    font-style: italic;
  }

  .typography-sz-ls {
    font-size: 11px;
    line-height: 16px;
  }

  .typography-sz-lm {
    font-size: 12px;
    line-height: 16px;
  }

  .typography-sz-ll {
    font-size: 14px;
    line-height: 20px;
  }

  .typography-sz-bs {
    font-size: 12px;
    line-height: 16px;
  }

  .typography-sz-bm {
    font-size: 14px;
    line-height: 20px;
  }

  .typography-sz-bl {
    font-size: 16px;
    line-height: 24px;
  }

  .typography-sz-ts {
    font-size: 14px;
    line-height: 20px;
  }

  .typography-sz-tm {
    font-size: 16px;
    line-height: 24px;
  }

  .typography-sz-tl {
    font-size: 22px;
    line-height: 28px;
  }

  .typography-sz-hs {
    font-size: 24px;
    line-height: 32px;
  }

  .typography-sz-hm {
    font-size: 28px;
    line-height: 36px;
  }

  .typography-sz-hl {
    font-size: 32px;
    line-height: 40px;
  }

  .typography-sz-ds {
    font-size: 36px;
    line-height: 44px;
  }

  .typography-sz-dm {
    font-size: 45px;
    line-height: 52px;
  }

  .typography-sz-dl {
    font-size: 57px;
    line-height: 64px;
  }

  .typography-ws-p {
    white-space: pre-line;
  }

  .typography-ws-nw {
    white-space: nowrap;
  }

  .typography-td-none {
    text-decoration: none;
  }

  /** Weights **/

  ${new Array(9).fill(0).map((e,t)=>{const u=(t+1)*100;return`.typography-w-${u} { font-weight: ${u}; }`}).join(`
`)}
`,ac=[Xo,ec,uc,rc,ic,sc,nc].flat(1/0).join(`
`),re=$s(ac);class oc{constructor(){this.schemas=new Map,this.registry=new Map}register(t,u,r,i){if(!/^[a-zA-Z0-9]+$/.test(t))throw new Error(`[Registry] Invalid typeName '${t}'. Must be alphanumeric.`);this.registry.set(t,u),i&&this.schemas.set(t,i);const s=r||`a2ui-custom-${t.toLowerCase()}`,n=customElements.getName(u);if(n){if(n!==s)throw new Error(`Component ${t} is already registered as ${n}, but requested as ${s}.`);return}customElements.get(s)||customElements.define(s,u)}get(t){return this.registry.get(t)}getInlineCatalog(){const t={};for(const[u,r]of this.schemas)t[u]=r;return{components:t}}}const qi=new oc;var de=function(e,t,u){for(var r=arguments.length>2,i=0;i<t.length;i++)u=r?t[i].call(e,u):t[i].call(e);return r?u:void 0},Fe=function(e,t,u,r,i,s){function n(_){if(_!==void 0&&typeof _!="function")throw new TypeError("Function expected");return _}for(var a=r.kind,c=a==="getter"?"get":a==="setter"?"set":"value",l=!t&&e?r.static?e:e.prototype:null,d=t||(l?Object.getOwnPropertyDescriptor(l,r.name):{}),o,p=!1,h=u.length-1;h>=0;h--){var f={};for(var m in r)f[m]=m==="access"?{}:r[m];for(var m in r.access)f.access[m]=r.access[m];f.addInitializer=function(_){if(p)throw new TypeError("Cannot add initializers after decoration has completed");s.push(n(_||null))};var b=(0,u[h])(a==="accessor"?{get:d.get,set:d.set}:d[c],f);if(a==="accessor"){if(b===void 0)continue;if(b===null||typeof b!="object")throw new TypeError("Object expected");(o=n(b.get))&&(d.get=o),(o=n(b.set))&&(d.set=o),(o=n(b.init))&&i.unshift(o)}else(o=n(b))&&(a==="field"?i.unshift(o):d[c]=o)}l&&Object.defineProperty(l,r.name,d),p=!0};let ie=(()=>{var E,U,ee,$,I,j,he,ge,ye,V;let e=[X("a2ui-root")],t,u=[],r,i=Ro(Ht),s=[],n,a=[],c=[],l,d=[],o=[],p,h=[],f=[],m,b=[],_=[],k,v=[],y=[],g,w=[],z=[],P,M=[],Z=[],F;return V=class extends i{constructor(){super(...arguments);T(this,E,(de(this,s),de(this,a,null)));T(this,U,(de(this,c),de(this,d,null)));T(this,ee,(de(this,o),de(this,h,void 0)));T(this,$,(de(this,f),de(this,b,null)));T(this,I,(de(this,_),de(this,v,null)));T(this,j,(de(this,y),de(this,w,"")));T(this,he,(de(this,z),de(this,M,!1)));T(this,ge,(de(this,Z),1));T(this,ye,null)}get surfaceId(){return A(this,E)}set surfaceId(S){N(this,E,S)}get component(){return A(this,U)}set component(S){N(this,U,S)}get theme(){return A(this,ee)}set theme(S){N(this,ee,S)}get childComponents(){return A(this,$)}set childComponents(S){N(this,$,S)}get processor(){return A(this,I)}set processor(S){N(this,I,S)}get dataContextPath(){return A(this,j)}set dataContextPath(S){N(this,j,S)}get enableCustomElements(){return A(this,he)}set enableCustomElements(S){N(this,he,S)}set weight(S){N(this,ge,S),this.style.setProperty("--weight",`${S}`)}get weight(){return A(this,ge)}willUpdate(S){S.has("childComponents")&&(A(this,ye)&&A(this,ye).call(this),N(this,ye,Qo(()=>{const C=this.childComponents??null,x=this.renderComponentTree(C);ni(x,this,{host:this})})))}disconnectedCallback(){super.disconnectedCallback(),A(this,ye)&&A(this,ye).call(this)}renderComponentTree(S){return!S||!Array.isArray(S)?O:D` ${Ko(S,C=>{if(this.enableCustomElements){const se=qi.get(C.type)||customElements.get(C.type);if(se){const H=C,te=new se;te.id=H.id,H.slotName&&(te.slot=H.slotName),te.component=H,te.weight=H.weight??"initial",te.processor=this.processor,te.surfaceId=this.surfaceId,te.dataContextPath=H.dataContextPath??"/";for(const[Ne,At]of Object.entries(C.properties))te[Ne]=At;return D`${te}`}}switch(C.type){case"List":{const x=C,se=x.properties.children;return D`<a2ui-list
            id=${x.id}
            slot=${x.slotName?x.slotName:O}
            .component=${x}
            .weight=${x.weight??"initial"}
            .direction=${x.properties.direction??"vertical"}
            .processor=${this.processor}
            .surfaceId=${this.surfaceId}
            .childComponents=${se}
            .enableCustomElements=${this.enableCustomElements}
          ></a2ui-list>`}case"Card":{const x=C;let se=x.properties.children;return!se&&x.properties.child&&(se=[x.properties.child]),D`<a2ui-card
            id=${x.id}
            slot=${x.slotName?x.slotName:O}
            .component=${x}
            .weight=${x.weight??"initial"}
            .processor=${this.processor}
            .surfaceId=${this.surfaceId}
            .childComponents=${se}
            .dataContextPath=${x.dataContextPath??""}
            .enableCustomElements=${this.enableCustomElements}
          ></a2ui-card>`}case"Column":{const x=C;return D`<a2ui-column
            id=${x.id}
            slot=${x.slotName?x.slotName:O}
            .component=${x}
            .weight=${x.weight??"initial"}
            .processor=${this.processor}
            .surfaceId=${this.surfaceId}
            .childComponents=${x.properties.children??null}
            .dataContextPath=${x.dataContextPath??""}
            .alignment=${x.properties.alignment??"stretch"}
            .distribution=${x.properties.distribution??"start"}
            .enableCustomElements=${this.enableCustomElements}
          ></a2ui-column>`}case"Row":{const x=C;return D`<a2ui-row
            id=${x.id}
            slot=${x.slotName?x.slotName:O}
            .component=${x}
            .weight=${x.weight??"initial"}
            .processor=${this.processor}
            .surfaceId=${this.surfaceId}
            .childComponents=${x.properties.children??null}
            .dataContextPath=${x.dataContextPath??""}
            .alignment=${x.properties.alignment??"stretch"}
            .distribution=${x.properties.distribution??"start"}
            .enableCustomElements=${this.enableCustomElements}
          ></a2ui-row>`}case"Image":{const x=C;return D`<a2ui-image
            id=${x.id}
            slot=${x.slotName?x.slotName:O}
            .component=${x}
            .weight=${x.weight??"initial"}
            .processor=${this.processor}
            .surfaceId=${this.surfaceId}
            .url=${x.properties.url??null}
            .dataContextPath=${x.dataContextPath??""}
            .usageHint=${x.properties.usageHint}
            .fit=${x.properties.fit}
            .enableCustomElements=${this.enableCustomElements}
          ></a2ui-image>`}case"Icon":{const x=C;return D`<a2ui-icon
            id=${x.id}
            slot=${x.slotName?x.slotName:O}
            .component=${x}
            .weight=${x.weight??"initial"}
            .processor=${this.processor}
            .surfaceId=${this.surfaceId}
            .name=${x.properties.name??null}
            .dataContextPath=${x.dataContextPath??""}
            .enableCustomElements=${this.enableCustomElements}
          ></a2ui-icon>`}case"AudioPlayer":{const x=C;return D`<a2ui-audioplayer
            id=${x.id}
            slot=${x.slotName?x.slotName:O}
            .component=${x}
            .weight=${x.weight??"initial"}
            .processor=${this.processor}
            .surfaceId=${this.surfaceId}
            .url=${x.properties.url??null}
            .dataContextPath=${x.dataContextPath??""}
            .enableCustomElements=${this.enableCustomElements}
          ></a2ui-audioplayer>`}case"Button":{const x=C;return D`<a2ui-button
            id=${x.id}
            slot=${x.slotName?x.slotName:O}
            .component=${x}
            .weight=${x.weight??"initial"}
            .processor=${this.processor}
            .surfaceId=${this.surfaceId}
            .dataContextPath=${x.dataContextPath??""}
            .action=${x.properties.action}
            .childComponents=${[x.properties.child]}
            .enableCustomElements=${this.enableCustomElements}
          ></a2ui-button>`}case"Text":{const x=C;return D`<a2ui-text
            id=${x.id}
            slot=${x.slotName?x.slotName:O}
            .component=${x}
            .weight=${x.weight??"initial"}
            .model=${this.processor}
            .surfaceId=${this.surfaceId}
            .processor=${this.processor}
            .dataContextPath=${x.dataContextPath}
            .text=${x.properties.text}
            .usageHint=${x.properties.usageHint}
            .enableCustomElements=${this.enableCustomElements}
          ></a2ui-text>`}case"CheckBox":{const x=C;return D`<a2ui-checkbox
            id=${x.id}
            slot=${x.slotName?x.slotName:O}
            .component=${x}
            .weight=${x.weight??"initial"}
            .processor=${this.processor}
            .surfaceId=${this.surfaceId}
            .dataContextPath=${x.dataContextPath??""}
            .label=${x.properties.label}
            .value=${x.properties.value}
            .enableCustomElements=${this.enableCustomElements}
          ></a2ui-checkbox>`}case"DateTimeInput":{const x=C;return D`<a2ui-datetimeinput
            id=${x.id}
            slot=${x.slotName?x.slotName:O}
            .component=${x}
            .weight=${x.weight??"initial"}
            .processor=${this.processor}
            .surfaceId=${this.surfaceId}
            .dataContextPath=${x.dataContextPath??""}
            .enableDate=${x.properties.enableDate??!0}
            .enableTime=${x.properties.enableTime??!0}
            .value=${x.properties.value}
            .enableCustomElements=${this.enableCustomElements}
          ></a2ui-datetimeinput>`}case"Divider":{const x=C;return D`<a2ui-divider
            id=${x.id}
            slot=${x.slotName?x.slotName:O}
            .component=${x}
            .weight=${x.weight??"initial"}
            .processor=${this.processor}
            .surfaceId=${this.surfaceId}
            .dataContextPath=${x.dataContextPath}
            .thickness=${x.properties.thickness}
            .axis=${x.properties.axis}
            .color=${x.properties.color}
            .enableCustomElements=${this.enableCustomElements}
          ></a2ui-divider>`}case"MultipleChoice":{const x=C;return D`<a2ui-multiplechoice
            id=${x.id}
            slot=${x.slotName?x.slotName:O}
            .component=${x}
            .weight=${x.weight??"initial"}
            .processor=${this.processor}
            .surfaceId=${this.surfaceId}
            .dataContextPath=${x.dataContextPath}
            .options=${x.properties.options}
            .maxAllowedSelections=${x.properties.maxAllowedSelections}
            .selections=${x.properties.selections}
            .variant=${x.properties.variant}
            .filterable=${x.properties.filterable}
            .enableCustomElements=${this.enableCustomElements}
          ></a2ui-multiplechoice>`}case"Slider":{const x=C;return D`<a2ui-slider
            id=${x.id}
            slot=${x.slotName?x.slotName:O}
            .component=${x}
            .weight=${x.weight??"initial"}
            .processor=${this.processor}
            .surfaceId=${this.surfaceId}
            .dataContextPath=${x.dataContextPath}
            .value=${x.properties.value}
            .minValue=${x.properties.minValue}
            .maxValue=${x.properties.maxValue}
            .enableCustomElements=${this.enableCustomElements}
          ></a2ui-slider>`}case"TextField":{const x=C;return D`<a2ui-textfield
            id=${x.id}
            slot=${x.slotName?x.slotName:O}
            .component=${x}
            .weight=${x.weight??"initial"}
            .processor=${this.processor}
            .surfaceId=${this.surfaceId}
            .dataContextPath=${x.dataContextPath}
            .label=${x.properties.label}
            .text=${x.properties.text}
            .type=${x.properties.type}
            .validationRegexp=${x.properties.validationRegexp}
            .enableCustomElements=${this.enableCustomElements}
          ></a2ui-textfield>`}case"Video":{const x=C;return D`<a2ui-video
            id=${x.id}
            slot=${x.slotName?x.slotName:O}
            .component=${x}
            .weight=${x.weight??"initial"}
            .processor=${this.processor}
            .surfaceId=${this.surfaceId}
            .dataContextPath=${x.dataContextPath}
            .url=${x.properties.url}
            .enableCustomElements=${this.enableCustomElements}
          ></a2ui-video>`}case"Tabs":{const x=C,se=[],H=[];if(x.properties.tabItems)for(const te of x.properties.tabItems)se.push(te.title),H.push(te.child);return D`<a2ui-tabs
            id=${x.id}
            slot=${x.slotName?x.slotName:O}
            .component=${x}
            .weight=${x.weight??"initial"}
            .processor=${this.processor}
            .surfaceId=${this.surfaceId}
            .dataContextPath=${x.dataContextPath}
            .titles=${se}
            .childComponents=${H}
            .enableCustomElements=${this.enableCustomElements}
          ></a2ui-tabs>`}case"Modal":{const x=C,se=[x.properties.entryPointChild,x.properties.contentChild];return x.properties.entryPointChild.slotName="entry",D`<a2ui-modal
            id=${x.id}
            slot=${x.slotName?x.slotName:O}
            .component=${x}
            .weight=${x.weight??"initial"}
            .processor=${this.processor}
            .surfaceId=${this.surfaceId}
            .dataContextPath=${x.dataContextPath}
            .childComponents=${se}
            .enableCustomElements=${this.enableCustomElements}
          ></a2ui-modal>`}default:return this.renderCustomComponent(C)}})}`}renderCustomComponent(S){if(!this.enableCustomElements)return;const C=S,se=qi.get(S.type)||customElements.get(S.type);if(!se)return D`Unknown element ${S.type}`;const H=new se;H.id=C.id,C.slotName&&(H.slot=C.slotName),H.component=C,H.weight=C.weight??"initial",H.processor=this.processor,H.surfaceId=this.surfaceId,H.dataContextPath=C.dataContextPath??"/";for(const[te,Ne]of Object.entries(S.properties))H[te]=Ne;return D`${H}`}render(){return D`<slot></slot>`}},E=new WeakMap,U=new WeakMap,ee=new WeakMap,$=new WeakMap,I=new WeakMap,j=new WeakMap,he=new WeakMap,ge=new WeakMap,ye=new WeakMap,r=V,(()=>{const S=typeof Symbol=="function"&&Symbol.metadata?Object.create(i[Symbol.metadata]??null):void 0;n=[L()],l=[L()],p=[Zo({context:Ns})],m=[L({attribute:!1})],k=[L({attribute:!1})],g=[L()],P=[L()],F=[L()],Fe(V,null,n,{kind:"accessor",name:"surfaceId",static:!1,private:!1,access:{has:C=>"surfaceId"in C,get:C=>C.surfaceId,set:(C,x)=>{C.surfaceId=x}},metadata:S},a,c),Fe(V,null,l,{kind:"accessor",name:"component",static:!1,private:!1,access:{has:C=>"component"in C,get:C=>C.component,set:(C,x)=>{C.component=x}},metadata:S},d,o),Fe(V,null,p,{kind:"accessor",name:"theme",static:!1,private:!1,access:{has:C=>"theme"in C,get:C=>C.theme,set:(C,x)=>{C.theme=x}},metadata:S},h,f),Fe(V,null,m,{kind:"accessor",name:"childComponents",static:!1,private:!1,access:{has:C=>"childComponents"in C,get:C=>C.childComponents,set:(C,x)=>{C.childComponents=x}},metadata:S},b,_),Fe(V,null,k,{kind:"accessor",name:"processor",static:!1,private:!1,access:{has:C=>"processor"in C,get:C=>C.processor,set:(C,x)=>{C.processor=x}},metadata:S},v,y),Fe(V,null,g,{kind:"accessor",name:"dataContextPath",static:!1,private:!1,access:{has:C=>"dataContextPath"in C,get:C=>C.dataContextPath,set:(C,x)=>{C.dataContextPath=x}},metadata:S},w,z),Fe(V,null,P,{kind:"accessor",name:"enableCustomElements",static:!1,private:!1,access:{has:C=>"enableCustomElements"in C,get:C=>C.enableCustomElements,set:(C,x)=>{C.enableCustomElements=x}},metadata:S},M,Z),Fe(V,null,F,{kind:"setter",name:"weight",static:!1,private:!1,access:{has:C=>"weight"in C,set:(C,x)=>{C.weight=x}},metadata:S},null,s),Fe(null,t={value:r},e,{kind:"class",name:r.name,metadata:S},null,u),r=t.value,S&&Object.defineProperty(r,Symbol.metadata,{enumerable:!0,configurable:!0,writable:!0,value:S})})(),V.styles=[re,Y`
      :host {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 80%;
      }
    `],de(r,u),r})();function cc(e){return q(e)&&"key"in e}function Ms(e,t){return e==="path"&&typeof t=="string"}function q(e){return typeof e=="object"&&e!==null&&!Array.isArray(e)}function js(e){return q(e)?"explicitList"in e||"template"in e:!1}function Pe(e){return q(e)&&("path"in e||"literal"in e&&typeof e.literal=="string"||"literalString"in e)}function lc(e){return q(e)&&("path"in e||"literal"in e&&typeof e.literal=="number"||"literalNumber"in e)}function dc(e){return q(e)&&("path"in e||"literal"in e&&typeof e.literal=="boolean"||"literalBoolean"in e)}function ze(e){return!(!q(e)||!("id"in e&&"type"in e&&"properties"in e))}function Bs(e){return q(e)&&"url"in e&&Pe(e.url)}function Ls(e){return q(e)&&"child"in e&&ze(e.child)&&"action"in e}function Us(e){return q(e)?"child"in e?ze(e.child):"children"in e?Array.isArray(e.children)&&e.children.every(ze):!1:!1}function qs(e){return q(e)&&"label"in e&&Pe(e.label)&&"value"in e&&dc(e.value)}function Vs(e){return q(e)&&"children"in e&&Array.isArray(e.children)&&e.children.every(ze)}function Hs(e){return q(e)&&"value"in e&&Pe(e.value)}function Ws(e){return q(e)}function Gs(e){return q(e)&&"url"in e&&Pe(e.url)}function Zs(e){return q(e)&&"name"in e&&Pe(e.name)}function Ks(e){return q(e)&&"children"in e&&Array.isArray(e.children)&&e.children.every(ze)}function Js(e){return q(e)&&"entryPointChild"in e&&ze(e.entryPointChild)&&"contentChild"in e&&ze(e.contentChild)}function Qs(e){return q(e)&&"selections"in e}function Ys(e){return q(e)&&"children"in e&&Array.isArray(e.children)&&e.children.every(ze)}function Xs(e){return q(e)&&"value"in e&&lc(e.value)}function fc(e){return q(e)&&"title"in e&&Pe(e.title)&&"child"in e&&ze(e.child)}function en(e){return q(e)&&"tabItems"in e&&Array.isArray(e.tabItems)&&e.tabItems.every(fc)}function tn(e){return q(e)&&"text"in e&&Pe(e.text)}function un(e){return q(e)&&"label"in e&&Pe(e.label)}function rn(e){return q(e)&&"url"in e&&Pe(e.url)}const hc=Object.freeze(Object.defineProperty({__proto__:null,isComponentArrayReference:js,isObject:q,isPath:Ms,isResolvedAudioPlayer:Bs,isResolvedButton:Ls,isResolvedCard:Us,isResolvedCheckbox:qs,isResolvedColumn:Vs,isResolvedDateTimeInput:Hs,isResolvedDivider:Ws,isResolvedIcon:Zs,isResolvedImage:Gs,isResolvedList:Ks,isResolvedModal:Js,isResolvedMultipleChoice:Qs,isResolvedRow:Ys,isResolvedSlider:Xs,isResolvedTabs:en,isResolvedText:tn,isResolvedTextField:un,isResolvedVideo:rn,isValueMap:cc},Symbol.toStringTag,{value:"Module"})),Zt=class Zt{constructor(t={mapCtor:Map,arrayCtor:Array,setCtor:Set,objCtor:Object}){this.opts=t,this.mapCtor=Map,this.arrayCtor=Array,this.setCtor=Set,this.objCtor=Object,this.arrayCtor=t.arrayCtor,this.mapCtor=t.mapCtor,this.setCtor=t.setCtor,this.objCtor=t.objCtor,this.surfaces=new t.mapCtor}getSurfaces(){return this.surfaces}clearSurfaces(){this.surfaces.clear()}processMessages(t){for(const u of t)u.beginRendering&&this.handleBeginRendering(u.beginRendering,u.beginRendering.surfaceId),u.surfaceUpdate&&this.handleSurfaceUpdate(u.surfaceUpdate,u.surfaceUpdate.surfaceId),u.dataModelUpdate&&this.handleDataModelUpdate(u.dataModelUpdate,u.dataModelUpdate.surfaceId),u.deleteSurface&&this.handleDeleteSurface(u.deleteSurface)}getData(t,u,r=Zt.DEFAULT_SURFACE_ID){const i=this.getOrCreateSurface(r);if(!i)return null;let s;return u==="."||u===""?s=t.dataContextPath??"/":s=this.resolvePath(u,t.dataContextPath),this.getDataByPath(i.dataModel,s)}setData(t,u,r,i=Zt.DEFAULT_SURFACE_ID){if(!t){console.warn("No component node set");return}const s=this.getOrCreateSurface(i);if(!s)return;let n;u==="."||u===""?n=t.dataContextPath??"/":n=this.resolvePath(u,t.dataContextPath),this.setDataByPath(s.dataModel,n,r)}resolvePath(t,u){return t.startsWith("/")?t:u&&u!=="/"?u.endsWith("/")?`${u}${t}`:`${u}/${t}`:`/${t}`}parseIfJsonString(t){if(typeof t!="string")return t;const u=t.trim();if(u.startsWith("{")&&u.endsWith("}")||u.startsWith("[")&&u.endsWith("]"))try{return JSON.parse(t)}catch(r){return console.warn(`Failed to parse potential JSON string: "${t.substring(0,50)}..."`,r),t}return t}convertKeyValueArrayToMap(t){const u=new this.mapCtor;for(const r of t){if(!q(r)||!("key"in r))continue;const i=r.key,s=this.findValueKey(r);if(!s)continue;let n=r[s];s==="valueMap"&&Array.isArray(n)?n=this.convertKeyValueArrayToMap(n):typeof n=="string"&&(n=this.parseIfJsonString(n)),this.setDataByPath(u,i,n)}return u}setDataByPath(t,u,r){if(Array.isArray(r)&&(r.length===0||q(r[0])&&"key"in r[0]))if(r.length===1&&q(r[0])&&r[0].key==="."){const c=r[0],l=this.findValueKey(c);l?(r=c[l],l==="valueMap"&&Array.isArray(r)?r=this.convertKeyValueArrayToMap(r):typeof r=="string"&&(r=this.parseIfJsonString(r))):r=this.convertKeyValueArrayToMap(r)}else r=this.convertKeyValueArrayToMap(r);const i=this.normalizePath(u).split("/").filter(c=>c);if(i.length===0){if(r instanceof Map||q(r)){!(r instanceof Map)&&q(r)&&(r=new this.mapCtor(Object.entries(r))),t.clear();for(const[c,l]of r.entries())t.set(c,l)}else console.error("Cannot set root of DataModel to a non-Map value.");return}let s=t;for(let c=0;c<i.length-1;c++){const l=i[c];let d;s instanceof Map?d=s.get(l):Array.isArray(s)&&/^\d+$/.test(l)&&(d=s[parseInt(l,10)]),(d===void 0||typeof d!="object"||d===null)&&(d=new this.mapCtor,s instanceof this.mapCtor?s.set(l,d):Array.isArray(s)&&(s[parseInt(l,10)]=d)),s=d}const n=i[i.length-1],a=r;s instanceof this.mapCtor?s.set(n,a):Array.isArray(s)&&/^\d+$/.test(n)&&(s[parseInt(n,10)]=a)}normalizePath(t){return"/"+t.replace(/\[(\d+)\]/g,".$1").split(".").filter(i=>i.length>0).join("/")}getDataByPath(t,u){const r=this.normalizePath(u).split("/").filter(s=>s);let i=t;for(const s of r){if(i==null)return null;if(i instanceof Map)i=i.get(s);else if(Array.isArray(i)&&/^\d+$/.test(s))i=i[parseInt(s,10)];else if(q(i))i=i[s];else return null}return i}getOrCreateSurface(t){let u=this.surfaces.get(t);return u||(u=new this.objCtor({rootComponentId:null,componentTree:null,dataModel:new this.mapCtor,components:new this.mapCtor,styles:new this.objCtor}),this.surfaces.set(t,u)),u}handleBeginRendering(t,u){const r=this.getOrCreateSurface(u);r.rootComponentId=t.root,r.styles=t.styles??{},this.rebuildComponentTree(r)}handleSurfaceUpdate(t,u){const r=this.getOrCreateSurface(u);for(const i of t.components)r.components.set(i.id,i);this.rebuildComponentTree(r)}handleDataModelUpdate(t,u){const r=this.getOrCreateSurface(u),i=t.path??"/";this.setDataByPath(r.dataModel,i,t.contents),this.rebuildComponentTree(r)}handleDeleteSurface(t){this.surfaces.delete(t.surfaceId)}rebuildComponentTree(t){if(!t.rootComponentId){t.componentTree=null;return}const u=new this.setCtor;t.componentTree=this.buildNodeRecursive(t.rootComponentId,t,u,"/","")}findValueKey(t){return Object.keys(t).find(u=>u.startsWith("value"))}buildNodeRecursive(t,u,r,i,s=""){const n=`${t}${s}`,{components:a}=u;if(!a.has(t))return null;if(r.has(n))throw new Error(`Circular dependency for component "${n}".`);r.add(n);const c=a.get(t),l=c.component??{},d=Object.keys(l)[0],o=l[d],p=new this.objCtor;if(q(o))for(const[f,m]of Object.entries(o))p[f]=this.resolvePropertyValue(m,u,r,i,s);r.delete(n);const h={id:n,dataContextPath:i,weight:c.weight??"initial"};switch(d){case"Text":if(!tn(p))throw new Error(`Invalid data; expected ${d}`);return new this.objCtor({...h,type:"Text",properties:p});case"Image":if(!Gs(p))throw new Error(`Invalid data; expected ${d}`);return new this.objCtor({...h,type:"Image",properties:p});case"Icon":if(!Zs(p))throw new Error(`Invalid data; expected ${d}`);return new this.objCtor({...h,type:"Icon",properties:p});case"Video":if(!rn(p))throw new Error(`Invalid data; expected ${d}`);return new this.objCtor({...h,type:"Video",properties:p});case"AudioPlayer":if(!Bs(p))throw new Error(`Invalid data; expected ${d}`);return new this.objCtor({...h,type:"AudioPlayer",properties:p});case"Row":if(!Ys(p))throw new Error(`Invalid data; expected ${d}`);return new this.objCtor({...h,type:"Row",properties:p});case"Column":if(!Vs(p))throw new Error(`Invalid data; expected ${d}`);return new this.objCtor({...h,type:"Column",properties:p});case"List":if(!Ks(p))throw new Error(`Invalid data; expected ${d}`);return new this.objCtor({...h,type:"List",properties:p});case"Card":if(!Us(p))throw new Error(`Invalid data; expected ${d}`);return new this.objCtor({...h,type:"Card",properties:p});case"Tabs":if(!en(p))throw new Error(`Invalid data; expected ${d}`);return new this.objCtor({...h,type:"Tabs",properties:p});case"Divider":if(!Ws(p))throw new Error(`Invalid data; expected ${d}`);return new this.objCtor({...h,type:"Divider",properties:p});case"Modal":if(!Js(p))throw new Error(`Invalid data; expected ${d}`);return new this.objCtor({...h,type:"Modal",properties:p});case"Button":if(!Ls(p))throw new Error(`Invalid data; expected ${d}`);return new this.objCtor({...h,type:"Button",properties:p});case"CheckBox":if(!qs(p))throw new Error(`Invalid data; expected ${d}`);return new this.objCtor({...h,type:"CheckBox",properties:p});case"TextField":if(!un(p))throw new Error(`Invalid data; expected ${d}`);return new this.objCtor({...h,type:"TextField",properties:p});case"DateTimeInput":if(!Hs(p))throw new Error(`Invalid data; expected ${d}`);return new this.objCtor({...h,type:"DateTimeInput",properties:p});case"MultipleChoice":if(!Qs(p))throw new Error(`Invalid data; expected ${d}`);return new this.objCtor({...h,type:"MultipleChoice",properties:p});case"Slider":if(!Xs(p))throw new Error(`Invalid data; expected ${d}`);return new this.objCtor({...h,type:"Slider",properties:p});default:return new this.objCtor({...h,type:d,properties:p})}}resolvePropertyValue(t,u,r,i,s=""){if(typeof t=="string"&&u.components.has(t))return this.buildNodeRecursive(t,u,r,i,s);if(js(t)){if(t.explicitList)return t.explicitList.map(n=>this.buildNodeRecursive(n,u,r,i,s));if(t.template){const n=this.resolvePath(t.template.dataBinding,i),a=this.getDataByPath(u.dataModel,n),c=t.template;if(Array.isArray(a))return a.map((d,o)=>{const f=`:${[...i.split("/").filter(b=>/^\d+$/.test(b)),o].join(":")}`,m=`${n}/${o}`;return this.buildNodeRecursive(c.componentId,u,r,m,f)});const l=this.mapCtor;return a instanceof l?Array.from(a.keys(),d=>{const o=`:${d}`,p=`${n}/${d}`;return this.buildNodeRecursive(c.componentId,u,r,p,o)}):new this.arrayCtor}}if(Array.isArray(t))return t.map(n=>this.resolvePropertyValue(n,u,r,i,s));if(q(t)){const n=new this.objCtor;for(const[a,c]of Object.entries(t)){let l=c;if(Ms(a,c)&&i!=="/"){l=c.replace(/^\.?\/item/,"").replace(/^\.?\/text/,"").replace(/^\.?\/label/,"").replace(/^\.?\//,""),n[a]=l;continue}n[a]=this.resolvePropertyValue(l,u,r,i,s)}return n}return t}};Zt.DEFAULT_SURFACE_ID="@default";let K=Zt;/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const W=kt(class extends $t{constructor(e){var t;if(super(e),e.type!==au.ATTRIBUTE||e.name!=="class"||((t=e.strings)==null?void 0:t.length)>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(e){return" "+Object.keys(e).filter(t=>e[t]).join(" ")+" "}update(e,[t]){var r,i;if(this.st===void 0){this.st=new Set,e.strings!==void 0&&(this.nt=new Set(e.strings.join(" ").split(/\s/).filter(s=>s!=="")));for(const s in t)t[s]&&!((r=this.nt)!=null&&r.has(s))&&this.st.add(s);return this.render(t)}const u=e.element.classList;for(const s of this.st)s in t||(u.remove(s),this.st.delete(s));for(const s in t){const n=!!t[s];n===this.st.has(s)||(i=this.nt)!=null&&i.has(s)||(n?(u.add(s),this.st.add(s)):(u.remove(s),this.st.delete(s)))}return ve}});/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const sn="important",pc=" !"+sn,oe=kt(class extends $t{constructor(e){var t;if(super(e),e.type!==au.ATTRIBUTE||e.name!=="style"||((t=e.strings)==null?void 0:t.length)>2)throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.")}render(e){return Object.keys(e).reduce((t,u)=>{const r=e[u];return r==null?t:t+`${u=u.includes("-")?u:u.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g,"-$&").toLowerCase()}:${r};`},"")}update(e,[t]){const{style:u}=e.element;if(this.ft===void 0)return this.ft=new Set(Object.keys(t)),this.render(t);for(const r of this.ft)t[r]==null&&(this.ft.delete(r),r.includes("-")?u.removeProperty(r):u[r]=null);for(const r in t){const i=t[r];if(i!=null){this.ft.add(r);const s=typeof i=="string"&&i.endsWith(pc);r.includes("-")||s?u.setProperty(r,s?i.slice(0,-11):i,s?sn:""):u[r]=i}}return ve}});var Vi=function(e,t,u,r,i,s){function n(_){if(_!==void 0&&typeof _!="function")throw new TypeError("Function expected");return _}for(var a=r.kind,c=a==="getter"?"get":a==="setter"?"set":"value",l=!t&&e?r.static?e:e.prototype:null,d=t||(l?Object.getOwnPropertyDescriptor(l,r.name):{}),o,p=!1,h=u.length-1;h>=0;h--){var f={};for(var m in r)f[m]=m==="access"?{}:r[m];for(var m in r.access)f.access[m]=r.access[m];f.addInitializer=function(_){if(p)throw new TypeError("Cannot add initializers after decoration has completed");s.push(n(_||null))};var b=(0,u[h])(a==="accessor"?{get:d.get,set:d.set}:d[c],f);if(a==="accessor"){if(b===void 0)continue;if(b===null||typeof b!="object")throw new TypeError("Object expected");(o=n(b.get))&&(d.get=o),(o=n(b.set))&&(d.set=o),(o=n(b.init))&&i.unshift(o)}else(o=n(b))&&(a==="field"?i.unshift(o):d[c]=o)}l&&Object.defineProperty(l,r.name,d),p=!0},fr=function(e,t,u){for(var r=arguments.length>2,i=0;i<t.length;i++)u=r?t[i].call(e,u):t[i].call(e);return r?u:void 0};(()=>{var c,l,nn,o;let e=[X("a2ui-audioplayer")],t,u=[],r,i=ie,s,n=[],a=[];return o=class extends i{constructor(){super(...arguments);T(this,l);T(this,c,fr(this,n,null));fr(this,a)}get url(){return A(this,c)}set url(f){N(this,c,f)}render(){var f,m;return D`<section
      class=${W(this.theme.components.AudioPlayer)}
      style=${(f=this.theme.additionalStyles)!=null&&f.AudioPlayer?oe((m=this.theme.additionalStyles)==null?void 0:m.AudioPlayer):O}
    >
      ${R(this,l,nn).call(this)}
    </section>`}},c=new WeakMap,l=new WeakSet,nn=function(){if(!this.url)return O;if(this.url&&typeof this.url=="object"){if("literalString"in this.url)return D`<audio controls src=${this.url.literalString} />`;if("literal"in this.url)return D`<audio controls src=${this.url.literal} />`;if(this.url&&"path"in this.url&&this.url.path){if(!this.processor||!this.component)return D`(no processor)`;const f=this.processor.getData(this.component,this.url.path,this.surfaceId??K.DEFAULT_SURFACE_ID);return f?typeof f!="string"?D`Invalid audio URL`:D`<audio controls src=${f} />`:D`Invalid audio URL`}}return D`(empty)`},r=o,(()=>{const f=typeof Symbol=="function"&&Symbol.metadata?Object.create(i[Symbol.metadata]??null):void 0;s=[L()],Vi(o,null,s,{kind:"accessor",name:"url",static:!1,private:!1,access:{has:m=>"url"in m,get:m=>m.url,set:(m,b)=>{m.url=b}},metadata:f},n,a),Vi(null,t={value:r},e,{kind:"class",name:r.name,metadata:f},null,u),r=t.value,f&&Object.defineProperty(r,Symbol.metadata,{enumerable:!0,configurable:!0,writable:!0,value:f})})(),o.styles=[re,Y`
      * {
        box-sizing: border-box;
      }

      :host {
        display: block;
        flex: var(--weight);
        min-height: 0;
        overflow: auto;
      }

      audio {
        display: block;
        width: 100%;
      }
    `],fr(r,u),r})();const bc={bubbles:!0,cancelable:!0,composed:!0},Nu=class Nu extends CustomEvent{constructor(t){super(Nu.eventName,{detail:t,...bc}),this.payload=t}};Nu.eventName="a2uiaction";let Mr=Nu;var Hi=function(e,t,u,r,i,s){function n(_){if(_!==void 0&&typeof _!="function")throw new TypeError("Function expected");return _}for(var a=r.kind,c=a==="getter"?"get":a==="setter"?"set":"value",l=!t&&e?r.static?e:e.prototype:null,d=t||(l?Object.getOwnPropertyDescriptor(l,r.name):{}),o,p=!1,h=u.length-1;h>=0;h--){var f={};for(var m in r)f[m]=m==="access"?{}:r[m];for(var m in r.access)f.access[m]=r.access[m];f.addInitializer=function(_){if(p)throw new TypeError("Cannot add initializers after decoration has completed");s.push(n(_||null))};var b=(0,u[h])(a==="accessor"?{get:d.get,set:d.set}:d[c],f);if(a==="accessor"){if(b===void 0)continue;if(b===null||typeof b!="object")throw new TypeError("Object expected");(o=n(b.get))&&(d.get=o),(o=n(b.set))&&(d.set=o),(o=n(b.init))&&i.unshift(o)}else(o=n(b))&&(a==="field"?i.unshift(o):d[c]=o)}l&&Object.defineProperty(l,r.name,d),p=!0},hr=function(e,t,u){for(var r=arguments.length>2,i=0;i<t.length;i++)u=r?t[i].call(e,u):t[i].call(e);return r?u:void 0};(()=>{var c,l;let e=[X("a2ui-button")],t,u=[],r,i=ie,s,n=[],a=[];return l=class extends i{constructor(){super(...arguments);T(this,c,hr(this,n,null));hr(this,a)}get action(){return A(this,c)}set action(p){N(this,c,p)}render(){var p,h;return D`<button
      class=${W(this.theme.components.Button)}
      style=${(p=this.theme.additionalStyles)!=null&&p.Button?oe((h=this.theme.additionalStyles)==null?void 0:h.Button):O}
      @click=${()=>{if(!this.action)return;const f=new Mr({eventType:"a2ui.action",action:this.action,dataContextPath:this.dataContextPath,sourceComponentId:this.id,sourceComponent:this.component});this.dispatchEvent(f)}}
    >
      <slot></slot>
    </button>`}},c=new WeakMap,r=l,(()=>{const p=typeof Symbol=="function"&&Symbol.metadata?Object.create(i[Symbol.metadata]??null):void 0;s=[L()],Hi(l,null,s,{kind:"accessor",name:"action",static:!1,private:!1,access:{has:h=>"action"in h,get:h=>h.action,set:(h,f)=>{h.action=f}},metadata:p},n,a),Hi(null,t={value:r},e,{kind:"class",name:r.name,metadata:p},null,u),r=t.value,p&&Object.defineProperty(r,Symbol.metadata,{enumerable:!0,configurable:!0,writable:!0,value:p})})(),l.styles=[re,Y`
      :host {
        display: block;
        flex: var(--weight);
        min-height: 0;
      }
    `],hr(r,u),r})();var mc=function(e,t,u,r,i,s){function n(_){if(_!==void 0&&typeof _!="function")throw new TypeError("Function expected");return _}for(var a=r.kind,c=a==="getter"?"get":a==="setter"?"set":"value",l=!t&&e?r.static?e:e.prototype:null,d=t||(l?Object.getOwnPropertyDescriptor(l,r.name):{}),o,p=!1,h=u.length-1;h>=0;h--){var f={};for(var m in r)f[m]=m==="access"?{}:r[m];for(var m in r.access)f.access[m]=r.access[m];f.addInitializer=function(_){if(p)throw new TypeError("Cannot add initializers after decoration has completed");s.push(n(_||null))};var b=(0,u[h])(a==="accessor"?{get:d.get,set:d.set}:d[c],f);if(a==="accessor"){if(b===void 0)continue;if(b===null||typeof b!="object")throw new TypeError("Object expected");(o=n(b.get))&&(d.get=o),(o=n(b.set))&&(d.set=o),(o=n(b.init))&&i.unshift(o)}else(o=n(b))&&(a==="field"?i.unshift(o):d[c]=o)}l&&Object.defineProperty(l,r.name,d),p=!0},_c=function(e,t,u){for(var r=arguments.length>2,i=0;i<t.length;i++)u=r?t[i].call(e,u):t[i].call(e);return r?u:void 0};(()=>{var s;let e=[X("a2ui-card")],t,u=[],r,i=ie;return s=class extends i{render(){var a,c;return D` <section
      class=${W(this.theme.components.Card)}
      style=${(a=this.theme.additionalStyles)!=null&&a.Card?oe((c=this.theme.additionalStyles)==null?void 0:c.Card):O}
    >
      <slot></slot>
    </section>`}},r=s,(()=>{const a=typeof Symbol=="function"&&Symbol.metadata?Object.create(i[Symbol.metadata]??null):void 0;mc(null,t={value:r},e,{kind:"class",name:r.name,metadata:a},null,u),r=t.value,a&&Object.defineProperty(r,Symbol.metadata,{enumerable:!0,configurable:!0,writable:!0,value:a})})(),s.styles=[re,Y`
      * {
        box-sizing: border-box;
      }

      :host {
        display: block;
        flex: var(--weight);
        min-height: 0;
        overflow: auto;
      }

      section {
        height: 100%;
        width: 100%;
        min-height: 0;
        overflow: auto;

        ::slotted(*) {
          height: 100%;
          width: 100%;
        }
      }
    `],_c(r,u),r})();function dt(e,t,u,r){if(e!==null&&typeof e=="object"){if("literalString"in e)return e.literalString??"";if("literal"in e&&e.literal!==void 0)return e.literal??"";if(e&&"path"in e&&e.path){if(!u||!t)return"(no model)";const i=u.getData(t,e.path,r??K.DEFAULT_SURFACE_ID);return i===null||typeof i!="string"?"":i}}return""}function gc(e,t,u,r){if(e!==null&&typeof e=="object"){if("literalNumber"in e)return e.literalNumber??0;if("literal"in e&&e.literal!==void 0)return e.literal??0;if(e&&"path"in e&&e.path){if(!u||!t)return-1;let i=u.getData(t,e.path,r??K.DEFAULT_SURFACE_ID);return typeof i=="string"&&(i=Number.parseInt(i,10),Number.isNaN(i)&&(i=null)),i===null||typeof i!="number"?-1:i}}return 0}var pr=function(e,t,u,r,i,s){function n(_){if(_!==void 0&&typeof _!="function")throw new TypeError("Function expected");return _}for(var a=r.kind,c=a==="getter"?"get":a==="setter"?"set":"value",l=!t&&e?r.static?e:e.prototype:null,d=t||(l?Object.getOwnPropertyDescriptor(l,r.name):{}),o,p=!1,h=u.length-1;h>=0;h--){var f={};for(var m in r)f[m]=m==="access"?{}:r[m];for(var m in r.access)f.access[m]=r.access[m];f.addInitializer=function(_){if(p)throw new TypeError("Cannot add initializers after decoration has completed");s.push(n(_||null))};var b=(0,u[h])(a==="accessor"?{get:d.get,set:d.set}:d[c],f);if(a==="accessor"){if(b===void 0)continue;if(b===null||typeof b!="object")throw new TypeError("Object expected");(o=n(b.get))&&(d.get=o),(o=n(b.set))&&(d.set=o),(o=n(b.init))&&i.unshift(o)}else(o=n(b))&&(a==="field"?i.unshift(o):d[c]=o)}l&&Object.defineProperty(l,r.name,d),p=!0},Tt=function(e,t,u){for(var r=arguments.length>2,i=0;i<t.length;i++)u=r?t[i].call(e,u):t[i].call(e);return r?u:void 0};(()=>{var o,p,h,an,vu,b;let e=[X("a2ui-checkbox")],t,u=[],r,i=ie,s,n=[],a=[],c,l=[],d=[];return b=class extends i{constructor(){super(...arguments);T(this,h);T(this,o,Tt(this,n,null));T(this,p,(Tt(this,a),Tt(this,l,null)));Tt(this,d)}get value(){return A(this,o)}set value(v){N(this,o,v)}get label(){return A(this,p)}set label(v){N(this,p,v)}render(){if(this.value&&typeof this.value=="object"){if("literalBoolean"in this.value&&this.value.literalBoolean)return R(this,h,vu).call(this,this.value.literalBoolean);if("literal"in this.value&&this.value.literal!==void 0)return R(this,h,vu).call(this,this.value.literal);if(this.value&&"path"in this.value&&this.value.path){if(!this.processor||!this.component)return D`(no model)`;const v=this.processor.getData(this.component,this.value.path,this.surfaceId??K.DEFAULT_SURFACE_ID);return v===null?D`Invalid label`:typeof v!="boolean"?D`Invalid label`:R(this,h,vu).call(this,v)}}return O}},o=new WeakMap,p=new WeakMap,h=new WeakSet,an=function(v){!this.value||!this.processor||"path"in this.value&&this.value.path&&this.processor.setData(this.component,this.value.path,v,this.surfaceId??K.DEFAULT_SURFACE_ID)},vu=function(v){var y,g;return D` <section
      class=${W(this.theme.components.CheckBox.container)}
      style=${(y=this.theme.additionalStyles)!=null&&y.CheckBox?oe((g=this.theme.additionalStyles)==null?void 0:g.CheckBox):O}
    >
      <input
        class=${W(this.theme.components.CheckBox.element)}
        autocomplete="off"
        @input=${w=>{w.target instanceof HTMLInputElement&&R(this,h,an).call(this,w.target.checked)}}
        id="data"
        type="checkbox"
        .checked=${v}
      />
      <label class=${W(this.theme.components.CheckBox.label)} for="data"
        >${dt(this.label,this.component,this.processor,this.surfaceId)}</label
      >
    </section>`},r=b,(()=>{const v=typeof Symbol=="function"&&Symbol.metadata?Object.create(i[Symbol.metadata]??null):void 0;s=[L()],c=[L()],pr(b,null,s,{kind:"accessor",name:"value",static:!1,private:!1,access:{has:y=>"value"in y,get:y=>y.value,set:(y,g)=>{y.value=g}},metadata:v},n,a),pr(b,null,c,{kind:"accessor",name:"label",static:!1,private:!1,access:{has:y=>"label"in y,get:y=>y.label,set:(y,g)=>{y.label=g}},metadata:v},l,d),pr(null,t={value:r},e,{kind:"class",name:r.name,metadata:v},null,u),r=t.value,v&&Object.defineProperty(r,Symbol.metadata,{enumerable:!0,configurable:!0,writable:!0,value:v})})(),b.styles=[re,Y`
      * {
        box-sizing: border-box;
      }

      :host {
        display: block;
        flex: var(--weight);
        min-height: 0;
        overflow: auto;
      }

      input {
        display: block;
        width: 100%;
      }

      .description {
        font-size: 14px;
        margin-bottom: 4px;
      }
    `],Tt(r,u),r})();var br=function(e,t,u,r,i,s){function n(_){if(_!==void 0&&typeof _!="function")throw new TypeError("Function expected");return _}for(var a=r.kind,c=a==="getter"?"get":a==="setter"?"set":"value",l=!t&&e?r.static?e:e.prototype:null,d=t||(l?Object.getOwnPropertyDescriptor(l,r.name):{}),o,p=!1,h=u.length-1;h>=0;h--){var f={};for(var m in r)f[m]=m==="access"?{}:r[m];for(var m in r.access)f.access[m]=r.access[m];f.addInitializer=function(_){if(p)throw new TypeError("Cannot add initializers after decoration has completed");s.push(n(_||null))};var b=(0,u[h])(a==="accessor"?{get:d.get,set:d.set}:d[c],f);if(a==="accessor"){if(b===void 0)continue;if(b===null||typeof b!="object")throw new TypeError("Object expected");(o=n(b.get))&&(d.get=o),(o=n(b.set))&&(d.set=o),(o=n(b.init))&&i.unshift(o)}else(o=n(b))&&(a==="field"?i.unshift(o):d[c]=o)}l&&Object.defineProperty(l,r.name,d),p=!0},It=function(e,t,u){for(var r=arguments.length>2,i=0;i<t.length;i++)u=r?t[i].call(e,u):t[i].call(e);return r?u:void 0};(()=>{var o,p,h;let e=[X("a2ui-column")],t,u=[],r,i=ie,s,n=[],a=[],c,l=[],d=[];return h=class extends i{constructor(){super(...arguments);T(this,o,It(this,n,"stretch"));T(this,p,(It(this,a),It(this,l,"start")));It(this,d)}get alignment(){return A(this,o)}set alignment(b){N(this,o,b)}get distribution(){return A(this,p)}set distribution(b){N(this,p,b)}render(){var b,_;return D`<section
      class=${W(this.theme.components.Column)}
      style=${(b=this.theme.additionalStyles)!=null&&b.Column?oe((_=this.theme.additionalStyles)==null?void 0:_.Column):O}
    >
      <slot></slot>
    </section>`}},o=new WeakMap,p=new WeakMap,r=h,(()=>{const b=typeof Symbol=="function"&&Symbol.metadata?Object.create(i[Symbol.metadata]??null):void 0;s=[L({reflect:!0,type:String})],c=[L({reflect:!0,type:String})],br(h,null,s,{kind:"accessor",name:"alignment",static:!1,private:!1,access:{has:_=>"alignment"in _,get:_=>_.alignment,set:(_,k)=>{_.alignment=k}},metadata:b},n,a),br(h,null,c,{kind:"accessor",name:"distribution",static:!1,private:!1,access:{has:_=>"distribution"in _,get:_=>_.distribution,set:(_,k)=>{_.distribution=k}},metadata:b},l,d),br(null,t={value:r},e,{kind:"class",name:r.name,metadata:b},null,u),r=t.value,b&&Object.defineProperty(r,Symbol.metadata,{enumerable:!0,configurable:!0,writable:!0,value:b})})(),h.styles=[re,Y`
      * {
        box-sizing: border-box;
      }

      :host {
        display: flex;
        flex: var(--weight);
      }

      section {
        display: flex;
        flex-direction: column;
        min-width: 100%;
        height: 100%;
      }

      :host([alignment="start"]) section {
        align-items: start;
      }

      :host([alignment="center"]) section {
        align-items: center;
      }

      :host([alignment="end"]) section {
        align-items: end;
      }

      :host([alignment="stretch"]) section {
        align-items: stretch;
      }

      :host([distribution="start"]) section {
        justify-content: start;
      }

      :host([distribution="center"]) section {
        justify-content: center;
      }

      :host([distribution="end"]) section {
        justify-content: end;
      }

      :host([distribution="spaceBetween"]) section {
        justify-content: space-between;
      }

      :host([distribution="spaceAround"]) section {
        justify-content: space-around;
      }

      :host([distribution="spaceEvenly"]) section {
        justify-content: space-evenly;
      }
    `],It(r,u),r})();var Ot=function(e,t,u,r,i,s){function n(_){if(_!==void 0&&typeof _!="function")throw new TypeError("Function expected");return _}for(var a=r.kind,c=a==="getter"?"get":a==="setter"?"set":"value",l=!t&&e?r.static?e:e.prototype:null,d=t||(l?Object.getOwnPropertyDescriptor(l,r.name):{}),o,p=!1,h=u.length-1;h>=0;h--){var f={};for(var m in r)f[m]=m==="access"?{}:r[m];for(var m in r.access)f.access[m]=r.access[m];f.addInitializer=function(_){if(p)throw new TypeError("Cannot add initializers after decoration has completed");s.push(n(_||null))};var b=(0,u[h])(a==="accessor"?{get:d.get,set:d.set}:d[c],f);if(a==="accessor"){if(b===void 0)continue;if(b===null||typeof b!="object")throw new TypeError("Object expected");(o=n(b.get))&&(d.get=o),(o=n(b.set))&&(d.set=o),(o=n(b.init))&&i.unshift(o)}else(o=n(b))&&(a==="field"?i.unshift(o):d[c]=o)}l&&Object.defineProperty(l,r.name,d),p=!0},Te=function(e,t,u){for(var r=arguments.length>2,i=0;i<t.length;i++)u=r?t[i].call(e,u):t[i].call(e);return r?u:void 0};(()=>{var _,k,v,y,g,on,Cu,wu,cn,at,jr,E;let e=[X("a2ui-datetimeinput")],t,u=[],r,i=ie,s,n=[],a=[],c,l=[],d=[],o,p=[],h=[],f,m=[],b=[];return E=class extends i{constructor(){super(...arguments);T(this,g);T(this,_,Te(this,n,null));T(this,k,(Te(this,a),Te(this,l,null)));T(this,v,(Te(this,d),Te(this,p,!0)));T(this,y,(Te(this,h),Te(this,m,!0)));Te(this,b)}get value(){return A(this,_)}set value($){N(this,_,$)}get label(){return A(this,k)}set label($){N(this,k,$)}get enableDate(){return A(this,v)}set enableDate($){N(this,v,$)}get enableTime(){return A(this,y)}set enableTime($){N(this,y,$)}render(){if(this.value&&typeof this.value=="object"){if("literalString"in this.value&&this.value.literalString)return R(this,g,Cu).call(this,this.value.literalString);if("literal"in this.value&&this.value.literal!==void 0)return R(this,g,Cu).call(this,this.value.literal);if(this.value&&"path"in this.value&&this.value.path){if(!this.processor||!this.component)return D`(no model)`;const $=this.processor.getData(this.component,this.value.path,this.surfaceId??K.DEFAULT_SURFACE_ID);return typeof $!="string"?D`(invalid)`:R(this,g,Cu).call(this,$)}}return O}},_=new WeakMap,k=new WeakMap,v=new WeakMap,y=new WeakMap,g=new WeakSet,on=function($){!this.value||!this.processor||"path"in this.value&&this.value.path&&this.processor.setData(this.component,this.value.path,$,this.surfaceId??K.DEFAULT_SURFACE_ID)},Cu=function($){var I,j;return D`<section
      class=${W(this.theme.components.DateTimeInput.container)}
    >
      <label
        for="data"
        class=${W(this.theme.components.DateTimeInput.label)}
        >${R(this,g,jr).call(this)}</label
      >
      <input
        autocomplete="off"
        class=${W(this.theme.components.DateTimeInput.element)}
        style=${(I=this.theme.additionalStyles)!=null&&I.DateTimeInput?oe((j=this.theme.additionalStyles)==null?void 0:j.DateTimeInput):O}
        @input=${he=>{he.target instanceof HTMLInputElement&&R(this,g,on).call(this,he.target.value)}}
        id="data"
        name="data"
        .value=${R(this,g,cn).call(this,$)}
        .placeholder=${R(this,g,jr).call(this)}
        .type=${R(this,g,wu).call(this)}
      />
    </section>`},wu=function(){return this.enableDate&&this.enableTime?"datetime-local":this.enableDate?"date":this.enableTime?"time":"datetime-local"},cn=function($){const I=R(this,g,wu).call(this),j=$?new Date($):null;if(!j||isNaN(j.getTime()))return"";const he=R(this,g,at).call(this,j.getFullYear()),ge=R(this,g,at).call(this,j.getMonth()+1),ye=R(this,g,at).call(this,j.getDate()),V=R(this,g,at).call(this,j.getHours()),du=R(this,g,at).call(this,j.getMinutes());return I==="date"?`${he}-${ge}-${ye}`:I==="time"?`${V}:${du}`:`${he}-${ge}-${ye}T${V}:${du}`},at=function($){return $.toString().padStart(2,"0")},jr=function(){const $=R(this,g,wu).call(this);return $==="date"?"Date":$==="time"?"Time":"Date & Time"},r=E,(()=>{const $=typeof Symbol=="function"&&Symbol.metadata?Object.create(i[Symbol.metadata]??null):void 0;s=[L()],c=[L()],o=[L({reflect:!1,type:Boolean})],f=[L({reflect:!1,type:Boolean})],Ot(E,null,s,{kind:"accessor",name:"value",static:!1,private:!1,access:{has:I=>"value"in I,get:I=>I.value,set:(I,j)=>{I.value=j}},metadata:$},n,a),Ot(E,null,c,{kind:"accessor",name:"label",static:!1,private:!1,access:{has:I=>"label"in I,get:I=>I.label,set:(I,j)=>{I.label=j}},metadata:$},l,d),Ot(E,null,o,{kind:"accessor",name:"enableDate",static:!1,private:!1,access:{has:I=>"enableDate"in I,get:I=>I.enableDate,set:(I,j)=>{I.enableDate=j}},metadata:$},p,h),Ot(E,null,f,{kind:"accessor",name:"enableTime",static:!1,private:!1,access:{has:I=>"enableTime"in I,get:I=>I.enableTime,set:(I,j)=>{I.enableTime=j}},metadata:$},m,b),Ot(null,t={value:r},e,{kind:"class",name:r.name,metadata:$},null,u),r=t.value,$&&Object.defineProperty(r,Symbol.metadata,{enumerable:!0,configurable:!0,writable:!0,value:$})})(),E.styles=[re,Y`
      * {
        box-sizing: border-box;
      }

      :host {
        display: block;
        flex: var(--weight);
        min-height: 0;
        overflow: auto;
      }

      input {
        display: block;
        border-radius: 8px;
        padding: 8px;
        border: 1px solid #ccc;
        width: 100%;
      }
    `],Te(r,u),r})();var yc=function(e,t,u,r,i,s){function n(_){if(_!==void 0&&typeof _!="function")throw new TypeError("Function expected");return _}for(var a=r.kind,c=a==="getter"?"get":a==="setter"?"set":"value",l=!t&&e?r.static?e:e.prototype:null,d=t||(l?Object.getOwnPropertyDescriptor(l,r.name):{}),o,p=!1,h=u.length-1;h>=0;h--){var f={};for(var m in r)f[m]=m==="access"?{}:r[m];for(var m in r.access)f.access[m]=r.access[m];f.addInitializer=function(_){if(p)throw new TypeError("Cannot add initializers after decoration has completed");s.push(n(_||null))};var b=(0,u[h])(a==="accessor"?{get:d.get,set:d.set}:d[c],f);if(a==="accessor"){if(b===void 0)continue;if(b===null||typeof b!="object")throw new TypeError("Object expected");(o=n(b.get))&&(d.get=o),(o=n(b.set))&&(d.set=o),(o=n(b.init))&&i.unshift(o)}else(o=n(b))&&(a==="field"?i.unshift(o):d[c]=o)}l&&Object.defineProperty(l,r.name,d),p=!0},xc=function(e,t,u){for(var r=arguments.length>2,i=0;i<t.length;i++)u=r?t[i].call(e,u):t[i].call(e);return r?u:void 0};(()=>{var s;let e=[X("a2ui-divider")],t,u=[],r,i=ie;return s=class extends i{render(){var a,c;return D`<hr
      class=${W(this.theme.components.Divider)}
      style=${(a=this.theme.additionalStyles)!=null&&a.Divider?oe((c=this.theme.additionalStyles)==null?void 0:c.Divider):O}
    />`}},r=s,(()=>{const a=typeof Symbol=="function"&&Symbol.metadata?Object.create(i[Symbol.metadata]??null):void 0;yc(null,t={value:r},e,{kind:"class",name:r.name,metadata:a},null,u),r=t.value,a&&Object.defineProperty(r,Symbol.metadata,{enumerable:!0,configurable:!0,writable:!0,value:a})})(),s.styles=[re,Y`
      :host {
        display: block;
        min-height: 0;
        overflow: auto;
      }

      hr {
        height: 1px;
        background: #ccc;
        border: none;
      }
    `],xc(r,u),r})();var Wi=function(e,t,u,r,i,s){function n(_){if(_!==void 0&&typeof _!="function")throw new TypeError("Function expected");return _}for(var a=r.kind,c=a==="getter"?"get":a==="setter"?"set":"value",l=!t&&e?r.static?e:e.prototype:null,d=t||(l?Object.getOwnPropertyDescriptor(l,r.name):{}),o,p=!1,h=u.length-1;h>=0;h--){var f={};for(var m in r)f[m]=m==="access"?{}:r[m];for(var m in r.access)f.access[m]=r.access[m];f.addInitializer=function(_){if(p)throw new TypeError("Cannot add initializers after decoration has completed");s.push(n(_||null))};var b=(0,u[h])(a==="accessor"?{get:d.get,set:d.set}:d[c],f);if(a==="accessor"){if(b===void 0)continue;if(b===null||typeof b!="object")throw new TypeError("Object expected");(o=n(b.get))&&(d.get=o),(o=n(b.set))&&(d.set=o),(o=n(b.init))&&i.unshift(o)}else(o=n(b))&&(a==="field"?i.unshift(o):d[c]=o)}l&&Object.defineProperty(l,r.name,d),p=!0},mr=function(e,t,u){for(var r=arguments.length>2,i=0;i<t.length;i++)u=r?t[i].call(e,u):t[i].call(e);return r?u:void 0};(()=>{var c,l,ln,o;let e=[X("a2ui-icon")],t,u=[],r,i=ie,s,n=[],a=[];return o=class extends i{constructor(){super(...arguments);T(this,l);T(this,c,mr(this,n,null));mr(this,a)}get name(){return A(this,c)}set name(f){N(this,c,f)}render(){var f,m;return D`<section
      class=${W(this.theme.components.Icon)}
      style=${(f=this.theme.additionalStyles)!=null&&f.Icon?oe((m=this.theme.additionalStyles)==null?void 0:m.Icon):O}
    >
      ${R(this,l,ln).call(this)}
    </section>`}},c=new WeakMap,l=new WeakSet,ln=function(){if(!this.name)return O;const f=m=>(m=m.replace(/([A-Z])/gm,"_$1").toLocaleLowerCase(),D`<span class="g-icon">${m}</span>`);if(this.name&&typeof this.name=="object"){if("literalString"in this.name){const m=this.name.literalString??"";return f(m)}else if("literal"in this.name){const m=this.name.literal??"";return f(m)}else if(this.name&&"path"in this.name&&this.name.path){if(!this.processor||!this.component)return D`(no model)`;const m=this.processor.getData(this.component,this.name.path,this.surfaceId??K.DEFAULT_SURFACE_ID);return m?typeof m!="string"?D`Invalid icon name`:f(m):D`Invalid icon name`}}return D`(empty)`},r=o,(()=>{const f=typeof Symbol=="function"&&Symbol.metadata?Object.create(i[Symbol.metadata]??null):void 0;s=[L()],Wi(o,null,s,{kind:"accessor",name:"name",static:!1,private:!1,access:{has:m=>"name"in m,get:m=>m.name,set:(m,b)=>{m.name=b}},metadata:f},n,a),Wi(null,t={value:r},e,{kind:"class",name:r.name,metadata:f},null,u),r=t.value,f&&Object.defineProperty(r,Symbol.metadata,{enumerable:!0,configurable:!0,writable:!0,value:f})})(),o.styles=[re,Y`
      * {
        box-sizing: border-box;
      }

      :host {
        display: block;
        flex: var(--weight);
        min-height: 0;

      }

      .g-icon {
        font-family: 'Material Symbols Outlined';
        font-weight: normal;
        font-style: normal;
        font-size: 24px;
        display: inline-block;
        line-height: 1;
        text-transform: none;
        letter-spacing: normal;
        word-wrap: normal;
        white-space: nowrap;
        direction: ltr;
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
        -moz-osx-font-smoothing: grayscale;
        font-feature-settings: 'liga';
      }
    `],mr(r,u),r})();const Kt=class Kt extends CustomEvent{constructor(t,u){super(Kt.EVENT_NAME,{bubbles:!0,composed:!0,...u,detail:{...t,eventType:Kt.EVENT_NAME}})}};Kt.EVENT_NAME="a2ui-validation-input";let Br=Kt;const Ve=(e=null)=>new De.State(e,{equals:()=>!1}),vc=new Set([Symbol.iterator,"concat","entries","every","filter","find","findIndex","flat","flatMap","forEach","includes","indexOf","join","keys","lastIndexOf","map","reduce","reduceRight","slice","some","values"]),Cc=new Set(["fill","push","unshift"]);function Gi(e){if(typeof e=="symbol")return null;const t=Number(e);return isNaN(t)?null:t%1===0?t:null}var Le,ht,vt,dn,fn;const lt=class lt{constructor(t=[]){T(this,vt);T(this,Le,Ve());T(this,ht,new Map);let u=t.slice(),r=this,i=new Map,s=!1;return new Proxy(u,{get(n,a){var l;let c=Gi(a);if(c!==null)return R(l=r,vt,dn).call(l,c),A(r,Le).get(),n[c];if(a==="length")return s?s=!1:A(r,Le).get(),n[a];if(Cc.has(a)&&(s=!0),vc.has(a)){let d=i.get(a);return d===void 0&&(d=(...o)=>(A(r,Le).get(),n[a](...o)),i.set(a,d)),d}return n[a]},set(n,a,c){var d;n[a]=c;let l=Gi(a);return l!==null?(R(d=r,vt,fn).call(d,l),A(r,Le).set(null)):a==="length"&&A(r,Le).set(null),!0},getPrototypeOf(){return lt.prototype}})}static from(t,u,r){return u?new lt(Array.from(t,u,r)):new lt(Array.from(t))}static of(...t){return new lt(t)}};Le=new WeakMap,ht=new WeakMap,vt=new WeakSet,dn=function(t){let u=A(this,ht).get(t);u===void 0&&(u=Ve(),A(this,ht).set(t,u)),u.get()},fn=function(t){const u=A(this,ht).get(t);u&&u.set(null)};let Iu=lt;Object.setPrototypeOf(Iu.prototype,Array.prototype);class hn{constructor(t){We(this,"collection",Ve());We(this,"storages",new Map);We(this,"vals");this.vals=t?new Map(t):new Map}readStorageFor(t){const{storages:u}=this;let r=u.get(t);r===void 0&&(r=Ve(),u.set(t,r)),r.get()}dirtyStorageFor(t){const u=this.storages.get(t);u&&u.set(null)}get(t){return this.readStorageFor(t),this.vals.get(t)}has(t){return this.readStorageFor(t),this.vals.has(t)}entries(){return this.collection.get(),this.vals.entries()}keys(){return this.collection.get(),this.vals.keys()}values(){return this.collection.get(),this.vals.values()}forEach(t){this.collection.get(),this.vals.forEach(t)}get size(){return this.collection.get(),this.vals.size}[Symbol.iterator](){return this.collection.get(),this.vals[Symbol.iterator]()}get[Symbol.toStringTag](){return this.vals[Symbol.toStringTag]}set(t,u){return this.dirtyStorageFor(t),this.collection.set(null),this.vals.set(t,u),this}delete(t){return this.dirtyStorageFor(t),this.collection.set(null),this.vals.delete(t)}clear(){this.storages.forEach(t=>t.set(null)),this.collection.set(null),this.vals.clear()}}Object.setPrototypeOf(hn.prototype,Map.prototype);var pt,ru,Ce,Ur,qr,Vr;const Ru=class Ru{constructor(t={}){T(this,Ce);T(this,pt,new Map);T(this,ru,Ve());let u=Object.getPrototypeOf(t),r=Object.getOwnPropertyDescriptors(t),i=Object.create(u);for(let n in r)Object.defineProperty(i,n,r[n]);let s=this;return new Proxy(i,{get(n,a,c){var l;return R(l=s,Ce,Ur).call(l,a),Reflect.get(n,a,c)},has(n,a){var c;return R(c=s,Ce,Ur).call(c,a),a in n},ownKeys(n){return A(s,ru).get(),Reflect.ownKeys(n)},set(n,a,c,l){var o,p;let d=Reflect.set(n,a,c,l);return R(o=s,Ce,qr).call(o,a),R(p=s,Ce,Vr).call(p),d},deleteProperty(n,a){var c,l;return a in n&&(delete n[a],R(c=s,Ce,qr).call(c,a),R(l=s,Ce,Vr).call(l)),!0},getPrototypeOf(){return Ru.prototype}})}static fromEntries(t){return new Ru(Object.fromEntries(t))}};pt=new WeakMap,ru=new WeakMap,Ce=new WeakSet,Ur=function(t){let u=A(this,pt).get(t);u===void 0&&(u=Ve(),A(this,pt).set(t,u)),u.get()},qr=function(t){const u=A(this,pt).get(t);u&&u.set(null)},Vr=function(){A(this,ru).set(null)};let Lr=Ru;const wc=Lr;class pn{constructor(t){We(this,"collection",Ve());We(this,"storages",new Map);We(this,"vals");this.vals=new Set(t)}storageFor(t){const u=this.storages;let r=u.get(t);return r===void 0&&(r=Ve(),u.set(t,r)),r}dirtyStorageFor(t){const u=this.storages.get(t);u&&u.set(null)}has(t){return this.storageFor(t).get(),this.vals.has(t)}entries(){return this.collection.get(),this.vals.entries()}keys(){return this.collection.get(),this.vals.keys()}values(){return this.collection.get(),this.vals.values()}forEach(t){this.collection.get(),this.vals.forEach(t)}get size(){return this.collection.get(),this.vals.size}[Symbol.iterator](){return this.collection.get(),this.vals[Symbol.iterator]()}get[Symbol.toStringTag](){return this.vals[Symbol.toStringTag]}add(t){return this.dirtyStorageFor(t),this.collection.set(null),this.vals.add(t),this}delete(t){return this.dirtyStorageFor(t),this.collection.set(null),this.vals.delete(t)}clear(){this.storages.forEach(t=>t.set(null)),this.collection.set(null),this.vals.clear()}}Object.setPrototypeOf(pn.prototype,Set.prototype);function kc(){return new K({arrayCtor:Iu,mapCtor:hn,objCtor:wc,setCtor:pn})}const $c={createSignalA2uiMessageProcessor:kc,A2uiMessageProcessor:K,Guards:hc};var pu=function(e,t,u,r,i,s){function n(_){if(_!==void 0&&typeof _!="function")throw new TypeError("Function expected");return _}for(var a=r.kind,c=a==="getter"?"get":a==="setter"?"set":"value",l=!t&&e?r.static?e:e.prototype:null,d=t||(l?Object.getOwnPropertyDescriptor(l,r.name):{}),o,p=!1,h=u.length-1;h>=0;h--){var f={};for(var m in r)f[m]=m==="access"?{}:r[m];for(var m in r.access)f.access[m]=r.access[m];f.addInitializer=function(_){if(p)throw new TypeError("Cannot add initializers after decoration has completed");s.push(n(_||null))};var b=(0,u[h])(a==="accessor"?{get:d.get,set:d.set}:d[c],f);if(a==="accessor"){if(b===void 0)continue;if(b===null||typeof b!="object")throw new TypeError("Object expected");(o=n(b.get))&&(d.get=o),(o=n(b.set))&&(d.set=o),(o=n(b.init))&&i.unshift(o)}else(o=n(b))&&(a==="field"?i.unshift(o):d[c]=o)}l&&Object.defineProperty(l,r.name,d),p=!0},Ke=function(e,t,u){for(var r=arguments.length>2,i=0;i<t.length;i++)u=r?t[i].call(e,u):t[i].call(e);return r?u:void 0};(()=>{var f,m,b,_,bn,v;let e=[X("a2ui-image")],t,u=[],r,i=ie,s,n=[],a=[],c,l=[],d=[],o,p=[],h=[];return v=class extends i{constructor(){super(...arguments);T(this,_);T(this,f,Ke(this,n,null));T(this,m,(Ke(this,a),Ke(this,l,null)));T(this,b,(Ke(this,d),Ke(this,p,null)));Ke(this,h)}get url(){return A(this,f)}set url(w){N(this,f,w)}get usageHint(){return A(this,m)}set usageHint(w){N(this,m,w)}get fit(){return A(this,b)}set fit(w){N(this,b,w)}render(){var z;const w=ci(this.theme.components.Image.all,this.usageHint?this.theme.components.Image[this.usageHint]:{});return D`<section
      class=${W(w)}
      style=${oe({...((z=this.theme.additionalStyles)==null?void 0:z.Image)??{},"--object-fit":this.fit??"fill"})}
    >
      ${R(this,_,bn).call(this)}
    </section>`}},f=new WeakMap,m=new WeakMap,b=new WeakMap,_=new WeakSet,bn=function(){if(!this.url)return O;const w=z=>D`<img src=${z} />`;if(this.url&&typeof this.url=="object"){if("literalString"in this.url){const z=this.url.literalString??"";return w(z)}else if("literal"in this.url){const z=this.url.literal??"";return w(z)}else if(this.url&&"path"in this.url&&this.url.path){if(!this.processor||!this.component)return D`(no model)`;const z=this.processor.getData(this.component,this.url.path,this.surfaceId??K.DEFAULT_SURFACE_ID);return z?typeof z!="string"?D`Invalid image URL`:w(z):D`Invalid image URL`}}return D`(empty)`},r=v,(()=>{const w=typeof Symbol=="function"&&Symbol.metadata?Object.create(i[Symbol.metadata]??null):void 0;s=[L()],c=[L()],o=[L()],pu(v,null,s,{kind:"accessor",name:"url",static:!1,private:!1,access:{has:z=>"url"in z,get:z=>z.url,set:(z,P)=>{z.url=P}},metadata:w},n,a),pu(v,null,c,{kind:"accessor",name:"usageHint",static:!1,private:!1,access:{has:z=>"usageHint"in z,get:z=>z.usageHint,set:(z,P)=>{z.usageHint=P}},metadata:w},l,d),pu(v,null,o,{kind:"accessor",name:"fit",static:!1,private:!1,access:{has:z=>"fit"in z,get:z=>z.fit,set:(z,P)=>{z.fit=P}},metadata:w},p,h),pu(null,t={value:r},e,{kind:"class",name:r.name,metadata:w},null,u),r=t.value,w&&Object.defineProperty(r,Symbol.metadata,{enumerable:!0,configurable:!0,writable:!0,value:w})})(),v.styles=[re,Y`
      * {
        box-sizing: border-box;
      }

      :host {
        display: block;
        flex: var(--weight);
        min-height: 0;
        overflow: auto;
      }

      img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: var(--object-fit, fill);
      }
    `],Ke(r,u),r})();var Zi=function(e,t,u,r,i,s){function n(_){if(_!==void 0&&typeof _!="function")throw new TypeError("Function expected");return _}for(var a=r.kind,c=a==="getter"?"get":a==="setter"?"set":"value",l=!t&&e?r.static?e:e.prototype:null,d=t||(l?Object.getOwnPropertyDescriptor(l,r.name):{}),o,p=!1,h=u.length-1;h>=0;h--){var f={};for(var m in r)f[m]=m==="access"?{}:r[m];for(var m in r.access)f.access[m]=r.access[m];f.addInitializer=function(_){if(p)throw new TypeError("Cannot add initializers after decoration has completed");s.push(n(_||null))};var b=(0,u[h])(a==="accessor"?{get:d.get,set:d.set}:d[c],f);if(a==="accessor"){if(b===void 0)continue;if(b===null||typeof b!="object")throw new TypeError("Object expected");(o=n(b.get))&&(d.get=o),(o=n(b.set))&&(d.set=o),(o=n(b.init))&&i.unshift(o)}else(o=n(b))&&(a==="field"?i.unshift(o):d[c]=o)}l&&Object.defineProperty(l,r.name,d),p=!0},_r=function(e,t,u){for(var r=arguments.length>2,i=0;i<t.length;i++)u=r?t[i].call(e,u):t[i].call(e);return r?u:void 0};(()=>{var c,l;let e=[X("a2ui-list")],t,u=[],r,i=ie,s,n=[],a=[];return l=class extends i{constructor(){super(...arguments);T(this,c,_r(this,n,"vertical"));_r(this,a)}get direction(){return A(this,c)}set direction(p){N(this,c,p)}render(){var p,h;return D`<section
      class=${W(this.theme.components.List)}
      style=${(p=this.theme.additionalStyles)!=null&&p.List?oe((h=this.theme.additionalStyles)==null?void 0:h.List):O}
    >
      <slot></slot>
    </section>`}},c=new WeakMap,r=l,(()=>{const p=typeof Symbol=="function"&&Symbol.metadata?Object.create(i[Symbol.metadata]??null):void 0;s=[L({reflect:!0,type:String})],Zi(l,null,s,{kind:"accessor",name:"direction",static:!1,private:!1,access:{has:h=>"direction"in h,get:h=>h.direction,set:(h,f)=>{h.direction=f}},metadata:p},n,a),Zi(null,t={value:r},e,{kind:"class",name:r.name,metadata:p},null,u),r=t.value,p&&Object.defineProperty(r,Symbol.metadata,{enumerable:!0,configurable:!0,writable:!0,value:p})})(),l.styles=[re,Y`
      * {
        box-sizing: border-box;
      }

      :host {
        display: block;
        flex: var(--weight);
        min-height: 0;
        overflow: auto;
      }

      :host([direction="vertical"]) section {
        display: grid;
      }

      :host([direction="horizontal"]) section {
        display: flex;
        max-width: 100%;
        overflow-x: scroll;
        overflow-y: hidden;
        scrollbar-width: none;

        > ::slotted(*) {
          flex: 1 0 fit-content;
          max-width: min(80%, 400px);
        }
      }
    `],_r(r,u),r})();var Re=function(e,t,u,r,i,s){function n(_){if(_!==void 0&&typeof _!="function")throw new TypeError("Function expected");return _}for(var a=r.kind,c=a==="getter"?"get":a==="setter"?"set":"value",l=!t&&e?r.static?e:e.prototype:null,d=t||(l?Object.getOwnPropertyDescriptor(l,r.name):{}),o,p=!1,h=u.length-1;h>=0;h--){var f={};for(var m in r)f[m]=m==="access"?{}:r[m];for(var m in r.access)f.access[m]=r.access[m];f.addInitializer=function(_){if(p)throw new TypeError("Cannot add initializers after decoration has completed");s.push(n(_||null))};var b=(0,u[h])(a==="accessor"?{get:d.get,set:d.set}:d[c],f);if(a==="accessor"){if(b===void 0)continue;if(b===null||typeof b!="object")throw new TypeError("Object expected");(o=n(b.get))&&(d.get=o),(o=n(b.set))&&(d.set=o),(o=n(b.init))&&i.unshift(o)}else(o=n(b))&&(a==="field"?i.unshift(o):d[c]=o)}l&&Object.defineProperty(l,r.name,d),p=!0},fe=function(e,t,u){for(var r=arguments.length>2,i=0;i<t.length;i++)u=r?t[i].call(e,u):t[i].call(e);return r?u:void 0};(()=>{var Z,F,E,U,ee,$,I,j,Hr,mn,Wr,V;let e=[X("a2ui-multiplechoice")],t,u=[],r,i=ie,s,n=[],a=[],c,l=[],d=[],o,p=[],h=[],f,m=[],b=[],_,k=[],v=[],y,g=[],w=[],z,P=[],M=[];return V=class extends i{constructor(){super(...arguments);T(this,j);T(this,Z,fe(this,n,null));T(this,F,(fe(this,a),fe(this,l,[])));T(this,E,(fe(this,d),fe(this,p,[])));T(this,U,(fe(this,h),fe(this,m,"checkbox")));T(this,ee,(fe(this,b),fe(this,k,!1)));T(this,$,(fe(this,v),fe(this,g,!1)));T(this,I,(fe(this,w),fe(this,P,"")));fe(this,M)}get description(){return A(this,Z)}set description(S){N(this,Z,S)}get options(){return A(this,F)}set options(S){N(this,F,S)}get selections(){return A(this,E)}set selections(S){N(this,E,S)}get variant(){return A(this,U)}set variant(S){N(this,U,S)}get filterable(){return A(this,ee)}set filterable(S){N(this,ee,S)}get isOpen(){return A(this,$)}set isOpen(S){N(this,$,S)}get filterText(){return A(this,I)}set filterText(S){N(this,I,S)}getCurrentSelections(){if(Array.isArray(this.selections))return this.selections;if(!this.processor||!this.component)return[];const S=this.processor.getData(this.component,this.selections.path,this.surfaceId??K.DEFAULT_SURFACE_ID);return Array.isArray(S)?S:[]}toggleSelection(S){const C=this.getCurrentSelections();C.includes(S)?R(this,j,Hr).call(this,C.filter(x=>x!==S)):R(this,j,Hr).call(this,[...C,S]),this.requestUpdate()}render(){const S=this.getCurrentSelections(),C=this.options.filter(H=>this.filterText?dt(H.label,this.component,this.processor,this.surfaceId).toLowerCase().includes(this.filterText.toLowerCase()):!0);if(this.variant==="chips")return D`
          <div class="container">
            ${this.description?D`<div class="header-text" style="margin-bottom: 8px;">${this.description}</div>`:O}
            ${this.filterable?R(this,j,Wr).call(this):O}
            <div class="chips-container">
              ${C.map(H=>{const te=dt(H.label,this.component,this.processor,this.surfaceId),Ne=S.includes(H.value);return D`
                  <div 
                    class="chip ${Ne?"selected":""}"
                    @click=${At=>{At.stopPropagation(),this.toggleSelection(H.value)}}
                  >
                    ${Ne?R(this,j,mn).call(this):O}
                    <span>${te}</span>
                  </div>
                `})}
            </div>
             ${C.length===0?D`<div style="padding: 8px; font-style: italic; color: var(--md-sys-color-outline);">No options found</div>`:O}
          </div>
        `;const x=S.length,se=x>0?`${x} Selected`:this.description??"Select items";return D`
      <div class="container">
        <div 
          class="dropdown-header" 
          @click=${()=>this.isOpen=!this.isOpen}
        >
          <span class="header-text">${se}</span>
          <span class="chevron ${this.isOpen?"open":""}">
            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor">
              <path d="M480-345 240-585l56-56 184 184 184-184 56 56-240 240Z"/>
            </svg>
          </span>
        </div>

        <div class="dropdown-wrapper ${this.isOpen?"open":""}">
          ${this.filterable?R(this,j,Wr).call(this):O}
          <div class="options-scroll-container">
            ${C.map(H=>{const te=dt(H.label,this.component,this.processor,this.surfaceId),Ne=S.includes(H.value);return D`
                <div 
                  class="option-item ${Ne?"selected":""}"
                  @click=${At=>{At.stopPropagation(),this.toggleSelection(H.value)}}
                >
                  <div class="checkbox">
                    <span class="checkbox-icon">✓</span>
                  </div>
                  <span>${te}</span>
                </div>
              `})}
             ${C.length===0?D`<div style="padding: 16px; text-align: center; color: var(--md-sys-color-outline);">No options found</div>`:O}
          </div>
        </div>
      </div>
    `}},Z=new WeakMap,F=new WeakMap,E=new WeakMap,U=new WeakMap,ee=new WeakMap,$=new WeakMap,I=new WeakMap,j=new WeakSet,Hr=function(S){!this.selections||!this.processor||"path"in this.selections&&this.selections.path&&this.processor.setData(this.component,this.selections.path,S,this.surfaceId??K.DEFAULT_SURFACE_ID)},mn=function(){return D`
      <svg class="chip-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
        <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/>
      </svg>
    `},Wr=function(){return D`
      <div class="filter-container">
        <input 
          type="text" 
          class="filter-input" 
          placeholder="Filter options..." 
          .value=${this.filterText}
          @input=${S=>{const C=S.target;this.filterText=C.value}}
          @click=${S=>S.stopPropagation()}
        />
      </div>
    `},r=V,(()=>{const S=typeof Symbol=="function"&&Symbol.metadata?Object.create(i[Symbol.metadata]??null):void 0;s=[L()],c=[L()],o=[L()],f=[L()],_=[L({type:Boolean})],y=[Pr()],z=[Pr()],Re(V,null,s,{kind:"accessor",name:"description",static:!1,private:!1,access:{has:C=>"description"in C,get:C=>C.description,set:(C,x)=>{C.description=x}},metadata:S},n,a),Re(V,null,c,{kind:"accessor",name:"options",static:!1,private:!1,access:{has:C=>"options"in C,get:C=>C.options,set:(C,x)=>{C.options=x}},metadata:S},l,d),Re(V,null,o,{kind:"accessor",name:"selections",static:!1,private:!1,access:{has:C=>"selections"in C,get:C=>C.selections,set:(C,x)=>{C.selections=x}},metadata:S},p,h),Re(V,null,f,{kind:"accessor",name:"variant",static:!1,private:!1,access:{has:C=>"variant"in C,get:C=>C.variant,set:(C,x)=>{C.variant=x}},metadata:S},m,b),Re(V,null,_,{kind:"accessor",name:"filterable",static:!1,private:!1,access:{has:C=>"filterable"in C,get:C=>C.filterable,set:(C,x)=>{C.filterable=x}},metadata:S},k,v),Re(V,null,y,{kind:"accessor",name:"isOpen",static:!1,private:!1,access:{has:C=>"isOpen"in C,get:C=>C.isOpen,set:(C,x)=>{C.isOpen=x}},metadata:S},g,w),Re(V,null,z,{kind:"accessor",name:"filterText",static:!1,private:!1,access:{has:C=>"filterText"in C,get:C=>C.filterText,set:(C,x)=>{C.filterText=x}},metadata:S},P,M),Re(null,t={value:r},e,{kind:"class",name:r.name,metadata:S},null,u),r=t.value,S&&Object.defineProperty(r,Symbol.metadata,{enumerable:!0,configurable:!0,writable:!0,value:S})})(),V.styles=[re,Y`
      * {
        box-sizing: border-box;
      }

      :host {
        display: block;
        flex: var(--weight);
        min-height: 0;
        position: relative;
        font-family: 'Google Sans', 'Roboto', sans-serif;
      }

      .container {
        display: flex;
        flex-direction: column;
        gap: 4px;
        position: relative;
      }

      /* Header / Trigger */
      .dropdown-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background: var(--md-sys-color-surface);
        border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: 8px;
        cursor: pointer;
        user-select: none;
        transition: background-color 0.2s;
        box-shadow: var(--md-sys-elevation-level1);
      }

      .dropdown-header:hover {
        background: var(--md-sys-color-surface-container-low);
      }

      .header-text {
        font-size: 1rem;
        color: var(--md-sys-color-on-surface);
        font-weight: 400;
      }

      .chevron {
        color: var(--md-sys-color-primary);
        font-size: 1.2rem;
        transition: transform 0.2s ease;
      }

      .chevron.open {
        transform: rotate(180deg);
      }

      /* Dropdown Wrapper */
      .dropdown-wrapper {
        background: var(--md-sys-color-surface);
        border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: 8px;
        box-shadow: var(--md-sys-elevation-level2);
        padding: 0;
        display: none;
        flex-direction: column;
        margin-top: 4px;
        max-height: 300px;
        transition: opacity 0.2s ease-out;
        overflow: hidden; /* contain children */
      }

      .dropdown-wrapper.open {
        display: flex;
        border: 1px solid var(--md-sys-color-outline-variant);
      }

      /* Scrollable Area for Options */
      .options-scroll-container {
        overflow-y: auto;
        flex: 1; /* take remaining height */
        display: flex;
        flex-direction: column;
      }

      /* Filter Input */
      .filter-container {
        padding: 8px;
        border-bottom: 1px solid var(--md-sys-color-outline-variant);
        background: var(--md-sys-color-surface);
        z-index: 1; /* ensure top of stack */
        flex-shrink: 0; /* don't shrink */
      }

      .filter-input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid var(--md-sys-color-outline);
        border-radius: 4px;
        font-family: inherit;
        font-size: 0.9rem;
        background: var(--md-sys-color-surface-container-low);
        color: var(--md-sys-color-on-surface);
      }

      .filter-input:focus {
        outline: none;
        border-color: var(--md-sys-color-primary);
      }

      /* Option Item (Checkbox style) */
      .option-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        cursor: pointer;
        color: var(--md-sys-color-on-surface);
        font-size: 0.95rem;
        transition: background-color 0.1s;
      }

      .option-item:hover {
        background: var(--md-sys-color-surface-container-highest);
      }

      /* Custom Checkbox */
      .checkbox {
        width: 18px;
        height: 18px;
        border: 2px solid var(--md-sys-color-outline);
        border-radius: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        flex-shrink: 0;
      }

      .option-item.selected .checkbox {
        background: var(--md-sys-color-primary);
        border-color: var(--md-sys-color-primary);
      }

      .checkbox-icon {
        color: var(--md-sys-color-on-primary);
        font-size: 14px;
        font-weight: bold;
        opacity: 0;
        transform: scale(0.5);
        transition: all 0.2s;
      }

      .option-item.selected .checkbox-icon {
        opacity: 1;
        transform: scale(1);
      }

      /* Chips Layout */
      .chips-container {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding: 4px 0;
      }

      .chip {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 16px;
        border: 1px solid var(--md-sys-color-outline);
        border-radius: 16px;
        cursor: pointer;
        user-select: none;
        background: var(--md-sys-color-surface);
        color: var(--md-sys-color-on-surface);
        transition: all 0.2s ease;
        font-size: 0.9rem;
      }

      .chip:hover {
        background: var(--md-sys-color-surface-container-high);
      }

      .chip.selected {
        background: var(--md-sys-color-secondary-container);
        color: var(--md-sys-color-on-secondary-container);
        border-color: var(--md-sys-color-secondary-container);
      }
      
      .chip.selected:hover {
         background: var(--md-sys-color-secondary-container-high);
      }

      .chip-icon {
        display: none;
        width: 18px;
        height: 18px;
      }
      
      .chip.selected .chip-icon {
        display: block;
        fill: currentColor;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-8px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `],fe(r,u),r})();const gr=new WeakMap,Ec=kt(class extends Wo{render(e){return O}update(e,[t]){var r;const u=t!==this.G;return u&&this.G!==void 0&&this.rt(void 0),(u||this.lt!==this.ct)&&(this.G=t,this.ht=(r=e.options)==null?void 0:r.host,this.rt(this.ct=e.element)),O}rt(e){if(this.isConnected||(e=void 0),typeof this.G=="function"){const t=this.ht??globalThis;let u=gr.get(t);u===void 0&&(u=new WeakMap,gr.set(t,u)),u.get(this.G)!==void 0&&this.G.call(this.ht,void 0),u.set(this.G,e),e!==void 0&&this.G.call(this.ht,e)}else this.G.value=e}get lt(){var e,t;return typeof this.G=="function"?(e=gr.get(this.ht??globalThis))==null?void 0:e.get(this.G):(t=this.G)==null?void 0:t.value}disconnected(){this.lt===this.ct&&this.rt(void 0)}reconnected(){this.rt(this.ct)}});var yr=function(e,t,u,r,i,s){function n(_){if(_!==void 0&&typeof _!="function")throw new TypeError("Function expected");return _}for(var a=r.kind,c=a==="getter"?"get":a==="setter"?"set":"value",l=!t&&e?r.static?e:e.prototype:null,d=t||(l?Object.getOwnPropertyDescriptor(l,r.name):{}),o,p=!1,h=u.length-1;h>=0;h--){var f={};for(var m in r)f[m]=m==="access"?{}:r[m];for(var m in r.access)f.access[m]=r.access[m];f.addInitializer=function(_){if(p)throw new TypeError("Cannot add initializers after decoration has completed");s.push(n(_||null))};var b=(0,u[h])(a==="accessor"?{get:d.get,set:d.set}:d[c],f);if(a==="accessor"){if(b===void 0)continue;if(b===null||typeof b!="object")throw new TypeError("Object expected");(o=n(b.get))&&(d.get=o),(o=n(b.set))&&(d.set=o),(o=n(b.init))&&i.unshift(o)}else(o=n(b))&&(a==="field"?i.unshift(o):d[c]=o)}l&&Object.defineProperty(l,r.name,d),p=!0},zt=function(e,t,u){for(var r=arguments.length>2,i=0;i<t.length;i++)u=r?t[i].call(e,u):t[i].call(e);return r?u:void 0},bu=function(e,t,u){return typeof t=="symbol"&&(t=t.description?"[".concat(t.description,"]"):""),Object.defineProperty(e,"name",{configurable:!0,value:u?"".concat(u," ",t):t})};(()=>{var h,f,Gr,ku,_,Bt,_n,Zr,g;let e=[X("a2ui-modal")],t,u=[],r,i=ie,s,n=[],a=[],c,l,d=[],o=[],p;return g=class extends i{constructor(){super(...arguments);T(this,f);T(this,h,zt(this,n,!1));T(this,_,(zt(this,a),zt(this,d,null)));zt(this,o)}render(){var P,M;return A(this,f,Gr)?D`<dialog
      class=${W(this.theme.components.Modal.backdrop)}
      @click=${Z=>{const[F]=Z.composedPath();F instanceof HTMLDialogElement&&R(this,f,Zr).call(this)}}
      ${Ec(Z=>{requestAnimationFrame(()=>{!(Z&&Z instanceof HTMLDialogElement)||Z.open||Z.showModal()})})}
    >
      <section
        class=${W(this.theme.components.Modal.element)}
        style=${(P=this.theme.additionalStyles)!=null&&P.Modal?oe((M=this.theme.additionalStyles)==null?void 0:M.Modal):O}
      >
        <div id="controls">
          <button
            @click=${()=>{R(this,f,Zr).call(this)}}
          >
            <span class="g-icon">close</span>
          </button>
        </div>
        <slot></slot>
      </section>
    </dialog>`:D`<section
        @click=${()=>{N(this,f,!0,ku)}}
      >
        <slot name="entry"></slot>
      </section>`}},h=new WeakMap,f=new WeakSet,Gr=function(){return c.get.call(this)},ku=function(P){return c.set.call(this,P)},_=new WeakMap,Bt=function(){return p.get.call(this)},_n=function(P){return p.set.call(this,P)},Zr=function(){A(this,f,Bt)&&(A(this,f,Bt).open&&A(this,f,Bt).close(),N(this,f,!1,ku))},r=g,(()=>{const P=typeof Symbol=="function"&&Symbol.metadata?Object.create(i[Symbol.metadata]??null):void 0;s=[Pr()],l=[ho("dialog")],yr(g,c={get:bu(function(){return A(this,h)},"#showModal","get"),set:bu(function(M){N(this,h,M)},"#showModal","set")},s,{kind:"accessor",name:"#showModal",static:!1,private:!0,access:{has:M=>Ju(f,M),get:M=>A(M,f,Gr),set:(M,Z)=>{N(M,f,Z,ku)}},metadata:P},n,a),yr(g,p={get:bu(function(){return A(this,_)},"#modalRef","get"),set:bu(function(M){N(this,_,M)},"#modalRef","set")},l,{kind:"accessor",name:"#modalRef",static:!1,private:!0,access:{has:M=>Ju(f,M),get:M=>A(M,f,Bt),set:(M,Z)=>{N(M,f,Z,_n)}},metadata:P},d,o),yr(null,t={value:r},e,{kind:"class",name:r.name,metadata:P},null,u),r=t.value,P&&Object.defineProperty(r,Symbol.metadata,{enumerable:!0,configurable:!0,writable:!0,value:P})})(),g.styles=[re,Y`
      * {
        box-sizing: border-box;
      }

      dialog {
        padding: 0 0 0 0;
        border: none;
        background: none;

        & section {
          & #controls {
            display: flex;
            justify-content: end;
            margin-bottom: 4px;

            & button {
              padding: 0;
              background: none;
              width: 20px;
              height: 20px;
              pointer: cursor;
              border: none;
              cursor: pointer;
            }
          }
        }
      }
    `],zt(r,u),r})();var xr=function(e,t,u,r,i,s){function n(_){if(_!==void 0&&typeof _!="function")throw new TypeError("Function expected");return _}for(var a=r.kind,c=a==="getter"?"get":a==="setter"?"set":"value",l=!t&&e?r.static?e:e.prototype:null,d=t||(l?Object.getOwnPropertyDescriptor(l,r.name):{}),o,p=!1,h=u.length-1;h>=0;h--){var f={};for(var m in r)f[m]=m==="access"?{}:r[m];for(var m in r.access)f.access[m]=r.access[m];f.addInitializer=function(_){if(p)throw new TypeError("Cannot add initializers after decoration has completed");s.push(n(_||null))};var b=(0,u[h])(a==="accessor"?{get:d.get,set:d.set}:d[c],f);if(a==="accessor"){if(b===void 0)continue;if(b===null||typeof b!="object")throw new TypeError("Object expected");(o=n(b.get))&&(d.get=o),(o=n(b.set))&&(d.set=o),(o=n(b.init))&&i.unshift(o)}else(o=n(b))&&(a==="field"?i.unshift(o):d[c]=o)}l&&Object.defineProperty(l,r.name,d),p=!0},Pt=function(e,t,u){for(var r=arguments.length>2,i=0;i<t.length;i++)u=r?t[i].call(e,u):t[i].call(e);return r?u:void 0};(()=>{var o,p,h;let e=[X("a2ui-row")],t,u=[],r,i=ie,s,n=[],a=[],c,l=[],d=[];return h=class extends i{constructor(){super(...arguments);T(this,o,Pt(this,n,"stretch"));T(this,p,(Pt(this,a),Pt(this,l,"start")));Pt(this,d)}get alignment(){return A(this,o)}set alignment(b){N(this,o,b)}get distribution(){return A(this,p)}set distribution(b){N(this,p,b)}render(){var b,_;return D`<section
      class=${W(this.theme.components.Row)}
      style=${(b=this.theme.additionalStyles)!=null&&b.Row?oe((_=this.theme.additionalStyles)==null?void 0:_.Row):O}
    >
      <slot></slot>
    </section>`}},o=new WeakMap,p=new WeakMap,r=h,(()=>{const b=typeof Symbol=="function"&&Symbol.metadata?Object.create(i[Symbol.metadata]??null):void 0;s=[L({reflect:!0,type:String})],c=[L({reflect:!0,type:String})],xr(h,null,s,{kind:"accessor",name:"alignment",static:!1,private:!1,access:{has:_=>"alignment"in _,get:_=>_.alignment,set:(_,k)=>{_.alignment=k}},metadata:b},n,a),xr(h,null,c,{kind:"accessor",name:"distribution",static:!1,private:!1,access:{has:_=>"distribution"in _,get:_=>_.distribution,set:(_,k)=>{_.distribution=k}},metadata:b},l,d),xr(null,t={value:r},e,{kind:"class",name:r.name,metadata:b},null,u),r=t.value,b&&Object.defineProperty(r,Symbol.metadata,{enumerable:!0,configurable:!0,writable:!0,value:b})})(),h.styles=[re,Y`
      * {
        box-sizing: border-box;
      }

      :host {
        display: flex;
        flex: var(--weight);
      }

      section {
        display: flex;
        flex-direction: row;
        width: 100%;
        min-height: 100%;
      }

      :host([alignment="start"]) section {
        align-items: start;
      }

      :host([alignment="center"]) section {
        align-items: center;
      }

      :host([alignment="end"]) section {
        align-items: end;
      }

      :host([alignment="stretch"]) section {
        align-items: stretch;
      }

      :host([distribution="start"]) section {
        justify-content: start;
      }

      :host([distribution="center"]) section {
        justify-content: center;
      }

      :host([distribution="end"]) section {
        justify-content: end;
      }

      :host([distribution="spaceBetween"]) section {
        justify-content: space-between;
      }

      :host([distribution="spaceAround"]) section {
        justify-content: space-around;
      }

      :host([distribution="spaceEvenly"]) section {
        justify-content: space-evenly;
      }
    `],Pt(r,u),r})();var it=function(e,t,u,r,i,s){function n(_){if(_!==void 0&&typeof _!="function")throw new TypeError("Function expected");return _}for(var a=r.kind,c=a==="getter"?"get":a==="setter"?"set":"value",l=!t&&e?r.static?e:e.prototype:null,d=t||(l?Object.getOwnPropertyDescriptor(l,r.name):{}),o,p=!1,h=u.length-1;h>=0;h--){var f={};for(var m in r)f[m]=m==="access"?{}:r[m];for(var m in r.access)f.access[m]=r.access[m];f.addInitializer=function(_){if(p)throw new TypeError("Cannot add initializers after decoration has completed");s.push(n(_||null))};var b=(0,u[h])(a==="accessor"?{get:d.get,set:d.set}:d[c],f);if(a==="accessor"){if(b===void 0)continue;if(b===null||typeof b!="object")throw new TypeError("Object expected");(o=n(b.get))&&(d.get=o),(o=n(b.set))&&(d.set=o),(o=n(b.init))&&i.unshift(o)}else(o=n(b))&&(a==="field"?i.unshift(o):d[c]=o)}l&&Object.defineProperty(l,r.name,d),p=!0},xe=function(e,t,u){for(var r=arguments.length>2,i=0;i<t.length;i++)u=r?t[i].call(e,u):t[i].call(e);return r?u:void 0};(()=>{var y,g,w,z,P,M,gn,$u,E;let e=[X("a2ui-slider")],t,u=[],r,i=ie,s,n=[],a=[],c,l=[],d=[],o,p=[],h=[],f,m=[],b=[],_,k=[],v=[];return E=class extends i{constructor(){super(...arguments);T(this,M);T(this,y,xe(this,n,null));T(this,g,(xe(this,a),xe(this,l,0)));T(this,w,(xe(this,d),xe(this,p,0)));T(this,z,(xe(this,h),xe(this,m,null)));T(this,P,(xe(this,b),xe(this,k,null)));xe(this,v)}get value(){return A(this,y)}set value($){N(this,y,$)}get minValue(){return A(this,g)}set minValue($){N(this,g,$)}get maxValue(){return A(this,w)}set maxValue($){N(this,w,$)}get label(){return A(this,z)}set label($){N(this,z,$)}get inputType(){return A(this,P)}set inputType($){N(this,P,$)}render(){if(this.value&&typeof this.value=="object"){if("literalNumber"in this.value&&this.value.literalNumber)return R(this,M,$u).call(this,this.value.literalNumber);if("literal"in this.value&&this.value.literal!==void 0)return R(this,M,$u).call(this,this.value.literal);if(this.value&&"path"in this.value&&this.value.path){if(!this.processor||!this.component)return D`(no processor)`;const $=this.processor.getData(this.component,this.value.path,this.surfaceId??K.DEFAULT_SURFACE_ID);return $===null?D`Invalid value`:typeof $!="string"&&typeof $!="number"?D`Invalid value`:R(this,M,$u).call(this,$)}}return O}},y=new WeakMap,g=new WeakMap,w=new WeakMap,z=new WeakMap,P=new WeakMap,M=new WeakSet,gn=function($){!this.value||!this.processor||"path"in this.value&&this.value.path&&this.processor.setData(this.component,this.value.path,$,this.surfaceId??K.DEFAULT_SURFACE_ID)},$u=function($){var I,j,he;return D`<section
      class=${W(this.theme.components.Slider.container)}
    >
      <label class=${W(this.theme.components.Slider.label)} for="data">
        ${((I=this.label)==null?void 0:I.literalString)??""}
      </label>
      <input
        autocomplete="off"
        class=${W(this.theme.components.Slider.element)}
        style=${(j=this.theme.additionalStyles)!=null&&j.Slider?oe((he=this.theme.additionalStyles)==null?void 0:he.Slider):O}
        @input=${ge=>{ge.target instanceof HTMLInputElement&&R(this,M,gn).call(this,ge.target.value)}}
        id="data"
        name="data"
        .value=${$}
        type="range"
        min=${this.minValue??"0"}
        max=${this.maxValue??"0"}
      />
      <span class=${W(this.theme.components.Slider.label)}
        >${this.value?gc(this.value,this.component,this.processor,this.surfaceId):"0"}</span
      >
    </section>`},r=E,(()=>{const $=typeof Symbol=="function"&&Symbol.metadata?Object.create(i[Symbol.metadata]??null):void 0;s=[L()],c=[L()],o=[L()],f=[L()],_=[L()],it(E,null,s,{kind:"accessor",name:"value",static:!1,private:!1,access:{has:I=>"value"in I,get:I=>I.value,set:(I,j)=>{I.value=j}},metadata:$},n,a),it(E,null,c,{kind:"accessor",name:"minValue",static:!1,private:!1,access:{has:I=>"minValue"in I,get:I=>I.minValue,set:(I,j)=>{I.minValue=j}},metadata:$},l,d),it(E,null,o,{kind:"accessor",name:"maxValue",static:!1,private:!1,access:{has:I=>"maxValue"in I,get:I=>I.maxValue,set:(I,j)=>{I.maxValue=j}},metadata:$},p,h),it(E,null,f,{kind:"accessor",name:"label",static:!1,private:!1,access:{has:I=>"label"in I,get:I=>I.label,set:(I,j)=>{I.label=j}},metadata:$},m,b),it(E,null,_,{kind:"accessor",name:"inputType",static:!1,private:!1,access:{has:I=>"inputType"in I,get:I=>I.inputType,set:(I,j)=>{I.inputType=j}},metadata:$},k,v),it(null,t={value:r},e,{kind:"class",name:r.name,metadata:$},null,u),r=t.value,$&&Object.defineProperty(r,Symbol.metadata,{enumerable:!0,configurable:!0,writable:!0,value:$})})(),E.styles=[re,Y`
      * {
        box-sizing: border-box;
      }

      :host {
        display: block;
        flex: var(--weight);
      }

      input {
        display: block;
        width: 100%;
      }

      .description {
      }
    `],xe(r,u),r})();var Nt=function(e,t,u,r,i,s){function n(_){if(_!==void 0&&typeof _!="function")throw new TypeError("Function expected");return _}for(var a=r.kind,c=a==="getter"?"get":a==="setter"?"set":"value",l=!t&&e?r.static?e:e.prototype:null,d=t||(l?Object.getOwnPropertyDescriptor(l,r.name):{}),o,p=!1,h=u.length-1;h>=0;h--){var f={};for(var m in r)f[m]=m==="access"?{}:r[m];for(var m in r.access)f.access[m]=r.access[m];f.addInitializer=function(_){if(p)throw new TypeError("Cannot add initializers after decoration has completed");s.push(n(_||null))};var b=(0,u[h])(a==="accessor"?{get:d.get,set:d.set}:d[c],f);if(a==="accessor"){if(b===void 0)continue;if(b===null||typeof b!="object")throw new TypeError("Object expected");(o=n(b.get))&&(d.get=o),(o=n(b.set))&&(d.set=o),(o=n(b.init))&&i.unshift(o)}else(o=n(b))&&(a==="field"?i.unshift(o):d[c]=o)}l&&Object.defineProperty(l,r.name,d),p=!0},Ie=function(e,t,u){for(var r=arguments.length>2,i=0;i<t.length;i++)u=r?t[i].call(e,u):t[i].call(e);return r?u:void 0};(()=>{var _,k,v,y,yn,w,xn,P;let e=[X("a2ui-surface")],t,u=[],r,i=ie,s,n=[],a=[],c,l=[],d=[],o,p=[],h=[],f,m=[],b=[];return P=class extends i{constructor(){super(...arguments);T(this,y);T(this,_,Ie(this,n,null));T(this,k,(Ie(this,a),Ie(this,l,null)));T(this,v,(Ie(this,d),Ie(this,p,null)));T(this,w,(Ie(this,h),Ie(this,m,!1)));Ie(this,b)}get surfaceId(){return A(this,_)}set surfaceId(F){N(this,_,F)}get surface(){return A(this,k)}set surface(F){N(this,k,F)}get processor(){return A(this,v)}set processor(F){N(this,v,F)}get enableCustomElements(){return A(this,w)}set enableCustomElements(F){N(this,w,F)}render(){return this.surface?D`${[R(this,y,yn).call(this),R(this,y,xn).call(this)]}`:O}},_=new WeakMap,k=new WeakMap,v=new WeakMap,y=new WeakSet,yn=function(){var F;return(F=this.surface)!=null&&F.styles.logoUrl?D`<div id="surface-logo">
      <img src=${this.surface.styles.logoUrl} />
    </div>`:O},w=new WeakMap,xn=function(){var E,U;const F={};if((E=this.surface)!=null&&E.styles)for(const[ee,$]of Object.entries(this.surface.styles))switch(ee){case"primaryColor":{F["--p-100"]="#ffffff",F["--p-99"]=`color-mix(in srgb, ${$} 2%, white 98%)`,F["--p-98"]=`color-mix(in srgb, ${$} 4%, white 96%)`,F["--p-95"]=`color-mix(in srgb, ${$} 10%, white 90%)`,F["--p-90"]=`color-mix(in srgb, ${$} 20%, white 80%)`,F["--p-80"]=`color-mix(in srgb, ${$} 40%, white 60%)`,F["--p-70"]=`color-mix(in srgb, ${$} 60%, white 40%)`,F["--p-60"]=`color-mix(in srgb, ${$} 80%, white 20%)`,F["--p-50"]=$,F["--p-40"]=`color-mix(in srgb, ${$} 80%, black 20%)`,F["--p-35"]=`color-mix(in srgb, ${$} 70%, black 30%)`,F["--p-30"]=`color-mix(in srgb, ${$} 60%, black 40%)`,F["--p-25"]=`color-mix(in srgb, ${$} 50%, black 50%)`,F["--p-20"]=`color-mix(in srgb, ${$} 40%, black 60%)`,F["--p-15"]=`color-mix(in srgb, ${$} 30%, black 70%)`,F["--p-10"]=`color-mix(in srgb, ${$} 20%, black 80%)`,F["--p-5"]=`color-mix(in srgb, ${$} 10%, black 90%)`,F["--0"]="#00000";break}case"font":{F["--font-family"]=$,F["--font-family-flex"]=$;break}}return D`<a2ui-root
      style=${oe(F)}
      .surfaceId=${this.surfaceId}
      .processor=${this.processor}
      .childComponents=${(U=this.surface)!=null&&U.componentTree?[this.surface.componentTree]:null}
      .enableCustomElements=${this.enableCustomElements}
    ></a2ui-root>`},r=P,(()=>{const F=typeof Symbol=="function"&&Symbol.metadata?Object.create(i[Symbol.metadata]??null):void 0;s=[L()],c=[L()],o=[L()],f=[L()],Nt(P,null,s,{kind:"accessor",name:"surfaceId",static:!1,private:!1,access:{has:E=>"surfaceId"in E,get:E=>E.surfaceId,set:(E,U)=>{E.surfaceId=U}},metadata:F},n,a),Nt(P,null,c,{kind:"accessor",name:"surface",static:!1,private:!1,access:{has:E=>"surface"in E,get:E=>E.surface,set:(E,U)=>{E.surface=U}},metadata:F},l,d),Nt(P,null,o,{kind:"accessor",name:"processor",static:!1,private:!1,access:{has:E=>"processor"in E,get:E=>E.processor,set:(E,U)=>{E.processor=U}},metadata:F},p,h),Nt(P,null,f,{kind:"accessor",name:"enableCustomElements",static:!1,private:!1,access:{has:E=>"enableCustomElements"in E,get:E=>E.enableCustomElements,set:(E,U)=>{E.enableCustomElements=U}},metadata:F},m,b),Nt(null,t={value:r},e,{kind:"class",name:r.name,metadata:F},null,u),r=t.value,F&&Object.defineProperty(r,Symbol.metadata,{enumerable:!0,configurable:!0,writable:!0,value:F})})(),P.styles=[Y`
      :host {
        display: flex;
        min-height: 0;
        max-height: 100%;
        flex-direction: column;
        gap: 16px;
      }

      #surface-logo {
        display: flex;
        justify-content: center;

        & img {
          width: 50%;
          max-width: 220px;
        }
      }

      a2ui-root {
        flex: 1;
      }
    `],Ie(r,u),r})();/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Ki=(e,t,u)=>{const r=new Map;for(let i=t;i<=u;i++)r.set(e[i],i);return r},Dc=kt(class extends $t{constructor(e){if(super(e),e.type!==au.CHILD)throw Error("repeat() can only be used in text expressions")}dt(e,t,u){let r;u===void 0?u=t:t!==void 0&&(r=t);const i=[],s=[];let n=0;for(const a of e)i[n]=r?r(a,n):n,s[n]=u(a,n),n++;return{values:s,keys:i}}render(e,t,u){return this.dt(e,t,u).values}update(e,[t,u,r]){const i=Uo(e),{values:s,keys:n}=this.dt(t,u,r);if(!Array.isArray(i))return this.ut=n,s;const a=this.ut??(this.ut=[]),c=[];let l,d,o=0,p=i.length-1,h=0,f=s.length-1;for(;o<=p&&h<=f;)if(i[o]===null)o++;else if(i[p]===null)p--;else if(a[o]===n[h])c[h]=Ze(i[o],s[h]),o++,h++;else if(a[p]===n[f])c[f]=Ze(i[p],s[f]),p--,f--;else if(a[o]===n[f])c[f]=Ze(i[o],s[f]),Ft(e,c[f+1],i[o]),o++,f--;else if(a[p]===n[h])c[h]=Ze(i[p],s[h]),Ft(e,i[o],i[p]),p--,h++;else if(l===void 0&&(l=Ki(n,h,f),d=Ki(a,o,p)),l.has(a[o]))if(l.has(a[p])){const m=d.get(n[h]),b=m!==void 0?i[m]:null;if(b===null){const _=Ft(e,i[o]);Ze(_,s[h]),c[h]=_}else c[h]=Ze(b,s[h]),Ft(e,i[o],b),i[m]=null;h++}else cr(i[p]),p--;else cr(i[o]),o++;for(;h<=f;){const m=Ft(e,c[f+1]);Ze(m,s[h]),c[h++]=m}for(;o<=p;){const m=i[o++];m!==null&&cr(m)}return this.ut=n,Lo(e,c),ve}});var vr=function(e,t,u,r,i,s){function n(_){if(_!==void 0&&typeof _!="function")throw new TypeError("Function expected");return _}for(var a=r.kind,c=a==="getter"?"get":a==="setter"?"set":"value",l=!t&&e?r.static?e:e.prototype:null,d=t||(l?Object.getOwnPropertyDescriptor(l,r.name):{}),o,p=!1,h=u.length-1;h>=0;h--){var f={};for(var m in r)f[m]=m==="access"?{}:r[m];for(var m in r.access)f.access[m]=r.access[m];f.addInitializer=function(_){if(p)throw new TypeError("Cannot add initializers after decoration has completed");s.push(n(_||null))};var b=(0,u[h])(a==="accessor"?{get:d.get,set:d.set}:d[c],f);if(a==="accessor"){if(b===void 0)continue;if(b===null||typeof b!="object")throw new TypeError("Object expected");(o=n(b.get))&&(d.get=o),(o=n(b.set))&&(d.set=o),(o=n(b.init))&&i.unshift(o)}else(o=n(b))&&(a==="field"?i.unshift(o):d[c]=o)}l&&Object.defineProperty(l,r.name,d),p=!0},Rt=function(e,t,u){for(var r=arguments.length>2,i=0;i<t.length;i++)u=r?t[i].call(e,u):t[i].call(e);return r?u:void 0};(()=>{var o,p,h,vn,Cn,b;let e=[X("a2ui-tabs")],t,u=[],r,i=ie,s,n=[],a=[],c,l=[],d=[];return b=class extends i{constructor(){super(...arguments);T(this,h);T(this,o,Rt(this,n,null));T(this,p,(Rt(this,a),Rt(this,l,0)));Rt(this,d)}get titles(){return A(this,o)}set titles(v){N(this,o,v)}get selected(){return A(this,p)}set selected(v){N(this,p,v)}willUpdate(v){if(super.willUpdate(v),v.has("selected")){for(const g of this.children)g.removeAttribute("slot");const y=this.children[this.selected];if(!y)return;y.slot="current"}}render(){var v,y;return D`<section
      class=${W(this.theme.components.Tabs.container)}
      style=${(v=this.theme.additionalStyles)!=null&&v.Tabs?oe((y=this.theme.additionalStyles)==null?void 0:y.Tabs):O}
    >
      ${[R(this,h,vn).call(this),R(this,h,Cn).call(this)]}
    </section>`}},o=new WeakMap,p=new WeakMap,h=new WeakSet,vn=function(){return this.titles?D`<div
      id="buttons"
      class=${W(this.theme.components.Tabs.element)}
    >
      ${Dc(this.titles,(v,y)=>{let g="";if("literalString"in v&&v.literalString)g=v.literalString;else if("literal"in v&&v.literal!==void 0)g=v.literal;else if(v&&"path"in v&&v.path){if(!this.processor||!this.component)return D`(no model)`;const z=this.processor.getData(this.component,v.path,this.surfaceId??K.DEFAULT_SURFACE_ID);if(typeof z!="string")return D`(invalid)`;g=z}let w;return this.selected===y?w=ci(this.theme.components.Tabs.controls.all,this.theme.components.Tabs.controls.selected):w={...this.theme.components.Tabs.controls.all},D`<button
          ?disabled=${this.selected===y}
          class=${W(w)}
          @click=${()=>{this.selected=y}}
        >
          ${g}
        </button>`})}
    </div>`:O},Cn=function(){return D`<slot name="current"></slot>`},r=b,(()=>{const v=typeof Symbol=="function"&&Symbol.metadata?Object.create(i[Symbol.metadata]??null):void 0;s=[L()],c=[L()],vr(b,null,s,{kind:"accessor",name:"titles",static:!1,private:!1,access:{has:y=>"titles"in y,get:y=>y.titles,set:(y,g)=>{y.titles=g}},metadata:v},n,a),vr(b,null,c,{kind:"accessor",name:"selected",static:!1,private:!1,access:{has:y=>"selected"in y,get:y=>y.selected,set:(y,g)=>{y.selected=g}},metadata:v},l,d),vr(null,t={value:r},e,{kind:"class",name:r.name,metadata:v},null,u),r=t.value,v&&Object.defineProperty(r,Symbol.metadata,{enumerable:!0,configurable:!0,writable:!0,value:v})})(),b.styles=[re,Y`
      :host {
        display: block;
        flex: var(--weight);
      }
    `],Rt(r,u),r})();var Mt=function(e,t,u,r,i,s){function n(_){if(_!==void 0&&typeof _!="function")throw new TypeError("Function expected");return _}for(var a=r.kind,c=a==="getter"?"get":a==="setter"?"set":"value",l=!t&&e?r.static?e:e.prototype:null,d=t||(l?Object.getOwnPropertyDescriptor(l,r.name):{}),o,p=!1,h=u.length-1;h>=0;h--){var f={};for(var m in r)f[m]=m==="access"?{}:r[m];for(var m in r.access)f.access[m]=r.access[m];f.addInitializer=function(_){if(p)throw new TypeError("Cannot add initializers after decoration has completed");s.push(n(_||null))};var b=(0,u[h])(a==="accessor"?{get:d.get,set:d.set}:d[c],f);if(a==="accessor"){if(b===void 0)continue;if(b===null||typeof b!="object")throw new TypeError("Object expected");(o=n(b.get))&&(d.get=o),(o=n(b.set))&&(d.set=o),(o=n(b.init))&&i.unshift(o)}else(o=n(b))&&(a==="field"?i.unshift(o):d[c]=o)}l&&Object.defineProperty(l,r.name,d),p=!0},Oe=function(e,t,u){for(var r=arguments.length>2,i=0;i<t.length;i++)u=r?t[i].call(e,u):t[i].call(e);return r?u:void 0};(()=>{var _,k,v,y,g,wn,kn,P;let e=[X("a2ui-textfield")],t,u=[],r,i=ie,s,n=[],a=[],c,l=[],d=[],o,p=[],h=[],f,m=[],b=[];return P=class extends i{constructor(){super(...arguments);T(this,g);T(this,_,Oe(this,n,null));T(this,k,(Oe(this,a),Oe(this,l,null)));T(this,v,(Oe(this,d),Oe(this,p,null)));T(this,y,(Oe(this,h),Oe(this,m,null)));Oe(this,b)}get text(){return A(this,_)}set text(F){N(this,_,F)}get label(){return A(this,k)}set label(F){N(this,k,F)}get inputType(){return A(this,v)}set inputType(F){N(this,v,F)}get validationRegexp(){return A(this,y)}set validationRegexp(F){N(this,y,F)}render(){const F=dt(this.label,this.component,this.processor,this.surfaceId),E=dt(this.text,this.component,this.processor,this.surfaceId);return R(this,g,kn).call(this,E,F)}},_=new WeakMap,k=new WeakMap,v=new WeakMap,y=new WeakMap,g=new WeakSet,wn=function(F){!this.text||!this.processor||"path"in this.text&&this.text.path&&this.processor.setData(this.component,this.text.path,F,this.surfaceId??K.DEFAULT_SURFACE_ID)},kn=function(F,E){var U,ee;return D` <section
      class=${W(this.theme.components.TextField.container)}
    >
      ${E&&E!==""?D`<label
            class=${W(this.theme.components.TextField.label)}
            for="data"
            >${E}</label
          >`:O}
      <input
        autocomplete="off"
        class=${W(this.theme.components.TextField.element)}
        style=${(U=this.theme.additionalStyles)!=null&&U.TextField?oe((ee=this.theme.additionalStyles)==null?void 0:ee.TextField):O}
        @input=${$=>{$.target instanceof HTMLInputElement&&(this.dispatchEvent(new Br({componentId:this.id,value:$.target.value,valid:$.target.checkValidity()})),R(this,g,wn).call(this,$.target.value))}}
        name="data"
        id="data"
        .value=${F}
        .placeholder=${"Please enter a value"}
        pattern=${this.validationRegexp||O}
        type=${this.inputType==="number"?"number":"text"}
      />
    </section>`},r=P,(()=>{const F=typeof Symbol=="function"&&Symbol.metadata?Object.create(i[Symbol.metadata]??null):void 0;s=[L()],c=[L()],o=[L()],f=[L()],Mt(P,null,s,{kind:"accessor",name:"text",static:!1,private:!1,access:{has:E=>"text"in E,get:E=>E.text,set:(E,U)=>{E.text=U}},metadata:F},n,a),Mt(P,null,c,{kind:"accessor",name:"label",static:!1,private:!1,access:{has:E=>"label"in E,get:E=>E.label,set:(E,U)=>{E.label=U}},metadata:F},l,d),Mt(P,null,o,{kind:"accessor",name:"inputType",static:!1,private:!1,access:{has:E=>"inputType"in E,get:E=>E.inputType,set:(E,U)=>{E.inputType=U}},metadata:F},p,h),Mt(P,null,f,{kind:"accessor",name:"validationRegexp",static:!1,private:!1,access:{has:E=>"validationRegexp"in E,get:E=>E.validationRegexp,set:(E,U)=>{E.validationRegexp=U}},metadata:F},m,b),Mt(null,t={value:r},e,{kind:"class",name:r.name,metadata:F},null,u),r=t.value,F&&Object.defineProperty(r,Symbol.metadata,{enumerable:!0,configurable:!0,writable:!0,value:F})})(),P.styles=[re,Y`
      * {
        box-sizing: border-box;
      }

      :host {
        display: flex;
        flex: var(--weight);
      }

      input {
        display: block;
        width: 100%;
      }
      
      input:invalid {
        border-color: var(--color-error);
        color: var(--color-error);
        outline-color: var(--color-error);
      }
      
      input:invalid:focus {
        border-color: var(--color-error);
        outline-color: var(--color-error);
      }

      label {
        display: block;
        margin-bottom: 4px;
      }
    `],Oe(r,u),r})();/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */let Kr=class extends $t{constructor(t){if(super(t),this.it=O,t.type!==au.CHILD)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(t){if(t===O||t==null)return this._t=void 0,this.it=t;if(t===ve)return t;if(typeof t!="string")throw Error(this.constructor.directiveName+"() called with a non-string value");if(t===this.it)return this._t;this.it=t;const u=[t];return u.raw=u,this._t={_$litType$:this.constructor.resultType,strings:u,values:[]}}};Kr.directiveName="unsafeHTML",Kr.resultType=1;const Ac=kt(Kr),Ji={};function Sc(e){let t=Ji[e];if(t)return t;t=Ji[e]=[];for(let u=0;u<128;u++){const r=String.fromCharCode(u);t.push(r)}for(let u=0;u<e.length;u++){const r=e.charCodeAt(u);t[r]="%"+("0"+r.toString(16).toUpperCase()).slice(-2)}return t}function yt(e,t){typeof t!="string"&&(t=yt.defaultChars);const u=Sc(t);return e.replace(/(%[a-f0-9]{2})+/gi,function(r){let i="";for(let s=0,n=r.length;s<n;s+=3){const a=parseInt(r.slice(s+1,s+3),16);if(a<128){i+=u[a];continue}if((a&224)===192&&s+3<n){const c=parseInt(r.slice(s+4,s+6),16);if((c&192)===128){const l=a<<6&1984|c&63;l<128?i+="��":i+=String.fromCharCode(l),s+=3;continue}}if((a&240)===224&&s+6<n){const c=parseInt(r.slice(s+4,s+6),16),l=parseInt(r.slice(s+7,s+9),16);if((c&192)===128&&(l&192)===128){const d=a<<12&61440|c<<6&4032|l&63;d<2048||d>=55296&&d<=57343?i+="���":i+=String.fromCharCode(d),s+=6;continue}}if((a&248)===240&&s+9<n){const c=parseInt(r.slice(s+4,s+6),16),l=parseInt(r.slice(s+7,s+9),16),d=parseInt(r.slice(s+10,s+12),16);if((c&192)===128&&(l&192)===128&&(d&192)===128){let o=a<<18&1835008|c<<12&258048|l<<6&4032|d&63;o<65536||o>1114111?i+="����":(o-=65536,i+=String.fromCharCode(55296+(o>>10),56320+(o&1023))),s+=9;continue}}i+="�"}return i})}yt.defaultChars=";/?:@&=+$,#";yt.componentChars="";const Qi={};function Fc(e){let t=Qi[e];if(t)return t;t=Qi[e]=[];for(let u=0;u<128;u++){const r=String.fromCharCode(u);/^[0-9a-z]$/i.test(r)?t.push(r):t.push("%"+("0"+u.toString(16).toUpperCase()).slice(-2))}for(let u=0;u<e.length;u++)t[e.charCodeAt(u)]=e[u];return t}function ou(e,t,u){typeof t!="string"&&(u=t,t=ou.defaultChars),typeof u>"u"&&(u=!0);const r=Fc(t);let i="";for(let s=0,n=e.length;s<n;s++){const a=e.charCodeAt(s);if(u&&a===37&&s+2<n&&/^[0-9a-f]{2}$/i.test(e.slice(s+1,s+3))){i+=e.slice(s,s+3),s+=2;continue}if(a<128){i+=r[a];continue}if(a>=55296&&a<=57343){if(a>=55296&&a<=56319&&s+1<n){const c=e.charCodeAt(s+1);if(c>=56320&&c<=57343){i+=encodeURIComponent(e[s]+e[s+1]),s++;continue}}i+="%EF%BF%BD";continue}i+=encodeURIComponent(e[s])}return i}ou.defaultChars=";/?:@&=+$,-_.!~*'()#";ou.componentChars="-_.!~*'()";function li(e){let t="";return t+=e.protocol||"",t+=e.slashes?"//":"",t+=e.auth?e.auth+"@":"",e.hostname&&e.hostname.indexOf(":")!==-1?t+="["+e.hostname+"]":t+=e.hostname||"",t+=e.port?":"+e.port:"",t+=e.pathname||"",t+=e.search||"",t+=e.hash||"",t}function Ou(){this.protocol=null,this.slashes=null,this.auth=null,this.port=null,this.hostname=null,this.hash=null,this.search=null,this.pathname=null}const Tc=/^([a-z0-9.+-]+:)/i,Ic=/:[0-9]*$/,Oc=/^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,zc=["<",">",'"',"`"," ","\r",`
`,"	"],Pc=["{","}","|","\\","^","`"].concat(zc),Nc=["'"].concat(Pc),Yi=["%","/","?",";","#"].concat(Nc),Xi=["/","?","#"],Rc=255,es=/^[+a-z0-9A-Z_-]{0,63}$/,Mc=/^([+a-z0-9A-Z_-]{0,63})(.*)$/,ts={javascript:!0,"javascript:":!0},us={http:!0,https:!0,ftp:!0,gopher:!0,file:!0,"http:":!0,"https:":!0,"ftp:":!0,"gopher:":!0,"file:":!0};function di(e,t){if(e&&e instanceof Ou)return e;const u=new Ou;return u.parse(e,t),u}Ou.prototype.parse=function(e,t){let u,r,i,s=e;if(s=s.trim(),!t&&e.split("#").length===1){const l=Oc.exec(s);if(l)return this.pathname=l[1],l[2]&&(this.search=l[2]),this}let n=Tc.exec(s);if(n&&(n=n[0],u=n.toLowerCase(),this.protocol=n,s=s.substr(n.length)),(t||n||s.match(/^\/\/[^@\/]+@[^@\/]+/))&&(i=s.substr(0,2)==="//",i&&!(n&&ts[n])&&(s=s.substr(2),this.slashes=!0)),!ts[n]&&(i||n&&!us[n])){let l=-1;for(let f=0;f<Xi.length;f++)r=s.indexOf(Xi[f]),r!==-1&&(l===-1||r<l)&&(l=r);let d,o;l===-1?o=s.lastIndexOf("@"):o=s.lastIndexOf("@",l),o!==-1&&(d=s.slice(0,o),s=s.slice(o+1),this.auth=d),l=-1;for(let f=0;f<Yi.length;f++)r=s.indexOf(Yi[f]),r!==-1&&(l===-1||r<l)&&(l=r);l===-1&&(l=s.length),s[l-1]===":"&&l--;const p=s.slice(0,l);s=s.slice(l),this.parseHost(p),this.hostname=this.hostname||"";const h=this.hostname[0]==="["&&this.hostname[this.hostname.length-1]==="]";if(!h){const f=this.hostname.split(/\./);for(let m=0,b=f.length;m<b;m++){const _=f[m];if(_&&!_.match(es)){let k="";for(let v=0,y=_.length;v<y;v++)_.charCodeAt(v)>127?k+="x":k+=_[v];if(!k.match(es)){const v=f.slice(0,m),y=f.slice(m+1),g=_.match(Mc);g&&(v.push(g[1]),y.unshift(g[2])),y.length&&(s=y.join(".")+s),this.hostname=v.join(".");break}}}}this.hostname.length>Rc&&(this.hostname=""),h&&(this.hostname=this.hostname.substr(1,this.hostname.length-2))}const a=s.indexOf("#");a!==-1&&(this.hash=s.substr(a),s=s.slice(0,a));const c=s.indexOf("?");return c!==-1&&(this.search=s.substr(c),s=s.slice(0,c)),s&&(this.pathname=s),us[u]&&this.hostname&&!this.pathname&&(this.pathname=""),this};Ou.prototype.parseHost=function(e){let t=Ic.exec(e);t&&(t=t[0],t!==":"&&(this.port=t.substr(1)),e=e.substr(0,e.length-t.length)),e&&(this.hostname=e)};const jc=Object.freeze(Object.defineProperty({__proto__:null,decode:yt,encode:ou,format:li,parse:di},Symbol.toStringTag,{value:"Module"})),$n=/[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/,En=/[\0-\x1F\x7F-\x9F]/,Bc=/[\xAD\u0600-\u0605\u061C\u06DD\u070F\u0890\u0891\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]|\uD804[\uDCBD\uDCCD]|\uD80D[\uDC30-\uDC3F]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]/,fi=/[!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061D-\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1B7D\u1B7E\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u2E52-\u2E5D\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDEAD\uDF55-\uDF59\uDF86-\uDF89]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5A\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDEB9\uDF3C-\uDF3E]|\uD806[\uDC3B\uDD44-\uDD46\uDDE2\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2\uDF00-\uDF09]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8\uDF43-\uDF4F\uDFFF]|\uD809[\uDC70-\uDC74]|\uD80B[\uDFF1\uDFF2]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDE97-\uDE9A\uDFE2]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]/,Dn=/[\$\+<->\^`\|~\xA2-\xA6\xA8\xA9\xAC\xAE-\xB1\xB4\xB8\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u03F6\u0482\u058D-\u058F\u0606-\u0608\u060B\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u07FE\u07FF\u0888\u09F2\u09F3\u09FA\u09FB\u0AF1\u0B70\u0BF3-\u0BFA\u0C7F\u0D4F\u0D79\u0E3F\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u166D\u17DB\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2044\u2052\u207A-\u207C\u208A-\u208C\u20A0-\u20C0\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2307\u230C-\u2328\u232B-\u2426\u2440-\u244A\u249C-\u24E9\u2500-\u2767\u2794-\u27C4\u27C7-\u27E5\u27F0-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2B73\u2B76-\u2B95\u2B97-\u2BFF\u2CE5-\u2CEA\u2E50\u2E51\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFF\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u309B\u309C\u3190\u3191\u3196-\u319F\u31C0-\u31E3\u31EF\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uAA77-\uAA79\uAB5B\uAB6A\uAB6B\uFB29\uFBB2-\uFBC2\uFD40-\uFD4F\uFDCF\uFDFC-\uFDFF\uFE62\uFE64-\uFE66\uFE69\uFF04\uFF0B\uFF1C-\uFF1E\uFF3E\uFF40\uFF5C\uFF5E\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD]|\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9C\uDDA0\uDDD0-\uDDFC]|\uD802[\uDC77\uDC78\uDEC8]|\uD805\uDF3F|\uD807[\uDFD5-\uDFF1]|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD82F\uDC9C|\uD833[\uDF50-\uDFC3]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDEA\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD838[\uDD4F\uDEFF]|\uD83B[\uDCAC\uDCB0\uDD2E\uDEF0\uDEF1]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD0D-\uDDAD\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED7\uDEDC-\uDEEC\uDEF0-\uDEFC\uDF00-\uDF76\uDF7B-\uDFD9\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDCB0\uDCB1\uDD00-\uDE53\uDE60-\uDE6D\uDE70-\uDE7C\uDE80-\uDE88\uDE90-\uDEBD\uDEBF-\uDEC5\uDECE-\uDEDB\uDEE0-\uDEE8\uDEF0-\uDEF8\uDF00-\uDF92\uDF94-\uDFCA]/,An=/[ \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/,Lc=Object.freeze(Object.defineProperty({__proto__:null,Any:$n,Cc:En,Cf:Bc,P:fi,S:Dn,Z:An},Symbol.toStringTag,{value:"Module"})),Uc=new Uint16Array('ᵁ<Õıʊҝջאٵ۞ޢߖࠏ੊ઑඡ๭༉༦჊ረዡᐕᒝᓃᓟᔥ\0\0\0\0\0\0ᕫᛍᦍᰒᷝ὾⁠↰⊍⏀⏻⑂⠤⤒ⴈ⹈⿎〖㊺㘹㞬㣾㨨㩱㫠㬮ࠀEMabcfglmnoprstu\\bfms¦³¹ÈÏlig耻Æ䃆P耻&䀦cute耻Á䃁reve;䄂Āiyx}rc耻Â䃂;䐐r;쀀𝔄rave耻À䃀pha;䎑acr;䄀d;橓Āgp¡on;䄄f;쀀𝔸plyFunction;恡ing耻Å䃅Ācs¾Ãr;쀀𝒜ign;扔ilde耻Ã䃃ml耻Ä䃄ЀaceforsuåûþėĜĢħĪĀcrêòkslash;或Ŷöø;櫧ed;挆y;䐑ƀcrtąċĔause;戵noullis;愬a;䎒r;쀀𝔅pf;쀀𝔹eve;䋘còēmpeq;扎܀HOacdefhilorsuōőŖƀƞƢƵƷƺǜȕɳɸɾcy;䐧PY耻©䂩ƀcpyŝŢźute;䄆Ā;iŧŨ拒talDifferentialD;慅leys;愭ȀaeioƉƎƔƘron;䄌dil耻Ç䃇rc;䄈nint;戰ot;䄊ĀdnƧƭilla;䂸terDot;䂷òſi;䎧rcleȀDMPTǇǋǑǖot;抙inus;抖lus;投imes;抗oĀcsǢǸkwiseContourIntegral;戲eCurlyĀDQȃȏoubleQuote;思uote;怙ȀlnpuȞȨɇɕonĀ;eȥȦ户;橴ƀgitȯȶȺruent;扡nt;戯ourIntegral;戮ĀfrɌɎ;愂oduct;成nterClockwiseContourIntegral;戳oss;樯cr;쀀𝒞pĀ;Cʄʅ拓ap;才րDJSZacefiosʠʬʰʴʸˋ˗ˡ˦̳ҍĀ;oŹʥtrahd;椑cy;䐂cy;䐅cy;䐏ƀgrsʿ˄ˇger;怡r;憡hv;櫤Āayː˕ron;䄎;䐔lĀ;t˝˞戇a;䎔r;쀀𝔇Āaf˫̧Ācm˰̢riticalȀADGT̖̜̀̆cute;䂴oŴ̋̍;䋙bleAcute;䋝rave;䁠ilde;䋜ond;拄ferentialD;慆Ѱ̽\0\0\0͔͂\0Ѕf;쀀𝔻ƀ;DE͈͉͍䂨ot;惜qual;扐blèCDLRUVͣͲ΂ϏϢϸontourIntegraìȹoɴ͹\0\0ͻ»͉nArrow;懓Āeo·ΤftƀARTΐΖΡrrow;懐ightArrow;懔eåˊngĀLRΫτeftĀARγιrrow;柸ightArrow;柺ightArrow;柹ightĀATϘϞrrow;懒ee;抨pɁϩ\0\0ϯrrow;懑ownArrow;懕erticalBar;戥ǹABLRTaВЪаўѿͼrrowƀ;BUНОТ憓ar;椓pArrow;懵reve;䌑eft˒к\0ц\0ѐightVector;楐eeVector;楞ectorĀ;Bљњ憽ar;楖ightǔѧ\0ѱeeVector;楟ectorĀ;BѺѻ懁ar;楗eeĀ;A҆҇护rrow;憧ĀctҒҗr;쀀𝒟rok;䄐ࠀNTacdfglmopqstuxҽӀӄӋӞӢӧӮӵԡԯԶՒ՝ՠեG;䅊H耻Ð䃐cute耻É䃉ƀaiyӒӗӜron;䄚rc耻Ê䃊;䐭ot;䄖r;쀀𝔈rave耻È䃈ement;戈ĀapӺӾcr;䄒tyɓԆ\0\0ԒmallSquare;旻erySmallSquare;斫ĀgpԦԪon;䄘f;쀀𝔼silon;䎕uĀaiԼՉlĀ;TՂՃ橵ilde;扂librium;懌Āci՗՚r;愰m;橳a;䎗ml耻Ë䃋Āipժկsts;戃onentialE;慇ʀcfiosօֈ֍ֲ׌y;䐤r;쀀𝔉lledɓ֗\0\0֣mallSquare;旼erySmallSquare;斪Ͱֺ\0ֿ\0\0ׄf;쀀𝔽All;戀riertrf;愱cò׋؀JTabcdfgorstר׬ׯ׺؀ؒؖ؛؝أ٬ٲcy;䐃耻>䀾mmaĀ;d׷׸䎓;䏜reve;䄞ƀeiy؇،ؐdil;䄢rc;䄜;䐓ot;䄠r;쀀𝔊;拙pf;쀀𝔾eater̀EFGLSTصلَٖٛ٦qualĀ;Lؾؿ扥ess;招ullEqual;执reater;檢ess;扷lantEqual;橾ilde;扳cr;쀀𝒢;扫ЀAacfiosuڅڋږڛڞڪھۊRDcy;䐪Āctڐڔek;䋇;䁞irc;䄤r;愌lbertSpace;愋ǰگ\0ڲf;愍izontalLine;攀Āctۃۅòکrok;䄦mpńېۘownHumðįqual;扏܀EJOacdfgmnostuۺ۾܃܇܎ܚܞܡܨ݄ݸދޏޕcy;䐕lig;䄲cy;䐁cute耻Í䃍Āiyܓܘrc耻Î䃎;䐘ot;䄰r;愑rave耻Ì䃌ƀ;apܠܯܿĀcgܴܷr;䄪inaryI;慈lieóϝǴ݉\0ݢĀ;eݍݎ戬Āgrݓݘral;戫section;拂isibleĀCTݬݲomma;恣imes;恢ƀgptݿރވon;䄮f;쀀𝕀a;䎙cr;愐ilde;䄨ǫޚ\0ޞcy;䐆l耻Ï䃏ʀcfosuެ޷޼߂ߐĀiyޱ޵rc;䄴;䐙r;쀀𝔍pf;쀀𝕁ǣ߇\0ߌr;쀀𝒥rcy;䐈kcy;䐄΀HJacfosߤߨ߽߬߱ࠂࠈcy;䐥cy;䐌ppa;䎚Āey߶߻dil;䄶;䐚r;쀀𝔎pf;쀀𝕂cr;쀀𝒦րJTaceflmostࠥࠩࠬࡐࡣ঳সে্਷ੇcy;䐉耻<䀼ʀcmnpr࠷࠼ࡁࡄࡍute;䄹bda;䎛g;柪lacetrf;愒r;憞ƀaeyࡗ࡜ࡡron;䄽dil;䄻;䐛Āfsࡨ॰tԀACDFRTUVarࡾࢩࢱࣦ࣠ࣼयज़ΐ४Ānrࢃ࢏gleBracket;柨rowƀ;BR࢙࢚࢞憐ar;懤ightArrow;懆eiling;挈oǵࢷ\0ࣃbleBracket;柦nǔࣈ\0࣒eeVector;楡ectorĀ;Bࣛࣜ懃ar;楙loor;挊ightĀAV࣯ࣵrrow;憔ector;楎Āerँगeƀ;AVउऊऐ抣rrow;憤ector;楚iangleƀ;BEतथऩ抲ar;槏qual;抴pƀDTVषूौownVector;楑eeVector;楠ectorĀ;Bॖॗ憿ar;楘ectorĀ;B॥०憼ar;楒ightáΜs̀EFGLSTॾঋকঝঢভqualGreater;拚ullEqual;扦reater;扶ess;檡lantEqual;橽ilde;扲r;쀀𝔏Ā;eঽা拘ftarrow;懚idot;䄿ƀnpw৔ਖਛgȀLRlr৞৷ਂਐeftĀAR০৬rrow;柵ightArrow;柷ightArrow;柶eftĀarγਊightáοightáϊf;쀀𝕃erĀLRਢਬeftArrow;憙ightArrow;憘ƀchtਾੀੂòࡌ;憰rok;䅁;扪Ѐacefiosuਗ਼੝੠੷੼અઋ઎p;椅y;䐜Ādl੥੯iumSpace;恟lintrf;愳r;쀀𝔐nusPlus;戓pf;쀀𝕄cò੶;䎜ҀJacefostuણધભીଔଙඑ඗ඞcy;䐊cute;䅃ƀaey઴હાron;䅇dil;䅅;䐝ƀgswે૰଎ativeƀMTV૓૟૨ediumSpace;怋hiĀcn૦૘ë૙eryThiî૙tedĀGL૸ଆreaterGreateòٳessLesóੈLine;䀊r;쀀𝔑ȀBnptଢନଷ଺reak;恠BreakingSpace;䂠f;愕ڀ;CDEGHLNPRSTV୕ୖ୪୼஡௫ఄ౞಄ದ೘ൡඅ櫬Āou୛୤ngruent;扢pCap;扭oubleVerticalBar;戦ƀlqxஃஊ஛ement;戉ualĀ;Tஒஓ扠ilde;쀀≂̸ists;戄reater΀;EFGLSTஶஷ஽௉௓௘௥扯qual;扱ullEqual;쀀≧̸reater;쀀≫̸ess;批lantEqual;쀀⩾̸ilde;扵umpń௲௽ownHump;쀀≎̸qual;쀀≏̸eĀfsఊధtTriangleƀ;BEచఛడ拪ar;쀀⧏̸qual;括s̀;EGLSTవశ఼ౄోౘ扮qual;扰reater;扸ess;쀀≪̸lantEqual;쀀⩽̸ilde;扴estedĀGL౨౹reaterGreater;쀀⪢̸essLess;쀀⪡̸recedesƀ;ESಒಓಛ技qual;쀀⪯̸lantEqual;拠ĀeiಫಹverseElement;戌ghtTriangleƀ;BEೋೌ೒拫ar;쀀⧐̸qual;拭ĀquೝഌuareSuĀbp೨೹setĀ;E೰ೳ쀀⊏̸qual;拢ersetĀ;Eഃആ쀀⊐̸qual;拣ƀbcpഓതൎsetĀ;Eഛഞ쀀⊂⃒qual;抈ceedsȀ;ESTലള഻െ抁qual;쀀⪰̸lantEqual;拡ilde;쀀≿̸ersetĀ;E൘൛쀀⊃⃒qual;抉ildeȀ;EFT൮൯൵ൿ扁qual;扄ullEqual;扇ilde;扉erticalBar;戤cr;쀀𝒩ilde耻Ñ䃑;䎝܀Eacdfgmoprstuvලෂ෉෕ෛ෠෧෼ขภยา฿ไlig;䅒cute耻Ó䃓Āiy෎ීrc耻Ô䃔;䐞blac;䅐r;쀀𝔒rave耻Ò䃒ƀaei෮ෲ෶cr;䅌ga;䎩cron;䎟pf;쀀𝕆enCurlyĀDQฎบoubleQuote;怜uote;怘;橔Āclวฬr;쀀𝒪ash耻Ø䃘iŬื฼de耻Õ䃕es;樷ml耻Ö䃖erĀBP๋๠Āar๐๓r;怾acĀek๚๜;揞et;掴arenthesis;揜Ҁacfhilors๿ງຊຏຒດຝະ໼rtialD;戂y;䐟r;쀀𝔓i;䎦;䎠usMinus;䂱Āipຢອncareplanåڝf;愙Ȁ;eio຺ູ໠໤檻cedesȀ;EST່້໏໚扺qual;檯lantEqual;扼ilde;找me;怳Ādp໩໮uct;戏ortionĀ;aȥ໹l;戝Āci༁༆r;쀀𝒫;䎨ȀUfos༑༖༛༟OT耻"䀢r;쀀𝔔pf;愚cr;쀀𝒬؀BEacefhiorsu༾གྷཇའཱིྦྷྪྭ႖ႩႴႾarr;椐G耻®䂮ƀcnrཎནབute;䅔g;柫rĀ;tཛྷཝ憠l;椖ƀaeyཧཬཱron;䅘dil;䅖;䐠Ā;vླྀཹ愜erseĀEUྂྙĀlq྇ྎement;戋uilibrium;懋pEquilibrium;楯r»ཹo;䎡ghtЀACDFTUVa࿁࿫࿳ဢဨၛႇϘĀnr࿆࿒gleBracket;柩rowƀ;BL࿜࿝࿡憒ar;懥eftArrow;懄eiling;按oǵ࿹\0စbleBracket;柧nǔည\0နeeVector;楝ectorĀ;Bဝသ懂ar;楕loor;挋Āerိ၃eƀ;AVဵံြ抢rrow;憦ector;楛iangleƀ;BEၐၑၕ抳ar;槐qual;抵pƀDTVၣၮၸownVector;楏eeVector;楜ectorĀ;Bႂႃ憾ar;楔ectorĀ;B႑႒懀ar;楓Āpuႛ႞f;愝ndImplies;楰ightarrow;懛ĀchႹႼr;愛;憱leDelayed;槴ڀHOacfhimoqstuფჱჷჽᄙᄞᅑᅖᅡᅧᆵᆻᆿĀCcჩხHcy;䐩y;䐨FTcy;䐬cute;䅚ʀ;aeiyᄈᄉᄎᄓᄗ檼ron;䅠dil;䅞rc;䅜;䐡r;쀀𝔖ortȀDLRUᄪᄴᄾᅉownArrow»ОeftArrow»࢚ightArrow»࿝pArrow;憑gma;䎣allCircle;战pf;쀀𝕊ɲᅭ\0\0ᅰt;戚areȀ;ISUᅻᅼᆉᆯ斡ntersection;抓uĀbpᆏᆞsetĀ;Eᆗᆘ抏qual;抑ersetĀ;Eᆨᆩ抐qual;抒nion;抔cr;쀀𝒮ar;拆ȀbcmpᇈᇛሉላĀ;sᇍᇎ拐etĀ;Eᇍᇕqual;抆ĀchᇠህeedsȀ;ESTᇭᇮᇴᇿ扻qual;檰lantEqual;扽ilde;承Tháྌ;我ƀ;esሒሓሣ拑rsetĀ;Eሜም抃qual;抇et»ሓրHRSacfhiorsሾቄ቉ቕ቞ቱቶኟዂወዑORN耻Þ䃞ADE;愢ĀHc቎ቒcy;䐋y;䐦Ābuቚቜ;䀉;䎤ƀaeyብቪቯron;䅤dil;䅢;䐢r;쀀𝔗Āeiቻ኉ǲኀ\0ኇefore;戴a;䎘Ācn኎ኘkSpace;쀀  Space;怉ldeȀ;EFTካኬኲኼ戼qual;扃ullEqual;扅ilde;扈pf;쀀𝕋ipleDot;惛Āctዖዛr;쀀𝒯rok;䅦ૡዷጎጚጦ\0ጬጱ\0\0\0\0\0ጸጽ፷ᎅ\0᏿ᐄᐊᐐĀcrዻጁute耻Ú䃚rĀ;oጇገ憟cir;楉rǣጓ\0጖y;䐎ve;䅬Āiyጞጣrc耻Û䃛;䐣blac;䅰r;쀀𝔘rave耻Ù䃙acr;䅪Ādiፁ፩erĀBPፈ፝Āarፍፐr;䁟acĀekፗፙ;揟et;掵arenthesis;揝onĀ;P፰፱拃lus;抎Āgp፻፿on;䅲f;쀀𝕌ЀADETadps᎕ᎮᎸᏄϨᏒᏗᏳrrowƀ;BDᅐᎠᎤar;椒ownArrow;懅ownArrow;憕quilibrium;楮eeĀ;AᏋᏌ报rrow;憥ownáϳerĀLRᏞᏨeftArrow;憖ightArrow;憗iĀ;lᏹᏺ䏒on;䎥ing;䅮cr;쀀𝒰ilde;䅨ml耻Ü䃜ҀDbcdefosvᐧᐬᐰᐳᐾᒅᒊᒐᒖash;披ar;櫫y;䐒ashĀ;lᐻᐼ抩;櫦Āerᑃᑅ;拁ƀbtyᑌᑐᑺar;怖Ā;iᑏᑕcalȀBLSTᑡᑥᑪᑴar;戣ine;䁼eparator;杘ilde;所ThinSpace;怊r;쀀𝔙pf;쀀𝕍cr;쀀𝒱dash;抪ʀcefosᒧᒬᒱᒶᒼirc;䅴dge;拀r;쀀𝔚pf;쀀𝕎cr;쀀𝒲Ȁfiosᓋᓐᓒᓘr;쀀𝔛;䎞pf;쀀𝕏cr;쀀𝒳ҀAIUacfosuᓱᓵᓹᓽᔄᔏᔔᔚᔠcy;䐯cy;䐇cy;䐮cute耻Ý䃝Āiyᔉᔍrc;䅶;䐫r;쀀𝔜pf;쀀𝕐cr;쀀𝒴ml;䅸ЀHacdefosᔵᔹᔿᕋᕏᕝᕠᕤcy;䐖cute;䅹Āayᕄᕉron;䅽;䐗ot;䅻ǲᕔ\0ᕛoWidtè૙a;䎖r;愨pf;愤cr;쀀𝒵௡ᖃᖊᖐ\0ᖰᖶᖿ\0\0\0\0ᗆᗛᗫᙟ᙭\0ᚕ᚛ᚲᚹ\0ᚾcute耻á䃡reve;䄃̀;Ediuyᖜᖝᖡᖣᖨᖭ戾;쀀∾̳;房rc耻â䃢te肻´̆;䐰lig耻æ䃦Ā;r²ᖺ;쀀𝔞rave耻à䃠ĀepᗊᗖĀfpᗏᗔsym;愵èᗓha;䎱ĀapᗟcĀclᗤᗧr;䄁g;樿ɤᗰ\0\0ᘊʀ;adsvᗺᗻᗿᘁᘇ戧nd;橕;橜lope;橘;橚΀;elmrszᘘᘙᘛᘞᘿᙏᙙ戠;榤e»ᘙsdĀ;aᘥᘦ戡ѡᘰᘲᘴᘶᘸᘺᘼᘾ;榨;榩;榪;榫;榬;榭;榮;榯tĀ;vᙅᙆ戟bĀ;dᙌᙍ抾;榝Āptᙔᙗh;戢»¹arr;捼Āgpᙣᙧon;䄅f;쀀𝕒΀;Eaeiop዁ᙻᙽᚂᚄᚇᚊ;橰cir;橯;扊d;手s;䀧roxĀ;e዁ᚒñᚃing耻å䃥ƀctyᚡᚦᚨr;쀀𝒶;䀪mpĀ;e዁ᚯñʈilde耻ã䃣ml耻ä䃤Āciᛂᛈoninôɲnt;樑ࠀNabcdefiklnoprsu᛭ᛱᜰ᜼ᝃᝈ᝸᝽០៦ᠹᡐᜍ᤽᥈ᥰot;櫭Ācrᛶ᜞kȀcepsᜀᜅᜍᜓong;扌psilon;䏶rime;怵imĀ;e᜚᜛戽q;拍Ŷᜢᜦee;抽edĀ;gᜬᜭ挅e»ᜭrkĀ;t፜᜷brk;掶Āoyᜁᝁ;䐱quo;怞ʀcmprtᝓ᝛ᝡᝤᝨausĀ;eĊĉptyv;榰séᜌnoõēƀahwᝯ᝱ᝳ;䎲;愶een;扬r;쀀𝔟g΀costuvwឍឝឳេ៕៛៞ƀaiuបពរðݠrc;旯p»፱ƀdptឤឨឭot;樀lus;樁imes;樂ɱឹ\0\0ើcup;樆ar;昅riangleĀdu៍្own;施p;斳plus;樄eåᑄåᒭarow;植ƀako៭ᠦᠵĀcn៲ᠣkƀlst៺֫᠂ozenge;槫riangleȀ;dlr᠒᠓᠘᠝斴own;斾eft;旂ight;斸k;搣Ʊᠫ\0ᠳƲᠯ\0ᠱ;斒;斑4;斓ck;斈ĀeoᠾᡍĀ;qᡃᡆ쀀=⃥uiv;쀀≡⃥t;挐Ȁptwxᡙᡞᡧᡬf;쀀𝕓Ā;tᏋᡣom»Ꮜtie;拈؀DHUVbdhmptuvᢅᢖᢪᢻᣗᣛᣬ᣿ᤅᤊᤐᤡȀLRlrᢎᢐᢒᢔ;敗;敔;敖;敓ʀ;DUduᢡᢢᢤᢦᢨ敐;敦;敩;敤;敧ȀLRlrᢳᢵᢷᢹ;敝;敚;敜;教΀;HLRhlrᣊᣋᣍᣏᣑᣓᣕ救;敬;散;敠;敫;敢;敟ox;槉ȀLRlrᣤᣦᣨᣪ;敕;敒;攐;攌ʀ;DUduڽ᣷᣹᣻᣽;敥;敨;攬;攴inus;抟lus;択imes;抠ȀLRlrᤙᤛᤝ᤟;敛;敘;攘;攔΀;HLRhlrᤰᤱᤳᤵᤷ᤻᤹攂;敪;敡;敞;攼;攤;攜Āevģ᥂bar耻¦䂦Ȁceioᥑᥖᥚᥠr;쀀𝒷mi;恏mĀ;e᜚᜜lƀ;bhᥨᥩᥫ䁜;槅sub;柈Ŭᥴ᥾lĀ;e᥹᥺怢t»᥺pƀ;Eeįᦅᦇ;檮Ā;qۜۛೡᦧ\0᧨ᨑᨕᨲ\0ᨷᩐ\0\0᪴\0\0᫁\0\0ᬡᬮ᭍᭒\0᯽\0ᰌƀcpr᦭ᦲ᧝ute;䄇̀;abcdsᦿᧀᧄ᧊᧕᧙戩nd;橄rcup;橉Āau᧏᧒p;橋p;橇ot;橀;쀀∩︀Āeo᧢᧥t;恁îړȀaeiu᧰᧻ᨁᨅǰ᧵\0᧸s;橍on;䄍dil耻ç䃧rc;䄉psĀ;sᨌᨍ橌m;橐ot;䄋ƀdmnᨛᨠᨦil肻¸ƭptyv;榲t脀¢;eᨭᨮ䂢räƲr;쀀𝔠ƀceiᨽᩀᩍy;䑇ckĀ;mᩇᩈ朓ark»ᩈ;䏇r΀;Ecefms᩟᩠ᩢᩫ᪤᪪᪮旋;槃ƀ;elᩩᩪᩭ䋆q;扗eɡᩴ\0\0᪈rrowĀlr᩼᪁eft;憺ight;憻ʀRSacd᪒᪔᪖᪚᪟»ཇ;擈st;抛irc;抚ash;抝nint;樐id;櫯cir;槂ubsĀ;u᪻᪼晣it»᪼ˬ᫇᫔᫺\0ᬊonĀ;eᫍᫎ䀺Ā;qÇÆɭ᫙\0\0᫢aĀ;t᫞᫟䀬;䁀ƀ;fl᫨᫩᫫戁îᅠeĀmx᫱᫶ent»᫩eóɍǧ᫾\0ᬇĀ;dኻᬂot;橭nôɆƀfryᬐᬔᬗ;쀀𝕔oäɔ脀©;sŕᬝr;愗Āaoᬥᬩrr;憵ss;朗Ācuᬲᬷr;쀀𝒸Ābpᬼ᭄Ā;eᭁᭂ櫏;櫑Ā;eᭉᭊ櫐;櫒dot;拯΀delprvw᭠᭬᭷ᮂᮬᯔ᯹arrĀlr᭨᭪;椸;椵ɰ᭲\0\0᭵r;拞c;拟arrĀ;p᭿ᮀ憶;椽̀;bcdosᮏᮐᮖᮡᮥᮨ截rcap;橈Āauᮛᮞp;橆p;橊ot;抍r;橅;쀀∪︀Ȁalrv᮵ᮿᯞᯣrrĀ;mᮼᮽ憷;椼yƀevwᯇᯔᯘqɰᯎ\0\0ᯒreã᭳uã᭵ee;拎edge;拏en耻¤䂤earrowĀlrᯮ᯳eft»ᮀight»ᮽeäᯝĀciᰁᰇoninôǷnt;戱lcty;挭ঀAHabcdefhijlorstuwz᰸᰻᰿ᱝᱩᱵᲊᲞᲬᲷ᳻᳿ᴍᵻᶑᶫᶻ᷆᷍rò΁ar;楥Ȁglrs᱈ᱍ᱒᱔ger;怠eth;愸òᄳhĀ;vᱚᱛ怐»ऊūᱡᱧarow;椏aã̕Āayᱮᱳron;䄏;䐴ƀ;ao̲ᱼᲄĀgrʿᲁr;懊tseq;橷ƀglmᲑᲔᲘ耻°䂰ta;䎴ptyv;榱ĀirᲣᲨsht;楿;쀀𝔡arĀlrᲳᲵ»ࣜ»သʀaegsv᳂͸᳖᳜᳠mƀ;oș᳊᳔ndĀ;ș᳑uit;晦amma;䏝in;拲ƀ;io᳧᳨᳸䃷de脀÷;o᳧ᳰntimes;拇nø᳷cy;䑒cɯᴆ\0\0ᴊrn;挞op;挍ʀlptuwᴘᴝᴢᵉᵕlar;䀤f;쀀𝕕ʀ;emps̋ᴭᴷᴽᵂqĀ;d͒ᴳot;扑inus;戸lus;戔quare;抡blebarwedgåúnƀadhᄮᵝᵧownarrowóᲃarpoonĀlrᵲᵶefôᲴighôᲶŢᵿᶅkaro÷གɯᶊ\0\0ᶎrn;挟op;挌ƀcotᶘᶣᶦĀryᶝᶡ;쀀𝒹;䑕l;槶rok;䄑Ādrᶰᶴot;拱iĀ;fᶺ᠖斿Āah᷀᷃ròЩaòྦangle;榦Āci᷒ᷕy;䑟grarr;柿ऀDacdefglmnopqrstuxḁḉḙḸոḼṉṡṾấắẽỡἪἷὄ὎὚ĀDoḆᴴoôᲉĀcsḎḔute耻é䃩ter;橮ȀaioyḢḧḱḶron;䄛rĀ;cḭḮ扖耻ê䃪lon;払;䑍ot;䄗ĀDrṁṅot;扒;쀀𝔢ƀ;rsṐṑṗ檚ave耻è䃨Ā;dṜṝ檖ot;檘Ȁ;ilsṪṫṲṴ檙nters;揧;愓Ā;dṹṺ檕ot;檗ƀapsẅẉẗcr;䄓tyƀ;svẒẓẕ戅et»ẓpĀ1;ẝẤĳạả;怄;怅怃ĀgsẪẬ;䅋p;怂ĀgpẴẸon;䄙f;쀀𝕖ƀalsỄỎỒrĀ;sỊị拕l;槣us;橱iƀ;lvỚớở䎵on»ớ;䏵ȀcsuvỪỳἋἣĀioữḱrc»Ḯɩỹ\0\0ỻíՈantĀglἂἆtr»ṝess»Ṻƀaeiἒ἖Ἒls;䀽st;扟vĀ;DȵἠD;橸parsl;槥ĀDaἯἳot;打rr;楱ƀcdiἾὁỸr;愯oô͒ĀahὉὋ;䎷耻ð䃰Āmrὓὗl耻ë䃫o;悬ƀcipὡὤὧl;䀡sôծĀeoὬὴctatioîՙnentialåչৡᾒ\0ᾞ\0ᾡᾧ\0\0ῆῌ\0ΐ\0ῦῪ \0 ⁚llingdotseñṄy;䑄male;晀ƀilrᾭᾳ῁lig;耀ﬃɩᾹ\0\0᾽g;耀ﬀig;耀ﬄ;쀀𝔣lig;耀ﬁlig;쀀fjƀaltῙ῜ῡt;晭ig;耀ﬂns;斱of;䆒ǰ΅\0ῳf;쀀𝕗ĀakֿῷĀ;vῼ´拔;櫙artint;樍Āao‌⁕Ācs‑⁒α‚‰‸⁅⁈\0⁐β•‥‧‪‬\0‮耻½䂽;慓耻¼䂼;慕;慙;慛Ƴ‴\0‶;慔;慖ʴ‾⁁\0\0⁃耻¾䂾;慗;慜5;慘ƶ⁌\0⁎;慚;慝8;慞l;恄wn;挢cr;쀀𝒻ࢀEabcdefgijlnorstv₂₉₟₥₰₴⃰⃵⃺⃿℃ℒℸ̗ℾ⅒↞Ā;lٍ₇;檌ƀcmpₐₕ₝ute;䇵maĀ;dₜ᳚䎳;檆reve;䄟Āiy₪₮rc;䄝;䐳ot;䄡Ȁ;lqsؾق₽⃉ƀ;qsؾٌ⃄lanô٥Ȁ;cdl٥⃒⃥⃕c;檩otĀ;o⃜⃝檀Ā;l⃢⃣檂;檄Ā;e⃪⃭쀀⋛︀s;檔r;쀀𝔤Ā;gٳ؛mel;愷cy;䑓Ȁ;Eajٚℌℎℐ;檒;檥;檤ȀEaesℛℝ℩ℴ;扩pĀ;p℣ℤ檊rox»ℤĀ;q℮ℯ檈Ā;q℮ℛim;拧pf;쀀𝕘Āci⅃ⅆr;愊mƀ;el٫ⅎ⅐;檎;檐茀>;cdlqr׮ⅠⅪⅮⅳⅹĀciⅥⅧ;檧r;橺ot;拗Par;榕uest;橼ʀadelsↄⅪ←ٖ↛ǰ↉\0↎proø₞r;楸qĀlqؿ↖lesó₈ií٫Āen↣↭rtneqq;쀀≩︀Å↪ԀAabcefkosy⇄⇇⇱⇵⇺∘∝∯≨≽ròΠȀilmr⇐⇔⇗⇛rsðᒄf»․ilôکĀdr⇠⇤cy;䑊ƀ;cwࣴ⇫⇯ir;楈;憭ar;意irc;䄥ƀalr∁∎∓rtsĀ;u∉∊晥it»∊lip;怦con;抹r;쀀𝔥sĀew∣∩arow;椥arow;椦ʀamopr∺∾≃≞≣rr;懿tht;戻kĀlr≉≓eftarrow;憩ightarrow;憪f;쀀𝕙bar;怕ƀclt≯≴≸r;쀀𝒽asè⇴rok;䄧Ābp⊂⊇ull;恃hen»ᱛૡ⊣\0⊪\0⊸⋅⋎\0⋕⋳\0\0⋸⌢⍧⍢⍿\0⎆⎪⎴cute耻í䃭ƀ;iyݱ⊰⊵rc耻î䃮;䐸Ācx⊼⊿y;䐵cl耻¡䂡ĀfrΟ⋉;쀀𝔦rave耻ì䃬Ȁ;inoܾ⋝⋩⋮Āin⋢⋦nt;樌t;戭fin;槜ta;愩lig;䄳ƀaop⋾⌚⌝ƀcgt⌅⌈⌗r;䄫ƀelpܟ⌏⌓inåގarôܠh;䄱f;抷ed;䆵ʀ;cfotӴ⌬⌱⌽⍁are;愅inĀ;t⌸⌹戞ie;槝doô⌙ʀ;celpݗ⍌⍐⍛⍡al;抺Āgr⍕⍙eróᕣã⍍arhk;樗rod;樼Ȁcgpt⍯⍲⍶⍻y;䑑on;䄯f;쀀𝕚a;䎹uest耻¿䂿Āci⎊⎏r;쀀𝒾nʀ;EdsvӴ⎛⎝⎡ӳ;拹ot;拵Ā;v⎦⎧拴;拳Ā;iݷ⎮lde;䄩ǫ⎸\0⎼cy;䑖l耻ï䃯̀cfmosu⏌⏗⏜⏡⏧⏵Āiy⏑⏕rc;䄵;䐹r;쀀𝔧ath;䈷pf;쀀𝕛ǣ⏬\0⏱r;쀀𝒿rcy;䑘kcy;䑔Ѐacfghjos␋␖␢␧␭␱␵␻ppaĀ;v␓␔䎺;䏰Āey␛␠dil;䄷;䐺r;쀀𝔨reen;䄸cy;䑅cy;䑜pf;쀀𝕜cr;쀀𝓀஀ABEHabcdefghjlmnoprstuv⑰⒁⒆⒍⒑┎┽╚▀♎♞♥♹♽⚚⚲⛘❝❨➋⟀⠁⠒ƀart⑷⑺⑼rò৆òΕail;椛arr;椎Ā;gঔ⒋;檋ar;楢ॣ⒥\0⒪\0⒱\0\0\0\0\0⒵Ⓔ\0ⓆⓈⓍ\0⓹ute;䄺mptyv;榴raîࡌbda;䎻gƀ;dlࢎⓁⓃ;榑åࢎ;檅uo耻«䂫rЀ;bfhlpst࢙ⓞⓦⓩ⓫⓮⓱⓵Ā;f࢝ⓣs;椟s;椝ë≒p;憫l;椹im;楳l;憢ƀ;ae⓿─┄檫il;椙Ā;s┉┊檭;쀀⪭︀ƀabr┕┙┝rr;椌rk;杲Āak┢┬cĀek┨┪;䁻;䁛Āes┱┳;榋lĀdu┹┻;榏;榍Ȁaeuy╆╋╖╘ron;䄾Ādi═╔il;䄼ìࢰâ┩;䐻Ȁcqrs╣╦╭╽a;椶uoĀ;rนᝆĀdu╲╷har;楧shar;楋h;憲ʀ;fgqs▋▌উ◳◿扤tʀahlrt▘▤▷◂◨rrowĀ;t࢙□aé⓶arpoonĀdu▯▴own»њp»०eftarrows;懇ightƀahs◍◖◞rrowĀ;sࣴࢧarpoonó྘quigarro÷⇰hreetimes;拋ƀ;qs▋ও◺lanôবʀ;cdgsব☊☍☝☨c;檨otĀ;o☔☕橿Ā;r☚☛檁;檃Ā;e☢☥쀀⋚︀s;檓ʀadegs☳☹☽♉♋pproøⓆot;拖qĀgq♃♅ôউgtò⒌ôছiíলƀilr♕࣡♚sht;楼;쀀𝔩Ā;Eজ♣;檑š♩♶rĀdu▲♮Ā;l॥♳;楪lk;斄cy;䑙ʀ;achtੈ⚈⚋⚑⚖rò◁orneòᴈard;楫ri;旺Āio⚟⚤dot;䅀ustĀ;a⚬⚭掰che»⚭ȀEaes⚻⚽⛉⛔;扨pĀ;p⛃⛄檉rox»⛄Ā;q⛎⛏檇Ā;q⛎⚻im;拦Ѐabnoptwz⛩⛴⛷✚✯❁❇❐Ānr⛮⛱g;柬r;懽rëࣁgƀlmr⛿✍✔eftĀar০✇ightá৲apsto;柼ightá৽parrowĀlr✥✩efô⓭ight;憬ƀafl✶✹✽r;榅;쀀𝕝us;樭imes;樴š❋❏st;戗áፎƀ;ef❗❘᠀旊nge»❘arĀ;l❤❥䀨t;榓ʀachmt❳❶❼➅➇ròࢨorneòᶌarĀ;d྘➃;業;怎ri;抿̀achiqt➘➝ੀ➢➮➻quo;怹r;쀀𝓁mƀ;egল➪➬;檍;檏Ābu┪➳oĀ;rฟ➹;怚rok;䅂萀<;cdhilqrࠫ⟒☹⟜⟠⟥⟪⟰Āci⟗⟙;檦r;橹reå◲mes;拉arr;楶uest;橻ĀPi⟵⟹ar;榖ƀ;ef⠀भ᠛旃rĀdu⠇⠍shar;楊har;楦Āen⠗⠡rtneqq;쀀≨︀Å⠞܀Dacdefhilnopsu⡀⡅⢂⢎⢓⢠⢥⢨⣚⣢⣤ઃ⣳⤂Dot;戺Ȁclpr⡎⡒⡣⡽r耻¯䂯Āet⡗⡙;時Ā;e⡞⡟朠se»⡟Ā;sျ⡨toȀ;dluျ⡳⡷⡻owîҌefôएðᏑker;斮Āoy⢇⢌mma;権;䐼ash;怔asuredangle»ᘦr;쀀𝔪o;愧ƀcdn⢯⢴⣉ro耻µ䂵Ȁ;acdᑤ⢽⣀⣄sôᚧir;櫰ot肻·Ƶusƀ;bd⣒ᤃ⣓戒Ā;uᴼ⣘;横ţ⣞⣡p;櫛ò−ðઁĀdp⣩⣮els;抧f;쀀𝕞Āct⣸⣽r;쀀𝓂pos»ᖝƀ;lm⤉⤊⤍䎼timap;抸ఀGLRVabcdefghijlmoprstuvw⥂⥓⥾⦉⦘⧚⧩⨕⨚⩘⩝⪃⪕⪤⪨⬄⬇⭄⭿⮮ⰴⱧⱼ⳩Āgt⥇⥋;쀀⋙̸Ā;v⥐௏쀀≫⃒ƀelt⥚⥲⥶ftĀar⥡⥧rrow;懍ightarrow;懎;쀀⋘̸Ā;v⥻ే쀀≪⃒ightarrow;懏ĀDd⦎⦓ash;抯ash;抮ʀbcnpt⦣⦧⦬⦱⧌la»˞ute;䅄g;쀀∠⃒ʀ;Eiop඄⦼⧀⧅⧈;쀀⩰̸d;쀀≋̸s;䅉roø඄urĀ;a⧓⧔普lĀ;s⧓ସǳ⧟\0⧣p肻 ଷmpĀ;e௹ఀʀaeouy⧴⧾⨃⨐⨓ǰ⧹\0⧻;橃on;䅈dil;䅆ngĀ;dൾ⨊ot;쀀⩭̸p;橂;䐽ash;怓΀;Aadqsxஒ⨩⨭⨻⩁⩅⩐rr;懗rĀhr⨳⨶k;椤Ā;oᏲᏰot;쀀≐̸uiöୣĀei⩊⩎ar;椨í஘istĀ;s஠டr;쀀𝔫ȀEest௅⩦⩹⩼ƀ;qs஼⩭௡ƀ;qs஼௅⩴lanô௢ií௪Ā;rஶ⪁»ஷƀAap⪊⪍⪑rò⥱rr;憮ar;櫲ƀ;svྍ⪜ྌĀ;d⪡⪢拼;拺cy;䑚΀AEadest⪷⪺⪾⫂⫅⫶⫹rò⥦;쀀≦̸rr;憚r;急Ȁ;fqs఻⫎⫣⫯tĀar⫔⫙rro÷⫁ightarro÷⪐ƀ;qs఻⪺⫪lanôౕĀ;sౕ⫴»శiíౝĀ;rవ⫾iĀ;eచథiäඐĀpt⬌⬑f;쀀𝕟膀¬;in⬙⬚⬶䂬nȀ;Edvஉ⬤⬨⬮;쀀⋹̸ot;쀀⋵̸ǡஉ⬳⬵;拷;拶iĀ;vಸ⬼ǡಸ⭁⭃;拾;拽ƀaor⭋⭣⭩rȀ;ast୻⭕⭚⭟lleì୻l;쀀⫽⃥;쀀∂̸lint;樔ƀ;ceಒ⭰⭳uåಥĀ;cಘ⭸Ā;eಒ⭽ñಘȀAait⮈⮋⮝⮧rò⦈rrƀ;cw⮔⮕⮙憛;쀀⤳̸;쀀↝̸ghtarrow»⮕riĀ;eೋೖ΀chimpqu⮽⯍⯙⬄୸⯤⯯Ȁ;cerല⯆ഷ⯉uå൅;쀀𝓃ortɭ⬅\0\0⯖ará⭖mĀ;e൮⯟Ā;q൴൳suĀbp⯫⯭å೸åഋƀbcp⯶ⰑⰙȀ;Ees⯿ⰀഢⰄ抄;쀀⫅̸etĀ;eഛⰋqĀ;qണⰀcĀ;eലⰗñസȀ;EesⰢⰣൟⰧ抅;쀀⫆̸etĀ;e൘ⰮqĀ;qൠⰣȀgilrⰽⰿⱅⱇìௗlde耻ñ䃱çృiangleĀlrⱒⱜeftĀ;eచⱚñదightĀ;eೋⱥñ೗Ā;mⱬⱭ䎽ƀ;esⱴⱵⱹ䀣ro;愖p;怇ҀDHadgilrsⲏⲔⲙⲞⲣⲰⲶⳓⳣash;抭arr;椄p;쀀≍⃒ash;抬ĀetⲨⲬ;쀀≥⃒;쀀>⃒nfin;槞ƀAetⲽⳁⳅrr;椂;쀀≤⃒Ā;rⳊⳍ쀀<⃒ie;쀀⊴⃒ĀAtⳘⳜrr;椃rie;쀀⊵⃒im;쀀∼⃒ƀAan⳰⳴ⴂrr;懖rĀhr⳺⳽k;椣Ā;oᏧᏥear;椧ቓ᪕\0\0\0\0\0\0\0\0\0\0\0\0\0ⴭ\0ⴸⵈⵠⵥ⵲ⶄᬇ\0\0ⶍⶫ\0ⷈⷎ\0ⷜ⸙⸫⸾⹃Ācsⴱ᪗ute耻ó䃳ĀiyⴼⵅrĀ;c᪞ⵂ耻ô䃴;䐾ʀabios᪠ⵒⵗǈⵚlac;䅑v;樸old;榼lig;䅓Ācr⵩⵭ir;榿;쀀𝔬ͯ⵹\0\0⵼\0ⶂn;䋛ave耻ò䃲;槁Ābmⶈ෴ar;榵Ȁacitⶕ⶘ⶥⶨrò᪀Āir⶝ⶠr;榾oss;榻nå๒;槀ƀaeiⶱⶵⶹcr;䅍ga;䏉ƀcdnⷀⷅǍron;䎿;榶pf;쀀𝕠ƀaelⷔ⷗ǒr;榷rp;榹΀;adiosvⷪⷫⷮ⸈⸍⸐⸖戨rò᪆Ȁ;efmⷷⷸ⸂⸅橝rĀ;oⷾⷿ愴f»ⷿ耻ª䂪耻º䂺gof;抶r;橖lope;橗;橛ƀclo⸟⸡⸧ò⸁ash耻ø䃸l;折iŬⸯ⸴de耻õ䃵esĀ;aǛ⸺s;樶ml耻ö䃶bar;挽ૡ⹞\0⹽\0⺀⺝\0⺢⺹\0\0⻋ຜ\0⼓\0\0⼫⾼\0⿈rȀ;astЃ⹧⹲຅脀¶;l⹭⹮䂶leìЃɩ⹸\0\0⹻m;櫳;櫽y;䐿rʀcimpt⺋⺏⺓ᡥ⺗nt;䀥od;䀮il;怰enk;怱r;쀀𝔭ƀimo⺨⺰⺴Ā;v⺭⺮䏆;䏕maô੶ne;明ƀ;tv⺿⻀⻈䏀chfork»´;䏖Āau⻏⻟nĀck⻕⻝kĀ;h⇴⻛;愎ö⇴sҀ;abcdemst⻳⻴ᤈ⻹⻽⼄⼆⼊⼎䀫cir;樣ir;樢Āouᵀ⼂;樥;橲n肻±ຝim;樦wo;樧ƀipu⼙⼠⼥ntint;樕f;쀀𝕡nd耻£䂣Ԁ;Eaceinosu່⼿⽁⽄⽇⾁⾉⾒⽾⾶;檳p;檷uå໙Ā;c໎⽌̀;acens່⽙⽟⽦⽨⽾pproø⽃urlyeñ໙ñ໎ƀaes⽯⽶⽺pprox;檹qq;檵im;拨iíໟmeĀ;s⾈ຮ怲ƀEas⽸⾐⽺ð⽵ƀdfp໬⾙⾯ƀals⾠⾥⾪lar;挮ine;挒urf;挓Ā;t໻⾴ï໻rel;抰Āci⿀⿅r;쀀𝓅;䏈ncsp;怈̀fiopsu⿚⋢⿟⿥⿫⿱r;쀀𝔮pf;쀀𝕢rime;恗cr;쀀𝓆ƀaeo⿸〉〓tĀei⿾々rnionóڰnt;樖stĀ;e【】䀿ñἙô༔઀ABHabcdefhilmnoprstux぀けさすムㄎㄫㅇㅢㅲㆎ㈆㈕㈤㈩㉘㉮㉲㊐㊰㊷ƀartぇおがròႳòϝail;検aròᱥar;楤΀cdenqrtとふへみわゔヌĀeuねぱ;쀀∽̱te;䅕iãᅮmptyv;榳gȀ;del࿑らるろ;榒;榥å࿑uo耻»䂻rր;abcfhlpstw࿜ガクシスゼゾダッデナp;極Ā;f࿠ゴs;椠;椳s;椞ë≝ð✮l;楅im;楴l;憣;憝Āaiパフil;椚oĀ;nホボ戶aló༞ƀabrョリヮrò៥rk;杳ĀakンヽcĀekヹ・;䁽;䁝Āes㄂㄄;榌lĀduㄊㄌ;榎;榐Ȁaeuyㄗㄜㄧㄩron;䅙Ādiㄡㄥil;䅗ì࿲âヺ;䑀Ȁclqsㄴㄷㄽㅄa;椷dhar;楩uoĀ;rȎȍh;憳ƀacgㅎㅟངlȀ;ipsླྀㅘㅛႜnåႻarôྩt;断ƀilrㅩဣㅮsht;楽;쀀𝔯ĀaoㅷㆆrĀduㅽㅿ»ѻĀ;l႑ㆄ;楬Ā;vㆋㆌ䏁;䏱ƀgns㆕ㇹㇼht̀ahlrstㆤㆰ㇂㇘㇤㇮rrowĀ;t࿜ㆭaéトarpoonĀduㆻㆿowîㅾp»႒eftĀah㇊㇐rrowó࿪arpoonóՑightarrows;應quigarro÷ニhreetimes;拌g;䋚ingdotseñἲƀahm㈍㈐㈓rò࿪aòՑ;怏oustĀ;a㈞㈟掱che»㈟mid;櫮Ȁabpt㈲㈽㉀㉒Ānr㈷㈺g;柭r;懾rëဃƀafl㉇㉊㉎r;榆;쀀𝕣us;樮imes;樵Āap㉝㉧rĀ;g㉣㉤䀩t;榔olint;樒arò㇣Ȁachq㉻㊀Ⴜ㊅quo;怺r;쀀𝓇Ābu・㊊oĀ;rȔȓƀhir㊗㊛㊠reåㇸmes;拊iȀ;efl㊪ၙᠡ㊫方tri;槎luhar;楨;愞ൡ㋕㋛㋟㌬㌸㍱\0㍺㎤\0\0㏬㏰\0㐨㑈㑚㒭㒱㓊㓱\0㘖\0\0㘳cute;䅛quï➺Ԁ;Eaceinpsyᇭ㋳㋵㋿㌂㌋㌏㌟㌦㌩;檴ǰ㋺\0㋼;檸on;䅡uåᇾĀ;dᇳ㌇il;䅟rc;䅝ƀEas㌖㌘㌛;檶p;檺im;择olint;樓iíሄ;䑁otƀ;be㌴ᵇ㌵担;橦΀Aacmstx㍆㍊㍗㍛㍞㍣㍭rr;懘rĀhr㍐㍒ë∨Ā;oਸ਼਴t耻§䂧i;䀻war;椩mĀin㍩ðnuóñt;朶rĀ;o㍶⁕쀀𝔰Ȁacoy㎂㎆㎑㎠rp;景Āhy㎋㎏cy;䑉;䑈rtɭ㎙\0\0㎜iäᑤaraì⹯耻­䂭Āgm㎨㎴maƀ;fv㎱㎲㎲䏃;䏂Ѐ;deglnprካ㏅㏉㏎㏖㏞㏡㏦ot;橪Ā;q኱ኰĀ;E㏓㏔檞;檠Ā;E㏛㏜檝;檟e;扆lus;樤arr;楲aròᄽȀaeit㏸㐈㐏㐗Āls㏽㐄lsetmé㍪hp;樳parsl;槤Ādlᑣ㐔e;挣Ā;e㐜㐝檪Ā;s㐢㐣檬;쀀⪬︀ƀflp㐮㐳㑂tcy;䑌Ā;b㐸㐹䀯Ā;a㐾㐿槄r;挿f;쀀𝕤aĀdr㑍ЂesĀ;u㑔㑕晠it»㑕ƀcsu㑠㑹㒟Āau㑥㑯pĀ;sᆈ㑫;쀀⊓︀pĀ;sᆴ㑵;쀀⊔︀uĀbp㑿㒏ƀ;esᆗᆜ㒆etĀ;eᆗ㒍ñᆝƀ;esᆨᆭ㒖etĀ;eᆨ㒝ñᆮƀ;afᅻ㒦ְrť㒫ֱ»ᅼaròᅈȀcemt㒹㒾㓂㓅r;쀀𝓈tmîñiì㐕aræᆾĀar㓎㓕rĀ;f㓔ឿ昆Āan㓚㓭ightĀep㓣㓪psiloîỠhé⺯s»⡒ʀbcmnp㓻㕞ሉ㖋㖎Ҁ;Edemnprs㔎㔏㔑㔕㔞㔣㔬㔱㔶抂;櫅ot;檽Ā;dᇚ㔚ot;櫃ult;櫁ĀEe㔨㔪;櫋;把lus;檿arr;楹ƀeiu㔽㕒㕕tƀ;en㔎㕅㕋qĀ;qᇚ㔏eqĀ;q㔫㔨m;櫇Ābp㕚㕜;櫕;櫓c̀;acensᇭ㕬㕲㕹㕻㌦pproø㋺urlyeñᇾñᇳƀaes㖂㖈㌛pproø㌚qñ㌗g;晪ڀ123;Edehlmnps㖩㖬㖯ሜ㖲㖴㗀㗉㗕㗚㗟㗨㗭耻¹䂹耻²䂲耻³䂳;櫆Āos㖹㖼t;檾ub;櫘Ā;dሢ㗅ot;櫄sĀou㗏㗒l;柉b;櫗arr;楻ult;櫂ĀEe㗤㗦;櫌;抋lus;櫀ƀeiu㗴㘉㘌tƀ;enሜ㗼㘂qĀ;qሢ㖲eqĀ;q㗧㗤m;櫈Ābp㘑㘓;櫔;櫖ƀAan㘜㘠㘭rr;懙rĀhr㘦㘨ë∮Ā;oਫ਩war;椪lig耻ß䃟௡㙑㙝㙠ዎ㙳㙹\0㙾㛂\0\0\0\0\0㛛㜃\0㜉㝬\0\0\0㞇ɲ㙖\0\0㙛get;挖;䏄rë๟ƀaey㙦㙫㙰ron;䅥dil;䅣;䑂lrec;挕r;쀀𝔱Ȁeiko㚆㚝㚵㚼ǲ㚋\0㚑eĀ4fኄኁaƀ;sv㚘㚙㚛䎸ym;䏑Ācn㚢㚲kĀas㚨㚮pproø዁im»ኬsðኞĀas㚺㚮ð዁rn耻þ䃾Ǭ̟㛆⋧es膀×;bd㛏㛐㛘䃗Ā;aᤏ㛕r;樱;樰ƀeps㛡㛣㜀á⩍Ȁ;bcf҆㛬㛰㛴ot;挶ir;櫱Ā;o㛹㛼쀀𝕥rk;櫚á㍢rime;怴ƀaip㜏㜒㝤dåቈ΀adempst㜡㝍㝀㝑㝗㝜㝟ngleʀ;dlqr㜰㜱㜶㝀㝂斵own»ᶻeftĀ;e⠀㜾ñम;扜ightĀ;e㊪㝋ñၚot;旬inus;樺lus;樹b;槍ime;樻ezium;揢ƀcht㝲㝽㞁Āry㝷㝻;쀀𝓉;䑆cy;䑛rok;䅧Āio㞋㞎xô᝷headĀlr㞗㞠eftarro÷ࡏightarrow»ཝऀAHabcdfghlmoprstuw㟐㟓㟗㟤㟰㟼㠎㠜㠣㠴㡑㡝㡫㢩㣌㣒㣪㣶ròϭar;楣Ācr㟜㟢ute耻ú䃺òᅐrǣ㟪\0㟭y;䑞ve;䅭Āiy㟵㟺rc耻û䃻;䑃ƀabh㠃㠆㠋ròᎭlac;䅱aòᏃĀir㠓㠘sht;楾;쀀𝔲rave耻ù䃹š㠧㠱rĀlr㠬㠮»ॗ»ႃlk;斀Āct㠹㡍ɯ㠿\0\0㡊rnĀ;e㡅㡆挜r»㡆op;挏ri;旸Āal㡖㡚cr;䅫肻¨͉Āgp㡢㡦on;䅳f;쀀𝕦̀adhlsuᅋ㡸㡽፲㢑㢠ownáᎳarpoonĀlr㢈㢌efô㠭ighô㠯iƀ;hl㢙㢚㢜䏅»ᏺon»㢚parrows;懈ƀcit㢰㣄㣈ɯ㢶\0\0㣁rnĀ;e㢼㢽挝r»㢽op;挎ng;䅯ri;旹cr;쀀𝓊ƀdir㣙㣝㣢ot;拰lde;䅩iĀ;f㜰㣨»᠓Āam㣯㣲rò㢨l耻ü䃼angle;榧ހABDacdeflnoprsz㤜㤟㤩㤭㦵㦸㦽㧟㧤㧨㧳㧹㧽㨁㨠ròϷarĀ;v㤦㤧櫨;櫩asèϡĀnr㤲㤷grt;榜΀eknprst㓣㥆㥋㥒㥝㥤㦖appá␕othinçẖƀhir㓫⻈㥙opô⾵Ā;hᎷ㥢ïㆍĀiu㥩㥭gmá㎳Ābp㥲㦄setneqĀ;q㥽㦀쀀⊊︀;쀀⫋︀setneqĀ;q㦏㦒쀀⊋︀;쀀⫌︀Āhr㦛㦟etá㚜iangleĀlr㦪㦯eft»थight»ၑy;䐲ash»ံƀelr㧄㧒㧗ƀ;beⷪ㧋㧏ar;抻q;扚lip;拮Ābt㧜ᑨaòᑩr;쀀𝔳tré㦮suĀbp㧯㧱»ജ»൙pf;쀀𝕧roð໻tré㦴Ācu㨆㨋r;쀀𝓋Ābp㨐㨘nĀEe㦀㨖»㥾nĀEe㦒㨞»㦐igzag;榚΀cefoprs㨶㨻㩖㩛㩔㩡㩪irc;䅵Ādi㩀㩑Ābg㩅㩉ar;機eĀ;qᗺ㩏;扙erp;愘r;쀀𝔴pf;쀀𝕨Ā;eᑹ㩦atèᑹcr;쀀𝓌ૣណ㪇\0㪋\0㪐㪛\0\0㪝㪨㪫㪯\0\0㫃㫎\0㫘ៜ៟tré៑r;쀀𝔵ĀAa㪔㪗ròσrò৶;䎾ĀAa㪡㪤ròθrò৫að✓is;拻ƀdptឤ㪵㪾Āfl㪺ឩ;쀀𝕩imåឲĀAa㫇㫊ròώròਁĀcq㫒ីr;쀀𝓍Āpt៖㫜ré។Ѐacefiosu㫰㫽㬈㬌㬑㬕㬛㬡cĀuy㫶㫻te耻ý䃽;䑏Āiy㬂㬆rc;䅷;䑋n耻¥䂥r;쀀𝔶cy;䑗pf;쀀𝕪cr;쀀𝓎Ācm㬦㬩y;䑎l耻ÿ䃿Ԁacdefhiosw㭂㭈㭔㭘㭤㭩㭭㭴㭺㮀cute;䅺Āay㭍㭒ron;䅾;䐷ot;䅼Āet㭝㭡træᕟa;䎶r;쀀𝔷cy;䐶grarr;懝pf;쀀𝕫cr;쀀𝓏Ājn㮅㮇;怍j;怌'.split("").map(e=>e.charCodeAt(0))),qc=new Uint16Array("Ȁaglq	\x1Bɭ\0\0p;䀦os;䀧t;䀾t;䀼uot;䀢".split("").map(e=>e.charCodeAt(0)));var Cr;const Vc=new Map([[0,65533],[128,8364],[130,8218],[131,402],[132,8222],[133,8230],[134,8224],[135,8225],[136,710],[137,8240],[138,352],[139,8249],[140,338],[142,381],[145,8216],[146,8217],[147,8220],[148,8221],[149,8226],[150,8211],[151,8212],[152,732],[153,8482],[154,353],[155,8250],[156,339],[158,382],[159,376]]),Hc=(Cr=String.fromCodePoint)!==null&&Cr!==void 0?Cr:function(e){let t="";return e>65535&&(e-=65536,t+=String.fromCharCode(e>>>10&1023|55296),e=56320|e&1023),t+=String.fromCharCode(e),t};function Wc(e){var t;return e>=55296&&e<=57343||e>1114111?65533:(t=Vc.get(e))!==null&&t!==void 0?t:e}var ae;(function(e){e[e.NUM=35]="NUM",e[e.SEMI=59]="SEMI",e[e.EQUALS=61]="EQUALS",e[e.ZERO=48]="ZERO",e[e.NINE=57]="NINE",e[e.LOWER_A=97]="LOWER_A",e[e.LOWER_F=102]="LOWER_F",e[e.LOWER_X=120]="LOWER_X",e[e.LOWER_Z=122]="LOWER_Z",e[e.UPPER_A=65]="UPPER_A",e[e.UPPER_F=70]="UPPER_F",e[e.UPPER_Z=90]="UPPER_Z"})(ae||(ae={}));const Gc=32;var Ue;(function(e){e[e.VALUE_LENGTH=49152]="VALUE_LENGTH",e[e.BRANCH_LENGTH=16256]="BRANCH_LENGTH",e[e.JUMP_TABLE=127]="JUMP_TABLE"})(Ue||(Ue={}));function Jr(e){return e>=ae.ZERO&&e<=ae.NINE}function Zc(e){return e>=ae.UPPER_A&&e<=ae.UPPER_F||e>=ae.LOWER_A&&e<=ae.LOWER_F}function Kc(e){return e>=ae.UPPER_A&&e<=ae.UPPER_Z||e>=ae.LOWER_A&&e<=ae.LOWER_Z||Jr(e)}function Jc(e){return e===ae.EQUALS||Kc(e)}var ne;(function(e){e[e.EntityStart=0]="EntityStart",e[e.NumericStart=1]="NumericStart",e[e.NumericDecimal=2]="NumericDecimal",e[e.NumericHex=3]="NumericHex",e[e.NamedEntity=4]="NamedEntity"})(ne||(ne={}));var Be;(function(e){e[e.Legacy=0]="Legacy",e[e.Strict=1]="Strict",e[e.Attribute=2]="Attribute"})(Be||(Be={}));class Qc{constructor(t,u,r){this.decodeTree=t,this.emitCodePoint=u,this.errors=r,this.state=ne.EntityStart,this.consumed=1,this.result=0,this.treeIndex=0,this.excess=1,this.decodeMode=Be.Strict}startEntity(t){this.decodeMode=t,this.state=ne.EntityStart,this.result=0,this.treeIndex=0,this.excess=1,this.consumed=1}write(t,u){switch(this.state){case ne.EntityStart:return t.charCodeAt(u)===ae.NUM?(this.state=ne.NumericStart,this.consumed+=1,this.stateNumericStart(t,u+1)):(this.state=ne.NamedEntity,this.stateNamedEntity(t,u));case ne.NumericStart:return this.stateNumericStart(t,u);case ne.NumericDecimal:return this.stateNumericDecimal(t,u);case ne.NumericHex:return this.stateNumericHex(t,u);case ne.NamedEntity:return this.stateNamedEntity(t,u)}}stateNumericStart(t,u){return u>=t.length?-1:(t.charCodeAt(u)|Gc)===ae.LOWER_X?(this.state=ne.NumericHex,this.consumed+=1,this.stateNumericHex(t,u+1)):(this.state=ne.NumericDecimal,this.stateNumericDecimal(t,u))}addToNumericResult(t,u,r,i){if(u!==r){const s=r-u;this.result=this.result*Math.pow(i,s)+parseInt(t.substr(u,s),i),this.consumed+=s}}stateNumericHex(t,u){const r=u;for(;u<t.length;){const i=t.charCodeAt(u);if(Jr(i)||Zc(i))u+=1;else return this.addToNumericResult(t,r,u,16),this.emitNumericEntity(i,3)}return this.addToNumericResult(t,r,u,16),-1}stateNumericDecimal(t,u){const r=u;for(;u<t.length;){const i=t.charCodeAt(u);if(Jr(i))u+=1;else return this.addToNumericResult(t,r,u,10),this.emitNumericEntity(i,2)}return this.addToNumericResult(t,r,u,10),-1}emitNumericEntity(t,u){var r;if(this.consumed<=u)return(r=this.errors)===null||r===void 0||r.absenceOfDigitsInNumericCharacterReference(this.consumed),0;if(t===ae.SEMI)this.consumed+=1;else if(this.decodeMode===Be.Strict)return 0;return this.emitCodePoint(Wc(this.result),this.consumed),this.errors&&(t!==ae.SEMI&&this.errors.missingSemicolonAfterCharacterReference(),this.errors.validateNumericCharacterReference(this.result)),this.consumed}stateNamedEntity(t,u){const{decodeTree:r}=this;let i=r[this.treeIndex],s=(i&Ue.VALUE_LENGTH)>>14;for(;u<t.length;u++,this.excess++){const n=t.charCodeAt(u);if(this.treeIndex=Yc(r,i,this.treeIndex+Math.max(1,s),n),this.treeIndex<0)return this.result===0||this.decodeMode===Be.Attribute&&(s===0||Jc(n))?0:this.emitNotTerminatedNamedEntity();if(i=r[this.treeIndex],s=(i&Ue.VALUE_LENGTH)>>14,s!==0){if(n===ae.SEMI)return this.emitNamedEntityData(this.treeIndex,s,this.consumed+this.excess);this.decodeMode!==Be.Strict&&(this.result=this.treeIndex,this.consumed+=this.excess,this.excess=0)}}return-1}emitNotTerminatedNamedEntity(){var t;const{result:u,decodeTree:r}=this,i=(r[u]&Ue.VALUE_LENGTH)>>14;return this.emitNamedEntityData(u,i,this.consumed),(t=this.errors)===null||t===void 0||t.missingSemicolonAfterCharacterReference(),this.consumed}emitNamedEntityData(t,u,r){const{decodeTree:i}=this;return this.emitCodePoint(u===1?i[t]&~Ue.VALUE_LENGTH:i[t+1],r),u===3&&this.emitCodePoint(i[t+2],r),r}end(){var t;switch(this.state){case ne.NamedEntity:return this.result!==0&&(this.decodeMode!==Be.Attribute||this.result===this.treeIndex)?this.emitNotTerminatedNamedEntity():0;case ne.NumericDecimal:return this.emitNumericEntity(0,2);case ne.NumericHex:return this.emitNumericEntity(0,3);case ne.NumericStart:return(t=this.errors)===null||t===void 0||t.absenceOfDigitsInNumericCharacterReference(this.consumed),0;case ne.EntityStart:return 0}}}function Sn(e){let t="";const u=new Qc(e,r=>t+=Hc(r));return function(i,s){let n=0,a=0;for(;(a=i.indexOf("&",a))>=0;){t+=i.slice(n,a),u.startEntity(s);const l=u.write(i,a+1);if(l<0){n=a+u.end();break}n=a+l,a=l===0?n+1:n}const c=t+i.slice(n);return t="",c}}function Yc(e,t,u,r){const i=(t&Ue.BRANCH_LENGTH)>>7,s=t&Ue.JUMP_TABLE;if(i===0)return s!==0&&r===s?u:-1;if(s){const c=r-s;return c<0||c>=i?-1:e[u+c]-1}let n=u,a=n+i-1;for(;n<=a;){const c=n+a>>>1,l=e[c];if(l<r)n=c+1;else if(l>r)a=c-1;else return e[c+i]}return-1}const Xc=Sn(Uc);Sn(qc);function Fn(e,t=Be.Legacy){return Xc(e,t)}function el(e){return Object.prototype.toString.call(e)}function hi(e){return el(e)==="[object String]"}const tl=Object.prototype.hasOwnProperty;function ul(e,t){return tl.call(e,t)}function qu(e){return Array.prototype.slice.call(arguments,1).forEach(function(u){if(u){if(typeof u!="object")throw new TypeError(u+"must be object");Object.keys(u).forEach(function(r){e[r]=u[r]})}}),e}function Tn(e,t,u){return[].concat(e.slice(0,t),u,e.slice(t+1))}function pi(e){return!(e>=55296&&e<=57343||e>=64976&&e<=65007||(e&65535)===65535||(e&65535)===65534||e>=0&&e<=8||e===11||e>=14&&e<=31||e>=127&&e<=159||e>1114111)}function zu(e){if(e>65535){e-=65536;const t=55296+(e>>10),u=56320+(e&1023);return String.fromCharCode(t,u)}return String.fromCharCode(e)}const In=/\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g,rl=/&([a-z#][a-z0-9]{1,31});/gi,il=new RegExp(In.source+"|"+rl.source,"gi"),sl=/^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))$/i;function nl(e,t){if(t.charCodeAt(0)===35&&sl.test(t)){const r=t[1].toLowerCase()==="x"?parseInt(t.slice(2),16):parseInt(t.slice(1),10);return pi(r)?zu(r):e}const u=Fn(e);return u!==e?u:e}function al(e){return e.indexOf("\\")<0?e:e.replace(In,"$1")}function xt(e){return e.indexOf("\\")<0&&e.indexOf("&")<0?e:e.replace(il,function(t,u,r){return u||nl(t,r)})}const ol=/[&<>"]/,cl=/[&<>"]/g,ll={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"};function dl(e){return ll[e]}function He(e){return ol.test(e)?e.replace(cl,dl):e}const fl=/[.?*+^$[\]\\(){}|-]/g;function hl(e){return e.replace(fl,"\\$&")}function G(e){switch(e){case 9:case 32:return!0}return!1}function Xt(e){if(e>=8192&&e<=8202)return!0;switch(e){case 9:case 10:case 11:case 12:case 13:case 32:case 160:case 5760:case 8239:case 8287:case 12288:return!0}return!1}function eu(e){return fi.test(e)||Dn.test(e)}function tu(e){switch(e){case 33:case 34:case 35:case 36:case 37:case 38:case 39:case 40:case 41:case 42:case 43:case 44:case 45:case 46:case 47:case 58:case 59:case 60:case 61:case 62:case 63:case 64:case 91:case 92:case 93:case 94:case 95:case 96:case 123:case 124:case 125:case 126:return!0;default:return!1}}function Vu(e){return e=e.trim().replace(/\s+/g," "),"ẞ".toLowerCase()==="Ṿ"&&(e=e.replace(/ẞ/g,"ß")),e.toLowerCase().toUpperCase()}const pl={mdurl:jc,ucmicro:Lc},bl=Object.freeze(Object.defineProperty({__proto__:null,arrayReplaceAt:Tn,assign:qu,escapeHtml:He,escapeRE:hl,fromCodePoint:zu,has:ul,isMdAsciiPunct:tu,isPunctChar:eu,isSpace:G,isString:hi,isValidEntityCode:pi,isWhiteSpace:Xt,lib:pl,normalizeReference:Vu,unescapeAll:xt,unescapeMd:al},Symbol.toStringTag,{value:"Module"}));function ml(e,t,u){let r,i,s,n;const a=e.posMax,c=e.pos;for(e.pos=t+1,r=1;e.pos<a;){if(s=e.src.charCodeAt(e.pos),s===93&&(r--,r===0)){i=!0;break}if(n=e.pos,e.md.inline.skipToken(e),s===91){if(n===e.pos-1)r++;else if(u)return e.pos=c,-1}}let l=-1;return i&&(l=e.pos),e.pos=c,l}function _l(e,t,u){let r,i=t;const s={ok:!1,pos:0,str:""};if(e.charCodeAt(i)===60){for(i++;i<u;){if(r=e.charCodeAt(i),r===10||r===60)return s;if(r===62)return s.pos=i+1,s.str=xt(e.slice(t+1,i)),s.ok=!0,s;if(r===92&&i+1<u){i+=2;continue}i++}return s}let n=0;for(;i<u&&(r=e.charCodeAt(i),!(r===32||r<32||r===127));){if(r===92&&i+1<u){if(e.charCodeAt(i+1)===32)break;i+=2;continue}if(r===40&&(n++,n>32))return s;if(r===41){if(n===0)break;n--}i++}return t===i||n!==0||(s.str=xt(e.slice(t,i)),s.pos=i,s.ok=!0),s}function gl(e,t,u,r){let i,s=t;const n={ok:!1,can_continue:!1,pos:0,str:"",marker:0};if(r)n.str=r.str,n.marker=r.marker;else{if(s>=u)return n;let a=e.charCodeAt(s);if(a!==34&&a!==39&&a!==40)return n;t++,s++,a===40&&(a=41),n.marker=a}for(;s<u;){if(i=e.charCodeAt(s),i===n.marker)return n.pos=s+1,n.str+=xt(e.slice(t,s)),n.ok=!0,n;if(i===40&&n.marker===41)return n;i===92&&s+1<u&&s++,s++}return n.can_continue=!0,n.str+=xt(e.slice(t,s)),n}const yl=Object.freeze(Object.defineProperty({__proto__:null,parseLinkDestination:_l,parseLinkLabel:ml,parseLinkTitle:gl},Symbol.toStringTag,{value:"Module"})),Ae={};Ae.code_inline=function(e,t,u,r,i){const s=e[t];return"<code"+i.renderAttrs(s)+">"+He(s.content)+"</code>"};Ae.code_block=function(e,t,u,r,i){const s=e[t];return"<pre"+i.renderAttrs(s)+"><code>"+He(e[t].content)+`</code></pre>
`};Ae.fence=function(e,t,u,r,i){const s=e[t],n=s.info?xt(s.info).trim():"";let a="",c="";if(n){const d=n.split(/(\s+)/g);a=d[0],c=d.slice(2).join("")}let l;if(u.highlight?l=u.highlight(s.content,a,c)||He(s.content):l=He(s.content),l.indexOf("<pre")===0)return l+`
`;if(n){const d=s.attrIndex("class"),o=s.attrs?s.attrs.slice():[];d<0?o.push(["class",u.langPrefix+a]):(o[d]=o[d].slice(),o[d][1]+=" "+u.langPrefix+a);const p={attrs:o};return`<pre><code${i.renderAttrs(p)}>${l}</code></pre>
`}return`<pre><code${i.renderAttrs(s)}>${l}</code></pre>
`};Ae.image=function(e,t,u,r,i){const s=e[t];return s.attrs[s.attrIndex("alt")][1]=i.renderInlineAsText(s.children,u,r),i.renderToken(e,t,u)};Ae.hardbreak=function(e,t,u){return u.xhtmlOut?`<br />
`:`<br>
`};Ae.softbreak=function(e,t,u){return u.breaks?u.xhtmlOut?`<br />
`:`<br>
`:`
`};Ae.text=function(e,t){return He(e[t].content)};Ae.html_block=function(e,t){return e[t].content};Ae.html_inline=function(e,t){return e[t].content};function Et(){this.rules=qu({},Ae)}Et.prototype.renderAttrs=function(t){let u,r,i;if(!t.attrs)return"";for(i="",u=0,r=t.attrs.length;u<r;u++)i+=" "+He(t.attrs[u][0])+'="'+He(t.attrs[u][1])+'"';return i};Et.prototype.renderToken=function(t,u,r){const i=t[u];let s="";if(i.hidden)return"";i.block&&i.nesting!==-1&&u&&t[u-1].hidden&&(s+=`
`),s+=(i.nesting===-1?"</":"<")+i.tag,s+=this.renderAttrs(i),i.nesting===0&&r.xhtmlOut&&(s+=" /");let n=!1;if(i.block&&(n=!0,i.nesting===1&&u+1<t.length)){const a=t[u+1];(a.type==="inline"||a.hidden||a.nesting===-1&&a.tag===i.tag)&&(n=!1)}return s+=n?`>
`:">",s};Et.prototype.renderInline=function(e,t,u){let r="";const i=this.rules;for(let s=0,n=e.length;s<n;s++){const a=e[s].type;typeof i[a]<"u"?r+=i[a](e,s,t,u,this):r+=this.renderToken(e,s,t)}return r};Et.prototype.renderInlineAsText=function(e,t,u){let r="";for(let i=0,s=e.length;i<s;i++)switch(e[i].type){case"text":r+=e[i].content;break;case"image":r+=this.renderInlineAsText(e[i].children,t,u);break;case"html_inline":case"html_block":r+=e[i].content;break;case"softbreak":case"hardbreak":r+=`
`;break}return r};Et.prototype.render=function(e,t,u){let r="";const i=this.rules;for(let s=0,n=e.length;s<n;s++){const a=e[s].type;a==="inline"?r+=this.renderInline(e[s].children,t,u):typeof i[a]<"u"?r+=i[a](e,s,t,u,this):r+=this.renderToken(e,s,t,u)}return r};function pe(){this.__rules__=[],this.__cache__=null}pe.prototype.__find__=function(e){for(let t=0;t<this.__rules__.length;t++)if(this.__rules__[t].name===e)return t;return-1};pe.prototype.__compile__=function(){const e=this,t=[""];e.__rules__.forEach(function(u){u.enabled&&u.alt.forEach(function(r){t.indexOf(r)<0&&t.push(r)})}),e.__cache__={},t.forEach(function(u){e.__cache__[u]=[],e.__rules__.forEach(function(r){r.enabled&&(u&&r.alt.indexOf(u)<0||e.__cache__[u].push(r.fn))})})};pe.prototype.at=function(e,t,u){const r=this.__find__(e),i=u||{};if(r===-1)throw new Error("Parser rule not found: "+e);this.__rules__[r].fn=t,this.__rules__[r].alt=i.alt||[],this.__cache__=null};pe.prototype.before=function(e,t,u,r){const i=this.__find__(e),s=r||{};if(i===-1)throw new Error("Parser rule not found: "+e);this.__rules__.splice(i,0,{name:t,enabled:!0,fn:u,alt:s.alt||[]}),this.__cache__=null};pe.prototype.after=function(e,t,u,r){const i=this.__find__(e),s=r||{};if(i===-1)throw new Error("Parser rule not found: "+e);this.__rules__.splice(i+1,0,{name:t,enabled:!0,fn:u,alt:s.alt||[]}),this.__cache__=null};pe.prototype.push=function(e,t,u){const r=u||{};this.__rules__.push({name:e,enabled:!0,fn:t,alt:r.alt||[]}),this.__cache__=null};pe.prototype.enable=function(e,t){Array.isArray(e)||(e=[e]);const u=[];return e.forEach(function(r){const i=this.__find__(r);if(i<0){if(t)return;throw new Error("Rules manager: invalid rule name "+r)}this.__rules__[i].enabled=!0,u.push(r)},this),this.__cache__=null,u};pe.prototype.enableOnly=function(e,t){Array.isArray(e)||(e=[e]),this.__rules__.forEach(function(u){u.enabled=!1}),this.enable(e,t)};pe.prototype.disable=function(e,t){Array.isArray(e)||(e=[e]);const u=[];return e.forEach(function(r){const i=this.__find__(r);if(i<0){if(t)return;throw new Error("Rules manager: invalid rule name "+r)}this.__rules__[i].enabled=!1,u.push(r)},this),this.__cache__=null,u};pe.prototype.getRules=function(e){return this.__cache__===null&&this.__compile__(),this.__cache__[e]||[]};function we(e,t,u){this.type=e,this.tag=t,this.attrs=null,this.map=null,this.nesting=u,this.level=0,this.children=null,this.content="",this.markup="",this.info="",this.meta=null,this.block=!1,this.hidden=!1}we.prototype.attrIndex=function(t){if(!this.attrs)return-1;const u=this.attrs;for(let r=0,i=u.length;r<i;r++)if(u[r][0]===t)return r;return-1};we.prototype.attrPush=function(t){this.attrs?this.attrs.push(t):this.attrs=[t]};we.prototype.attrSet=function(t,u){const r=this.attrIndex(t),i=[t,u];r<0?this.attrPush(i):this.attrs[r]=i};we.prototype.attrGet=function(t){const u=this.attrIndex(t);let r=null;return u>=0&&(r=this.attrs[u][1]),r};we.prototype.attrJoin=function(t,u){const r=this.attrIndex(t);r<0?this.attrPush([t,u]):this.attrs[r][1]=this.attrs[r][1]+" "+u};function On(e,t,u){this.src=e,this.env=u,this.tokens=[],this.inlineMode=!1,this.md=t}On.prototype.Token=we;const xl=/\r\n?|\n/g,vl=/\0/g;function Cl(e){let t;t=e.src.replace(xl,`
`),t=t.replace(vl,"�"),e.src=t}function wl(e){let t;e.inlineMode?(t=new e.Token("inline","",0),t.content=e.src,t.map=[0,1],t.children=[],e.tokens.push(t)):e.md.block.parse(e.src,e.md,e.env,e.tokens)}function kl(e){const t=e.tokens;for(let u=0,r=t.length;u<r;u++){const i=t[u];i.type==="inline"&&e.md.inline.parse(i.content,e.md,e.env,i.children)}}function $l(e){return/^<a[>\s]/i.test(e)}function El(e){return/^<\/a\s*>/i.test(e)}function Dl(e){const t=e.tokens;if(e.md.options.linkify)for(let u=0,r=t.length;u<r;u++){if(t[u].type!=="inline"||!e.md.linkify.pretest(t[u].content))continue;let i=t[u].children,s=0;for(let n=i.length-1;n>=0;n--){const a=i[n];if(a.type==="link_close"){for(n--;i[n].level!==a.level&&i[n].type!=="link_open";)n--;continue}if(a.type==="html_inline"&&($l(a.content)&&s>0&&s--,El(a.content)&&s++),!(s>0)&&a.type==="text"&&e.md.linkify.test(a.content)){const c=a.content;let l=e.md.linkify.match(c);const d=[];let o=a.level,p=0;l.length>0&&l[0].index===0&&n>0&&i[n-1].type==="text_special"&&(l=l.slice(1));for(let h=0;h<l.length;h++){const f=l[h].url,m=e.md.normalizeLink(f);if(!e.md.validateLink(m))continue;let b=l[h].text;l[h].schema?l[h].schema==="mailto:"&&!/^mailto:/i.test(b)?b=e.md.normalizeLinkText("mailto:"+b).replace(/^mailto:/,""):b=e.md.normalizeLinkText(b):b=e.md.normalizeLinkText("http://"+b).replace(/^http:\/\//,"");const _=l[h].index;if(_>p){const g=new e.Token("text","",0);g.content=c.slice(p,_),g.level=o,d.push(g)}const k=new e.Token("link_open","a",1);k.attrs=[["href",m]],k.level=o++,k.markup="linkify",k.info="auto",d.push(k);const v=new e.Token("text","",0);v.content=b,v.level=o,d.push(v);const y=new e.Token("link_close","a",-1);y.level=--o,y.markup="linkify",y.info="auto",d.push(y),p=l[h].lastIndex}if(p<c.length){const h=new e.Token("text","",0);h.content=c.slice(p),h.level=o,d.push(h)}t[u].children=i=Tn(i,n,d)}}}}const zn=/\+-|\.\.|\?\?\?\?|!!!!|,,|--/,Al=/\((c|tm|r)\)/i,Sl=/\((c|tm|r)\)/ig,Fl={c:"©",r:"®",tm:"™"};function Tl(e,t){return Fl[t.toLowerCase()]}function Il(e){let t=0;for(let u=e.length-1;u>=0;u--){const r=e[u];r.type==="text"&&!t&&(r.content=r.content.replace(Sl,Tl)),r.type==="link_open"&&r.info==="auto"&&t--,r.type==="link_close"&&r.info==="auto"&&t++}}function Ol(e){let t=0;for(let u=e.length-1;u>=0;u--){const r=e[u];r.type==="text"&&!t&&zn.test(r.content)&&(r.content=r.content.replace(/\+-/g,"±").replace(/\.{2,}/g,"…").replace(/([?!])…/g,"$1..").replace(/([?!]){4,}/g,"$1$1$1").replace(/,{2,}/g,",").replace(/(^|[^-])---(?=[^-]|$)/mg,"$1—").replace(/(^|\s)--(?=\s|$)/mg,"$1–").replace(/(^|[^-\s])--(?=[^-\s]|$)/mg,"$1–")),r.type==="link_open"&&r.info==="auto"&&t--,r.type==="link_close"&&r.info==="auto"&&t++}}function zl(e){let t;if(e.md.options.typographer)for(t=e.tokens.length-1;t>=0;t--)e.tokens[t].type==="inline"&&(Al.test(e.tokens[t].content)&&Il(e.tokens[t].children),zn.test(e.tokens[t].content)&&Ol(e.tokens[t].children))}const Pl=/['"]/,rs=/['"]/g,is="’";function mu(e,t,u){return e.slice(0,t)+u+e.slice(t+1)}function Nl(e,t){let u;const r=[];for(let i=0;i<e.length;i++){const s=e[i],n=e[i].level;for(u=r.length-1;u>=0&&!(r[u].level<=n);u--);if(r.length=u+1,s.type!=="text")continue;let a=s.content,c=0,l=a.length;e:for(;c<l;){rs.lastIndex=c;const d=rs.exec(a);if(!d)break;let o=!0,p=!0;c=d.index+1;const h=d[0]==="'";let f=32;if(d.index-1>=0)f=a.charCodeAt(d.index-1);else for(u=i-1;u>=0&&!(e[u].type==="softbreak"||e[u].type==="hardbreak");u--)if(e[u].content){f=e[u].content.charCodeAt(e[u].content.length-1);break}let m=32;if(c<l)m=a.charCodeAt(c);else for(u=i+1;u<e.length&&!(e[u].type==="softbreak"||e[u].type==="hardbreak");u++)if(e[u].content){m=e[u].content.charCodeAt(0);break}const b=tu(f)||eu(String.fromCharCode(f)),_=tu(m)||eu(String.fromCharCode(m)),k=Xt(f),v=Xt(m);if(v?o=!1:_&&(k||b||(o=!1)),k?p=!1:b&&(v||_||(p=!1)),m===34&&d[0]==='"'&&f>=48&&f<=57&&(p=o=!1),o&&p&&(o=b,p=_),!o&&!p){h&&(s.content=mu(s.content,d.index,is));continue}if(p)for(u=r.length-1;u>=0;u--){let y=r[u];if(r[u].level<n)break;if(y.single===h&&r[u].level===n){y=r[u];let g,w;h?(g=t.md.options.quotes[2],w=t.md.options.quotes[3]):(g=t.md.options.quotes[0],w=t.md.options.quotes[1]),s.content=mu(s.content,d.index,w),e[y.token].content=mu(e[y.token].content,y.pos,g),c+=w.length-1,y.token===i&&(c+=g.length-1),a=s.content,l=a.length,r.length=u;continue e}}o?r.push({token:i,pos:d.index,single:h,level:n}):p&&h&&(s.content=mu(s.content,d.index,is))}}}function Rl(e){if(e.md.options.typographer)for(let t=e.tokens.length-1;t>=0;t--)e.tokens[t].type!=="inline"||!Pl.test(e.tokens[t].content)||Nl(e.tokens[t].children,e)}function Ml(e){let t,u;const r=e.tokens,i=r.length;for(let s=0;s<i;s++){if(r[s].type!=="inline")continue;const n=r[s].children,a=n.length;for(t=0;t<a;t++)n[t].type==="text_special"&&(n[t].type="text");for(t=u=0;t<a;t++)n[t].type==="text"&&t+1<a&&n[t+1].type==="text"?n[t+1].content=n[t].content+n[t+1].content:(t!==u&&(n[u]=n[t]),u++);t!==u&&(n.length=u)}}const wr=[["normalize",Cl],["block",wl],["inline",kl],["linkify",Dl],["replacements",zl],["smartquotes",Rl],["text_join",Ml]];function bi(){this.ruler=new pe;for(let e=0;e<wr.length;e++)this.ruler.push(wr[e][0],wr[e][1])}bi.prototype.process=function(e){const t=this.ruler.getRules("");for(let u=0,r=t.length;u<r;u++)t[u](e)};bi.prototype.State=On;function Se(e,t,u,r){this.src=e,this.md=t,this.env=u,this.tokens=r,this.bMarks=[],this.eMarks=[],this.tShift=[],this.sCount=[],this.bsCount=[],this.blkIndent=0,this.line=0,this.lineMax=0,this.tight=!1,this.ddIndent=-1,this.listIndent=-1,this.parentType="root",this.level=0;const i=this.src;for(let s=0,n=0,a=0,c=0,l=i.length,d=!1;n<l;n++){const o=i.charCodeAt(n);if(!d)if(G(o)){a++,o===9?c+=4-c%4:c++;continue}else d=!0;(o===10||n===l-1)&&(o!==10&&n++,this.bMarks.push(s),this.eMarks.push(n),this.tShift.push(a),this.sCount.push(c),this.bsCount.push(0),d=!1,a=0,c=0,s=n+1)}this.bMarks.push(i.length),this.eMarks.push(i.length),this.tShift.push(0),this.sCount.push(0),this.bsCount.push(0),this.lineMax=this.bMarks.length-1}Se.prototype.push=function(e,t,u){const r=new we(e,t,u);return r.block=!0,u<0&&this.level--,r.level=this.level,u>0&&this.level++,this.tokens.push(r),r};Se.prototype.isEmpty=function(t){return this.bMarks[t]+this.tShift[t]>=this.eMarks[t]};Se.prototype.skipEmptyLines=function(t){for(let u=this.lineMax;t<u&&!(this.bMarks[t]+this.tShift[t]<this.eMarks[t]);t++);return t};Se.prototype.skipSpaces=function(t){for(let u=this.src.length;t<u;t++){const r=this.src.charCodeAt(t);if(!G(r))break}return t};Se.prototype.skipSpacesBack=function(t,u){if(t<=u)return t;for(;t>u;)if(!G(this.src.charCodeAt(--t)))return t+1;return t};Se.prototype.skipChars=function(t,u){for(let r=this.src.length;t<r&&this.src.charCodeAt(t)===u;t++);return t};Se.prototype.skipCharsBack=function(t,u,r){if(t<=r)return t;for(;t>r;)if(u!==this.src.charCodeAt(--t))return t+1;return t};Se.prototype.getLines=function(t,u,r,i){if(t>=u)return"";const s=new Array(u-t);for(let n=0,a=t;a<u;a++,n++){let c=0;const l=this.bMarks[a];let d=l,o;for(a+1<u||i?o=this.eMarks[a]+1:o=this.eMarks[a];d<o&&c<r;){const p=this.src.charCodeAt(d);if(G(p))p===9?c+=4-(c+this.bsCount[a])%4:c++;else if(d-l<this.tShift[a])c++;else break;d++}c>r?s[n]=new Array(c-r+1).join(" ")+this.src.slice(d,o):s[n]=this.src.slice(d,o)}return s.join("")};Se.prototype.Token=we;const jl=65536;function kr(e,t){const u=e.bMarks[t]+e.tShift[t],r=e.eMarks[t];return e.src.slice(u,r)}function ss(e){const t=[],u=e.length;let r=0,i=e.charCodeAt(r),s=!1,n=0,a="";for(;r<u;)i===124&&(s?(a+=e.substring(n,r-1),n=r):(t.push(a+e.substring(n,r)),a="",n=r+1)),s=i===92,r++,i=e.charCodeAt(r);return t.push(a+e.substring(n)),t}function Bl(e,t,u,r){if(t+2>u)return!1;let i=t+1;if(e.sCount[i]<e.blkIndent||e.sCount[i]-e.blkIndent>=4)return!1;let s=e.bMarks[i]+e.tShift[i];if(s>=e.eMarks[i])return!1;const n=e.src.charCodeAt(s++);if(n!==124&&n!==45&&n!==58||s>=e.eMarks[i])return!1;const a=e.src.charCodeAt(s++);if(a!==124&&a!==45&&a!==58&&!G(a)||n===45&&G(a))return!1;for(;s<e.eMarks[i];){const y=e.src.charCodeAt(s);if(y!==124&&y!==45&&y!==58&&!G(y))return!1;s++}let c=kr(e,t+1),l=c.split("|");const d=[];for(let y=0;y<l.length;y++){const g=l[y].trim();if(!g){if(y===0||y===l.length-1)continue;return!1}if(!/^:?-+:?$/.test(g))return!1;g.charCodeAt(g.length-1)===58?d.push(g.charCodeAt(0)===58?"center":"right"):g.charCodeAt(0)===58?d.push("left"):d.push("")}if(c=kr(e,t).trim(),c.indexOf("|")===-1||e.sCount[t]-e.blkIndent>=4)return!1;l=ss(c),l.length&&l[0]===""&&l.shift(),l.length&&l[l.length-1]===""&&l.pop();const o=l.length;if(o===0||o!==d.length)return!1;if(r)return!0;const p=e.parentType;e.parentType="table";const h=e.md.block.ruler.getRules("blockquote"),f=e.push("table_open","table",1),m=[t,0];f.map=m;const b=e.push("thead_open","thead",1);b.map=[t,t+1];const _=e.push("tr_open","tr",1);_.map=[t,t+1];for(let y=0;y<l.length;y++){const g=e.push("th_open","th",1);d[y]&&(g.attrs=[["style","text-align:"+d[y]]]);const w=e.push("inline","",0);w.content=l[y].trim(),w.children=[],e.push("th_close","th",-1)}e.push("tr_close","tr",-1),e.push("thead_close","thead",-1);let k,v=0;for(i=t+2;i<u&&!(e.sCount[i]<e.blkIndent);i++){let y=!1;for(let w=0,z=h.length;w<z;w++)if(h[w](e,i,u,!0)){y=!0;break}if(y||(c=kr(e,i).trim(),!c)||e.sCount[i]-e.blkIndent>=4||(l=ss(c),l.length&&l[0]===""&&l.shift(),l.length&&l[l.length-1]===""&&l.pop(),v+=o-l.length,v>jl))break;if(i===t+2){const w=e.push("tbody_open","tbody",1);w.map=k=[t+2,0]}const g=e.push("tr_open","tr",1);g.map=[i,i+1];for(let w=0;w<o;w++){const z=e.push("td_open","td",1);d[w]&&(z.attrs=[["style","text-align:"+d[w]]]);const P=e.push("inline","",0);P.content=l[w]?l[w].trim():"",P.children=[],e.push("td_close","td",-1)}e.push("tr_close","tr",-1)}return k&&(e.push("tbody_close","tbody",-1),k[1]=i),e.push("table_close","table",-1),m[1]=i,e.parentType=p,e.line=i,!0}function Ll(e,t,u){if(e.sCount[t]-e.blkIndent<4)return!1;let r=t+1,i=r;for(;r<u;){if(e.isEmpty(r)){r++;continue}if(e.sCount[r]-e.blkIndent>=4){r++,i=r;continue}break}e.line=i;const s=e.push("code_block","code",0);return s.content=e.getLines(t,i,4+e.blkIndent,!1)+`
`,s.map=[t,e.line],!0}function Ul(e,t,u,r){let i=e.bMarks[t]+e.tShift[t],s=e.eMarks[t];if(e.sCount[t]-e.blkIndent>=4||i+3>s)return!1;const n=e.src.charCodeAt(i);if(n!==126&&n!==96)return!1;let a=i;i=e.skipChars(i,n);let c=i-a;if(c<3)return!1;const l=e.src.slice(a,i),d=e.src.slice(i,s);if(n===96&&d.indexOf(String.fromCharCode(n))>=0)return!1;if(r)return!0;let o=t,p=!1;for(;o++,!(o>=u||(i=a=e.bMarks[o]+e.tShift[o],s=e.eMarks[o],i<s&&e.sCount[o]<e.blkIndent));)if(e.src.charCodeAt(i)===n&&!(e.sCount[o]-e.blkIndent>=4)&&(i=e.skipChars(i,n),!(i-a<c)&&(i=e.skipSpaces(i),!(i<s)))){p=!0;break}c=e.sCount[t],e.line=o+(p?1:0);const h=e.push("fence","code",0);return h.info=d,h.content=e.getLines(t+1,o,c,!0),h.markup=l,h.map=[t,e.line],!0}function ql(e,t,u,r){let i=e.bMarks[t]+e.tShift[t],s=e.eMarks[t];const n=e.lineMax;if(e.sCount[t]-e.blkIndent>=4||e.src.charCodeAt(i)!==62)return!1;if(r)return!0;const a=[],c=[],l=[],d=[],o=e.md.block.ruler.getRules("blockquote"),p=e.parentType;e.parentType="blockquote";let h=!1,f;for(f=t;f<u;f++){const v=e.sCount[f]<e.blkIndent;if(i=e.bMarks[f]+e.tShift[f],s=e.eMarks[f],i>=s)break;if(e.src.charCodeAt(i++)===62&&!v){let g=e.sCount[f]+1,w,z;e.src.charCodeAt(i)===32?(i++,g++,z=!1,w=!0):e.src.charCodeAt(i)===9?(w=!0,(e.bsCount[f]+g)%4===3?(i++,g++,z=!1):z=!0):w=!1;let P=g;for(a.push(e.bMarks[f]),e.bMarks[f]=i;i<s;){const M=e.src.charCodeAt(i);if(G(M))M===9?P+=4-(P+e.bsCount[f]+(z?1:0))%4:P++;else break;i++}h=i>=s,c.push(e.bsCount[f]),e.bsCount[f]=e.sCount[f]+1+(w?1:0),l.push(e.sCount[f]),e.sCount[f]=P-g,d.push(e.tShift[f]),e.tShift[f]=i-e.bMarks[f];continue}if(h)break;let y=!1;for(let g=0,w=o.length;g<w;g++)if(o[g](e,f,u,!0)){y=!0;break}if(y){e.lineMax=f,e.blkIndent!==0&&(a.push(e.bMarks[f]),c.push(e.bsCount[f]),d.push(e.tShift[f]),l.push(e.sCount[f]),e.sCount[f]-=e.blkIndent);break}a.push(e.bMarks[f]),c.push(e.bsCount[f]),d.push(e.tShift[f]),l.push(e.sCount[f]),e.sCount[f]=-1}const m=e.blkIndent;e.blkIndent=0;const b=e.push("blockquote_open","blockquote",1);b.markup=">";const _=[t,0];b.map=_,e.md.block.tokenize(e,t,f);const k=e.push("blockquote_close","blockquote",-1);k.markup=">",e.lineMax=n,e.parentType=p,_[1]=e.line;for(let v=0;v<d.length;v++)e.bMarks[v+t]=a[v],e.tShift[v+t]=d[v],e.sCount[v+t]=l[v],e.bsCount[v+t]=c[v];return e.blkIndent=m,!0}function Vl(e,t,u,r){const i=e.eMarks[t];if(e.sCount[t]-e.blkIndent>=4)return!1;let s=e.bMarks[t]+e.tShift[t];const n=e.src.charCodeAt(s++);if(n!==42&&n!==45&&n!==95)return!1;let a=1;for(;s<i;){const l=e.src.charCodeAt(s++);if(l!==n&&!G(l))return!1;l===n&&a++}if(a<3)return!1;if(r)return!0;e.line=t+1;const c=e.push("hr","hr",0);return c.map=[t,e.line],c.markup=Array(a+1).join(String.fromCharCode(n)),!0}function ns(e,t){const u=e.eMarks[t];let r=e.bMarks[t]+e.tShift[t];const i=e.src.charCodeAt(r++);if(i!==42&&i!==45&&i!==43)return-1;if(r<u){const s=e.src.charCodeAt(r);if(!G(s))return-1}return r}function as(e,t){const u=e.bMarks[t]+e.tShift[t],r=e.eMarks[t];let i=u;if(i+1>=r)return-1;let s=e.src.charCodeAt(i++);if(s<48||s>57)return-1;for(;;){if(i>=r)return-1;if(s=e.src.charCodeAt(i++),s>=48&&s<=57){if(i-u>=10)return-1;continue}if(s===41||s===46)break;return-1}return i<r&&(s=e.src.charCodeAt(i),!G(s))?-1:i}function Hl(e,t){const u=e.level+2;for(let r=t+2,i=e.tokens.length-2;r<i;r++)e.tokens[r].level===u&&e.tokens[r].type==="paragraph_open"&&(e.tokens[r+2].hidden=!0,e.tokens[r].hidden=!0,r+=2)}function Wl(e,t,u,r){let i,s,n,a,c=t,l=!0;if(e.sCount[c]-e.blkIndent>=4||e.listIndent>=0&&e.sCount[c]-e.listIndent>=4&&e.sCount[c]<e.blkIndent)return!1;let d=!1;r&&e.parentType==="paragraph"&&e.sCount[c]>=e.blkIndent&&(d=!0);let o,p,h;if((h=as(e,c))>=0){if(o=!0,n=e.bMarks[c]+e.tShift[c],p=Number(e.src.slice(n,h-1)),d&&p!==1)return!1}else if((h=ns(e,c))>=0)o=!1;else return!1;if(d&&e.skipSpaces(h)>=e.eMarks[c])return!1;if(r)return!0;const f=e.src.charCodeAt(h-1),m=e.tokens.length;o?(a=e.push("ordered_list_open","ol",1),p!==1&&(a.attrs=[["start",p]])):a=e.push("bullet_list_open","ul",1);const b=[c,0];a.map=b,a.markup=String.fromCharCode(f);let _=!1;const k=e.md.block.ruler.getRules("list"),v=e.parentType;for(e.parentType="list";c<u;){s=h,i=e.eMarks[c];const y=e.sCount[c]+h-(e.bMarks[c]+e.tShift[c]);let g=y;for(;s<i;){const $=e.src.charCodeAt(s);if($===9)g+=4-(g+e.bsCount[c])%4;else if($===32)g++;else break;s++}const w=s;let z;w>=i?z=1:z=g-y,z>4&&(z=1);const P=y+z;a=e.push("list_item_open","li",1),a.markup=String.fromCharCode(f);const M=[c,0];a.map=M,o&&(a.info=e.src.slice(n,h-1));const Z=e.tight,F=e.tShift[c],E=e.sCount[c],U=e.listIndent;if(e.listIndent=e.blkIndent,e.blkIndent=P,e.tight=!0,e.tShift[c]=w-e.bMarks[c],e.sCount[c]=g,w>=i&&e.isEmpty(c+1)?e.line=Math.min(e.line+2,u):e.md.block.tokenize(e,c,u,!0),(!e.tight||_)&&(l=!1),_=e.line-c>1&&e.isEmpty(e.line-1),e.blkIndent=e.listIndent,e.listIndent=U,e.tShift[c]=F,e.sCount[c]=E,e.tight=Z,a=e.push("list_item_close","li",-1),a.markup=String.fromCharCode(f),c=e.line,M[1]=c,c>=u||e.sCount[c]<e.blkIndent||e.sCount[c]-e.blkIndent>=4)break;let ee=!1;for(let $=0,I=k.length;$<I;$++)if(k[$](e,c,u,!0)){ee=!0;break}if(ee)break;if(o){if(h=as(e,c),h<0)break;n=e.bMarks[c]+e.tShift[c]}else if(h=ns(e,c),h<0)break;if(f!==e.src.charCodeAt(h-1))break}return o?a=e.push("ordered_list_close","ol",-1):a=e.push("bullet_list_close","ul",-1),a.markup=String.fromCharCode(f),b[1]=c,e.line=c,e.parentType=v,l&&Hl(e,m),!0}function Gl(e,t,u,r){let i=e.bMarks[t]+e.tShift[t],s=e.eMarks[t],n=t+1;if(e.sCount[t]-e.blkIndent>=4||e.src.charCodeAt(i)!==91)return!1;function a(k){const v=e.lineMax;if(k>=v||e.isEmpty(k))return null;let y=!1;if(e.sCount[k]-e.blkIndent>3&&(y=!0),e.sCount[k]<0&&(y=!0),!y){const z=e.md.block.ruler.getRules("reference"),P=e.parentType;e.parentType="reference";let M=!1;for(let Z=0,F=z.length;Z<F;Z++)if(z[Z](e,k,v,!0)){M=!0;break}if(e.parentType=P,M)return null}const g=e.bMarks[k]+e.tShift[k],w=e.eMarks[k];return e.src.slice(g,w+1)}let c=e.src.slice(i,s+1);s=c.length;let l=-1;for(i=1;i<s;i++){const k=c.charCodeAt(i);if(k===91)return!1;if(k===93){l=i;break}else if(k===10){const v=a(n);v!==null&&(c+=v,s=c.length,n++)}else if(k===92&&(i++,i<s&&c.charCodeAt(i)===10)){const v=a(n);v!==null&&(c+=v,s=c.length,n++)}}if(l<0||c.charCodeAt(l+1)!==58)return!1;for(i=l+2;i<s;i++){const k=c.charCodeAt(i);if(k===10){const v=a(n);v!==null&&(c+=v,s=c.length,n++)}else if(!G(k))break}const d=e.md.helpers.parseLinkDestination(c,i,s);if(!d.ok)return!1;const o=e.md.normalizeLink(d.str);if(!e.md.validateLink(o))return!1;i=d.pos;const p=i,h=n,f=i;for(;i<s;i++){const k=c.charCodeAt(i);if(k===10){const v=a(n);v!==null&&(c+=v,s=c.length,n++)}else if(!G(k))break}let m=e.md.helpers.parseLinkTitle(c,i,s);for(;m.can_continue;){const k=a(n);if(k===null)break;c+=k,i=s,s=c.length,n++,m=e.md.helpers.parseLinkTitle(c,i,s,m)}let b;for(i<s&&f!==i&&m.ok?(b=m.str,i=m.pos):(b="",i=p,n=h);i<s;){const k=c.charCodeAt(i);if(!G(k))break;i++}if(i<s&&c.charCodeAt(i)!==10&&b)for(b="",i=p,n=h;i<s;){const k=c.charCodeAt(i);if(!G(k))break;i++}if(i<s&&c.charCodeAt(i)!==10)return!1;const _=Vu(c.slice(1,l));return _?(r||(typeof e.env.references>"u"&&(e.env.references={}),typeof e.env.references[_]>"u"&&(e.env.references[_]={title:b,href:o}),e.line=n),!0):!1}const Zl=["address","article","aside","base","basefont","blockquote","body","caption","center","col","colgroup","dd","details","dialog","dir","div","dl","dt","fieldset","figcaption","figure","footer","form","frame","frameset","h1","h2","h3","h4","h5","h6","head","header","hr","html","iframe","legend","li","link","main","menu","menuitem","nav","noframes","ol","optgroup","option","p","param","search","section","summary","table","tbody","td","tfoot","th","thead","title","tr","track","ul"],Kl="[a-zA-Z_:][a-zA-Z0-9:._-]*",Jl="[^\"'=<>`\\x00-\\x20]+",Ql="'[^']*'",Yl='"[^"]*"',Xl="(?:"+Jl+"|"+Ql+"|"+Yl+")",e0="(?:\\s+"+Kl+"(?:\\s*=\\s*"+Xl+")?)",Pn="<[A-Za-z][A-Za-z0-9\\-]*"+e0+"*\\s*\\/?>",Nn="<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>",t0="<!---?>|<!--(?:[^-]|-[^-]|--[^>])*-->",u0="<[?][\\s\\S]*?[?]>",r0="<![A-Za-z][^>]*>",i0="<!\\[CDATA\\[[\\s\\S]*?\\]\\]>",s0=new RegExp("^(?:"+Pn+"|"+Nn+"|"+t0+"|"+u0+"|"+r0+"|"+i0+")"),n0=new RegExp("^(?:"+Pn+"|"+Nn+")"),st=[[/^<(script|pre|style|textarea)(?=(\s|>|$))/i,/<\/(script|pre|style|textarea)>/i,!0],[/^<!--/,/-->/,!0],[/^<\?/,/\?>/,!0],[/^<![A-Z]/,/>/,!0],[/^<!\[CDATA\[/,/\]\]>/,!0],[new RegExp("^</?("+Zl.join("|")+")(?=(\\s|/?>|$))","i"),/^$/,!0],[new RegExp(n0.source+"\\s*$"),/^$/,!1]];function a0(e,t,u,r){let i=e.bMarks[t]+e.tShift[t],s=e.eMarks[t];if(e.sCount[t]-e.blkIndent>=4||!e.md.options.html||e.src.charCodeAt(i)!==60)return!1;let n=e.src.slice(i,s),a=0;for(;a<st.length&&!st[a][0].test(n);a++);if(a===st.length)return!1;if(r)return st[a][2];let c=t+1;if(!st[a][1].test(n)){for(;c<u&&!(e.sCount[c]<e.blkIndent);c++)if(i=e.bMarks[c]+e.tShift[c],s=e.eMarks[c],n=e.src.slice(i,s),st[a][1].test(n)){n.length!==0&&c++;break}}e.line=c;const l=e.push("html_block","",0);return l.map=[t,c],l.content=e.getLines(t,c,e.blkIndent,!0),!0}function o0(e,t,u,r){let i=e.bMarks[t]+e.tShift[t],s=e.eMarks[t];if(e.sCount[t]-e.blkIndent>=4)return!1;let n=e.src.charCodeAt(i);if(n!==35||i>=s)return!1;let a=1;for(n=e.src.charCodeAt(++i);n===35&&i<s&&a<=6;)a++,n=e.src.charCodeAt(++i);if(a>6||i<s&&!G(n))return!1;if(r)return!0;s=e.skipSpacesBack(s,i);const c=e.skipCharsBack(s,35,i);c>i&&G(e.src.charCodeAt(c-1))&&(s=c),e.line=t+1;const l=e.push("heading_open","h"+String(a),1);l.markup="########".slice(0,a),l.map=[t,e.line];const d=e.push("inline","",0);d.content=e.src.slice(i,s).trim(),d.map=[t,e.line],d.children=[];const o=e.push("heading_close","h"+String(a),-1);return o.markup="########".slice(0,a),!0}function c0(e,t,u){const r=e.md.block.ruler.getRules("paragraph");if(e.sCount[t]-e.blkIndent>=4)return!1;const i=e.parentType;e.parentType="paragraph";let s=0,n,a=t+1;for(;a<u&&!e.isEmpty(a);a++){if(e.sCount[a]-e.blkIndent>3)continue;if(e.sCount[a]>=e.blkIndent){let h=e.bMarks[a]+e.tShift[a];const f=e.eMarks[a];if(h<f&&(n=e.src.charCodeAt(h),(n===45||n===61)&&(h=e.skipChars(h,n),h=e.skipSpaces(h),h>=f))){s=n===61?1:2;break}}if(e.sCount[a]<0)continue;let p=!1;for(let h=0,f=r.length;h<f;h++)if(r[h](e,a,u,!0)){p=!0;break}if(p)break}if(!s)return!1;const c=e.getLines(t,a,e.blkIndent,!1).trim();e.line=a+1;const l=e.push("heading_open","h"+String(s),1);l.markup=String.fromCharCode(n),l.map=[t,e.line];const d=e.push("inline","",0);d.content=c,d.map=[t,e.line-1],d.children=[];const o=e.push("heading_close","h"+String(s),-1);return o.markup=String.fromCharCode(n),e.parentType=i,!0}function l0(e,t,u){const r=e.md.block.ruler.getRules("paragraph"),i=e.parentType;let s=t+1;for(e.parentType="paragraph";s<u&&!e.isEmpty(s);s++){if(e.sCount[s]-e.blkIndent>3||e.sCount[s]<0)continue;let l=!1;for(let d=0,o=r.length;d<o;d++)if(r[d](e,s,u,!0)){l=!0;break}if(l)break}const n=e.getLines(t,s,e.blkIndent,!1).trim();e.line=s;const a=e.push("paragraph_open","p",1);a.map=[t,e.line];const c=e.push("inline","",0);return c.content=n,c.map=[t,e.line],c.children=[],e.push("paragraph_close","p",-1),e.parentType=i,!0}const _u=[["table",Bl,["paragraph","reference"]],["code",Ll],["fence",Ul,["paragraph","reference","blockquote","list"]],["blockquote",ql,["paragraph","reference","blockquote","list"]],["hr",Vl,["paragraph","reference","blockquote","list"]],["list",Wl,["paragraph","reference","blockquote"]],["reference",Gl],["html_block",a0,["paragraph","reference","blockquote"]],["heading",o0,["paragraph","reference","blockquote"]],["lheading",c0],["paragraph",l0]];function Hu(){this.ruler=new pe;for(let e=0;e<_u.length;e++)this.ruler.push(_u[e][0],_u[e][1],{alt:(_u[e][2]||[]).slice()})}Hu.prototype.tokenize=function(e,t,u){const r=this.ruler.getRules(""),i=r.length,s=e.md.options.maxNesting;let n=t,a=!1;for(;n<u&&(e.line=n=e.skipEmptyLines(n),!(n>=u||e.sCount[n]<e.blkIndent));){if(e.level>=s){e.line=u;break}const c=e.line;let l=!1;for(let d=0;d<i;d++)if(l=r[d](e,n,u,!1),l){if(c>=e.line)throw new Error("block rule didn't increment state.line");break}if(!l)throw new Error("none of the block rules matched");e.tight=!a,e.isEmpty(e.line-1)&&(a=!0),n=e.line,n<u&&e.isEmpty(n)&&(a=!0,n++,e.line=n)}};Hu.prototype.parse=function(e,t,u,r){if(!e)return;const i=new this.State(e,t,u,r);this.tokenize(i,i.line,i.lineMax)};Hu.prototype.State=Se;function cu(e,t,u,r){this.src=e,this.env=u,this.md=t,this.tokens=r,this.tokens_meta=Array(r.length),this.pos=0,this.posMax=this.src.length,this.level=0,this.pending="",this.pendingLevel=0,this.cache={},this.delimiters=[],this._prev_delimiters=[],this.backticks={},this.backticksScanned=!1,this.linkLevel=0}cu.prototype.pushPending=function(){const e=new we("text","",0);return e.content=this.pending,e.level=this.pendingLevel,this.tokens.push(e),this.pending="",e};cu.prototype.push=function(e,t,u){this.pending&&this.pushPending();const r=new we(e,t,u);let i=null;return u<0&&(this.level--,this.delimiters=this._prev_delimiters.pop()),r.level=this.level,u>0&&(this.level++,this._prev_delimiters.push(this.delimiters),this.delimiters=[],i={delimiters:this.delimiters}),this.pendingLevel=this.level,this.tokens.push(r),this.tokens_meta.push(i),r};cu.prototype.scanDelims=function(e,t){const u=this.posMax,r=this.src.charCodeAt(e),i=e>0?this.src.charCodeAt(e-1):32;let s=e;for(;s<u&&this.src.charCodeAt(s)===r;)s++;const n=s-e,a=s<u?this.src.charCodeAt(s):32,c=tu(i)||eu(String.fromCharCode(i)),l=tu(a)||eu(String.fromCharCode(a)),d=Xt(i),o=Xt(a),p=!o&&(!l||d||c),h=!d&&(!c||o||l);return{can_open:p&&(t||!h||c),can_close:h&&(t||!p||l),length:n}};cu.prototype.Token=we;function d0(e){switch(e){case 10:case 33:case 35:case 36:case 37:case 38:case 42:case 43:case 45:case 58:case 60:case 61:case 62:case 64:case 91:case 92:case 93:case 94:case 95:case 96:case 123:case 125:case 126:return!0;default:return!1}}function f0(e,t){let u=e.pos;for(;u<e.posMax&&!d0(e.src.charCodeAt(u));)u++;return u===e.pos?!1:(t||(e.pending+=e.src.slice(e.pos,u)),e.pos=u,!0)}const h0=/(?:^|[^a-z0-9.+-])([a-z][a-z0-9.+-]*)$/i;function p0(e,t){if(!e.md.options.linkify||e.linkLevel>0)return!1;const u=e.pos,r=e.posMax;if(u+3>r||e.src.charCodeAt(u)!==58||e.src.charCodeAt(u+1)!==47||e.src.charCodeAt(u+2)!==47)return!1;const i=e.pending.match(h0);if(!i)return!1;const s=i[1],n=e.md.linkify.matchAtStart(e.src.slice(u-s.length));if(!n)return!1;let a=n.url;if(a.length<=s.length)return!1;a=a.replace(/\*+$/,"");const c=e.md.normalizeLink(a);if(!e.md.validateLink(c))return!1;if(!t){e.pending=e.pending.slice(0,-s.length);const l=e.push("link_open","a",1);l.attrs=[["href",c]],l.markup="linkify",l.info="auto";const d=e.push("text","",0);d.content=e.md.normalizeLinkText(a);const o=e.push("link_close","a",-1);o.markup="linkify",o.info="auto"}return e.pos+=a.length-s.length,!0}function b0(e,t){let u=e.pos;if(e.src.charCodeAt(u)!==10)return!1;const r=e.pending.length-1,i=e.posMax;if(!t)if(r>=0&&e.pending.charCodeAt(r)===32)if(r>=1&&e.pending.charCodeAt(r-1)===32){let s=r-1;for(;s>=1&&e.pending.charCodeAt(s-1)===32;)s--;e.pending=e.pending.slice(0,s),e.push("hardbreak","br",0)}else e.pending=e.pending.slice(0,-1),e.push("softbreak","br",0);else e.push("softbreak","br",0);for(u++;u<i&&G(e.src.charCodeAt(u));)u++;return e.pos=u,!0}const mi=[];for(let e=0;e<256;e++)mi.push(0);"\\!\"#$%&'()*+,./:;<=>?@[]^_`{|}~-".split("").forEach(function(e){mi[e.charCodeAt(0)]=1});function m0(e,t){let u=e.pos;const r=e.posMax;if(e.src.charCodeAt(u)!==92||(u++,u>=r))return!1;let i=e.src.charCodeAt(u);if(i===10){for(t||e.push("hardbreak","br",0),u++;u<r&&(i=e.src.charCodeAt(u),!!G(i));)u++;return e.pos=u,!0}let s=e.src[u];if(i>=55296&&i<=56319&&u+1<r){const a=e.src.charCodeAt(u+1);a>=56320&&a<=57343&&(s+=e.src[u+1],u++)}const n="\\"+s;if(!t){const a=e.push("text_special","",0);i<256&&mi[i]!==0?a.content=s:a.content=n,a.markup=n,a.info="escape"}return e.pos=u+1,!0}function _0(e,t){let u=e.pos;if(e.src.charCodeAt(u)!==96)return!1;const i=u;u++;const s=e.posMax;for(;u<s&&e.src.charCodeAt(u)===96;)u++;const n=e.src.slice(i,u),a=n.length;if(e.backticksScanned&&(e.backticks[a]||0)<=i)return t||(e.pending+=n),e.pos+=a,!0;let c=u,l;for(;(l=e.src.indexOf("`",c))!==-1;){for(c=l+1;c<s&&e.src.charCodeAt(c)===96;)c++;const d=c-l;if(d===a){if(!t){const o=e.push("code_inline","code",0);o.markup=n,o.content=e.src.slice(u,l).replace(/\n/g," ").replace(/^ (.+) $/,"$1")}return e.pos=c,!0}e.backticks[d]=l}return e.backticksScanned=!0,t||(e.pending+=n),e.pos+=a,!0}function g0(e,t){const u=e.pos,r=e.src.charCodeAt(u);if(t||r!==126)return!1;const i=e.scanDelims(e.pos,!0);let s=i.length;const n=String.fromCharCode(r);if(s<2)return!1;let a;s%2&&(a=e.push("text","",0),a.content=n,s--);for(let c=0;c<s;c+=2)a=e.push("text","",0),a.content=n+n,e.delimiters.push({marker:r,length:0,token:e.tokens.length-1,end:-1,open:i.can_open,close:i.can_close});return e.pos+=i.length,!0}function os(e,t){let u;const r=[],i=t.length;for(let s=0;s<i;s++){const n=t[s];if(n.marker!==126||n.end===-1)continue;const a=t[n.end];u=e.tokens[n.token],u.type="s_open",u.tag="s",u.nesting=1,u.markup="~~",u.content="",u=e.tokens[a.token],u.type="s_close",u.tag="s",u.nesting=-1,u.markup="~~",u.content="",e.tokens[a.token-1].type==="text"&&e.tokens[a.token-1].content==="~"&&r.push(a.token-1)}for(;r.length;){const s=r.pop();let n=s+1;for(;n<e.tokens.length&&e.tokens[n].type==="s_close";)n++;n--,s!==n&&(u=e.tokens[n],e.tokens[n]=e.tokens[s],e.tokens[s]=u)}}function y0(e){const t=e.tokens_meta,u=e.tokens_meta.length;os(e,e.delimiters);for(let r=0;r<u;r++)t[r]&&t[r].delimiters&&os(e,t[r].delimiters)}const Rn={tokenize:g0,postProcess:y0};function x0(e,t){const u=e.pos,r=e.src.charCodeAt(u);if(t||r!==95&&r!==42)return!1;const i=e.scanDelims(e.pos,r===42);for(let s=0;s<i.length;s++){const n=e.push("text","",0);n.content=String.fromCharCode(r),e.delimiters.push({marker:r,length:i.length,token:e.tokens.length-1,end:-1,open:i.can_open,close:i.can_close})}return e.pos+=i.length,!0}function cs(e,t){const u=t.length;for(let r=u-1;r>=0;r--){const i=t[r];if(i.marker!==95&&i.marker!==42||i.end===-1)continue;const s=t[i.end],n=r>0&&t[r-1].end===i.end+1&&t[r-1].marker===i.marker&&t[r-1].token===i.token-1&&t[i.end+1].token===s.token+1,a=String.fromCharCode(i.marker),c=e.tokens[i.token];c.type=n?"strong_open":"em_open",c.tag=n?"strong":"em",c.nesting=1,c.markup=n?a+a:a,c.content="";const l=e.tokens[s.token];l.type=n?"strong_close":"em_close",l.tag=n?"strong":"em",l.nesting=-1,l.markup=n?a+a:a,l.content="",n&&(e.tokens[t[r-1].token].content="",e.tokens[t[i.end+1].token].content="",r--)}}function v0(e){const t=e.tokens_meta,u=e.tokens_meta.length;cs(e,e.delimiters);for(let r=0;r<u;r++)t[r]&&t[r].delimiters&&cs(e,t[r].delimiters)}const Mn={tokenize:x0,postProcess:v0};function C0(e,t){let u,r,i,s,n="",a="",c=e.pos,l=!0;if(e.src.charCodeAt(e.pos)!==91)return!1;const d=e.pos,o=e.posMax,p=e.pos+1,h=e.md.helpers.parseLinkLabel(e,e.pos,!0);if(h<0)return!1;let f=h+1;if(f<o&&e.src.charCodeAt(f)===40){for(l=!1,f++;f<o&&(u=e.src.charCodeAt(f),!(!G(u)&&u!==10));f++);if(f>=o)return!1;if(c=f,i=e.md.helpers.parseLinkDestination(e.src,f,e.posMax),i.ok){for(n=e.md.normalizeLink(i.str),e.md.validateLink(n)?f=i.pos:n="",c=f;f<o&&(u=e.src.charCodeAt(f),!(!G(u)&&u!==10));f++);if(i=e.md.helpers.parseLinkTitle(e.src,f,e.posMax),f<o&&c!==f&&i.ok)for(a=i.str,f=i.pos;f<o&&(u=e.src.charCodeAt(f),!(!G(u)&&u!==10));f++);}(f>=o||e.src.charCodeAt(f)!==41)&&(l=!0),f++}if(l){if(typeof e.env.references>"u")return!1;if(f<o&&e.src.charCodeAt(f)===91?(c=f+1,f=e.md.helpers.parseLinkLabel(e,f),f>=0?r=e.src.slice(c,f++):f=h+1):f=h+1,r||(r=e.src.slice(p,h)),s=e.env.references[Vu(r)],!s)return e.pos=d,!1;n=s.href,a=s.title}if(!t){e.pos=p,e.posMax=h;const m=e.push("link_open","a",1),b=[["href",n]];m.attrs=b,a&&b.push(["title",a]),e.linkLevel++,e.md.inline.tokenize(e),e.linkLevel--,e.push("link_close","a",-1)}return e.pos=f,e.posMax=o,!0}function w0(e,t){let u,r,i,s,n,a,c,l,d="";const o=e.pos,p=e.posMax;if(e.src.charCodeAt(e.pos)!==33||e.src.charCodeAt(e.pos+1)!==91)return!1;const h=e.pos+2,f=e.md.helpers.parseLinkLabel(e,e.pos+1,!1);if(f<0)return!1;if(s=f+1,s<p&&e.src.charCodeAt(s)===40){for(s++;s<p&&(u=e.src.charCodeAt(s),!(!G(u)&&u!==10));s++);if(s>=p)return!1;for(l=s,a=e.md.helpers.parseLinkDestination(e.src,s,e.posMax),a.ok&&(d=e.md.normalizeLink(a.str),e.md.validateLink(d)?s=a.pos:d=""),l=s;s<p&&(u=e.src.charCodeAt(s),!(!G(u)&&u!==10));s++);if(a=e.md.helpers.parseLinkTitle(e.src,s,e.posMax),s<p&&l!==s&&a.ok)for(c=a.str,s=a.pos;s<p&&(u=e.src.charCodeAt(s),!(!G(u)&&u!==10));s++);else c="";if(s>=p||e.src.charCodeAt(s)!==41)return e.pos=o,!1;s++}else{if(typeof e.env.references>"u")return!1;if(s<p&&e.src.charCodeAt(s)===91?(l=s+1,s=e.md.helpers.parseLinkLabel(e,s),s>=0?i=e.src.slice(l,s++):s=f+1):s=f+1,i||(i=e.src.slice(h,f)),n=e.env.references[Vu(i)],!n)return e.pos=o,!1;d=n.href,c=n.title}if(!t){r=e.src.slice(h,f);const m=[];e.md.inline.parse(r,e.md,e.env,m);const b=e.push("image","img",0),_=[["src",d],["alt",""]];b.attrs=_,b.children=m,b.content=r,c&&_.push(["title",c])}return e.pos=s,e.posMax=p,!0}const k0=/^([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)$/,$0=/^([a-zA-Z][a-zA-Z0-9+.-]{1,31}):([^<>\x00-\x20]*)$/;function E0(e,t){let u=e.pos;if(e.src.charCodeAt(u)!==60)return!1;const r=e.pos,i=e.posMax;for(;;){if(++u>=i)return!1;const n=e.src.charCodeAt(u);if(n===60)return!1;if(n===62)break}const s=e.src.slice(r+1,u);if($0.test(s)){const n=e.md.normalizeLink(s);if(!e.md.validateLink(n))return!1;if(!t){const a=e.push("link_open","a",1);a.attrs=[["href",n]],a.markup="autolink",a.info="auto";const c=e.push("text","",0);c.content=e.md.normalizeLinkText(s);const l=e.push("link_close","a",-1);l.markup="autolink",l.info="auto"}return e.pos+=s.length+2,!0}if(k0.test(s)){const n=e.md.normalizeLink("mailto:"+s);if(!e.md.validateLink(n))return!1;if(!t){const a=e.push("link_open","a",1);a.attrs=[["href",n]],a.markup="autolink",a.info="auto";const c=e.push("text","",0);c.content=e.md.normalizeLinkText(s);const l=e.push("link_close","a",-1);l.markup="autolink",l.info="auto"}return e.pos+=s.length+2,!0}return!1}function D0(e){return/^<a[>\s]/i.test(e)}function A0(e){return/^<\/a\s*>/i.test(e)}function S0(e){const t=e|32;return t>=97&&t<=122}function F0(e,t){if(!e.md.options.html)return!1;const u=e.posMax,r=e.pos;if(e.src.charCodeAt(r)!==60||r+2>=u)return!1;const i=e.src.charCodeAt(r+1);if(i!==33&&i!==63&&i!==47&&!S0(i))return!1;const s=e.src.slice(r).match(s0);if(!s)return!1;if(!t){const n=e.push("html_inline","",0);n.content=s[0],D0(n.content)&&e.linkLevel++,A0(n.content)&&e.linkLevel--}return e.pos+=s[0].length,!0}const T0=/^&#((?:x[a-f0-9]{1,6}|[0-9]{1,7}));/i,I0=/^&([a-z][a-z0-9]{1,31});/i;function O0(e,t){const u=e.pos,r=e.posMax;if(e.src.charCodeAt(u)!==38||u+1>=r)return!1;if(e.src.charCodeAt(u+1)===35){const s=e.src.slice(u).match(T0);if(s){if(!t){const n=s[1][0].toLowerCase()==="x"?parseInt(s[1].slice(1),16):parseInt(s[1],10),a=e.push("text_special","",0);a.content=pi(n)?zu(n):zu(65533),a.markup=s[0],a.info="entity"}return e.pos+=s[0].length,!0}}else{const s=e.src.slice(u).match(I0);if(s){const n=Fn(s[0]);if(n!==s[0]){if(!t){const a=e.push("text_special","",0);a.content=n,a.markup=s[0],a.info="entity"}return e.pos+=s[0].length,!0}}}return!1}function ls(e){const t={},u=e.length;if(!u)return;let r=0,i=-2;const s=[];for(let n=0;n<u;n++){const a=e[n];if(s.push(0),(e[r].marker!==a.marker||i!==a.token-1)&&(r=n),i=a.token,a.length=a.length||0,!a.close)continue;t.hasOwnProperty(a.marker)||(t[a.marker]=[-1,-1,-1,-1,-1,-1]);const c=t[a.marker][(a.open?3:0)+a.length%3];let l=r-s[r]-1,d=l;for(;l>c;l-=s[l]+1){const o=e[l];if(o.marker===a.marker&&o.open&&o.end<0){let p=!1;if((o.close||a.open)&&(o.length+a.length)%3===0&&(o.length%3!==0||a.length%3!==0)&&(p=!0),!p){const h=l>0&&!e[l-1].open?s[l-1]+1:0;s[n]=n-l+h,s[l]=h,a.open=!1,o.end=n,o.close=!1,d=-1,i=-2;break}}}d!==-1&&(t[a.marker][(a.open?3:0)+(a.length||0)%3]=d)}}function z0(e){const t=e.tokens_meta,u=e.tokens_meta.length;ls(e.delimiters);for(let r=0;r<u;r++)t[r]&&t[r].delimiters&&ls(t[r].delimiters)}function P0(e){let t,u,r=0;const i=e.tokens,s=e.tokens.length;for(t=u=0;t<s;t++)i[t].nesting<0&&r--,i[t].level=r,i[t].nesting>0&&r++,i[t].type==="text"&&t+1<s&&i[t+1].type==="text"?i[t+1].content=i[t].content+i[t+1].content:(t!==u&&(i[u]=i[t]),u++);t!==u&&(i.length=u)}const $r=[["text",f0],["linkify",p0],["newline",b0],["escape",m0],["backticks",_0],["strikethrough",Rn.tokenize],["emphasis",Mn.tokenize],["link",C0],["image",w0],["autolink",E0],["html_inline",F0],["entity",O0]],Er=[["balance_pairs",z0],["strikethrough",Rn.postProcess],["emphasis",Mn.postProcess],["fragments_join",P0]];function lu(){this.ruler=new pe;for(let e=0;e<$r.length;e++)this.ruler.push($r[e][0],$r[e][1]);this.ruler2=new pe;for(let e=0;e<Er.length;e++)this.ruler2.push(Er[e][0],Er[e][1])}lu.prototype.skipToken=function(e){const t=e.pos,u=this.ruler.getRules(""),r=u.length,i=e.md.options.maxNesting,s=e.cache;if(typeof s[t]<"u"){e.pos=s[t];return}let n=!1;if(e.level<i){for(let a=0;a<r;a++)if(e.level++,n=u[a](e,!0),e.level--,n){if(t>=e.pos)throw new Error("inline rule didn't increment state.pos");break}}else e.pos=e.posMax;n||e.pos++,s[t]=e.pos};lu.prototype.tokenize=function(e){const t=this.ruler.getRules(""),u=t.length,r=e.posMax,i=e.md.options.maxNesting;for(;e.pos<r;){const s=e.pos;let n=!1;if(e.level<i){for(let a=0;a<u;a++)if(n=t[a](e,!1),n){if(s>=e.pos)throw new Error("inline rule didn't increment state.pos");break}}if(n){if(e.pos>=r)break;continue}e.pending+=e.src[e.pos++]}e.pending&&e.pushPending()};lu.prototype.parse=function(e,t,u,r){const i=new this.State(e,t,u,r);this.tokenize(i);const s=this.ruler2.getRules(""),n=s.length;for(let a=0;a<n;a++)s[a](i)};lu.prototype.State=cu;function N0(e){const t={};e=e||{},t.src_Any=$n.source,t.src_Cc=En.source,t.src_Z=An.source,t.src_P=fi.source,t.src_ZPCc=[t.src_Z,t.src_P,t.src_Cc].join("|"),t.src_ZCc=[t.src_Z,t.src_Cc].join("|");const u="[><｜]";return t.src_pseudo_letter="(?:(?!"+u+"|"+t.src_ZPCc+")"+t.src_Any+")",t.src_ip4="(?:(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)",t.src_auth="(?:(?:(?!"+t.src_ZCc+"|[@/\\[\\]()]).)+@)?",t.src_port="(?::(?:6(?:[0-4]\\d{3}|5(?:[0-4]\\d{2}|5(?:[0-2]\\d|3[0-5])))|[1-5]?\\d{1,4}))?",t.src_host_terminator="(?=$|"+u+"|"+t.src_ZPCc+")(?!"+(e["---"]?"-(?!--)|":"-|")+"_|:\\d|\\.-|\\.(?!$|"+t.src_ZPCc+"))",t.src_path="(?:[/?#](?:(?!"+t.src_ZCc+"|"+u+`|[()[\\]{}.,"'?!\\-;]).|\\[(?:(?!`+t.src_ZCc+"|\\]).)*\\]|\\((?:(?!"+t.src_ZCc+"|[)]).)*\\)|\\{(?:(?!"+t.src_ZCc+'|[}]).)*\\}|\\"(?:(?!'+t.src_ZCc+`|["]).)+\\"|\\'(?:(?!`+t.src_ZCc+"|[']).)+\\'|\\'(?="+t.src_pseudo_letter+"|[-])|\\.{2,}[a-zA-Z0-9%/&]|\\.(?!"+t.src_ZCc+"|[.]|$)|"+(e["---"]?"\\-(?!--(?:[^-]|$))(?:-*)|":"\\-+|")+",(?!"+t.src_ZCc+"|$)|;(?!"+t.src_ZCc+"|$)|\\!+(?!"+t.src_ZCc+"|[!]|$)|\\?(?!"+t.src_ZCc+"|[?]|$))+|\\/)?",t.src_email_name='[\\-;:&=\\+\\$,\\.a-zA-Z0-9_][\\-;:&=\\+\\$,\\"\\.a-zA-Z0-9_]*',t.src_xn="xn--[a-z0-9\\-]{1,59}",t.src_domain_root="(?:"+t.src_xn+"|"+t.src_pseudo_letter+"{1,63})",t.src_domain="(?:"+t.src_xn+"|(?:"+t.src_pseudo_letter+")|(?:"+t.src_pseudo_letter+"(?:-|"+t.src_pseudo_letter+"){0,61}"+t.src_pseudo_letter+"))",t.src_host="(?:(?:(?:(?:"+t.src_domain+")\\.)*"+t.src_domain+"))",t.tpl_host_fuzzy="(?:"+t.src_ip4+"|(?:(?:(?:"+t.src_domain+")\\.)+(?:%TLDS%)))",t.tpl_host_no_ip_fuzzy="(?:(?:(?:"+t.src_domain+")\\.)+(?:%TLDS%))",t.src_host_strict=t.src_host+t.src_host_terminator,t.tpl_host_fuzzy_strict=t.tpl_host_fuzzy+t.src_host_terminator,t.src_host_port_strict=t.src_host+t.src_port+t.src_host_terminator,t.tpl_host_port_fuzzy_strict=t.tpl_host_fuzzy+t.src_port+t.src_host_terminator,t.tpl_host_port_no_ip_fuzzy_strict=t.tpl_host_no_ip_fuzzy+t.src_port+t.src_host_terminator,t.tpl_host_fuzzy_test="localhost|www\\.|\\.\\d{1,3}\\.|(?:\\.(?:%TLDS%)(?:"+t.src_ZPCc+"|>|$))",t.tpl_email_fuzzy="(^|"+u+'|"|\\(|'+t.src_ZCc+")("+t.src_email_name+"@"+t.tpl_host_fuzzy_strict+")",t.tpl_link_fuzzy="(^|(?![.:/\\-_@])(?:[$+<=>^`|｜]|"+t.src_ZPCc+"))((?![$+<=>^`|｜])"+t.tpl_host_port_fuzzy_strict+t.src_path+")",t.tpl_link_no_ip_fuzzy="(^|(?![.:/\\-_@])(?:[$+<=>^`|｜]|"+t.src_ZPCc+"))((?![$+<=>^`|｜])"+t.tpl_host_port_no_ip_fuzzy_strict+t.src_path+")",t}function Qr(e){return Array.prototype.slice.call(arguments,1).forEach(function(u){u&&Object.keys(u).forEach(function(r){e[r]=u[r]})}),e}function Wu(e){return Object.prototype.toString.call(e)}function R0(e){return Wu(e)==="[object String]"}function M0(e){return Wu(e)==="[object Object]"}function j0(e){return Wu(e)==="[object RegExp]"}function ds(e){return Wu(e)==="[object Function]"}function B0(e){return e.replace(/[.?*+^$[\]\\(){}|-]/g,"\\$&")}const jn={fuzzyLink:!0,fuzzyEmail:!0,fuzzyIP:!1};function L0(e){return Object.keys(e||{}).reduce(function(t,u){return t||jn.hasOwnProperty(u)},!1)}const U0={"http:":{validate:function(e,t,u){const r=e.slice(t);return u.re.http||(u.re.http=new RegExp("^\\/\\/"+u.re.src_auth+u.re.src_host_port_strict+u.re.src_path,"i")),u.re.http.test(r)?r.match(u.re.http)[0].length:0}},"https:":"http:","ftp:":"http:","//":{validate:function(e,t,u){const r=e.slice(t);return u.re.no_http||(u.re.no_http=new RegExp("^"+u.re.src_auth+"(?:localhost|(?:(?:"+u.re.src_domain+")\\.)+"+u.re.src_domain_root+")"+u.re.src_port+u.re.src_host_terminator+u.re.src_path,"i")),u.re.no_http.test(r)?t>=3&&e[t-3]===":"||t>=3&&e[t-3]==="/"?0:r.match(u.re.no_http)[0].length:0}},"mailto:":{validate:function(e,t,u){const r=e.slice(t);return u.re.mailto||(u.re.mailto=new RegExp("^"+u.re.src_email_name+"@"+u.re.src_host_strict,"i")),u.re.mailto.test(r)?r.match(u.re.mailto)[0].length:0}}},q0="a[cdefgilmnoqrstuwxz]|b[abdefghijmnorstvwyz]|c[acdfghiklmnoruvwxyz]|d[ejkmoz]|e[cegrstu]|f[ijkmor]|g[abdefghilmnpqrstuwy]|h[kmnrtu]|i[delmnoqrst]|j[emop]|k[eghimnprwyz]|l[abcikrstuvy]|m[acdeghklmnopqrstuvwxyz]|n[acefgilopruz]|om|p[aefghklmnrstwy]|qa|r[eosuw]|s[abcdeghijklmnortuvxyz]|t[cdfghjklmnortvwz]|u[agksyz]|v[aceginu]|w[fs]|y[et]|z[amw]",V0="biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф".split("|");function H0(e){e.__index__=-1,e.__text_cache__=""}function W0(e){return function(t,u){const r=t.slice(u);return e.test(r)?r.match(e)[0].length:0}}function fs(){return function(e,t){t.normalize(e)}}function Pu(e){const t=e.re=N0(e.__opts__),u=e.__tlds__.slice();e.onCompile(),e.__tlds_replaced__||u.push(q0),u.push(t.src_xn),t.src_tlds=u.join("|");function r(a){return a.replace("%TLDS%",t.src_tlds)}t.email_fuzzy=RegExp(r(t.tpl_email_fuzzy),"i"),t.link_fuzzy=RegExp(r(t.tpl_link_fuzzy),"i"),t.link_no_ip_fuzzy=RegExp(r(t.tpl_link_no_ip_fuzzy),"i"),t.host_fuzzy_test=RegExp(r(t.tpl_host_fuzzy_test),"i");const i=[];e.__compiled__={};function s(a,c){throw new Error('(LinkifyIt) Invalid schema "'+a+'": '+c)}Object.keys(e.__schemas__).forEach(function(a){const c=e.__schemas__[a];if(c===null)return;const l={validate:null,link:null};if(e.__compiled__[a]=l,M0(c)){j0(c.validate)?l.validate=W0(c.validate):ds(c.validate)?l.validate=c.validate:s(a,c),ds(c.normalize)?l.normalize=c.normalize:c.normalize?s(a,c):l.normalize=fs();return}if(R0(c)){i.push(a);return}s(a,c)}),i.forEach(function(a){e.__compiled__[e.__schemas__[a]]&&(e.__compiled__[a].validate=e.__compiled__[e.__schemas__[a]].validate,e.__compiled__[a].normalize=e.__compiled__[e.__schemas__[a]].normalize)}),e.__compiled__[""]={validate:null,normalize:fs()};const n=Object.keys(e.__compiled__).filter(function(a){return a.length>0&&e.__compiled__[a]}).map(B0).join("|");e.re.schema_test=RegExp("(^|(?!_)(?:[><｜]|"+t.src_ZPCc+"))("+n+")","i"),e.re.schema_search=RegExp("(^|(?!_)(?:[><｜]|"+t.src_ZPCc+"))("+n+")","ig"),e.re.schema_at_start=RegExp("^"+e.re.schema_search.source,"i"),e.re.pretest=RegExp("("+e.re.schema_test.source+")|("+e.re.host_fuzzy_test.source+")|@","i"),H0(e)}function G0(e,t){const u=e.__index__,r=e.__last_index__,i=e.__text_cache__.slice(u,r);this.schema=e.__schema__.toLowerCase(),this.index=u+t,this.lastIndex=r+t,this.raw=i,this.text=i,this.url=i}function Yr(e,t){const u=new G0(e,t);return e.__compiled__[u.schema].normalize(u,e),u}function be(e,t){if(!(this instanceof be))return new be(e,t);t||L0(e)&&(t=e,e={}),this.__opts__=Qr({},jn,t),this.__index__=-1,this.__last_index__=-1,this.__schema__="",this.__text_cache__="",this.__schemas__=Qr({},U0,e),this.__compiled__={},this.__tlds__=V0,this.__tlds_replaced__=!1,this.re={},Pu(this)}be.prototype.add=function(t,u){return this.__schemas__[t]=u,Pu(this),this};be.prototype.set=function(t){return this.__opts__=Qr(this.__opts__,t),this};be.prototype.test=function(t){if(this.__text_cache__=t,this.__index__=-1,!t.length)return!1;let u,r,i,s,n,a,c,l,d;if(this.re.schema_test.test(t)){for(c=this.re.schema_search,c.lastIndex=0;(u=c.exec(t))!==null;)if(s=this.testSchemaAt(t,u[2],c.lastIndex),s){this.__schema__=u[2],this.__index__=u.index+u[1].length,this.__last_index__=u.index+u[0].length+s;break}}return this.__opts__.fuzzyLink&&this.__compiled__["http:"]&&(l=t.search(this.re.host_fuzzy_test),l>=0&&(this.__index__<0||l<this.__index__)&&(r=t.match(this.__opts__.fuzzyIP?this.re.link_fuzzy:this.re.link_no_ip_fuzzy))!==null&&(n=r.index+r[1].length,(this.__index__<0||n<this.__index__)&&(this.__schema__="",this.__index__=n,this.__last_index__=r.index+r[0].length))),this.__opts__.fuzzyEmail&&this.__compiled__["mailto:"]&&(d=t.indexOf("@"),d>=0&&(i=t.match(this.re.email_fuzzy))!==null&&(n=i.index+i[1].length,a=i.index+i[0].length,(this.__index__<0||n<this.__index__||n===this.__index__&&a>this.__last_index__)&&(this.__schema__="mailto:",this.__index__=n,this.__last_index__=a))),this.__index__>=0};be.prototype.pretest=function(t){return this.re.pretest.test(t)};be.prototype.testSchemaAt=function(t,u,r){return this.__compiled__[u.toLowerCase()]?this.__compiled__[u.toLowerCase()].validate(t,r,this):0};be.prototype.match=function(t){const u=[];let r=0;this.__index__>=0&&this.__text_cache__===t&&(u.push(Yr(this,r)),r=this.__last_index__);let i=r?t.slice(r):t;for(;this.test(i);)u.push(Yr(this,r)),i=i.slice(this.__last_index__),r+=this.__last_index__;return u.length?u:null};be.prototype.matchAtStart=function(t){if(this.__text_cache__=t,this.__index__=-1,!t.length)return null;const u=this.re.schema_at_start.exec(t);if(!u)return null;const r=this.testSchemaAt(t,u[2],u[0].length);return r?(this.__schema__=u[2],this.__index__=u.index+u[1].length,this.__last_index__=u.index+u[0].length+r,Yr(this,0)):null};be.prototype.tlds=function(t,u){return t=Array.isArray(t)?t:[t],u?(this.__tlds__=this.__tlds__.concat(t).sort().filter(function(r,i,s){return r!==s[i-1]}).reverse(),Pu(this),this):(this.__tlds__=t.slice(),this.__tlds_replaced__=!0,Pu(this),this)};be.prototype.normalize=function(t){t.schema||(t.url="http://"+t.url),t.schema==="mailto:"&&!/^mailto:/i.test(t.url)&&(t.url="mailto:"+t.url)};be.prototype.onCompile=function(){};const ft=2147483647,$e=36,_i=1,uu=26,Z0=38,K0=700,Bn=72,Ln=128,Un="-",J0=/^xn--/,Q0=/[^\0-\x7F]/,Y0=/[\x2E\u3002\uFF0E\uFF61]/g,X0={overflow:"Overflow: input needs wider integers to process","not-basic":"Illegal input >= 0x80 (not a basic code point)","invalid-input":"Invalid input"},Dr=$e-_i,Ee=Math.floor,Ar=String.fromCharCode;function Me(e){throw new RangeError(X0[e])}function ed(e,t){const u=[];let r=e.length;for(;r--;)u[r]=t(e[r]);return u}function qn(e,t){const u=e.split("@");let r="";u.length>1&&(r=u[0]+"@",e=u[1]),e=e.replace(Y0,".");const i=e.split("."),s=ed(i,t).join(".");return r+s}function Vn(e){const t=[];let u=0;const r=e.length;for(;u<r;){const i=e.charCodeAt(u++);if(i>=55296&&i<=56319&&u<r){const s=e.charCodeAt(u++);(s&64512)==56320?t.push(((i&1023)<<10)+(s&1023)+65536):(t.push(i),u--)}else t.push(i)}return t}const td=e=>String.fromCodePoint(...e),ud=function(e){return e>=48&&e<58?26+(e-48):e>=65&&e<91?e-65:e>=97&&e<123?e-97:$e},hs=function(e,t){return e+22+75*(e<26)-((t!=0)<<5)},Hn=function(e,t,u){let r=0;for(e=u?Ee(e/K0):e>>1,e+=Ee(e/t);e>Dr*uu>>1;r+=$e)e=Ee(e/Dr);return Ee(r+(Dr+1)*e/(e+Z0))},Wn=function(e){const t=[],u=e.length;let r=0,i=Ln,s=Bn,n=e.lastIndexOf(Un);n<0&&(n=0);for(let a=0;a<n;++a)e.charCodeAt(a)>=128&&Me("not-basic"),t.push(e.charCodeAt(a));for(let a=n>0?n+1:0;a<u;){const c=r;for(let d=1,o=$e;;o+=$e){a>=u&&Me("invalid-input");const p=ud(e.charCodeAt(a++));p>=$e&&Me("invalid-input"),p>Ee((ft-r)/d)&&Me("overflow"),r+=p*d;const h=o<=s?_i:o>=s+uu?uu:o-s;if(p<h)break;const f=$e-h;d>Ee(ft/f)&&Me("overflow"),d*=f}const l=t.length+1;s=Hn(r-c,l,c==0),Ee(r/l)>ft-i&&Me("overflow"),i+=Ee(r/l),r%=l,t.splice(r++,0,i)}return String.fromCodePoint(...t)},Gn=function(e){const t=[];e=Vn(e);const u=e.length;let r=Ln,i=0,s=Bn;for(const c of e)c<128&&t.push(Ar(c));const n=t.length;let a=n;for(n&&t.push(Un);a<u;){let c=ft;for(const d of e)d>=r&&d<c&&(c=d);const l=a+1;c-r>Ee((ft-i)/l)&&Me("overflow"),i+=(c-r)*l,r=c;for(const d of e)if(d<r&&++i>ft&&Me("overflow"),d===r){let o=i;for(let p=$e;;p+=$e){const h=p<=s?_i:p>=s+uu?uu:p-s;if(o<h)break;const f=o-h,m=$e-h;t.push(Ar(hs(h+f%m,0))),o=Ee(f/m)}t.push(Ar(hs(o,0))),s=Hn(i,l,a===n),i=0,++a}++i,++r}return t.join("")},rd=function(e){return qn(e,function(t){return J0.test(t)?Wn(t.slice(4).toLowerCase()):t})},id=function(e){return qn(e,function(t){return Q0.test(t)?"xn--"+Gn(t):t})},Zn={version:"2.3.1",ucs2:{decode:Vn,encode:td},decode:Wn,encode:Gn,toASCII:id,toUnicode:rd},sd={options:{html:!1,xhtmlOut:!1,breaks:!1,langPrefix:"language-",linkify:!1,typographer:!1,quotes:"“”‘’",highlight:null,maxNesting:100},components:{core:{},block:{},inline:{}}},nd={options:{html:!1,xhtmlOut:!1,breaks:!1,langPrefix:"language-",linkify:!1,typographer:!1,quotes:"“”‘’",highlight:null,maxNesting:20},components:{core:{rules:["normalize","block","inline","text_join"]},block:{rules:["paragraph"]},inline:{rules:["text"],rules2:["balance_pairs","fragments_join"]}}},ad={options:{html:!0,xhtmlOut:!0,breaks:!1,langPrefix:"language-",linkify:!1,typographer:!1,quotes:"“”‘’",highlight:null,maxNesting:20},components:{core:{rules:["normalize","block","inline","text_join"]},block:{rules:["blockquote","code","fence","heading","hr","html_block","lheading","list","reference","paragraph"]},inline:{rules:["autolink","backticks","emphasis","entity","escape","html_inline","image","link","newline","text"],rules2:["balance_pairs","emphasis","fragments_join"]}}},od={default:sd,zero:nd,commonmark:ad},cd=/^(vbscript|javascript|file|data):/,ld=/^data:image\/(gif|png|jpeg|webp);/;function dd(e){const t=e.trim().toLowerCase();return cd.test(t)?ld.test(t):!0}const Kn=["http:","https:","mailto:"];function fd(e){const t=di(e,!0);if(t.hostname&&(!t.protocol||Kn.indexOf(t.protocol)>=0))try{t.hostname=Zn.toASCII(t.hostname)}catch{}return ou(li(t))}function hd(e){const t=di(e,!0);if(t.hostname&&(!t.protocol||Kn.indexOf(t.protocol)>=0))try{t.hostname=Zn.toUnicode(t.hostname)}catch{}return yt(li(t),yt.defaultChars+"%")}function me(e,t){if(!(this instanceof me))return new me(e,t);t||hi(e)||(t=e||{},e="default"),this.inline=new lu,this.block=new Hu,this.core=new bi,this.renderer=new Et,this.linkify=new be,this.validateLink=dd,this.normalizeLink=fd,this.normalizeLinkText=hd,this.utils=bl,this.helpers=qu({},yl),this.options={},this.configure(e),t&&this.set(t)}me.prototype.set=function(e){return qu(this.options,e),this};me.prototype.configure=function(e){const t=this;if(hi(e)){const u=e;if(e=od[u],!e)throw new Error('Wrong `markdown-it` preset "'+u+'", check name')}if(!e)throw new Error("Wrong `markdown-it` preset, can't be empty");return e.options&&t.set(e.options),e.components&&Object.keys(e.components).forEach(function(u){e.components[u].rules&&t[u].ruler.enableOnly(e.components[u].rules),e.components[u].rules2&&t[u].ruler2.enableOnly(e.components[u].rules2)}),this};me.prototype.enable=function(e,t){let u=[];Array.isArray(e)||(e=[e]),["core","block","inline"].forEach(function(i){u=u.concat(this[i].ruler.enable(e,!0))},this),u=u.concat(this.inline.ruler2.enable(e,!0));const r=e.filter(function(i){return u.indexOf(i)<0});if(r.length&&!t)throw new Error("MarkdownIt. Failed to enable unknown rule(s): "+r);return this};me.prototype.disable=function(e,t){let u=[];Array.isArray(e)||(e=[e]),["core","block","inline"].forEach(function(i){u=u.concat(this[i].ruler.disable(e,!0))},this),u=u.concat(this.inline.ruler2.disable(e,!0));const r=e.filter(function(i){return u.indexOf(i)<0});if(r.length&&!t)throw new Error("MarkdownIt. Failed to disable unknown rule(s): "+r);return this};me.prototype.use=function(e){const t=[this].concat(Array.prototype.slice.call(arguments,1));return e.apply(e,t),this};me.prototype.parse=function(e,t){if(typeof e!="string")throw new Error("Input data should be a String");const u=new this.core.State(e,this,t);return this.core.process(u),u.tokens};me.prototype.render=function(e,t){return t=t||{},this.renderer.render(this.parse(e,t),this.options,t)};me.prototype.parseInline=function(e,t){const u=new this.core.State(e,this,t);return u.inlineMode=!0,this.core.process(u),u.tokens};me.prototype.renderInline=function(e,t){return t=t||{},this.renderer.render(this.parseInline(e,t),this.options,t)};function pd(e){const t=document.createElement("div");return ni(D`${e}`,t),t.innerHTML.replaceAll(/<!--([^-]*)-->/gim,"")}var bt,iu,su,nu,Ct,Jn,Qn;class bd extends $t{constructor(){super(...arguments);T(this,Ct);T(this,bt,me({highlight:(u,r)=>{switch(r){case"html":{const i=document.createElement("iframe");return i.classList.add("html-view"),i.srcdoc=u,i.sandbox="",i.innerHTML}default:return pd(u)}}}));T(this,iu,null);T(this,su,null);T(this,nu,new Map)}update(u,[r,i]){return A(this,iu)===r&&JSON.stringify(i)===A(this,su)?ve:(N(this,iu,r),N(this,su,JSON.stringify(i)),this.render(r,i))}render(u,r){r&&R(this,Ct,Jn).call(this,r);const i=A(this,bt).render(u);return R(this,Ct,Qn).call(this),Ac(i)}}bt=new WeakMap,iu=new WeakMap,su=new WeakMap,nu=new WeakMap,Ct=new WeakSet,Jn=function(u){Object.entries(u).forEach(([r])=>{let i;switch(r){case"p":i="paragraph";break;case"h1":case"h2":case"h3":case"h4":case"h5":case"h6":i="heading";break;case"ul":i="bullet_list";break;case"ol":i="ordered_list";break;case"li":i="list_item";break;case"a":i="link";break;case"strong":i="strong";break;case"em":i="em";break}if(!i)return;const s=`${i}_open`;A(this,bt).renderer.rules[s]=(n,a,c,l,d)=>{const o=n[a],p=u[o.tag]??[];for(const h of p)o.attrJoin("class",h);return d.renderToken(n,a,c)}})},Qn=function(){for(const[u]of A(this,nu))delete A(this,bt).renderer.rules[u];A(this,nu).clear()};const md=kt(bd);me();var Sr=function(e,t,u,r,i,s){function n(_){if(_!==void 0&&typeof _!="function")throw new TypeError("Function expected");return _}for(var a=r.kind,c=a==="getter"?"get":a==="setter"?"set":"value",l=!t&&e?r.static?e:e.prototype:null,d=t||(l?Object.getOwnPropertyDescriptor(l,r.name):{}),o,p=!1,h=u.length-1;h>=0;h--){var f={};for(var m in r)f[m]=m==="access"?{}:r[m];for(var m in r.access)f.access[m]=r.access[m];f.addInitializer=function(_){if(p)throw new TypeError("Cannot add initializers after decoration has completed");s.push(n(_||null))};var b=(0,u[h])(a==="accessor"?{get:d.get,set:d.set}:d[c],f);if(a==="accessor"){if(b===void 0)continue;if(b===null||typeof b!="object")throw new TypeError("Object expected");(o=n(b.get))&&(d.get=o),(o=n(b.set))&&(d.set=o),(o=n(b.init))&&i.unshift(o)}else(o=n(b))&&(a==="field"?i.unshift(o):d[c]=o)}l&&Object.defineProperty(l,r.name,d),p=!0},jt=function(e,t,u){for(var r=arguments.length>2,i=0;i<t.length;i++)u=r?t[i].call(e,u):t[i].call(e);return r?u:void 0};(()=>{var o,p,h,Yn,Xn,ea,_;let e=[X("a2ui-text")],t,u=[],r,i=ie,s,n=[],a=[],c,l=[],d=[];return _=class extends i{constructor(){super(...arguments);T(this,h);T(this,o,jt(this,n,null));T(this,p,(jt(this,a),jt(this,l,null)));jt(this,d)}get text(){return A(this,o)}set text(y){N(this,o,y)}get usageHint(){return A(this,p)}set usageHint(y){N(this,p,y)}render(){var g;const y=ci(this.theme.components.Text.all,this.usageHint?this.theme.components.Text[this.usageHint]:{});return D`<section
      class=${W(y)}
      style=${(g=this.theme.additionalStyles)!=null&&g.Text?oe(R(this,h,ea).call(this)):O}
    >
      ${R(this,h,Yn).call(this)}
    </section>`}},o=new WeakMap,p=new WeakMap,h=new WeakSet,Yn=function(){let y=null;if(this.text&&typeof this.text=="object"){if("literalString"in this.text&&this.text.literalString)y=this.text.literalString;else if("literal"in this.text&&this.text.literal!==void 0)y=this.text.literal;else if(this.text&&"path"in this.text&&this.text.path){if(!this.processor||!this.component)return D`(no model)`;const w=this.processor.getData(this.component,this.text.path,this.surfaceId??K.DEFAULT_SURFACE_ID);w!=null&&(y=w.toString())}}if(y==null)return D`(empty)`;let g=y;switch(this.usageHint){case"h1":g=`# ${g}`;break;case"h2":g=`## ${g}`;break;case"h3":g=`### ${g}`;break;case"h4":g=`#### ${g}`;break;case"h5":g=`##### ${g}`;break;case"caption":g=`*${g}*`;break}return D`${md(g,tc(this.theme.markdown,["ol","ul","li"],{}))}`},Xn=function(y){return typeof y!="object"||Array.isArray(y)||!y?!1:["h1","h2","h3","h4","h5","h6","caption","body"].every(w=>w in y)},ea=function(){var w;let y={};const g=(w=this.theme.additionalStyles)==null?void 0:w.Text;if(!g)return y;if(R(this,h,Xn).call(this,g)){const z=this.usageHint??"body";y=g[z]}else y=g;return y},r=_,(()=>{const y=typeof Symbol=="function"&&Symbol.metadata?Object.create(i[Symbol.metadata]??null):void 0;s=[L()],c=[L({reflect:!0,attribute:"usage-hint"})],Sr(_,null,s,{kind:"accessor",name:"text",static:!1,private:!1,access:{has:g=>"text"in g,get:g=>g.text,set:(g,w)=>{g.text=w}},metadata:y},n,a),Sr(_,null,c,{kind:"accessor",name:"usageHint",static:!1,private:!1,access:{has:g=>"usageHint"in g,get:g=>g.usageHint,set:(g,w)=>{g.usageHint=w}},metadata:y},l,d),Sr(null,t={value:r},e,{kind:"class",name:r.name,metadata:y},null,u),r=t.value,y&&Object.defineProperty(r,Symbol.metadata,{enumerable:!0,configurable:!0,writable:!0,value:y})})(),_.styles=[re,Y`
      :host {
        display: block;
        flex: var(--weight);
      }

      h1,
      h2,
      h3,
      h4,
      h5 {
        line-height: inherit;
        font: inherit;
      }
    `],jt(r,u),r})();var ps=function(e,t,u,r,i,s){function n(_){if(_!==void 0&&typeof _!="function")throw new TypeError("Function expected");return _}for(var a=r.kind,c=a==="getter"?"get":a==="setter"?"set":"value",l=!t&&e?r.static?e:e.prototype:null,d=t||(l?Object.getOwnPropertyDescriptor(l,r.name):{}),o,p=!1,h=u.length-1;h>=0;h--){var f={};for(var m in r)f[m]=m==="access"?{}:r[m];for(var m in r.access)f.access[m]=r.access[m];f.addInitializer=function(_){if(p)throw new TypeError("Cannot add initializers after decoration has completed");s.push(n(_||null))};var b=(0,u[h])(a==="accessor"?{get:d.get,set:d.set}:d[c],f);if(a==="accessor"){if(b===void 0)continue;if(b===null||typeof b!="object")throw new TypeError("Object expected");(o=n(b.get))&&(d.get=o),(o=n(b.set))&&(d.set=o),(o=n(b.init))&&i.unshift(o)}else(o=n(b))&&(a==="field"?i.unshift(o):d[c]=o)}l&&Object.defineProperty(l,r.name,d),p=!0},Fr=function(e,t,u){for(var r=arguments.length>2,i=0;i<t.length;i++)u=r?t[i].call(e,u):t[i].call(e);return r?u:void 0};(()=>{var c,l,ta,o;let e=[X("a2ui-video")],t,u=[],r,i=ie,s,n=[],a=[];return o=class extends i{constructor(){super(...arguments);T(this,l);T(this,c,Fr(this,n,null));Fr(this,a)}get url(){return A(this,c)}set url(f){N(this,c,f)}render(){var f,m;return D`<section
      class=${W(this.theme.components.Video)}
      style=${(f=this.theme.additionalStyles)!=null&&f.Video?oe((m=this.theme.additionalStyles)==null?void 0:m.Video):O}
    >
      ${R(this,l,ta).call(this)}
    </section>`}},c=new WeakMap,l=new WeakSet,ta=function(){if(!this.url)return O;if(this.url&&typeof this.url=="object"){if("literalString"in this.url)return D`<video controls src=${this.url.literalString} />`;if("literal"in this.url)return D`<video controls src=${this.url.literal} />`;if(this.url&&"path"in this.url&&this.url.path){if(!this.processor||!this.component)return D`(no processor)`;const f=this.processor.getData(this.component,this.url.path,this.surfaceId??K.DEFAULT_SURFACE_ID);return f?typeof f!="string"?D`Invalid video URL`:D`<video controls src=${f} />`:D`Invalid video URL`}}return D`(empty)`},r=o,(()=>{const f=typeof Symbol=="function"&&Symbol.metadata?Object.create(i[Symbol.metadata]??null):void 0;s=[L()],ps(o,null,s,{kind:"accessor",name:"url",static:!1,private:!1,access:{has:m=>"url"in m,get:m=>m.url,set:(m,b)=>{m.url=b}},metadata:f},n,a),ps(null,t={value:r},e,{kind:"class",name:r.name,metadata:f},null,u),r=t.value,f&&Object.defineProperty(r,Symbol.metadata,{enumerable:!0,configurable:!0,writable:!0,value:f})})(),o.styles=[re,Y`
      * {
        box-sizing: border-box;
      }

      :host {
        display: block;
        flex: var(--weight);
        min-height: 0;
        overflow: auto;
      }

      video {
        display: block;
        width: 100%;
      }
    `],Fr(r,u),r})();var _d=Object.create,gi=Object.defineProperty,gd=Object.getOwnPropertyDescriptor,ua=(e,t)=>(t=Symbol[e])?t:Symbol.for("Symbol."+e),Dt=e=>{throw TypeError(e)},yd=(e,t,u)=>t in e?gi(e,t,{enumerable:!0,configurable:!0,writable:!0,value:u}):e[t]=u,bs=(e,t)=>gi(e,"name",{value:t,configurable:!0}),xd=e=>[,,,_d((e==null?void 0:e[ua("metadata")])??null)],ra=["class","method","getter","setter","accessor","field","value","get","set"],Lt=e=>e!==void 0&&typeof e!="function"?Dt("Function expected"):e,vd=(e,t,u,r,i)=>({kind:ra[e],name:t,metadata:r,addInitializer:s=>u._?Dt("Already initialized"):i.push(Lt(s||null))}),Cd=(e,t)=>yd(t,ua("metadata"),e[3]),Je=(e,t,u,r)=>{for(var i=0,s=e[t>>1],n=s&&s.length;i<n;i++)t&1?s[i].call(u):r=s[i].call(u,r);return r},Gu=(e,t,u,r,i,s)=>{var n,a,c,l,d,o=t&7,p=!!(t&8),h=!!(t&16),f=o>3?e.length+1:o?p?1:2:0,m=ra[o+5],b=o>3&&(e[f-1]=[]),_=e[f]||(e[f]=[]),k=o&&(!h&&!p&&(i=i.prototype),o<5&&(o>3||!h)&&gd(o<4?i:{get[u](){return ms(this,s)},set[u](y){return _s(this,s,y)}},u));o?h&&o<4&&bs(s,(o>2?"set ":o>1?"get ":"")+u):bs(i,u);for(var v=r.length-1;v>=0;v--)l=vd(o,u,c={},e[3],_),o&&(l.static=p,l.private=h,d=l.access={has:h?y=>wd(i,y):y=>u in y},o^3&&(d.get=h?y=>(o^1?ms:kd)(y,i,o^4?s:k.get):y=>y[u]),o>2&&(d.set=h?(y,g)=>_s(y,i,g,o^4?s:k.set):(y,g)=>y[u]=g)),a=(0,r[v])(o?o<4?h?s:k[m]:o>4?void 0:{get:k.get,set:k.set}:i,l),c._=1,o^4||a===void 0?Lt(a)&&(o>4?b.unshift(a):o?h?s=a:k[m]=a:i=a):typeof a!="object"||a===null?Dt("Object expected"):(Lt(n=a.get)&&(k.get=n),Lt(n=a.set)&&(k.set=n),Lt(n=a.init)&&b.unshift(n));return o||Cd(e,i),k&&gi(i,u,k),h?o^4?s:k:i},yi=(e,t,u)=>t.has(e)||Dt("Cannot "+u),wd=(e,t)=>Object(t)!==t?Dt('Cannot use the "in" operator on this value'):e.has(t),ms=(e,t,u)=>(yi(e,t,"read from private field"),u?u.call(e):t.get(e)),Tr=(e,t,u)=>t.has(e)?Dt("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,u),_s=(e,t,u,r)=>(yi(e,t,"write to private field"),r?r.call(e,u):t.set(e,u),u),kd=(e,t,u)=>(yi(e,t,"access private method"),u),ia,sa,na,Xr,aa,_e,xi,vi,Ci;const B={},$d={components:{Text:{all:B,h1:B,h2:B,h3:B,h4:B,h5:B,body:B,bodySmall:B,label:B,labelSmall:B,caption:B},Button:B,Card:B,Checkbox:{container:B,element:B,label:B},Column:B,Row:B,List:{container:B,item:B},Tabs:{container:B,element:B,controls:{all:B,selected:B}},Divider:B,Icon:B,Image:{all:B,icon:B,avatar:B,image:B},Slider:{container:B,element:B,label:B},TextField:{container:B,element:B,label:B},DateTimeInput:{container:B,element:B,label:B},MultipleChoice:{container:B,option:B,selectedOption:B},Audio:B,AudioPlayer:B,Video:B,Modal:{backdrop:B,element:B},Surface:B}};aa=[pa("conformance-a2ui-wrapper")];class tt extends(Xr=Va(ha),na=[xa({context:Ns})],sa=[wi({attribute:!1})],ia=[wi({attribute:!1})],Xr){constructor(){super(...arguments),Tr(this,xi,Je(_e,8,this,$d)),Je(_e,11,this),Tr(this,vi,Je(_e,12,this)),Je(_e,15,this),Tr(this,Ci,Je(_e,16,this,"test_surface")),Je(_e,19,this)}render(){var u;const t=(u=this.processor)==null?void 0:u.getSurfaces().get(this.surfaceId);if(!t){const r=this.processor?Array.from(this.processor.getSurfaces().keys()).join(", "):"none";return Ir`<p style="color: red;">Surface "${this.surfaceId}" not found. Available: ${r}</p>`}return Ir`
      <a2ui-surface
        .surface=${{...t}}
        .surfaceId=${this.surfaceId}
        .processor=${this.processor}
        .enableCustomElements=${!1}
      ></a2ui-surface>
    `}}_e=xd(Xr);xi=new WeakMap;vi=new WeakMap;Ci=new WeakMap;Gu(_e,4,"theme",na,tt,xi);Gu(_e,4,"processor",sa,tt,vi);Gu(_e,4,"surfaceId",ia,tt,Ci);tt=Gu(_e,0,"ConformanceA2UIWrapper",aa,tt);tt.styles=fa`
    :host {
      display: block;
      padding: 16px;
      font-family: "Roboto", system-ui, sans-serif;
    }
  `;Je(_e,1,tt);function Ed(e){const{version:t,...u}=e;if(u.createSurface)return{_createSurface:u.createSurface};if(u.updateComponents){const r=Dd(u.updateComponents.components||[]);return{surfaceUpdate:{surfaceId:u.updateComponents.surfaceId,components:r}}}return u.updateDataModel?{dataModelUpdate:u.updateDataModel}:u}function Dd(e){return e.map(t=>{if(typeof t.component=="object")return t;const{id:u,component:r,weight:i,...s}=t,n=r==="ChoicePicker"?"MultipleChoice":r,c={Text:{variant:"usageHint"}}[n]||{},l=new Set(["text","label","hint","name","url","src","title","placeholder","description"]),d={};for(const[p,h]of Object.entries(s)){const f=c[p]||p;l.has(f)&&typeof h=="string"?d[f]={literalString:h}:d[f]=h}n==="Tabs"&&d.tabs&&Array.isArray(d.tabs)&&(d.tabItems=d.tabs.map(p=>({title:typeof p.label=="string"?{literalString:p.label}:typeof p.title=="string"?{literalString:p.title}:p.title||p.label,child:p.child})),delete d.tabs),n==="MultipleChoice"&&(d.options&&(d.options=d.options.map(p=>({...p,label:typeof p.label=="string"?{literalString:p.label}:p.label}))),d.value&&!d.selections&&(d.selections=d.value,delete d.value),d.selections||(d.selections=[]));const o={id:u,component:{[n]:d}};return i!==void 0&&(o.weight=i),o})}function Ud(e,t){var a,c;const u=$c.createSignalA2uiMessageProcessor(),r=e.some(l=>l.createSurface||l.updateComponents);let i;if(r){const l=e.map(Ed);i=[];for(const d of l)if(d._createSurface){const o=d._createSurface.surfaceId,p=l.find(m=>{var b;return((b=m.surfaceUpdate)==null?void 0:b.surfaceId)===o}),f=((c=(((a=p==null?void 0:p.surfaceUpdate)==null?void 0:a.components)||[])[0])==null?void 0:c.id)||"root";i.push({beginRendering:{surfaceId:o,root:f}})}else i.push(d)}else i=e.map(({version:l,...d})=>d);u.processMessages(i);const s=u.getSurfaces(),n=t||Array.from(s.keys())[0]||"test_surface";return Ir`
    <conformance-a2ui-wrapper
      .processor=${u}
      .surfaceId=${n}
    ></conformance-a2ui-wrapper>
  `}function Ad(e,t){var i;const u=t.map(s=>{if(typeof s.component=="object")return s;const{id:n,component:a,weight:c,...l}=s,d=a==="ChoicePicker"?"MultipleChoice":a,p={Text:{variant:"usageHint"}}[d]||{},h={};for(const[m,b]of Object.entries(l)){const _=p[m]||m;new Set(["text","label","hint","name","url","src","title","placeholder","description"]).has(_)&&typeof b=="string"?h[_]={literalString:b}:h[_]=b}d==="Tabs"&&h.tabs&&Array.isArray(h.tabs)&&(h.titles=h.tabs.map(m=>typeof m.label=="string"?{literalString:m.label}:m.label),h.children=h.tabs.map(m=>m.child),delete h.tabs),d==="MultipleChoice"&&h.options&&Array.isArray(h.options)&&(h.options=h.options.map(m=>({...m,label:typeof m.label=="string"?{literalString:m.label}:m.label})));const f={id:n,component:{[d]:h}};return c!==void 0&&(f.weight=c),f}),r=((i=u[0])==null?void 0:i.id)||"root";return[{beginRendering:{surfaceId:e,root:r}},{surfaceUpdate:{surfaceId:e,components:u}}]}function qd(e,t,u,r){return[...Ad(e,t),{dataModelUpdate:{surfaceId:e,path:u,value:r}}]}export{qd as c,Ud as r,Ad as s};
