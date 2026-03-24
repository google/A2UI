from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable, Literal

from models import A2UIFrame, AddRegionDelta, AddSectionDelta, AddTextDelta


WidthBehavior = Literal['full', 'readable', 'compact', 'card_grid_item']
ActionsMode = Literal['inline_actions', 'stacked_actions', 'footer_actions', 'primary_plus_overflow']
EmitLowLevel = Callable[[object], list[A2UIFrame]]


@dataclass
class RegionBuildContext:
  slot_parent: str
  delta: AddRegionDelta
  page_kind: str
  emphasis: str
  layout_hint: str
  width_behavior: WidthBehavior
  actions_mode: ActionsMode


@dataclass
class RegionBuildResult:
  archetype: str
  frames: list[A2UIFrame] = field(default_factory=list)
  slot_parents: dict[str, str] = field(default_factory=dict)


@dataclass(frozen=True)
class SlotSpec:
  name: str
  section_id: str
  layout: str
  order: int


class RegionArchetypeBuilder:
  archetype_name = 'details_group'

  def build(self, context: RegionBuildContext, emit: EmitLowLevel) -> RegionBuildResult:
    raise NotImplementedError

  def _panel_layout(self, context: RegionBuildContext) -> str:
    if context.width_behavior == 'card_grid_item':
      return 'Card'
    return 'Column'

  def _base_region(
      self,
      context: RegionBuildContext,
      emit: EmitLowLevel,
      *,
      layout: str = 'Column',
      include_body_slot: bool = True,
      slot_specs: list[SlotSpec] | None = None,
      slot_parents: dict[str, str] | None = None,
  ) -> RegionBuildResult:
    region_id = context.delta.id
    frames = emit(
        AddSectionDelta(
            event='add_section',
            id=region_id,
            parent_id=context.slot_parent,
            layout=layout,
        )
    )

    resolved_slot_parents = {
        'text': region_id,
        'fact': region_id,
        'action_primary': region_id,
        'action_secondary': region_id,
        'input': region_id,
        'image': region_id,
        'list_item': region_id,
        'flow': region_id,
        'divider': region_id,
    }

    content_parent = region_id
    if context.delta.title or context.delta.description:
      header_id = f'{region_id}_header'
      frames.extend(
          emit(
              AddSectionDelta(
                  event='add_section',
                  id=header_id,
                  parent_id=region_id,
                  layout='Column',
                  order=10,
              )
          )
      )
      if context.delta.title:
        frames.extend(
            emit(
                AddTextDelta(
                    event='add_text',
                    id=f'{header_id}_title',
                    parent_id=header_id,
                    text=context.delta.title,
                    usage_hint='h2',
                )
            )
        )
      if context.delta.description:
        frames.extend(
            emit(
                AddTextDelta(
                    event='add_text',
                    id=f'{header_id}_description',
                    parent_id=header_id,
                    text=context.delta.description,
                    usage_hint='body',
                )
            )
        )
      if include_body_slot:
        body_id = f'{region_id}_body'
        frames.extend(
            emit(
                AddSectionDelta(
                    event='add_section',
                    id=body_id,
                    parent_id=region_id,
                    layout='Column',
                    order=20,
                )
            )
        )
        content_parent = body_id
    elif include_body_slot and slot_specs:
      body_id = f'{region_id}_body'
      frames.extend(
          emit(
              AddSectionDelta(
                  event='add_section',
                  id=body_id,
                  parent_id=region_id,
                  layout='Column',
                  order=20,
              )
          )
      )
      content_parent = body_id

    resolved_slot_parents['text'] = content_parent
    resolved_slot_parents['image'] = content_parent
    resolved_slot_parents['divider'] = content_parent

    for spec in slot_specs or []:
      frames.extend(
          emit(
              AddSectionDelta(
                  event='add_section',
                  id=spec.section_id,
                  parent_id=region_id,
                  layout=spec.layout,
                  order=spec.order,
              )
          )
      )
      resolved_slot_parents[spec.name] = spec.section_id

    if slot_parents:
      resolved_slot_parents.update(slot_parents)

    return RegionBuildResult(archetype=self.archetype_name, frames=frames, slot_parents=resolved_slot_parents)


class HeroArchetypeBuilder(RegionArchetypeBuilder):
  archetype_name = 'hero_header'

  def build(self, context: RegionBuildContext, emit: EmitLowLevel) -> RegionBuildResult:
    region_id = context.delta.id
    actions_id = f'{region_id}_hero_actions'
    action_layout = 'Column' if context.actions_mode == 'stacked_actions' else 'Row'
    return self._base_region(
        context,
        emit,
        layout=self._panel_layout(context),
        slot_specs=[
            SlotSpec(name='fact', section_id=f'{region_id}_hero_facts', layout='Row', order=30),
            SlotSpec(name='action_primary', section_id=actions_id, layout=action_layout, order=40),
        ],
        slot_parents={'action_secondary': actions_id},
    )


class SummaryArchetypeBuilder(RegionArchetypeBuilder):
  archetype_name = 'summary_strip'

  def build(self, context: RegionBuildContext, emit: EmitLowLevel) -> RegionBuildResult:
    region_id = context.delta.id
    return self._base_region(
        context,
        emit,
        layout=self._panel_layout(context),
        slot_specs=[SlotSpec(name='fact', section_id=f'{region_id}_summary_facts', layout='Row', order=30)],
    )


