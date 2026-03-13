import type { Meta, StoryObj } from "@storybook/web-components";
import { renderA2UI, componentWithData } from "./helpers/a2ui-story-wrapper.js";

const meta: Meta = { title: "Components/DateTimeInput" };
export default meta;

export const DatePicker: StoryObj = {
  render: () => renderA2UI(componentWithData("dt-date", [
    { id: "dt1", component: "DateTimeInput", label: "Birth Date", variant: "date", value: { path: "/form/dob" } },
  ], "/form", { dob: "1990-01-15" })),
};

export const TimePicker: StoryObj = {
  render: () => renderA2UI(componentWithData("dt-time", [
    { id: "dt1", component: "DateTimeInput", label: "Meeting Time", variant: "time", value: { path: "/form/time" } },
  ], "/form", { time: "14:30" })),
};

export const DateTimePicker: StoryObj = {
  render: () => renderA2UI(componentWithData("dt-both", [
    { id: "dt1", component: "DateTimeInput", label: "Event Start", variant: "dateTime", value: { path: "/form/start" } },
  ], "/form", { start: "2026-03-01T09:00" })),
};
