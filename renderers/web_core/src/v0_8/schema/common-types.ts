/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { z } from "zod";

/**
 * Base primitives
 */

const exactlyOneKey = (val: any, ctx: z.RefinementCtx) => {
  const keys = Object.keys(val).filter((k) => val[k] !== undefined);
  if (keys.length !== 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Must define exactly one property, found ${keys.length} (${keys.join(", ")}).`,
    });
  }
};

export interface StringValue {
  path?: string;
  literalString?: string;
  literal?: string;
}

export const StringValueSchema: z.ZodType<StringValue> = z
  .object({
    path: z.string().optional(),
    literalString: z.string().optional(),
    literal: z.string().optional(),
  })
  .strict()
  .superRefine(exactlyOneKey);

export interface DataValue {
  key: string;
  valueString?: string;
  valueNumber?: number;
  valueBoolean?: boolean;
  valueMap?: DataValue[];
}

const DataValueMapItemSchema: z.ZodType<DataValue> = z.lazy(() =>
  z
    .object({
      key: z.string(),
      valueString: z.string().optional(),
      valueNumber: z.number().optional(),
      valueBoolean: z.boolean().optional(),
      valueMap: z.array(DataValueMapItemSchema).optional(),
    })
    .strict()
    .superRefine((val: any, ctx: z.RefinementCtx) => {
      let count = 0;
      if (val.valueString !== undefined) count++;
      if (val.valueNumber !== undefined) count++;
      if (val.valueBoolean !== undefined) count++;
      if (val.valueMap !== undefined) count++;
      if (count !== 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Value map item must have exactly one value property (valueString, valueNumber, valueBoolean, valueMap), found ${count}.`,
        });
      }
    }),
);

