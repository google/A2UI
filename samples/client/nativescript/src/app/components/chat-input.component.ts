import {
  Component,
  signal,
  NO_ERRORS_SCHEMA,
  output,
  input,
  inject,
} from "@angular/core";
import { NativeScriptCommonModule } from "@nativescript/angular";
import { EventData, isIOS } from "@nativescript/core";

@Component({
  selector: "a2ui-chat-input",
  imports: [NativeScriptCommonModule],
  template: `
    <GridLayout
      [row]="row()"
      rows="auto"
      columns="*, auto"
      class="input-container"
      [class.ios]="isIOS"
      (loaded)="loadedBottomBar($event)"
    >
      <TextField
        col="0"
        class="message-input"
        hint="Message..."
        [text]="inputText()"
        (textChange)="onTextChange($event)"
        (returnPress)="onSend()"
        returnKeyType="send"
        autocorrect="true"
        autocapitalizationType="sentences"
      >
      </TextField>

      <GridLayout
        col="1"
        class="send-button"
        [class.active]="inputText().trim().length > 0"
        (tap)="onSend()"
        width="44"
        height="44"
      >
        <Label
          class="send-icon"
          text="→"
          horizontalAlignment="center"
          verticalAlignment="center"
          [marginTop]="isIOS ? 0 : -6"
        >
        </Label>
      </GridLayout>
    </GridLayout>
  `,
  styles: [
    `
      .input-container {
        background-color: black;
        border-radius: 28;
        border-width: 1;
        border-color: #2a2a4a;
        margin: 4 8 4 8;
        padding: 4 6 4 16;
        vertical-align: bottom;
      }

      .input-container.ios {
        margin-bottom: 14;
      }

      .message-input {
        font-size: 16;
        color: #ffffff;
        background-color: transparent;
        border-width: 0;
        padding: 12 0;
        placeholder-color: #999;
      }

      .message-input:focus {
        border-width: 0;
      }

      .send-button {
        background-color: #3a3a5c;
        border-radius: 22;
        margin: 2 0 2 2;
      }

      .send-button.active {
        background-color: #6366f1;
      }

      .send-icon {
        font-size: 20;
        font-weight: bold;
        color: #ffffff;
      }
    `,
  ],
  schemas: [NO_ERRORS_SCHEMA],
})
export class ChatInputComponent {
  row = input(0);
  send = output<string>();
  loaded = output<EventData>();

  readonly inputText = signal("");
  readonly isIOS = isIOS;

  onTextChange(event: any): void {
    this.inputText.set(event.value || "");
  }

  onSend(): void {
    const text = this.inputText().trim();
    if (text) {
      this.send.emit(text);
      this.inputText.set("");
    }
  }

  loadedBottomBar(args: EventData) {
    this.loaded.emit(args);
  }
}
