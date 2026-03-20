from __future__ import annotations

import logging
from dataclasses import dataclass

from compiler import FrameCompiler
from models import (
    A2UIFrame,
    AddButtonDelta,
    AddDividerDelta,
    AddFlowDiagramDelta,
    AddImageDelta,
    AddInputDelta,
    AddKeyValueDelta,
    AddRegionActionDelta,
    AddRegionDelta,
    AddRegionDividerDelta,
    AddRegionFactDelta,
    AddRegionFlowDiagramDelta,
    AddRegionImageDelta,
    AddRegionInputDelta,
    AddRegionTextDelta,
    AddSectionDelta,
    AddTextDelta,
    AppendListItemDelta,
    AppendRegionListItemDelta,
    InitPlanDelta,
    InitSurfaceDelta,
)

logger = logging.getLogger(__name__)


@dataclass
class RegionBinding:
  region_id: str
  role: str
  section_id: str
  content_parent_id: str


class SkeletonCompiler:
  def __init__(self) -> None:
    self.frame_compiler = FrameCompiler()
    self.initialized = False
    self.layout_hint = 'single_column'
    self.role_slots: dict[str, str] = {}
    self.regions: dict[str, RegionBinding] = {}

  def apply(self, delta: object) -> list[A2UIFrame]:
    payload = delta.model_dump() if hasattr(delta, 'model_dump') else delta
    logger.info('Compiling skeleton delta type=%s payload=%s', type(delta).__name__, payload)
    if isinstance(delta, InitPlanDelta):
      return self._init_plan(delta)
    if isinstance(delta, AddRegionDelta):
      return self._add_region(delta)
    if isinstance(delta, AddRegionTextDelta):
      return self._apply_low_level(
          AddTextDelta(
              event='add_text',
              id=delta.id,
              parent_id=self._resolve_region_parent(delta.region_id),
              text=delta.text,
              usage_hint=delta.usage_hint,
          )
      )
    if isinstance(delta, AddRegionFactDelta):
      return self._apply_low_level(
          AddKeyValueDelta(
              event='add_key_value',
              id=delta.id,
              parent_id=self._resolve_region_parent(delta.region_id),
              label=delta.label,
              value=delta.value,
          )
      )
    if isinstance(delta, AddRegionImageDelta):
      return self._apply_low_level(
          AddImageDelta(
              event='add_image',
              id=delta.id,
              parent_id=self._resolve_region_parent(delta.region_id),
              url=delta.url,
              usage_hint=delta.usage_hint,
          )
      )
    if isinstance(delta, AddRegionActionDelta):
      return self._apply_low_level(
          AddButtonDelta(
              event='add_button',
              id=delta.id,
              parent_id=self._resolve_region_parent(delta.region_id),
              label=delta.label,
              action_name=delta.action_name,
              primary=delta.primary,
          )
      )
    if isinstance(delta, AddRegionInputDelta):
      return self._apply_low_level(
          AddInputDelta(
              event='add_input',
              id=delta.id,
              parent_id=self._resolve_region_parent(delta.region_id),
              component=delta.component,
              label=delta.label,
              path=delta.path,
              value=delta.value,
              text_field_type=delta.text_field_type,
              min_value=delta.min_value,
              max_value=delta.max_value,
              options=delta.options,
              enable_date=delta.enable_date,
              enable_time=delta.enable_time,
          )
      )
    if isinstance(delta, AddRegionDividerDelta):
      return self._apply_low_level(
          AddDividerDelta(
              event='add_divider',
              id=delta.id,
              parent_id=self._resolve_region_parent(delta.region_id),
          )
      )
    if isinstance(delta, AppendRegionListItemDelta):
      return self._apply_low_level(
          AppendListItemDelta(
              event='append_list_item',
              id=delta.id,
              parent_id=self._resolve_region_parent(delta.region_id),
              title=delta.title,
              detail=delta.detail,
          )
      )
    if isinstance(delta, AddRegionFlowDiagramDelta):
      return self._apply_low_level(
          AddFlowDiagramDelta(
              event='add_flow_diagram',
              id=delta.id,
              parent_id=self._resolve_region_parent(delta.region_id),
              title=delta.title,
              nodes=delta.nodes,
              edges=delta.edges,
          )
      )
    return []

  def _apply_low_level(self, delta: object) -> list[A2UIFrame]:
    return self.frame_compiler.apply(delta)

  def _resolve_layout(self, delta: InitPlanDelta) -> str:
    if delta.layout_hint != 'auto':
      return delta.layout_hint
    if delta.emphasis == 'action-first' or delta.page_kind == 'approval_workflow':
      return 'hero_plus_action_panel'
    if delta.emphasis == 'analytics-first' or delta.page_kind == 'dashboard':
      return 'hero_plus_two_column'
    if delta.page_kind == 'detail':
      return 'two_column'
    return 'single_column'

  def _init_plan(self, delta: InitPlanDelta) -> list[A2UIFrame]:
    self.initialized = True
    self.layout_hint = self._resolve_layout(delta)
    self.role_slots = {}
    self.regions = {}

    frames = self._apply_low_level(
        InitSurfaceDelta(
            event='init_surface',
            surface_id=delta.surface_id,
            title=delta.title,
            summary=delta.summary,
            theme=delta.theme,
        )
    )
    frames.extend(self._build_layout_scaffold())
    return frames

  def _build_layout_scaffold(self) -> list[A2UIFrame]:
    if self.layout_hint == 'single_column':
      self.role_slots = {
          'hero': 'root',
          'summary': 'root',
          'details': 'root',
          'workflow': 'root',
          'actions': 'root',
          'form': 'root',
          'list': 'root',
          'insights': 'root',
          'supporting': 'root',
      }
      return []

    row_id = 'layout_split_row'
    main_id = 'layout_main_column'
    side_id = 'layout_side_column'
    frames = []
    frames.extend(self._apply_low_level(AddSectionDelta(event='add_section', id=row_id, parent_id='root', layout='Row')))
    frames.extend(self._apply_low_level(AddSectionDelta(event='add_section', id=main_id, parent_id=row_id, layout='Column')))
    frames.extend(self._apply_low_level(AddSectionDelta(event='add_section', id=side_id, parent_id=row_id, layout='Column')))

    hero_slot = 'root' if self.layout_hint.startswith('hero_plus') else main_id
    self.role_slots = {
        'hero': hero_slot,
        'summary': main_id,
        'details': main_id,
        'workflow': main_id,
        'form': main_id,
        'list': main_id,
        'insights': main_id,
        'supporting': side_id if self.layout_hint == 'two_column' else main_id,
        'actions': side_id if self.layout_hint in {'two_column', 'hero_plus_two_column', 'hero_plus_action_panel'} else main_id,
    }
    if self.layout_hint == 'two_column':
      self.role_slots['hero'] = main_id
      self.role_slots['supporting'] = side_id
    elif self.layout_hint == 'hero_plus_two_column':
      self.role_slots['supporting'] = side_id

    logger.info('Initialized layout scaffold=%s role_slots=%s', self.layout_hint, self.role_slots)
    return frames

  def _slot_for_role(self, role: str) -> str:
    return self.role_slots.get(role, 'root')

  def _add_region(self, delta: AddRegionDelta) -> list[A2UIFrame]:
    if not self.initialized:
      raise ValueError('init_plan must be emitted before add_region')
    if delta.id in self.regions:
      raise ValueError(f'Duplicate region id: {delta.id}')

    slot_parent = self._slot_for_role(delta.role)
    section_frames = self._apply_low_level(
        AddSectionDelta(
            event='add_section',
            id=delta.id,
            parent_id=slot_parent,
            layout='Card',
            title=delta.title,
            description=delta.description,
        )
    )
    content_parent_id = delta.id
    frames = list(section_frames)

    if delta.role == 'actions':
      action_row_id = f'{delta.id}_actions_row'
      frames.extend(
          self._apply_low_level(
              AddSectionDelta(
                  event='add_section',
                  id=action_row_id,
                  parent_id=delta.id,
                  layout='Row',
              )
          )
      )
      content_parent_id = action_row_id
    elif delta.role == 'list':
      list_id = f'{delta.id}_list'
      frames.extend(
          self._apply_low_level(
              AddSectionDelta(
                  event='add_section',
                  id=list_id,
                  parent_id=delta.id,
                  layout='List',
              )
          )
      )
      content_parent_id = list_id

    self.regions[delta.id] = RegionBinding(
        region_id=delta.id,
        role=delta.role,
        section_id=delta.id,
        content_parent_id=content_parent_id,
    )
    return frames

  def _resolve_region_parent(self, region_id: str) -> str:
    binding = self.regions.get(region_id)
    if not binding:
      raise ValueError(f'Unknown region id: {region_id}')
    return binding.content_parent_id
