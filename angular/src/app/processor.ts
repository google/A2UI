import { inject, Injectable, signal } from '@angular/core';
import { v0_8 } from '@a2ui/web-lib';
import { A2UIClient } from './client';

@Injectable({ providedIn: 'root' })
export class ModelProcessor {
  private readonly a2uiClient = inject(A2UIClient);
  private readonly processor = new v0_8.Data.A2UIModelProcessor();
  readonly isLoading = signal(false);

  getSurfaces() {
    return this.processor.getSurfaces();
  }

  resolvePath(path: string, dataContextPath?: string) {
    return this.processor.resolvePath(path, dataContextPath);
  }

  setData(
    node: v0_8.Types.AnyComponentNode,
    relativePath: string,
    value: v0_8.Types.DataValue,
    surfaceId?: v0_8.Types.SurfaceID | null
  ) {
    return this.processor.setData(node, relativePath, value, surfaceId ?? undefined);
  }

  getData(
    node: v0_8.Types.AnyComponentNode,
    relativePath: string,
    surfaceId?: string
  ): v0_8.Types.DataValue | null {
    return this.processor.getData(node, relativePath, surfaceId);
  }

  async makeRequest(request: v0_8.Types.A2UIClientEventMessage | string) {
    let messages: v0_8.Types.ServerToClientMessage[];

    try {
      this.isLoading.set(true);
      const response = await this.a2uiClient.send(request as v0_8.Types.A2UIClientEventMessage);
      this.isLoading.set(false);
      messages = response;
    } catch (err) {
      // this.snackbar(err as string, SnackType.ERROR);
      console.error(err);
      messages = [];
    } finally {
      this.isLoading.set(false);
    }

    // this.#lastMessages = messages;
    this.processor.clearSurfaces();
    this.processor.processMessages(messages);
    return messages;
  }
}
