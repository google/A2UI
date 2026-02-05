
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { TextFieldComponent } from './text-field.js';
import { CheckBoxComponent } from './check-box.js';
import { ChoicePickerComponent } from './choice-picker.js';
import { SliderComponent } from './slider.js';
import { DateTimeInputComponent } from './date-time-input.js';
import { ComponentContext } from '../../rendering/component-context.js';
import { DataContext } from '../../state/data-context.js';
import { SurfaceContext } from '../../state/surface-context.js';

class TestSurfaceContext extends SurfaceContext {
  constructor(actionHandler: any) {
    super('test', {} as any, {}, actionHandler);
  }
}

function createTestContext(properties: any, actionHandler: any = async () => { }) {
  const surface = new TestSurfaceContext(actionHandler);
  const dataContext = new DataContext(surface.dataModel, '/');
  return new ComponentContext<any>('test-id', properties, dataContext, surface, () => { });
}

describe('InputComponents', () => {
  it('TextField updates data model', () => {
    const comp = new TextFieldComponent((props) => props);
    const context = createTestContext({
      label: 'Name',
      value: { path: '/user/name' }
    });

    // Initial render
    context.dataContext.update('/user/name', 'Alice');
    context.dataContext.update('/user/name', 'Alice');
    const result = comp.render(context) as any;
    assert.strictEqual(result.value, 'Alice');

    // Simulate change
    result.onChange('Bob');
    assert.strictEqual(context.dataContext.getValue('/user/name'), 'Bob');
  });

  it('CheckBox updates data model', () => {
    const comp = new CheckBoxComponent((props) => props);
    const context = createTestContext({
      label: 'Agree',
      value: { path: '/agreed' }
    });

    context.dataContext.update('/agreed', false);
    context.dataContext.update('/agreed', false);
    const result = comp.render(context) as any;
    assert.strictEqual(result.value, false);

    result.onChange(true);
    assert.strictEqual(context.dataContext.getValue('/agreed'), true);
  });

  it('ChoicePicker updates data model', () => {
    const comp = new ChoicePickerComponent((props) => props);
    const context = createTestContext({
      value: { path: '/selection' },
      selections: [{ label: 'A', value: 'a' }]
    });

    // Test initial value from props if data model is empty? 
    // Usually components pull from data model if bound.
    // Usually components pull from data model if bound.
    context.dataContext.update('/selection', ['a']);
    const result = comp.render(context) as any;
    assert.deepStrictEqual(result.value, ['a']);

    result.onChange(['b']);
    assert.deepStrictEqual(context.dataContext.getValue('/selection'), ['b']);
  });

  it('Slider updates data model', () => {
    const comp = new SliderComponent((props) => props);
    const context = createTestContext({
      value: { path: '/volume' },
      min: 0, max: 100
    });

    context.dataContext.update('/volume', 50);
    context.dataContext.update('/volume', 50);
    const result = comp.render(context) as any;
    assert.strictEqual(result.value, 50);

    result.onChange(75);
    assert.strictEqual(context.dataContext.getValue('/volume'), 75);
  });

  it('DateTimeInput updates data model', () => {
    const comp = new DateTimeInputComponent((props) => props);
    const context = createTestContext({
      value: { path: '/date' }
    });

    context.dataContext.update('/date', '2023-01-01');
    context.dataContext.update('/date', '2023-01-01');
    const result = comp.render(context) as any;
    assert.strictEqual(result.value, '2023-01-01');

    result.onChange('2023-12-31');
    assert.strictEqual(context.dataContext.getValue('/date'), '2023-12-31');
  });
});
