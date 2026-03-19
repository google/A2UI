from __future__ import annotations

from typing import Annotated, Any, Literal

from pydantic import BaseModel, Field, RootModel, TypeAdapter, ConfigDict


class Theme(BaseModel):
  primaryColor: str | None = None
  font: str | None = None


class InitSurfaceDelta(BaseModel):
  event: Literal["init_surface"]
  surface_id: str = "main"
  title: str
  summary: str | None = None
  theme: Theme | None = None


class AddSectionDelta(BaseModel):
  event: Literal["add_section"]
  id: str
  parent_id: str
  layout: Literal["Card", "Column", "Row", "List"]
  title: str | None = None
  description: str | None = None


class AddTextDelta(BaseModel):
  event: Literal["add_text"]
  id: str
  parent_id: str
  text: str
  usage_hint: Literal["h1", "h2", "h3", "body", "caption"] = "body"


class AddKeyValueDelta(BaseModel):
  event: Literal["add_key_value"]
  id: str
  parent_id: str
  label: str
  value: str


class AddImageDelta(BaseModel):
  event: Literal["add_image"]
  id: str
  parent_id: str
  url: str
  usage_hint: Literal["icon", "avatar", "smallFeature", "mediumFeature", "largeFeature", "header"] | None = None


class AddButtonDelta(BaseModel):
  event: Literal["add_button"]
  id: str
  parent_id: str
  label: str
  action_name: str
  primary: bool = False


class FlowDiagramNode(BaseModel):
  id: str
  label: str
  column: int
  lane: int = 0
  kind: Literal["start", "process", "decision", "end"] = "process"


class FlowDiagramEdge(BaseModel):
  from_id: str
  to_id: str
  label: str | None = None


class AddFlowDiagramDelta(BaseModel):
  event: Literal["add_flow_diagram"]
  id: str
  parent_id: str
  title: str
  nodes: list[FlowDiagramNode]
  edges: list[FlowDiagramEdge]


class ChoiceOption(BaseModel):
  label: str
  value: str


class AddInputDelta(BaseModel):
  event: Literal["add_input"]
  id: str
  parent_id: str
  component: Literal["TextField", "CheckBox", "Slider", "MultipleChoice", "DateTimeInput"]
  label: str
  path: str
  value: str | bool | float | int | list[str] | None = None
  text_field_type: Literal["shortText", "longText", "number", "date", "obscured"] | None = None
  min_value: float | None = None
  max_value: float | None = None
  options: list[ChoiceOption] | None = None
  enable_date: bool | None = None
  enable_time: bool | None = None


class AddDividerDelta(BaseModel):
  event: Literal["add_divider"]
  id: str
  parent_id: str


class AppendListItemDelta(BaseModel):
  event: Literal["append_list_item"]
  id: str
  parent_id: str
  title: str
  detail: str | None = None


class FinalizeDelta(BaseModel):
  event: Literal["finalize"]


Delta = Annotated[
    InitSurfaceDelta
    | AddSectionDelta
    | AddTextDelta
    | AddKeyValueDelta
    | AddImageDelta
    | AddButtonDelta
    | AddFlowDiagramDelta
    | AddInputDelta
    | AddDividerDelta
    | AppendListItemDelta
    | FinalizeDelta,
    Field(discriminator="event"),
]

DELTA_ADAPTER = TypeAdapter(Delta)


class LiteralString(BaseModel):
  literalString: str


class PathValue(BaseModel):
  path: str


class LiteralBoolean(BaseModel):
  literalBoolean: bool


class LiteralNumber(BaseModel):
  literalNumber: float


class LiteralArray(BaseModel):
  literalArray: list[str]


class ContextEntry(BaseModel):
  key: str
  value: PathValue | LiteralString


class ComponentNode(BaseModel):
  id: str
  weight: float | None = None
  component: dict[str, Any]


class BeginRenderingPayload(BaseModel):
  surfaceId: str
  root: str
  styles: Theme | None = None


class SurfaceUpdatePayload(BaseModel):
  surfaceId: str
  components: list[ComponentNode]


class DataMapEntry(BaseModel):
  key: str
  valueString: str | None = None
  valueNumber: float | None = None
  valueBoolean: bool | None = None
  valueMap: list["DataMapEntry"] | None = None


DataMapEntry.model_rebuild()


class DataModelUpdatePayload(BaseModel):
  surfaceId: str
  path: str
  contents: list[DataMapEntry]


class DeleteSurfacePayload(BaseModel):
  surfaceId: str


class A2UIFrame(BaseModel):
  model_config = ConfigDict(extra="forbid")

  beginRendering: BeginRenderingPayload | None = None
  surfaceUpdate: SurfaceUpdatePayload | None = None
  dataModelUpdate: DataModelUpdatePayload | None = None
  deleteSurface: DeleteSurfacePayload | None = None

  def model_post_init(self, __context: Any) -> None:
    populated = [
        self.beginRendering is not None,
        self.surfaceUpdate is not None,
        self.dataModelUpdate is not None,
        self.deleteSurface is not None,
    ]
    if sum(populated) != 1:
      raise ValueError(
          "A2UI frame must contain exactly one of beginRendering, surfaceUpdate, dataModelUpdate, deleteSurface"
      )
