import { v0_8 } from "@a2ui/lit";
import { A2AClient } from "@a2a-js/sdk/client";
// import { v4 as uuidv4 } from "uuid";
import Begin from "./mock/begin.json";
import Update_1 from "./mock/update_1.json";
import Update_2 from "./mock/update_2.json";
import Update_3 from "./mock/update_3.json";

import { createResource } from "./resouece";

export function randomId(prefix = "") {
  return (
    prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  );
}

// import type {
//   MessageSendParams,
//   SendMessageSuccessResponse,
//   Task,
// } from "@a2a-js/sdk";

// const fetchWithCustomHeader: typeof fetch = async (url, init) => {
//   const headers = new Headers(init?.headers);
//   headers.set("X-A2A-Extensions", "https://a2ui.org/a2a-extension/a2ui/v0.8");

//   const newInit = { ...init, headers };
//   return fetch(url, newInit);
// };

// let client: A2AClient | null = null;
// const createOrGetClient = async () => {
//   if (!client) {
//     client = await A2AClient.fromCardUrl(
//       "http://10.5.110.62:10002/.well-known/agent-card.json",
//       { fetchImpl: fetchWithCustomHeader }
//     );
//   }
//   return client;
// };

const chunks = [Begin, Update_1, Update_2, Update_3];
export async function* fakeStreamResponse(chunks: any[], delay = 1000) {
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    await new Promise((r) => setTimeout(r, delay * (i + 1)));
    console.log("yield chunk", chunk);
    yield chunk;
  }
}

export class Client {
  private processor: MessageProcessor;
  private resolves: Map<string, (surface: any) => void> = new Map();
  constructor() {
    this.processor = new MessageProcessor();
    lynx
      .getJSModule("GlobalEventEmitter")
      .addListener("message", (data: any) => {
        console.log("listen message", data);
        if (data.type === "beginRendering") {
          const resolve = this.resolves.get(data.message!)!;
          resolve(data);
          this.resolves.delete(data.message);
        } else if (data.type === "surfaceUpdate") {
          const { updateComponents, surface } = data;
          updateComponents.forEach((comp: v0_8.Types.ComponentInstance) => {
            const resolve = this.findResolver(comp.id, surface);
            resolve({
              type: "surfaceUpdate",
              component: comp,
              components: updateComponents,
            });
          });
        }
      });
  }
  findResolver(comId: string, surface: v0_8.Types.Surface & { resolve: any }) {
    let resolve;
    if (comId === surface.rootComponentId) {
      resolve = surface.resolve;
    } else {
      surface.components.forEach((comp: v0_8.Types.ComponentInstance) => {
        // @ts-ignore
        if (comp.resolveMap && comp.resolveMap.has(comId)) {
          // @ts-ignore
          resolve = comp.resolveMap.get(comId);
        }
      });
    }
    return resolve;
  }

  async makeRequest(request: string) {
    console.log("makeRequest", request);
    const response = await this.send(
      request as v0_8.Types.A2UIClientEventMessage
    );
    const { resource, startStreaming } = response;
    startStreaming();
    return resource;
    // this.processor.clearSurfaces();
    // this.processor.processMessages(response);
  }
  private async send(message: v0_8.Types.A2UIClientEventMessage) {
    // const client = await createOrGetClient();
    // const sendParams: MessageSendParams = {
    //   message: {
    //     messageId: randomId("task_"),
    //     role: "user",
    //     parts: [
    //       {
    //         kind: "text",
    //         text: message as string,
    //       },
    //     ],
    //     kind: "message",
    //   },
    // };
    // const response = await client.sendMessage(sendParams);
    // if ("error" in response) {
    //   console.error("Error:", response.error.message);
    // } else {
    //   const result = (response as SendMessageSuccessResponse).result as Task;
    //   console.log("Result:", result);
    //   if (result.kind === "task") {
    //     const messages: v0_8.Types.ServerToClientMessage[] = [];
    //     return messages;
    //   }
    // }
    const response = new Promise((_resolve) => {
      this.resolves.set(message as string, _resolve);
    });
    const that = this;
    function startStreaming() {
      (async () => {
        for await (const piece of fakeStreamResponse(chunks)) {
          piece.message = message;
          that.processor.processMessages([piece]);
        }
      })();
    }
    return {
      resource: createResource(response),
      startStreaming,
    };
  }
}

