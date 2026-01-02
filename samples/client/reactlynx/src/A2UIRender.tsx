import { Suspense } from '@lynx-js/react';
import { v0_8 } from "@a2ui/lit";

import './A2UIRender.css';

export function A2UIRender(props: any){
  const { type, surfaceId, surface, component, components } = props.resource();
  console.log("A2UIRender start render", surface);
  return type==='beginRendering' ? <view id={`surface-${surfaceId}`} style={surface.styles}>
    <Suspense fallback={<text>loading...</text>}>
      <A2UIRender resource={surface.resource} />
    </Suspense>
  </view>: buildNodeRecursive(component, components);
}

function hasComponent(id: string, components: any[]){
  console.log("hasComponent", id, components);
  for(let i = 0; i < components.length; i++){
    const item = components[i];
    if(item.id === id){
      return i;
    }
  }
  return -1;
}

function buildNodeRecursive(comp: v0_8.Types.ComponentInstance & {
  resourceMap: Map<string, any>,
}, components: any[]){
  console.log("buildNodeRecursive", comp);
  const { id, component, resourceMap } = comp;
  const res = [];
  if(component){
    const items = Object.keys(component);
    for(const key of items){
      const value = component[key];
      const { children={}, text={}, src={}, styles={}} = value as v0_8.Types.ComponentProperties;
      switch (key) {
        case 'Column':
          res.push(<view class="column" id={id}>
            {children.explicitList?.map((itemId: string) => {
              // const index = hasComponent(itemId, components);
              // if(index === -1){
                return <Suspense fallback={<text>{`loading ${itemId}...`}</text>}>
                  <A2UIRender resource={resourceMap.get(itemId)} />
                </Suspense>;
              // }
              // const childComponent = components[index];
              // return <>
              //   {buildNodeRecursive(childComponent, components)}
              // </>
            })}
          </view>)
          break;
        case 'Text':
          // @ts-ignore
          res.push(<text key={id}>{text?.literalString}</text>);
          break;
        case 'Image':
          res.push(<image key={id} style={styles} src={src?.literalString} />);
          break;
      }
    }
  }
  return res;
}