class DetailsArchetypeBuilder(RegionArchetypeBuilder):
  archetype_name = 'details_group'

  def build(self, context: RegionBuildContext, emit: EmitLowLevel) -> RegionBuildResult:
    region_id = context.delta.id
    actions_id = f'{region_id}_details_actions'
    layout = 'Card' if context.width_behavior == 'card_grid_item' else 'Column'
    action_layout = 'Column' if context.actions_mode in {'stacked_actions', 'primary_plus_overflow'} else 'Row'
    return self._base_region(
        context,
        emit,
        layout=layout,
        slot_specs=[
            SlotSpec(name='fact', section_id=f'{region_id}_details_facts', layout='Row', order=30),
            SlotSpec(name='action_primary', section_id=actions_id, layout=action_layout, order=40),
        ],
        slot_parents={'action_secondary': actions_id},
    )


class ActionsArchetypeBuilder(RegionArchetypeBuilder):
  archetype_name = 'action_panel'

  def build(self, context: RegionBuildContext, emit: EmitLowLevel) -> RegionBuildResult:
    region_id = context.delta.id
    primary_id = f'{region_id}_actions_primary'
    secondary_id = f'{region_id}_actions_secondary'

    if context.actions_mode == 'primary_plus_overflow':
      return self._base_region(
          context,
          emit,
          layout='Card' if context.width_behavior in {'compact', 'card_grid_item'} else 'Column',
          slot_specs=[
              SlotSpec(name='action_primary', section_id=primary_id, layout='Column', order=30),
              SlotSpec(name='action_secondary', section_id=secondary_id, layout='Column', order=40),
          ],
      )

    action_layout = 'Column' if context.actions_mode in {'stacked_actions', 'footer_actions'} else 'Row'
    actions_id = f'{region_id}_actions'
    return self._base_region(
        context,
        emit,
        layout='Card' if context.width_behavior in {'compact', 'card_grid_item'} else 'Column',
        slot_specs=[SlotSpec(name='action_primary', section_id=actions_id, layout=action_layout, order=30)],
        slot_parents={'action_secondary': actions_id},
    )


class WorkflowArchetypeBuilder(RegionArchetypeBuilder):
  archetype_name = 'workflow_panel'

  def build(self, context: RegionBuildContext, emit: EmitLowLevel) -> RegionBuildResult:
    region_id = context.delta.id
    actions_id = f'{region_id}_workflow_actions'
    action_layout = 'Column' if context.actions_mode == 'stacked_actions' else 'Row'
    return self._base_region(
        context,
        emit,
        layout='Card' if context.width_behavior == 'card_grid_item' else 'Column',
        slot_specs=[
            SlotSpec(name='flow', section_id=f'{region_id}_workflow_flow', layout='Column', order=30),
            SlotSpec(name='action_primary', section_id=actions_id, layout=action_layout, order=40),
        ],
        slot_parents={'action_secondary': actions_id},
    )


class SupportingArchetypeBuilder(RegionArchetypeBuilder):
  archetype_name = 'supporting_block'

  def build(self, context: RegionBuildContext, emit: EmitLowLevel) -> RegionBuildResult:
    return self._base_region(
        context,
        emit,
        layout='Card' if context.width_behavior in {'compact', 'card_grid_item'} else 'Column',
    )


class ListArchetypeBuilder(RegionArchetypeBuilder):
  archetype_name = 'list_panel'

  def build(self, context: RegionBuildContext, emit: EmitLowLevel) -> RegionBuildResult:
    region_id = context.delta.id
    return self._base_region(
        context,
        emit,
        layout='Card' if context.width_behavior == 'card_grid_item' else 'Column',
        slot_specs=[SlotSpec(name='list_item', section_id=f'{region_id}_list_items', layout='List', order=30)],
    )


class FormArchetypeBuilder(RegionArchetypeBuilder):
  archetype_name = 'form_panel'

  def build(self, context: RegionBuildContext, emit: EmitLowLevel) -> RegionBuildResult:
    region_id = context.delta.id
    actions_id = f'{region_id}_form_actions'
    action_layout = 'Column' if context.actions_mode in {'stacked_actions', 'footer_actions'} else 'Row'
    return self._base_region(
        context,
        emit,
        layout='Card' if context.width_behavior == 'card_grid_item' else 'Column',
        slot_specs=[
            SlotSpec(name='input', section_id=f'{region_id}_form_inputs', layout='Column', order=30),
            SlotSpec(name='action_primary', section_id=actions_id, layout=action_layout, order=40),
        ],
        slot_parents={'action_secondary': actions_id},
    )


class RegionArchetypeRegistry:
  def __init__(self) -> None:
    details = DetailsArchetypeBuilder()
    summary = SummaryArchetypeBuilder()
    self._builders: dict[str, RegionArchetypeBuilder] = {
        'hero': HeroArchetypeBuilder(),
        'summary': summary,
        'details': details,
        'workflow': WorkflowArchetypeBuilder(),
        'actions': ActionsArchetypeBuilder(),
        'form': FormArchetypeBuilder(),
        'list': ListArchetypeBuilder(),
        'insights': summary,
        'supporting': SupportingArchetypeBuilder(),
    }
    self._default_builder = details

  def builder_for(self, role: str) -> RegionArchetypeBuilder:
    return self._builders.get(role, self._default_builder)
