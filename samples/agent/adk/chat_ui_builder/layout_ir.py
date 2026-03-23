from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

from intent_plan import PlanAction, PlanFact, PlanFlow, PlanInput, PlanListItem, PlanTextBlock
from models import Theme


@dataclass
class LayoutNode:
  id: str
  role: str


@dataclass
class ContentNode:
  id: str
  kind: str


@dataclass
class TextContent(ContentNode):
  text: str
  usage_hint: Literal['h1', 'h2', 'h3', 'body', 'caption'] = 'body'


@dataclass
class FactContent(ContentNode):
  label: str
  value: str


@dataclass
class ActionContent(ContentNode):
  label: str
  action_name: str
  primary: bool = False


@dataclass
class InputContent(ContentNode):
  component: str
  label: str
  path: str
  value: str | bool | float | int | list[str] | None = None
  text_field_type: str | None = None
  min_value: float | None = None
  max_value: float | None = None
  options: list | None = None
  enable_date: bool | None = None
  enable_time: bool | None = None


@dataclass
class ListItemContent(ContentNode):
  title: str
  detail: str | None = None


@dataclass
class FlowContent(ContentNode):
  title: str
  flow: PlanFlow


@dataclass
class CardRegion(LayoutNode):
  title: str | None = None
  description: str | None = None
  content: list[ContentNode] = field(default_factory=list)
  children: list[LayoutNode] = field(default_factory=list)


@dataclass
class HeroRegion(CardRegion):
  pass


@dataclass
class SummaryRegion(CardRegion):
  pass


@dataclass
class DetailsRegion(CardRegion):
  pass


@dataclass
class FlowRegion(CardRegion):
  pass


@dataclass
class FormRegion(CardRegion):
  pass


@dataclass
class ListRegion(CardRegion):
  pass


@dataclass
class ActionPanel(CardRegion):
  pass


@dataclass
class SplitRegion(LayoutNode):
  left: list[LayoutNode] = field(default_factory=list)
  right: list[LayoutNode] = field(default_factory=list)


@dataclass
class LayoutPage:
  surface_id: str
  title: str
  summary: str | None
  density: str
  theme: Theme | None
  children: list[LayoutNode] = field(default_factory=list)


class LayoutIRFactory:
  @staticmethod
  def content_from_texts(items: list[PlanTextBlock]) -> list[TextContent]:
    return [TextContent(id=item.id or 'text', kind='text', text=item.text, usage_hint=item.usage_hint) for item in items]

  @staticmethod
  def content_from_facts(items: list[PlanFact]) -> list[FactContent]:
    return [FactContent(id=item.id or 'fact', kind='fact', label=item.label, value=item.value) for item in items]

  @staticmethod
  def content_from_actions(items: list[PlanAction]) -> list[ActionContent]:
    return [
        ActionContent(id=item.id or 'action', kind='action', label=item.label, action_name=item.action_name or 'action', primary=item.primary)
        for item in items
    ]

  @staticmethod
  def content_from_inputs(items: list[PlanInput]) -> list[InputContent]:
    return [
        InputContent(
            id=item.id or 'input',
            kind='input',
            component=item.component,
            label=item.label,
            path=item.path,
            value=item.value,
            text_field_type=item.text_field_type,
            min_value=item.min_value,
            max_value=item.max_value,
            options=item.options,
            enable_date=item.enable_date,
            enable_time=item.enable_time,
        )
        for item in items
    ]

  @staticmethod
  def content_from_list_items(items: list[PlanListItem]) -> list[ListItemContent]:
    return [ListItemContent(id=item.id or 'list_item', kind='list_item', title=item.title, detail=item.detail) for item in items]
