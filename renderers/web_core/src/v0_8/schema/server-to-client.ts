import { z } from "zod";
import {
  AudioPlayerSchema,
  ButtonSchema,
  CardSchema,
  CheckboxSchema,
  ColumnSchema,
  DateTimeInputSchema,
  DividerSchema,
  IconSchema,
  ImageSchema,
  ListSchema,
  ModalSchema,
  MultipleChoiceSchema,
  RowSchema,
  SliderSchema,
  TabsSchema,
  TextFieldSchema,
  TextSchema,
  VideoSchema,
} from "./common-types.js";

const ValueMapItemSchema = z
  .object({
    key: z.string(),
    valueString: z.string().optional(),
    valueNumber: z.number().optional(),
    valueBoolean: z.boolean().optional(),
  })
  .strict()
  .describe(
    "One entry in the map. Exactly one 'value*' property should be provided alongside the key.",
  );

export const ValueMapSchema = z
  .object({
    key: z.string().describe("The key for this data entry."),
    valueString: z.string().optional(),
    valueNumber: z.number().optional(),
    valueBoolean: z.boolean().optional(),
    valueMap: z
      .array(ValueMapItemSchema)
      .optional()
      .describe("Represents a map as an adjacency list."),
  })
  .strict()
  .describe(
    "A single data entry. Exactly one 'value*' property should be provided alongside the key.",
  );

export const AnyComponentSchema = z
  .object({
    Text: TextSchema.optional(),
    Image: ImageSchema.optional(),
    Icon: IconSchema.optional(),
    Video: VideoSchema.optional(),
    AudioPlayer: AudioPlayerSchema.optional(),
    Row: z.lazy(() => RowSchema).optional(),
    Column: z.lazy(() => ColumnSchema).optional(),
    List: z.lazy(() => ListSchema).optional(),
    Card: z.lazy(() => CardSchema).optional(),
    Tabs: TabsSchema.optional(),
    Divider: DividerSchema.optional(),
    Modal: ModalSchema.optional(),
    Button: ButtonSchema.optional(),
    Checkbox: CheckboxSchema.optional(),
    TextField: TextFieldSchema.optional(),
    DateTimeInput: DateTimeInputSchema.optional(),
    MultipleChoice: MultipleChoiceSchema.optional(),
    Slider: SliderSchema.optional(),
  })
  .catchall(z.any());

export const ComponentPropertiesSchema = AnyComponentSchema;

export const ComponentInstanceSchema = z
  .object({
    id: z.string().describe("The unique identifier for this component."),
    weight: z
      .number()
      .optional()
      .describe(
        "The relative weight of this component within a Row or Column. This corresponds to the CSS 'flex-grow' property. Note: this may ONLY be set when the component is a direct descendant of a Row or Column.",
      ),
    component: ComponentPropertiesSchema.describe(
      "A wrapper object that MUST contain exactly one key, which is the name of the component type (e.g., 'Heading'). The value is an object containing the properties for that specific component.",
    ),
  })
  .strict()
  .describe(
    "Represents a *single* component in a UI widget tree. This component could be one of many supported types.",
  );

export const BeginRenderingMessageSchema = z
  .object({
    surfaceId: z
      .string()
      .describe("The unique identifier for the UI surface to be rendered."),
    root: z.string().describe("The ID of the root component to render."),
    styles: z
      .object({
        font: z.string().optional().describe("The primary font for the UI."),
        primaryColor: z
          .string()
          .regex(/^#[0-9a-fA-F]{6}$/)
          .optional()
          .describe(
            "The primary UI color as a hexadecimal code (e.g., '#00BFFF').",
          ),
      })
      .strict()
      .optional()
      .describe("Styling information for the UI."),
  })
  .strict()
  .describe(
    "Signals the client to begin rendering a surface with a root component and specific styles.",
  );

export const SurfaceUpdateMessageSchema = z
  .object({
    surfaceId: z
      .string()
      .describe(
        "The unique identifier for the UI surface to be updated. If you are adding a new surface this *must* be a new, unique identified that has never been used for any existing surfaces shown.",
      ),
    components: z
      .array(ComponentInstanceSchema)
      .min(1)
      .describe("A list containing all UI components for the surface."),
  })
  .strict()
  .describe("Updates a surface with a new set of components.");

export const DataModelUpdateMessageSchema = z
  .object({
    surfaceId: z
      .string()
      .describe(
        "The unique identifier for the UI surface this data model update applies to.",
      ),
    path: z
      .string()
      .optional()
      .describe(
        "An optional path to a location within the data model (e.g., '/user/name'). If omitted, or set to '/', the entire data model will be replaced.",
      ),
    contents: z
      .array(ValueMapSchema)
      .describe(
        "An array of data entries. Each entry must contain a 'key' and exactly one corresponding typed 'value*' property.",
      ),
  })
  .strict()
  .describe("Updates the data model for a surface.");

export const DeleteSurfaceMessageSchema = z
  .object({
    surfaceId: z
      .string()
      .describe("The unique identifier for the UI surface to be deleted."),
  })
  .strict()
  .describe(
    "Signals the client to delete the surface identified by 'surfaceId'.",
  );

export const A2uiMessageSchema = z
  .object({
    beginRendering: BeginRenderingMessageSchema.optional(),
    surfaceUpdate: SurfaceUpdateMessageSchema.optional(),
    dataModelUpdate: DataModelUpdateMessageSchema.optional(),
    deleteSurface: DeleteSurfaceMessageSchema.optional(),
  })
  .strict()
  .describe(
    "Describes a JSON payload for an A2UI (Agent to UI) message, which is used to dynamically construct and update user interfaces. A message MUST contain exactly ONE of the action properties: 'beginRendering', 'surfaceUpdate', 'dataModelUpdate', or 'deleteSurface'.",
  );

export type A2uiMessage = z.infer<typeof A2uiMessageSchema>;
