import assert from 'node:assert';
import { describe, it } from 'node:test';
import { A2uiMessageProcessor } from './message-processor.js';
import { createStandardCatalog } from '../standard_catalog/factory.js';
import { TextComponent } from '../standard_catalog/components/text.js';
import { ButtonComponent } from '../standard_catalog/components/button.js';
import { ColumnComponent } from '../standard_catalog/components/column.js';
import { RowComponent } from '../standard_catalog/components/row.js';
import { CardComponent } from '../standard_catalog/components/card.js';
import { ImageComponent } from '../standard_catalog/components/image.js';
import { IconComponent } from '../standard_catalog/components/icon.js';
import { VideoComponent } from '../standard_catalog/components/video.js';
import { AudioPlayerComponent } from '../standard_catalog/components/audio-player.js';
import { ListComponent } from '../standard_catalog/components/list.js';
import { TabsComponent } from '../standard_catalog/components/tabs.js';
import { ModalComponent } from '../standard_catalog/components/modal.js';
import { DividerComponent } from '../standard_catalog/components/divider.js';
import { TextFieldComponent } from '../standard_catalog/components/text-field.js';
import { CheckBoxComponent } from '../standard_catalog/components/check-box.js';
import { ChoicePickerComponent } from '../standard_catalog/components/choice-picker.js';
import { SliderComponent } from '../standard_catalog/components/slider.js';
import { DateTimeInputComponent } from '../standard_catalog/components/date-time-input.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Mock renderer function
const noopRenderer = () => null;

describe('Client Capabilities Generation', () => {
  it('generates standard catalog matching the spec', () => {
    // 1. Create the standard catalog with all components
    const components = {
      Text: new TextComponent(noopRenderer),
      Button: new ButtonComponent(noopRenderer),
      Column: new ColumnComponent(noopRenderer),
      Row: new RowComponent(noopRenderer),
      Card: new CardComponent(noopRenderer),
      Image: new ImageComponent(noopRenderer),
      Icon: new IconComponent(noopRenderer),
      Video: new VideoComponent(noopRenderer),
      AudioPlayer: new AudioPlayerComponent(noopRenderer),
      List: new ListComponent(noopRenderer),
      Tabs: new TabsComponent(noopRenderer),
      Modal: new ModalComponent(noopRenderer),
      Divider: new DividerComponent(noopRenderer),
      TextField: new TextFieldComponent(noopRenderer),
      CheckBox: new CheckBoxComponent(noopRenderer),
      ChoicePicker: new ChoicePickerComponent(noopRenderer),
      Slider: new SliderComponent(noopRenderer),
      DateTimeInput: new DateTimeInputComponent(noopRenderer),
    };
    const catalog = createStandardCatalog(components);

    // 2. Initialize processor
    const processor = new A2uiMessageProcessor([catalog], async () => {});

    // 3. Generate capabilities
    const capabilities = processor.getClientCapabilities({ inlineCatalogs: [catalog] });
    const generatedCatalog = capabilities.inlineCatalogs[0];

    // 4. Load expected JSON
    // The test is running from renderers/web_core
    const specPath = join(process.cwd(), '../../specification/v0_9/json/standard_catalog.json');
    const specContent = JSON.parse(readFileSync(specPath, 'utf-8'));

    // 5. Compare components
    for (const [name, expectedDef] of Object.entries(specContent.components)) {
        const generatedDef = generatedCatalog.components[name];
        assert.ok(generatedDef, `Component ${name} should exist in generated catalog`);

        // Check the envelope structure
        assert.strictEqual(generatedDef.type, 'object');
        assert.ok(generatedDef.allOf, `Component ${name} should have allOf`);
        assert.strictEqual(generatedDef.allOf.length, 3);
        
        // Check references to common types
        assert.deepStrictEqual(generatedDef.allOf[0], { "$ref": "common_types.json#/$defs/ComponentCommon" });
        assert.deepStrictEqual(generatedDef.allOf[1], { "$ref": "#/$defs/CatalogComponentCommon" });

        // Check specific properties block
        const propsSchema = generatedDef.allOf[2];
        assert.strictEqual(propsSchema.type, 'object');
        assert.strictEqual(propsSchema.properties.component.const, name);

        // Find the properties block in the expected definition
        // It's the one with "properties" and "properties.component"
        const expectedPropsSchema = (expectedDef as any).allOf.find((item: any) => 
            item.properties && item.properties.component
        );
        assert.ok(expectedPropsSchema, `Could not find properties block in spec for ${name}`);
        const expectedProps = expectedPropsSchema.properties;
        const generatedProps = propsSchema.properties;

        // Helper to check reference equality
        const checkRef = (propName: string) => {
             if (expectedProps[propName] && expectedProps[propName].$ref) {
                 assert.strictEqual(
                     generatedProps[propName].$ref, 
                     expectedProps[propName].$ref, 
                     `Reference mismatch for ${name}.${propName}`
                 );
             }
        };

        // Specific component checks based on what we know uses references
        if (name === 'Text') checkRef('text');
        if (name === 'Image') checkRef('url');
        if (name === 'Button') {
            checkRef('child');
            checkRef('action');
        }
        if (name === 'TextField') {
            checkRef('label');
            checkRef('value');
        }
        if (name === 'Row' || name === 'Column' || name === 'List') {
             checkRef('children');
        }
    }
  });
});
