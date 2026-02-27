import { z } from 'zod';

export const DataBindingSchema = z.object({
    path: z.string().describe('A JSON Pointer path to a value in the data model.')
});

export const FunctionCallSchema = z.object({
    call: z.string().describe('The name of the function to call.'),
    args: z.record(z.any()).describe('Arguments passed to the function.'),
    returnType: z.enum(['string', 'number', 'boolean', 'array', 'object', 'any', 'void']).default('boolean')
});

export const LogicExpressionSchema: z.ZodType<any> = z.lazy(() => z.union([
    z.object({ and: z.array(LogicExpressionSchema).min(1) }),
    z.object({ or: z.array(LogicExpressionSchema).min(1) }),
    z.object({ not: LogicExpressionSchema }),
    z.intersection(FunctionCallSchema, z.object({ returnType: z.literal('boolean').optional() })), // FunctionCall returning boolean
    z.object({ true: z.literal(true) }),
    z.object({ false: z.literal(false) })
]));

export const DynamicStringSchema = z.union([
    z.string(),
    DataBindingSchema,
    // FunctionCall returning string (simplified schema for Zod, stricter in JSON Schema)
    FunctionCallSchema
]);

export const DynamicNumberSchema = z.union([
    z.number(),
    DataBindingSchema,
    FunctionCallSchema
]);

export const DynamicBooleanSchema = z.union([
    z.boolean(),
    DataBindingSchema,
    LogicExpressionSchema
]);

export const DynamicStringListSchema = z.union([
    z.array(z.string()),
    DataBindingSchema,
    FunctionCallSchema
]);

export const DynamicValueSchema = z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.any()),
    DataBindingSchema,
    FunctionCallSchema
]);

export type DataBinding = z.infer<typeof DataBindingSchema>;
export type FunctionCall = z.infer<typeof FunctionCallSchema>;
export type LogicExpression = z.infer<typeof LogicExpressionSchema>;
export type DynamicString = z.infer<typeof DynamicStringSchema>;
export type DynamicNumber = z.infer<typeof DynamicNumberSchema>;
export type DynamicBoolean = z.infer<typeof DynamicBooleanSchema>;
export type DynamicStringList = z.infer<typeof DynamicStringListSchema>;
export type DynamicValue = z.infer<typeof DynamicValueSchema>;

export const ComponentIdSchema = z.string().describe('The unique identifier for a component.');
export type ComponentId = z.infer<typeof ComponentIdSchema>;

export const ChildListSchema = z.union([
    z.array(ComponentIdSchema).describe('A static list of child component IDs.'),
    z.object({
        componentId: ComponentIdSchema,
        path: z.string().describe('The path to the list of component property objects in the data model.')
    }).describe('A template for generating a dynamic list of children.')
]);
export type ChildList = z.infer<typeof ChildListSchema>;

export const ActionSchema = z.union([
    z.object({
        event: z.object({
            name: z.string(),
            context: z.record(DynamicValueSchema).optional()
        })
    }).describe('Triggers a server-side event.'),
    z.object({
        functionCall: FunctionCallSchema
    }).describe('Executes a local client-side function.')
]);
export type Action = z.infer<typeof ActionSchema>;

export const CheckRuleSchema = z.intersection(
    LogicExpressionSchema,
    z.object({
        message: z.string().describe('The error message to display if the check fails.')
    })
);
export type CheckRule = z.infer<typeof CheckRuleSchema>;

export const CheckableSchema = z.object({
    checks: z.array(CheckRuleSchema).optional().describe('A list of checks to perform.')
});
export type Checkable = z.infer<typeof CheckableSchema>;

export const AccessibilityAttributesSchema = z.object({
    label: DynamicStringSchema.optional().describe('REF:common_types.json#/$defs/DynamicString|A short string used by assistive technologies to convey the purpose of an element.'),
    description: DynamicStringSchema.optional().describe('REF:common_types.json#/$defs/DynamicString|Additional information provided by assistive technologies about an element.')
}).describe('REF:common_types.json#/$defs/AccessibilityAttributes|Attributes to enhance accessibility.');

export type AccessibilityAttributes = z.infer<typeof AccessibilityAttributesSchema>;

export const CommonSchemas = {
    ComponentId: ComponentIdSchema,
    ChildList: ChildListSchema,
    DataBinding: DataBindingSchema,
    DynamicValue: DynamicValueSchema,
    DynamicString: DynamicStringSchema,
    DynamicNumber: DynamicNumberSchema,
    DynamicBoolean: DynamicBooleanSchema,
    DynamicStringList: DynamicStringListSchema,
    FunctionCall: FunctionCallSchema,
    LogicExpression: LogicExpressionSchema,
    CheckRule: CheckRuleSchema,
    Checkable: CheckableSchema,
    Action: ActionSchema,
    AccessibilityAttributes: AccessibilityAttributesSchema,
};
