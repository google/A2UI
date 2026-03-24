from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Callable, Literal

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
    FinalizeDelta,
    InitPlanDelta,
    InitSurfaceDelta,
)
from region_archetypes import ActionsMode, RegionArchetypeRegistry, RegionBuildContext, WidthBehavior

logger = logging.getLogger(__name__)

BUCKET_ORDER = {
    'hero_bucket': 10,
    'summary_bucket': 20,
    'details_bucket': 30,
    'workflow_bucket': 40,
    'form_bucket': 50,
    'list_bucket': 60,
    'supporting_bucket': 70,
    'actions_bucket': 80,
    'layout_split_row': 90,
}

ROLE_DEFAULT_WIDTH: dict[str, WidthBehavior] = {
    'hero': 'readable',
    'summary': 'readable',
    'details': 'readable',
    'workflow': 'full',
    'form': 'full',
    'list': 'full',
    'insights': 'card_grid_item',
    'supporting': 'compact',
    'actions': 'compact',
}


@dataclass
class PendingRegionDelta:
  slot_name: str
  delta_builder: Callable[[str], object]


@dataclass
class RegionBinding:
  region_id: str
  role: str
  section_id: str
  archetype: str
  importance: str
  slot_parents: dict[str, str] = field(default_factory=dict)

  def parent_for(self, slot_name: str) -> str:
    return self.slot_parents.get(slot_name, self.slot_parents.get('text', self.section_id))


@dataclass
class LayoutRecipe:
  root_parent: str
  main_parent: str
  side_parent: str
  footer_parent: str
  role_slots: dict[str, str]
  role_width: dict[str, WidthBehavior]
  side_behavior: Literal['normal', 'narrow']


