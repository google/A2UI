import { v0_8 } from '@a2ui/web-lib';
import { Injectable } from '@angular/core';

type A2TextPayload = {
  kind: 'text';
  text: string;
};

type A2DataPayload = {
  kind: 'data';
  data: v0_8.Types.A2UIProtocolMessage;
};

type A2AServerPayload = Array<A2DataPayload | A2TextPayload> | { error: string };

// TODO: possibly dedupe this
@Injectable({ providedIn: 'root' })
export class A2UIClient {
  async send(
    message: v0_8.Types.A2UIClientEventMessage
  ): Promise<v0_8.Types.A2UIProtocolMessage[]> {
    const response = await fetch('/a2a', {
      body: JSON.stringify(message),
      method: 'POST',
    });

    if (response.ok) {
      const data = (await response.json()) as A2AServerPayload;
      const messages: v0_8.Types.A2UIProtocolMessage[] = [];

      if ('error' in data) {
        throw new Error(data.error);
      } else {
        for (const item of data) {
          if (item.kind === 'text') continue;
          messages.push(item.data);
        }
      }
      return messages;
    }

    const error = (await response.json()) as { error: string };
    throw new Error(error.error);
  }
}
