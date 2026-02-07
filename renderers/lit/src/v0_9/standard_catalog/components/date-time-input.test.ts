import { describe, it } from 'node:test';
import { litDateTimeInput } from './date-time-input.js';
import { createLitTestContext, assertTemplateContains } from '../../test/test-utils.js';

describe('Lit DateTimeInput', () => {
    it('renders date input', () => {
        const context = createLitTestContext({ label: 'Birthday', value: '2000-01-01', enableDate: true });
        const result = litDateTimeInput.render(context);
        assertTemplateContains(result, 'Birthday');
        assertTemplateContains(result, 'type="date"');
    });

    it('renders time input', () => {
        const context = createLitTestContext({ label: 'Alarm', value: '12:00', enableTime: true, enableDate: false });
        const result = litDateTimeInput.render(context);
        assertTemplateContains(result, 'type="time"');
    });
});
