from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable

from models import A2UIFrame, AddRegionDelta, AddSectionDelta


EmitLowLevel = Callable[[object], list[A2UIFrame]]


@dataclass
class RegionBuildContext:
  slot_parent: str
  delta: AddRegionDelta
  page_kind: str
  emphasis: str
  layout_hint: str


@dataclass
class RegionBuildResult:
  archetype: str
  frames: list[A2UIFrame] = field(default_factory=list)
  slot_parents: dict[str, str] = field(default_factory=dict)


class RegionArchetypeBuilder:
  archetype_name = 'details_group'

  def build(self, context: RegionBuildContext, emit: EmitLowLevel) -> RegionBuildResult:
    raise NotImplementedError

  def _base_region(
      self,
      context: RegionBuildContext,
      emit: EmitLowLevel,
      *,
      layout: str = 'Column',
      extra_slots: dict[str, tuple[str, str]] | None = None,
      slot_parents: dict[str, str] | None = None,
  ) -> RegionBuildResult:
    region_id = context.delta.id
    frames = emit(
        AddSectionDelta(
            event='add_section',
            id=region_id,
            parent_id=context.slot_parent,
            layout=layout,
            title=context.delta.title,
            description=context.delta.description,
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
    if extra_slots:
      for slot_name, (slot_id, slot_layout) in extra_slots.items():
        frames.extend(emit(AddSectionDelta(event='add_section', id=slot_id, parent_id=region_id, layout=slot_layout)))
        resolved_slot_parents[slot_name] = slot_id
    if slot_parents:
      resolved_slot_parents.update(slot_parents)
    return RegionBuildResult(archetype=self.archetype_name, frames=frames, slot_parents=resolved_slot_parents)


class HeroArchetypeBuilder(RegionArchetypeBuilder):
  archetype_name = 'hero_header'

  def build(self, context: RegionBuildContext, emit: EmitLowLevel) -> RegionBuildResult:
    region_id = context.delta.id
    return self._base_region(
        context,
        emit,
        extra_slots={
            'fact': (f'{region_id}_hero_facts', 'Row'),
            'action_primary': (f'{region_id}_hero_actions', 'Row'),
        },
        slot_parents={'action_secondary': f'{region_id}_hero_actions'},
    )


class SummaryArchetypeBuilder(RegionArchetypeBuilder):
  archetype_name = 'summary_strip'

  def build(self, context: RegionBuildContext, emit: EmitLowLevel) -> RegionBuildResult:
    region_id = context.delta.id
    return self._base_region(
        context,
        emit,
        extra_slots={'fact': (f'{region_id}_summary_facts', 'Row')},
    )


class DetailsArchetypeBuilder(RegionArchetypeBuilder):
  archetype_name = 'details_group'

  def build(self, context: RegionBuildContext, emit: EmitLowLevel) -> RegionBuildResult:
    region_id = context.delta.id
    layout = 'Card' if context.delta.importance == 'high' and context.emphasis != 'content-first' else 'Column'
    return self._base_region(
        context,
        emit,
        layout=layout,
        extra_slots={
            'fact': (f'{region_id}_details_facts', 'Row'),
            'action_primary': (f'{region_id}_details_actions', 'Row'),
        },
        slot_parents={'action_secondary': f'{region_id}_details_actions'},
    )


class ActionsArchetypeBuilder(RegionArchetypeBuilder):
  archetype_name = 'action_panel'

  def build(self, context: RegionBuildContext, emit: EmitLowLevel) -> RegionBuildResult:
    region_id = context.delta.id
    actions_id = f'{region_id}_actions'
    return self._base_region(
        context,
        emit,
        extra_slots={'action_primary': (actions_id, 'Row')},
        slot_parents={'action_secondary': actions_id},
    )


class WorkflowArchetypeBuilder(RegionArchetypeBuilder):
  archetype_name = 'workflow_panel'

  def build(self, context: RegionBuildContext, emit: EmitLowLevel) -> RegionBuildResult:
    region_id = context.delta.id
    return self._base_region(
        context,
        emit,
        extra_slots={
            'flow': (f'{region_id}_workflow_flow', 'Column'),
            'action_primary': (f'{region_id}_workflow_actions', 'Row'),
        },
        slot_parents={'action_secondary': f'{region_id}_workflow_actions'},
    )


class SupportingArchetypeBuilder(RegionArchetypeBuilder):
  archetype_name = 'supporting_block'

  def build(self, context: RegionBuildContext, emit: EmitLowLevel) -> RegionBuildResult:
    return self._base_region(context, emit)


class ListArchetypeBuilder(RegionArchetypeBuilder):
  archetype_name = 'list_panel'

  def build(self, context: RegionBuildContext, emit: EmitLowLevel) -> RegionBuildResult:
    region_id = context.delta.id
    return self._base_region(
        context,
        emit,
        extra_slots={'list_item': (f'{region_id}_list_items', 'List')},
    )


class FormArchetypeBuilder(RegionArchetypeBuilder):
  archetype_name = 'form_panel'

  def build(self, context: RegionBuildContext, emit: EmitLowLevel) -> RegionBuildResult:
    region_id = context.delta.id
    layout = 'Card' if context.delta.importance == 'high' and context.emphasis != 'action-first' else 'Column'
    return self._base_region(
        context,
        emit,
        layout=layout,
        extra_slots={
            'input': (f'{region_id}_form_inputs', 'Column'),
            'action_primary': (f'{region_id}_form_actions', 'Row'),
        },
        slot_parents={'action_secondary': f'{region_id}_form_actions'},
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
