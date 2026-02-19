import { z } from 'zod';

const DataBinding = z.object({
  path: z.string().describe('A JSON Pointer path to a value in the data model.')
});

const FunctionCall = z.object({
  call: z.string().describe('The name of the function to call.'),
  args: z.record(z.any()).describe('Arguments passed to the function.'),
  returnType: z.enum(['string', 'number', 'boolean', 'array', 'object', 'any', 'void']).default('boolean')
});

const LogicExpression: z.ZodType<any> = z.lazy(() => z.union([
  z.object({ and: z.array(LogicExpression).min(1) }),
  z.object({ or: z.array(LogicExpression).min(1) }),
  z.object({ not: LogicExpression }),
  z.intersection(FunctionCall, z.object({ returnType: z.literal('boolean').optional() })), // FunctionCall returning boolean
  z.object({ true: z.literal(true) }),
  z.object({ false: z.literal(false) })
]));

const DynamicString = z.union([
    z.string(),
    DataBinding,
    // FunctionCall returning string (simplified schema for Zod, stricter in JSON Schema)
    FunctionCall
]);

const DynamicNumber = z.union([
    z.number(),
    DataBinding,
    FunctionCall
]);

const DynamicBoolean = z.union([
    z.boolean(),
    DataBinding,
    LogicExpression
]);

const DynamicStringList = z.union([
    z.array(z.string()),
    DataBinding,
    FunctionCall
]);

const DynamicValue = z.union([
    z.string(),
    z.number(),
    z.boolean(),
    DataBinding,
    FunctionCall
]);

const ComponentId = z.string().describe('The unique identifier for a component.');

const ChildList = z.union([
    z.array(ComponentId).describe('A static list of child component IDs.'),
    z.object({
        componentId: ComponentId,
        path: z.string().describe('The path to the list of component property objects in the data model.')
    }).describe('A template for generating a dynamic list of children.')
]);

const Action = z.union([
    z.object({
        event: z.object({
            name: z.string(),
            context: z.record(DynamicValue).optional()
        })
    }).describe('Triggers a server-side event.'),
    z.object({
        functionCall: FunctionCall
    }).describe('Executes a local client-side function.')
]);

const CheckRule = z.intersection(
    LogicExpression,
    z.object({
        message: z.string().describe('The error message to display if the check fails.')
    })
);

const Checkable = z.object({
    checks: z.array(CheckRule).optional().describe('A list of checks to perform.')
});

export const CommonTypes = {
    ComponentId,
    ChildList,
    DataBinding,
    DynamicValue,
    DynamicString,
    DynamicNumber,
    DynamicBoolean,
    DynamicStringList,
    FunctionCall,
    LogicExpression,
    CheckRule,
    Checkable,
    Action,
};