class MessageProcessor implements v0_8.Types.MessageProcessor {
  surfaces: Map<v0_8.Types.SurfaceID, v0_8.Types.Surface>;
  constructor() {
    this.surfaces = new Map();
  }
  getSurfaces(): ReadonlyMap<string, v0_8.Types.Surface> {
    return this.surfaces;
  }
  clearSurfaces() {
    this.surfaces.clear();
  }
  getOrCreateSurface(surfaceId: string): v0_8.Types.Surface {
    let surface: v0_8.Types.Surface | undefined = this.surfaces.get(surfaceId);
    if (!surface) {
      surface = {
        rootComponentId: null,
        componentTree: null,
        dataModel: new Map(),
        components: new Map(),
        styles: {},
      } as v0_8.Types.Surface;
      this.surfaces.set(surfaceId, surface);
    }

    return surface;
  }

  processMessages(messages: v0_8.Types.ServerToClientMessage[]): void {
    console.log("processMessages", messages);
    for (const message of messages) {
      if (message.beginRendering) {
        const { surfaceId, root, styles = {} } = message.beginRendering;
        const surface = this.getOrCreateSurface(surfaceId);
        surface.rootComponentId = root;
        surface.styles = styles;
        if (surface.rootComponentId) {
          let resolve;
          const req = new Promise((_resolve) => {
            resolve = _resolve;
          });
          const rootComponentResource = createResource(req);
          // @ts-ignore
          surface.resource = rootComponentResource;
          // @ts-ignore
          surface.resolve = resolve;
        }
        lynx.getJSModule("GlobalEventEmitter").toggle("message", {
          type: "beginRendering",
          surfaceId,
          surface,
          message: (
            message as v0_8.Types.ServerToClientMessage & {
              message: string;
            }
          ).message,
        });
      }
      if (message.surfaceUpdate) {
        const { surfaceId, components } = message.surfaceUpdate;
        const surface = this.getOrCreateSurface(surfaceId);
        const updateComponents = [];
        for (const component of components) {
          const items = Object.keys(component.component!);
          for (const key of items) {
            const value = component.component![
              key
            ] as v0_8.Types.ComponentProperties;
            const resourceMap = new Map();
            const resolveMap = new Map();
            if (value?.children?.explicitList?.length) {
              value?.children?.explicitList?.forEach((child) => {
                let resolve;
                const req = new Promise((_resolve) => {
                  resolve = _resolve;
                });
                resourceMap.set(child, createResource(req));
                resolveMap.set(child, resolve);
              });
            }
            // @ts-ignore
            component.resourceMap = resourceMap;
            // @ts-ignore
            component.resolveMap = resolveMap;
          }
          updateComponents.push(component);
          surface.components.set(component.id, component);
        }
        lynx.getJSModule("GlobalEventEmitter").toggle("message", {
          type: "surfaceUpdate",
          updateComponents,
          surfaceId,
          surface,
        });
      }
      if (message.dataModelUpdate) {
      }
      if (message.deleteSurface) {
      }
    }
    // lynx.getJSModule("GlobalEventEmitter").toggle("message", data);
  }

  getData(
    node: v0_8.Types.AnyComponentNode,
    relativePath: string,
    surfaceId: string
  ): v0_8.Types.DataValue | null {
    return null;
  }

  setData(
    node: v0_8.Types.AnyComponentNode | null,
    relativePath: string,
    value: v0_8.Types.DataValue,
    surfaceId: string
  ): void {}

  resolvePath(path: string, dataContextPath?: string): string {
    return "";
  }
}
