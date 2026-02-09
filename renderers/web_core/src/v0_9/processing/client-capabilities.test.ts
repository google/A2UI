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

    // Helper to check reference equality
    const checkRef = (propName: string, generatedProps: any, expectedProps: any, name: string) => {
      // Only check if both expected and generated define this property with a $ref
      const expectedProp = expectedProps[propName];
      const generatedProp = generatedProps[propName];

      if (expectedProp && expectedProp.$ref) {
        assert.ok(generatedProp, `Generated property ${name}.${propName} is missing`);
        assert.strictEqual(
          generatedProp.$ref,
          expectedProp.$ref,
          `Reference mismatch for ${name}.${propName}`
        );
      } else if (name === 'Icon' && propName === 'name' && expectedProp && expectedProp.oneOf && generatedProp) {
        // Special handling for Icon.name, which is a union
        const unionProp = generatedProp.oneOf || generatedProp.anyOf;
        assert.ok(unionProp, `Generated property ${name}.${propName} should have oneOf or anyOf`);
        assert.strictEqual(unionProp.length, expectedProp.oneOf.length, `Union length mismatch for ${name}.${propName}`);

        // Perform a simplified check: ensure types (string/object) and const values match
        for (let i = 0; i < expectedProp.oneOf.length; i++) {
          const expItem = expectedProp.oneOf[i];
          const genItem = unionProp[i];
          if (expItem.type === "string") {
            assert.strictEqual(genItem.type, "string", `Union item type mismatch for ${name}.${propName}[${i}]`);
            assert.deepStrictEqual(genItem.enum, expItem.enum, `Union item enum mismatch for ${name}.${propName}[${i}]`);
          } else if (expItem.type === "object") {
            assert.strictEqual(genItem.type, "object", `Union item type mismatch for ${name}.${propName}[${i}]`);
            assert.deepStrictEqual(genItem.properties, expItem.properties, `Union item properties mismatch for ${name}.${propName}[${i}]`);
          }
        }
      }
    };

    // 5. Compare components
    for (const [name, expectedDef] of Object.entries(specContent.components)) {
        const generatedDef = generatedCatalog.components[name];
        assert.ok(generatedDef, `Component ${name} should exist in generated catalog`);

        // Check the envelope structure
        assert.strictEqual(generatedDef.type, 'object');
        assert.ok(generatedDef.allOf, `Component ${name} should have allOf`);
        
        // Find the properties block in the expected definition and generated definition
        const expectedPropsSchemaItem = (expectedDef as any).allOf.find((item: any) => 
            item.properties && item.properties.component
        );
        assert.ok(expectedPropsSchemaItem, `Could not find properties block in spec for ${name}`);
        const expectedProps = expectedPropsSchemaItem.properties;

        const generatedPropsSchemaItem = generatedDef.allOf.find((item: any) => 
            item.properties && item.properties.component
        );
        assert.ok(generatedPropsSchemaItem, `Could not find properties block in generated for ${name}`);
        const generatedProps = generatedPropsSchemaItem.properties;

        // Verify basic properties of the properties block
        assert.strictEqual(generatedProps.component.const, name);

        // All components should have weight now
        assert.ok(generatedProps.weight, `Weight property missing for ${name}`);
        // Weight is now a direct number property in the inline catalog
        assert.strictEqual(generatedProps.weight.type, 'number', `Weight type mismatch for ${name}`);

        // Specific component checks based on what we know uses references
        if (name === 'Text') checkRef('text', generatedProps, expectedProps, name);
        if (name === 'Image') checkRef('url', generatedProps, expectedProps, name);
        if (name === 'Button') {
            checkRef('child', generatedProps, expectedProps, name);
            checkRef('action', generatedProps, expectedProps, name);
        }
        if (name === 'TextField') {
            checkRef('label', generatedProps, expectedProps, name);
            checkRef('value', generatedProps, expectedProps, name);
        }
        if (name === 'Row' || name === 'Column' || name === 'List') {
             checkRef('children', generatedProps, expectedProps, name);
        }
        if (name === 'Icon') {
            checkRef('name', generatedProps, expectedProps, name);
        }

        // TODO: Add more comprehensive checks for other components and their specific properties
        // For now, we are primarily validating the reference resolution mechanism.
    }
  });
});
