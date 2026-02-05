import { TemplateResult } from 'lit';
import { ComponentContext, SurfaceContext, DataContext, Component } from '@a2ui/web_core/v0_9';

// Minimal mock for testing Lit components in Node (inspecting TemplateResult)
export class TestLitSurfaceContext extends SurfaceContext {
    constructor(actionHandler: any = () => { }) {
        super('test-lit', {} as any, {}, actionHandler);
    }
}

export function createLitTestContext(properties: any, actionHandler: any = () => { }) {
    const surface = new TestLitSurfaceContext(actionHandler);
    const dataContext = new DataContext(surface.dataModel, '/');
    return new ComponentContext<TemplateResult>('test-id', properties, dataContext, surface, () => { });
}

function expandTemplate(result: TemplateResult): string {
    let combined = result.strings[0];
    for (let i = 0; i < result.values.length; i++) {
        const val = result.values[i];
        let valStr = '';
        if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
            valStr = String(val);
        } else if (val && typeof val === 'object' && 'strings' in val) {
            valStr = expandTemplate(val as TemplateResult);
        } else if (Array.isArray(val)) {
            valStr = val.map(v => {
                if (v && typeof v === 'object' && 'strings' in v) {
                    return expandTemplate(v as TemplateResult);
                }
                return String(v);
            }).join('');
        }
        combined += valStr + result.strings[i + 1];
    }
    return combined;
}

export function assertTemplateContains(result: TemplateResult, expected: string) {
    const combined = expandTemplate(result);

    if (!combined.includes(expected)) {
        throw new Error(`Expected template to contain "${expected}".\nCombined: ${combined}`);
    }
}
