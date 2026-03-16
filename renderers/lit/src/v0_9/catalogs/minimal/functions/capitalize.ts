import { z } from "zod";
import { createFunctionImplementation } from "@a2ui/web_core/v0_9";

export const CapitalizeApi = {
  name: "capitalize" as const,
  returnType: "string" as const,
  schema: z.object({
    value: z.string()
  }) as z.ZodType<any, any, any>
};

export const CapitalizeImplementation = createFunctionImplementation(
  CapitalizeApi as any,
  (args) => {
    if (!args.value) return "";
    return args.value.charAt(0).toUpperCase() + args.value.slice(1);
  }
);