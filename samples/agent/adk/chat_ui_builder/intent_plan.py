from __future__ import annotations

import re
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, TypeAdapter, model_validator

from models import ChoiceOption, FlowDiagramEdge, Theme


def slugify(value: str, fallback: str) -> str:
  normalized = re.sub(r'[^a-z0-9]+', '_', value.lower()).strip('_')
  return normalized or fallback


class PlanTextBlock(BaseModel):
  id: str | None = None
  text: str
  usage_hint: Literal['h1', 'h2', 'h3', 'body', 'caption'] = 'body'


class PlanFact(BaseModel):
  id: str | None = None
  label: str
  value: str


class PlanListItem(BaseModel):
  id: str | None = None
  title: str
  detail: str | None = None


class PlanAction(BaseModel):
  id: str | None = None
  label: str
  action_name: str | None = None
  primary: bool = False

  @model_validator(mode='after')
  def ensure_action_name(self) -> 'PlanAction':
    if not self.action_name:
      self.action_name = slugify(self.label, 'action')
    if not self.id:
      suffix = 'primary_action' if self.primary else 'action'
      self.id = f'{slugify(self.label, suffix)}_{suffix}'
    return self


class PlanInput(BaseModel):
  id: str | None = None
  component: Literal['TextField', 'CheckBox', 'Slider', 'MultipleChoice', 'DateTimeInput']
  label: str
  path: str
  value: str | bool | float | int | list[str] | None = None
  text_field_type: Literal['shortText', 'longText', 'number', 'date', 'obscured'] | None = None
  min_value: float | None = None
  max_value: float | None = None
  options: list[ChoiceOption] | None = None
  enable_date: bool | None = None
  enable_time: bool | None = None


class PlanFlow(BaseModel):
  title: str
  nodes: list['PlanFlowNode']
  edges: list[FlowDiagramEdge]


class PlanFlowNode(BaseModel):
  id: str
  label: str
  column: int
  lane: int = 0
  kind: Literal['start', 'process', 'decision', 'end', 'action', 'task', 'terminal'] = 'process'

  @model_validator(mode='after')
  def normalize_kind(self) -> 'PlanFlowNode':
    if self.kind in {'action', 'task'}:
      self.kind = 'process'
    elif self.kind == 'terminal':
      self.kind = 'end'
    return self


class SectionIntent(BaseModel):
  model_config = ConfigDict(extra='forbid')

  id: str | None = None
  role: Literal['hero', 'summary', 'details', 'workflow', 'actions', 'form', 'list', 'insights', 'supporting'] = 'details'
  importance: Literal['high', 'medium', 'low'] = 'medium'
  content_type: Literal['summary', 'facts', 'list', 'flow', 'actions', 'form', 'mixed'] = 'mixed'
  interaction_priority: Literal['high', 'medium', 'low'] = 'medium'
  title: str | None = None
  summary: str | None = None
  texts: list[PlanTextBlock] = Field(default_factory=list)
  facts: list[PlanFact] = Field(default_factory=list)
  list_items: list[PlanListItem] = Field(default_factory=list)
  inputs: list[PlanInput] = Field(default_factory=list)
  actions: list[PlanAction] = Field(default_factory=list)
  flow: PlanFlow | None = None
  children: list['SectionIntent'] = Field(default_factory=list)

  @model_validator(mode='after')
  def ensure_defaults(self) -> 'SectionIntent':
    if not self.id:
      base = self.title or self.role
      self.id = f'{slugify(base, self.role)}_section'
    return self


SectionIntent.model_rebuild()


class IntentPlan(BaseModel):
  model_config = ConfigDict(extra='forbid')

  surface_id: str = 'main'
  page_kind: Literal['overview', 'dashboard', 'approval_workflow', 'form', 'detail', 'workflow', 'result'] = 'overview'
  emphasis: Literal['balanced', 'action-first', 'analytics-first', 'content-first'] = 'balanced'
  density: Literal['comfortable', 'compact'] = 'comfortable'
  title: str
  summary: str | None = None
  layout_hint: Literal['auto', 'single_column', 'two_column', 'hero_plus_two_column', 'hero_plus_action_panel'] = 'auto'
  sections: list[SectionIntent] = Field(default_factory=list)
  primary_action: PlanAction | None = None
  secondary_actions: list[PlanAction] = Field(default_factory=list)
  theme: Theme | None = None

  @model_validator(mode='after')
  def ensure_unique_sections(self) -> 'IntentPlan':
    seen: set[str] = set()
    for section in self.sections:
      if section.id in seen:
        raise ValueError(f'duplicate section id: {section.id}')
      seen.add(section.id)
    return self


INTENT_PLAN_ADAPTER = TypeAdapter(IntentPlan)
