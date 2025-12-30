import { describe, beforeEach, expect, it } from 'vitest';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Modal } from './modal.js';
import { Theme } from '../rendering/theming.js';
import { MessageProcessor } from '../data/processor.js';
import { Catalog } from '../rendering/catalog.js';
import { DEFAULT_CATALOG } from './default.js';
import type { Types } from '@a2ui/lit/0.8';

async function waitForSelector(
  fixture: ComponentFixture<unknown>,
  selector: string,
  timeout = 2000,
): Promise<Element> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    fixture.detectChanges();
    const element = fixture.nativeElement.querySelector(selector);
    if (element) {
      return element;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`Element "${selector}" not found after ${timeout}ms`);
}

const testTheme: Types.Theme = {
  components: {
    AudioPlayer: {},
    Button: {},
    Card: {},
    Column: {},
    CheckBox: { container: {}, element: {}, label: {} },
    DateTimeInput: { container: {}, element: {}, label: {} },
    Divider: {},
    Image: {
      all: {},
      icon: {},
      avatar: {},
      smallFeature: {},
      mediumFeature: {},
      largeFeature: {},
      header: {},
    },
    Icon: {},
    List: {},
    Modal: { backdrop: {}, element: {} },
    MultipleChoice: { container: {}, element: {}, label: {} },
    Row: {},
    Slider: { container: {}, element: {}, label: {} },
    Tabs: { container: {}, element: {}, controls: { all: {}, selected: {} } },
    Text: { all: {}, h1: {}, h2: {}, h3: {}, h4: {}, h5: {}, body: {}, caption: {} },
    TextField: { container: {}, element: {}, label: {} },
    Video: {},
  },
  elements: {
    a: {},
    audio: {},
    body: {},
    button: {},
    h1: {},
    h2: {},
    h3: {},
    h4: {},
    h5: {},
    iframe: {},
    input: {},
    p: {},
    pre: {},
    textarea: {},
    video: {},
  },
  additionalStyles: {},
  markdown: {
    p: [],
    h1: [],
    h2: [],
    h3: [],
    h4: [],
    h5: [],
    ul: [],
    ol: [],
    li: [],
    a: [],
    strong: [],
    em: [],
  },
};

describe('Modal', () => {
  let component: Modal;
  let fixture: ComponentFixture<Modal>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [Modal],
      providers: [
        {
          provide: Theme,
          useValue: testTheme,
        },
        {
          provide: MessageProcessor,
          useClass: MessageProcessor,
        },
        {
          provide: Catalog,
          useValue: DEFAULT_CATALOG,
        },
      ],
    });

    const buttonTextNode: Types.TextNode = {
      id: 'button-text',
      type: 'Text',
      properties: {
        text: { literal: 'Open Modal' },
        usageHint: 'body',
      },
      dataContextPath: '/',
      weight: 1,
    };

    const buttonNode: Types.ButtonNode = {
      id: 'entry-point-button',
      type: 'Button',
      properties: {
        action: { name: 'openModal' },
        child: buttonTextNode,
      },
      dataContextPath: '/',
      weight: 1,
    };

    const contentTextNode: Types.TextNode = {
      id: 'content-text',
      type: 'Text',
      properties: {
        text: { literal: 'Modal content' },
        usageHint: 'body',
      },
      dataContextPath: '/',
      weight: 1,
    };

    const modalNode: Types.ModalNode = {
      id: 'test-modal',
      type: 'Modal',
      properties: {
        contentChild: contentTextNode,
        entryPointChild: buttonNode,
      },
      dataContextPath: '/',
      weight: 1,
    };

    fixture = TestBed.createComponent(Modal);
    fixture.componentRef.setInput('weight', 1);
    fixture.componentRef.setInput('surfaceId', 'surface-1');
    fixture.componentRef.setInput('component', modalNode);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    await waitForSelector(fixture, 'a2ui-button');
  });

  it('should render correctly', () => {
    const section = fixture.nativeElement.querySelector('section');
    expect(section).toBeTruthy();
    expect(section.textContent).toContain('Open Modal');
  });

  it('should open modal on click', async () => {
    const section = fixture.nativeElement.querySelector('section');
    section.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const dialog = await waitForSelector(fixture, 'dialog[open]');
    expect(dialog).toBeTruthy();
    expect(dialog.textContent).toContain('Modal content');
  });
});