class SkeletonCompiler:
  def __init__(self) -> None:
    self.frame_compiler = FrameCompiler()
    self.archetypes = RegionArchetypeRegistry()
    self.initialized = False
    self.layout_hint = 'single_column'
    self.page_kind = 'overview'
    self.emphasis = 'balanced'
    self.role_slots: dict[str, str] = {}
    self.role_width: dict[str, WidthBehavior] = {}
    self.side_behavior: Literal['normal', 'narrow'] = 'normal'
    self.regions: dict[str, RegionBinding] = {}
    self.pending_region_deltas: dict[str, list[PendingRegionDelta]] = {}

  def apply(self, delta: object) -> list[A2UIFrame]:
    payload = delta.model_dump() if hasattr(delta, 'model_dump') else delta
    logger.info('Compiling skeleton delta type=%s payload=%s', type(delta).__name__, payload)
    if isinstance(delta, InitPlanDelta):
      return self._init_plan(delta)
    if isinstance(delta, AddRegionDelta):
      return self._add_region(delta)
    if isinstance(delta, AddRegionTextDelta):
      return self._apply_region_delta(
          delta.region_id,
          'text',
          lambda parent_id: AddTextDelta(
              event='add_text',
              id=delta.id,
              parent_id=parent_id,
              text=delta.text,
              usage_hint=delta.usage_hint,
          ),
      )
    if isinstance(delta, AddRegionFactDelta):
      return self._apply_region_delta(
          delta.region_id,
          'fact',
          lambda parent_id: AddKeyValueDelta(
              event='add_key_value',
              id=delta.id,
              parent_id=parent_id,
              label=delta.label,
              value=delta.value,
          ),
      )
    if isinstance(delta, AddRegionImageDelta):
      return self._apply_region_delta(
          delta.region_id,
          'image',
          lambda parent_id: AddImageDelta(
              event='add_image',
              id=delta.id,
              parent_id=parent_id,
              url=delta.url,
              usage_hint=delta.usage_hint,
          ),
      )
    if isinstance(delta, AddRegionActionDelta):
      slot_name = 'action_primary' if delta.primary else 'action_secondary'
      return self._apply_region_delta(
          delta.region_id,
          slot_name,
          lambda parent_id: AddButtonDelta(
              event='add_button',
              id=delta.id,
              parent_id=parent_id,
              label=delta.label,
              action_name=delta.action_name,
              primary=delta.primary,
          ),
      )
    if isinstance(delta, AddRegionInputDelta):
      return self._apply_region_delta(
          delta.region_id,
          'input',
          lambda parent_id: AddInputDelta(
              event='add_input',
              id=delta.id,
              parent_id=parent_id,
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
          ),
      )
    if isinstance(delta, AddRegionDividerDelta):
      return self._apply_region_delta(
          delta.region_id,
          'divider',
          lambda parent_id: AddDividerDelta(
              event='add_divider',
              id=delta.id,
              parent_id=parent_id,
          ),
      )
    if isinstance(delta, AppendRegionListItemDelta):
      return self._apply_region_delta(
          delta.region_id,
          'list_item',
          lambda parent_id: AppendListItemDelta(
              event='append_list_item',
              id=delta.id,
              parent_id=parent_id,
              title=delta.title,
              detail=delta.detail,
          ),
      )
    if isinstance(delta, AddRegionFlowDiagramDelta):
      return self._apply_region_delta(
          delta.region_id,
          'flow',
          lambda parent_id: AddFlowDiagramDelta(
              event='add_flow_diagram',
              id=delta.id,
              parent_id=parent_id,
              title=delta.title,
              nodes=delta.nodes,
              edges=delta.edges,
          ),
      )
    if isinstance(delta, FinalizeDelta):
      return self._finalize()
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
    self.page_kind = delta.page_kind
    self.emphasis = delta.emphasis
    self.role_slots = {}
    self.role_width = {}
    self.side_behavior = 'normal'
    self.regions = {}
    self.pending_region_deltas = {}

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
    recipe = self._layout_recipe()
    frames: list[A2UIFrame] = []

    if self.layout_hint != 'single_column':
      row_id = 'layout_split_row'
      main_lane_id = 'layout_main_lane'
      side_lane_id = 'layout_side_lane'
      main_content_id = 'layout_main_content'
      side_rail_id = 'layout_side_rail'
      main_footer_id = 'layout_main_footer'
      frames.extend(
          self._apply_low_level(
              AddSectionDelta(
                  event='add_section',
                  id=row_id,
                  parent_id='root',
                  layout='Row',
                  order=self._bucket_order(row_id),
              )
          )
      )
      frames.extend(self._apply_low_level(AddSectionDelta(event='add_section', id=main_lane_id, parent_id=row_id, layout='Column')))
      frames.extend(self._apply_low_level(AddSectionDelta(event='add_section', id=side_lane_id, parent_id=row_id, layout='Column')))
      frames.extend(
          self._apply_low_level(
              AddSectionDelta(event='add_section', id=main_content_id, parent_id=main_lane_id, layout='Column', order=10)
          )
      )
      frames.extend(
          self._apply_low_level(
              AddSectionDelta(event='add_section', id=main_footer_id, parent_id=main_lane_id, layout='Column', order=20)
          )
      )
      frames.extend(self._apply_low_level(AddSectionDelta(event='add_section', id=side_rail_id, parent_id=side_lane_id, layout='Column')))

    frames.extend(self._build_role_buckets(recipe))
    self.role_slots = recipe.role_slots
    self.role_width = recipe.role_width
    self.side_behavior = recipe.side_behavior
    logger.info(
        'Initialized layout scaffold=%s role_slots=%s role_width=%s side_behavior=%s',
        self.layout_hint,
        self.role_slots,
        self.role_width,
        self.side_behavior,
    )
    return frames

  def _slot_for_role(self, role: str) -> str:
    return self.role_slots.get(role, 'root')

  def _layout_recipe(self) -> LayoutRecipe:
    role_slots = {
        'hero': 'hero_bucket',
        'summary': 'summary_bucket',
        'details': 'details_bucket',
        'workflow': 'workflow_bucket',
        'form': 'form_bucket',
        'list': 'list_bucket',
        'insights': 'summary_bucket',
        'supporting': 'supporting_bucket',
        'actions': 'actions_bucket',
    }
    role_width = dict(ROLE_DEFAULT_WIDTH)
    side_behavior: Literal['normal', 'narrow'] = 'normal'
    root_parent = 'root'
    main_parent = 'root'
    side_parent = 'root'
    footer_parent = main_parent

    if self.layout_hint != 'single_column':
      main_parent = 'layout_main_content'
      side_parent = 'layout_side_rail'
      footer_parent = 'layout_main_footer'
      root_parent = 'root' if self.layout_hint.startswith('hero_plus') else main_parent
      side_behavior = 'narrow'

    if self.layout_hint == 'hero_plus_two_column' and self.page_kind == 'dashboard':
      role_width.update(
          {
              'summary': 'card_grid_item',
              'insights': 'card_grid_item',
              'supporting': 'card_grid_item',
              'actions': 'compact',
          }
      )

    if self.page_kind in {'dashboard', 'overview'} and self.emphasis == 'analytics-first':
      role_width.update({'summary': 'card_grid_item', 'insights': 'card_grid_item'})

    if self.emphasis == 'content-first':
      role_width.update({'details': 'full', 'hero': 'readable'})
      if self.layout_hint != 'single_column':
        side_parent = main_parent
        side_behavior = 'normal'

    if self.emphasis == 'action-first':
      role_width.update({'actions': 'compact'})
      if self.page_kind == 'form':
        role_slots['actions'] = 'actions_footer_bucket'
        side_parent = main_parent if self.layout_hint == 'single_column' else side_parent

    if self.page_kind == 'workflow':
      role_width['workflow'] = 'full'

    return LayoutRecipe(
        root_parent=root_parent,
        main_parent=main_parent,
        side_parent=side_parent,
        footer_parent=footer_parent,
        role_slots=role_slots,
        role_width=role_width,
        side_behavior=side_behavior,
    )

  def _build_role_buckets(self, recipe: LayoutRecipe) -> list[A2UIFrame]:
    bucket_parents = {
        'hero_bucket': recipe.root_parent,
        'summary_bucket': recipe.main_parent,
        'details_bucket': recipe.main_parent,
        'workflow_bucket': recipe.main_parent,
        'form_bucket': recipe.main_parent,
        'list_bucket': recipe.main_parent,
        'supporting_bucket': recipe.side_parent,
        'actions_bucket': recipe.side_parent,
    }
    frames: list[A2UIFrame] = []
    for bucket_id, parent_id in bucket_parents.items():
      frames.extend(
          self._apply_low_level(
              AddSectionDelta(
                  event='add_section',
                  id=bucket_id,
                  parent_id=parent_id,
                  layout='Column',
                  order=self._bucket_order(bucket_id),
              )
          )
      )
    if recipe.role_slots.get('actions') == 'actions_footer_bucket':
      frames.extend(
          self._apply_low_level(
              AddSectionDelta(
                  event='add_section',
                  id='actions_footer_bucket',
                  parent_id=recipe.footer_parent,
                  layout='Column',
                  order=85,
              )
          )
      )
    return frames

  def _bucket_order(self, bucket_id: str) -> int:
    return BUCKET_ORDER.get(bucket_id, 1000)

  def _width_for_role(self, role: str) -> WidthBehavior:
    return self.role_width.get(role, ROLE_DEFAULT_WIDTH.get(role, 'readable'))

  def _actions_mode_for(self, delta: AddRegionDelta) -> ActionsMode:
    if delta.role == 'actions' and self.page_kind == 'form' and self.emphasis == 'action-first':
      return 'footer_actions'
    if delta.role == 'actions' and self.side_behavior == 'narrow':
      return 'primary_plus_overflow'
    if delta.role in {'form', 'workflow', 'details', 'hero'} and self.side_behavior == 'narrow':
      if self._slot_for_role(delta.role) in {'supporting_bucket', 'actions_bucket'}:
        return 'stacked_actions'
    if delta.role == 'form' and self.emphasis == 'action-first':
      return 'footer_actions'
    return 'inline_actions'

  def _add_region(self, delta: AddRegionDelta) -> list[A2UIFrame]:
    if not self.initialized:
      raise ValueError('init_plan must be emitted before add_region')
    if delta.id in self.regions:
      raise ValueError(f'Duplicate region id: {delta.id}')

    builder = self.archetypes.builder_for(delta.role)
    context = RegionBuildContext(
        slot_parent=self._slot_for_role(delta.role),
        delta=delta,
        page_kind=self.page_kind,
        emphasis=self.emphasis,
        layout_hint=self.layout_hint,
        width_behavior=self._width_for_role(delta.role),
        actions_mode=self._actions_mode_for(delta),
    )
    result = builder.build(context, self._apply_low_level)
    self.regions[delta.id] = RegionBinding(
        region_id=delta.id,
        role=delta.role,
        section_id=delta.id,
        archetype=result.archetype,
        importance=delta.importance,
        slot_parents=result.slot_parents,
    )
    frames = list(result.frames)
    frames.extend(self._flush_pending_region_deltas(delta.id))
    return frames

  def _apply_region_delta(
      self,
      region_id: str,
      slot_name: str,
      delta_builder: Callable[[str], object],
  ) -> list[A2UIFrame]:
    if region_id not in self.regions:
      logger.info('Region %s not ready; queueing %s', region_id, slot_name)
      self.pending_region_deltas.setdefault(region_id, []).append(
          PendingRegionDelta(slot_name=slot_name, delta_builder=delta_builder)
      )
      return []
    binding = self.regions[region_id]
    return self._apply_low_level(delta_builder(binding.parent_for(slot_name)))

  def _flush_pending_region_deltas(self, region_id: str) -> list[A2UIFrame]:
    binding = self.regions[region_id]
    queued = self.pending_region_deltas.pop(region_id, [])
    frames: list[A2UIFrame] = []
    for item in queued:
      frames.extend(self._apply_low_level(item.delta_builder(binding.parent_for(item.slot_name))))
    return frames

  def _finalize(self) -> list[A2UIFrame]:
    frames: list[A2UIFrame] = []
    orphan_region_ids = list(self.pending_region_deltas.keys())
    for region_id in orphan_region_ids:
      frames.extend(
          self._add_region(
              AddRegionDelta(
                  event='add_region',
                  id=region_id,
                  role='details',
                  title='补建内容区',
                  description='模型在 region 声明前先发送了条目，后端已自动兜底创建。',
              )
          )
      )
    return frames