export const DataValueSchema: z.ZodType<DataValue> = z
  .object({
    key: z.string(),
    valueString: z.string().optional(),
    valueNumber: z.number().optional(),
    valueBoolean: z.boolean().optional(),
    valueMap: z.array(DataValueMapItemSchema).optional(),
  })
  .strict()
  .superRefine((val: any, ctx: z.RefinementCtx) => {
    let count = 0;
    if (val.valueString !== undefined) count++;
    if (val.valueNumber !== undefined) count++;
    if (val.valueBoolean !== undefined) count++;
    if (val.valueMap !== undefined) count++;
    if (count !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Value must have exactly one value property (valueString, valueNumber, valueBoolean, valueMap), found ${count}.`,
      });
    }
  })
  .superRefine((val: any, ctx: z.RefinementCtx) => {
    const checkDepth = (v: any, currentDepth: number) => {
      if (currentDepth > 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "valueMap recursion exceeded maximum depth of 5.",
        });
        return;
      }
      if (v.valueMap && Array.isArray(v.valueMap)) {
        for (const item of v.valueMap) {
          checkDepth(item, currentDepth + 1);
        }
      }
    };
    checkDepth(val, 1);
  });

export interface NumberValue {
  path?: string;
  literalNumber?: number;
  literal?: number;
}

export const NumberValueSchema: z.ZodType<NumberValue> = z
  .object({
    path: z.string().optional(),
    literalNumber: z.number().optional(),
    literal: z.number().optional(),
  })
  .strict()
  .superRefine(exactlyOneKey);

export interface BooleanValue {
  path?: string;
  literalBoolean?: boolean;
  literal?: boolean;
}

export const BooleanValueSchema: z.ZodType<BooleanValue> = z
  .object({
    path: z.string().optional(),
    literalBoolean: z.boolean().optional(),
    literal: z.boolean().optional(),
  })
  .strict()
  .superRefine(exactlyOneKey);

/**
 * Action Schema for components that trigger user actions
 */
export interface Action {
  name: string;
  context?: Array<{
    key: string;
    value: {
      path?: string;
      literalString?: string;
      literalNumber?: number;
      literalBoolean?: boolean;
    };
  }>;
}

export const ActionSchema: z.ZodType<Action> = z.object({
  name: z
    .string()
    .describe("A unique name identifying the action (e.g., 'submitForm')."),
  context: z
    .array(
      z.object({
        key: z.string(),
        value: z
          .object({
            path: z
              .string()
              .describe(
                "A data binding reference to a location in the data model (e.g., '/user/name').",
              )
              .optional(),
            literalString: z
              .string()
              .describe("A fixed, hardcoded string value.")
              .optional(),
            literalNumber: z.number().optional(),
            literalBoolean: z.boolean().optional(),
          })
          .describe(
            "The dynamic value. Define EXACTLY ONE of the nested properties.",
          )
          .strict()
          .superRefine(exactlyOneKey),
      }),
    )
    .describe(
      "A key-value map of data bindings to be resolved when the action is triggered.",
    )
    .optional(),
});

/**
 * Component Properties Schemas
 */

const TEXT_USAGE_HINT_VALUES = ["h1", "h2", "h3", "h4", "h5", "caption", "body"] as const;
type TextUsageHint = typeof TEXT_USAGE_HINT_VALUES[number];

export interface Text {
  text: StringValue;
  usageHint?: TextUsageHint;
}

export const TextSchema: z.ZodType<Text> = z.object({
  text: StringValueSchema,
  usageHint: z.enum(TEXT_USAGE_HINT_VALUES).optional(),
});

const IMAGE_USAGE_HINT_VALUES = [
  "icon",
  "avatar",
  "smallFeature",
  "mediumFeature",
  "largeFeature",
  "header",
] as const;
type ImageUsageHint = typeof IMAGE_USAGE_HINT_VALUES[number];

const IMAGE_FIT_VALUES = ["contain", "cover", "fill", "none", "scale-down"] as const;
type ImageFit = typeof IMAGE_FIT_VALUES[number];

export interface Image {
  url: StringValue;
  usageHint?: ImageUsageHint;
  fit?: ImageFit;
  altText?: StringValue;
}

export const ImageSchema: z.ZodType<Image> = z.object({
  url: StringValueSchema,
  usageHint: z.enum(IMAGE_USAGE_HINT_VALUES).optional(),
  fit: z.enum(IMAGE_FIT_VALUES).optional(),
  altText: StringValueSchema.optional(),
});

export interface Icon {
  name: StringValue;
}

export const IconSchema: z.ZodType<Icon> = z.object({
  name: StringValueSchema,
});

export interface Video {
  url: StringValue;
}

export const VideoSchema: z.ZodType<Video> = z.object({
  url: StringValueSchema,
});

export interface AudioPlayer {
  url: StringValue;
  description?: StringValue;
}

export const AudioPlayerSchema: z.ZodType<AudioPlayer> = z.object({
  url: StringValueSchema,
  description: StringValueSchema.optional().describe(
    "A label, title, or placeholder text.",
  ),
});

export interface Tabs {
  tabItems: Array<{
    title: {
      path?: string;
      literalString?: string;
    };
    child: string;
  }>;
}

export const TabsSchema: z.ZodType<Tabs> = z.object({
  tabItems: z
    .array(
      z
        .object({
          title: z.object({
            path: z
              .string()
              .describe(
                "A data binding reference to a location in the data model (e.g., '/user/name').",
              )
              .optional(),
            literalString: z
              .string()
              .describe("A fixed, hardcoded string value.")
              .optional(),
          }),
          child: z
            .string()
            .describe("A reference to a component instance by its unique ID."),
        })
        .strict()
        .superRefine((val: any, ctx: z.RefinementCtx) => {
          if (!val.title) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Tab item is missing 'title'.",
            });
          }
          if (!val.child) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Tab item is missing 'child'.",
            });
          }
          if (val.title) {
            exactlyOneKey(val.title, ctx);
          }
        }),
    )
    .describe("A list of tabs, each with a title and a child component ID."),
});

const DIVIDER_AXIS_VALUES = ["horizontal", "vertical"] as const;
type DividerAxis = typeof DIVIDER_AXIS_VALUES[number];

export interface Divider {
  axis?: DividerAxis;
  color?: string;
  thickness?: number;
}

export const DividerSchema: z.ZodType<Divider> = z.object({
  axis: z
    .enum(DIVIDER_AXIS_VALUES)
    .optional()
    .describe("The orientation."),
  color: z
    .string()
    .optional()
    .describe("The color of the divider (e.g., hex code or semantic name)."),
  thickness: z.number().optional().describe("The thickness of the divider."),
});

export interface Modal {
  entryPointChild: string;
  contentChild: string;
}

export const ModalSchema: z.ZodType<Modal> = z.object({
  entryPointChild: z
    .string()
    .describe(
      "The ID of the component (e.g., a button) that triggers the modal.",
    ),
  contentChild: z
    .string()
    .describe("The ID of the component to display as the modal's content."),
});

export interface Button {
  child: string;
  action: Action;
  primary?: boolean;
}

export const ButtonSchema: z.ZodType<Button> = z.object({
  child: z
    .string()
    .describe("The ID of the component to display as the button's content."),
  action: ActionSchema.describe("Represents a user-initiated action."),
  primary: z
    .boolean()
    .optional()
    .describe(
      "Indicates if this button should be styled as the primary action."
    ),
});

export interface Checkbox {
  label: StringValue;
  value: {
    path?: string;
    literalBoolean?: boolean;
  };
}

export const CheckboxSchema: z.ZodType<Checkbox> = z.object({
  label: StringValueSchema,
  value: z
    .object({
      path: z
        .string()
        .describe(
          "A data binding reference to a location in the data model (e.g., '/user/name').",
        )
        .optional(),
      literalBoolean: z.boolean().optional(),
    })
    .strict()
    .superRefine(exactlyOneKey),
});

const TEXT_FIELD_TYPE_VALUES = ["shortText", "number", "date", "longText"] as const;
type TextFieldType = typeof TEXT_FIELD_TYPE_VALUES[number];

export interface TextField {
  text?: StringValue;
  label: StringValue;
  textFieldType?: TextFieldType;
  validationRegexp?: string;
}

export const TextFieldSchema: z.ZodType<TextField> = z.object({
  text: StringValueSchema.optional(),
  label: StringValueSchema.describe("A label, title, or placeholder text."),
  textFieldType: z.enum(TEXT_FIELD_TYPE_VALUES).optional(),
  validationRegexp: z
    .string()
    .optional()
    .describe("A regex string to validate the input."),
});

export interface DateTimeInput {
  value: StringValue;
  enableDate?: boolean;
  enableTime?: boolean;
  outputFormat?: string;
}

export const DateTimeInputSchema: z.ZodType<DateTimeInput> = z.object({
  value: StringValueSchema,
  enableDate: z.boolean().optional(),
  enableTime: z.boolean().optional(),
  outputFormat: z
    .string()
    .optional()
    .describe("The string format for the output (e.g., 'YYYY-MM-DD')."),
});

const MULTIPLE_CHOICE_TYPE_VALUES = ["checkbox", "chips"] as const;
type MultipleChoiceType = typeof MULTIPLE_CHOICE_TYPE_VALUES[number];

export interface MultipleChoice {
  selections: {
    path?: string;
    literalArray?: string[];
  };
  options?: Array<{
    label: {
      path?: string;
      literalString?: string;
    };
    value: string;
  }>;
  maxAllowedSelections?: number;
  type?: MultipleChoiceType;
  filterable?: boolean;
}

export const MultipleChoiceSchema: z.ZodType<MultipleChoice> = z.object({
  selections: z
    .object({
      path: z
        .string()
        .describe(
          "A data binding reference to a location in the data model (e.g., '/user/name').",
        )
        .optional(),
      literalArray: z.array(z.string()).optional(),
    })
    .strict()
    .superRefine(exactlyOneKey),
  options: z
    .array(
      z.object({
        label: z
          .object({
            path: z
              .string()
              .describe(
                "A data binding reference to a location in the data model (e.g., '/user/name').",
              )
              .optional(),
            literalString: z
              .string()
              .describe("A fixed, hardcoded string value.")
              .optional(),
          })
          .strict()
          .superRefine(exactlyOneKey),
        value: z.string(),
      }),
    )
    .optional(),
  maxAllowedSelections: z.number().optional(),
  type: z.enum(MULTIPLE_CHOICE_TYPE_VALUES).optional(),
  filterable: z.boolean().optional(),
});

export interface Slider {
  value: {
    path?: string;
    literalNumber?: number;
  };
  minValue?: number;
  maxValue?: number;
  label?: StringValue;
}

export const SliderSchema: z.ZodType<Slider> = z.object({
  value: z
    .object({
      path: z
        .string()
        .describe(
          "A data binding reference to a location in the data model (e.g., '/user/name').",
        )
        .optional(),
      literalNumber: z.number().optional(),
    })
    .strict()
    .superRefine(exactlyOneKey),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  label: StringValueSchema.optional(),
});

export interface ComponentArrayTemplate {
  componentId: string;
  dataBinding: string;
}

export const ComponentArrayTemplateSchema: z.ZodType<ComponentArrayTemplate> = z.object({
  componentId: z.string(),
  dataBinding: z.string(),
});

export interface ComponentArrayReference {
  explicitList?: string[];
  template?: ComponentArrayTemplate;
}

export const ComponentArrayReferenceSchema: z.ZodType<ComponentArrayReference> = z
  .object({
    explicitList: z.array(z.string()).optional(),
    template: ComponentArrayTemplateSchema.describe(
      "A template for generating a dynamic list of children from a data model list. `componentId` is the component to use as a template, and `dataBinding` is the path to the map of components in the data model. Values in the map will define the list of children.",
    ).optional(),
  })
  .strict()
  .superRefine(exactlyOneKey);

const COMPONENT_DISTRIBUTION_VALUES = [
  "start",
  "center",
  "end",
  "spaceBetween",
  "spaceAround",
  "spaceEvenly",
] as const;
type ComponentDistribution = typeof COMPONENT_DISTRIBUTION_VALUES[number];

const COMPONENT_ALIGNMENT_VALUES = ["start", "center", "end", "stretch"] as const;
type ComponentAlignment = typeof COMPONENT_ALIGNMENT_VALUES[number];

export interface Row {
  children: ComponentArrayReference;
  distribution?: ComponentDistribution;
  alignment?: ComponentAlignment;
}

export const RowSchema: z.ZodType<Row> = z.object({
  children: ComponentArrayReferenceSchema,
  distribution: z.enum(COMPONENT_DISTRIBUTION_VALUES).optional(),
  alignment: z.enum(COMPONENT_ALIGNMENT_VALUES).optional(),
});

export interface Column {
  children: ComponentArrayReference;
  distribution?: ComponentDistribution;
  alignment?: ComponentAlignment;
}

export const ColumnSchema: z.ZodType<Column> = z.object({
  children: ComponentArrayReferenceSchema,
  distribution: z.enum(COMPONENT_DISTRIBUTION_VALUES).optional(),
  alignment: z.enum(COMPONENT_ALIGNMENT_VALUES).optional(),
});

const LIST_DIRECTION_VALUES = ["vertical", "horizontal"] as const;
type ListDirection = typeof LIST_DIRECTION_VALUES[number];

export interface List {
  children: ComponentArrayReference;
  direction?: ListDirection;
  alignment?: ComponentAlignment;
}

export const ListSchema: z.ZodType<List> = z.object({
  children: ComponentArrayReferenceSchema,
  direction: z.enum(LIST_DIRECTION_VALUES).optional(),
  alignment: z.enum(COMPONENT_ALIGNMENT_VALUES).optional(),
});

export interface Card {
  child: string;
}

export const CardSchema: z.ZodType<Card> = z.object({
  child: z
    .string()
    .describe("The ID of the component to be rendered inside the card."),
});
