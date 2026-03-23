from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable

from models import A2UIFrame, AddDividerDelta, AddRegionDelta, AddSectionDelta


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


class HeroArchetypeBuilder(RegionArchetypeBuilder):
  archetype_name = 'hero_header'

  def build(self, context: RegionBuildContext, emit: EmitLowLevel) -> RegionBuildResult:
    region_id = context.delta.id
    body_id = f'{region_id}_hero_body'
    facts_id = f'{region_id}_hero_facts'
    content_id = f'{region_id}_hero_content'
    actions_id = f'{region_id}_hero_actions'
    frames = []
    frames.extend(
        emit(
            AddSectionDelta(
                event='add_section',
                id=region_id,
                parent_id=context.slot_parent,
                layout='Column',
                title=context.delta.title,
                description=context.delta.description,
            )
        )
    )
    frames.extend(emit(AddSectionDelta(event='add_section', id=body_id, parent_id=region_id, layout='Column')))
    frames.extend(emit(AddSectionDelta(event='add_section', id=facts_id, parent_id=body_id, layout='Row')))
    frames.extend(emit(AddSectionDelta(event='add_section', id=content_id, parent_id=body_id, layout='Column')))
    frames.extend(emit(AddSectionDelta(event='add_section', id=actions_id, parent_id=body_id, layout='Row')))
    return RegionBuildResult(
        archetype=self.archetype_name,
        frames=frames,
        slot_parents={
            'text': content_id,
            'fact': facts_id,
            'action_primary': actions_id,
            'action_secondary': actions_id,
            'input': content_id,
            'image': content_id,
            'list_item': content_id,
            'flow': content_id,
            'divider': body_id,
        },
    )


class SummaryArchetypeBuilder(RegionArchetypeBuilder):
  archetype_name = 'summary_strip'

  def build(self, context: RegionBuildContext, emit: EmitLowLevel) -> RegionBuildResult:
    region_id = context.delta.id
    body_id = f'{region_id}_summary_body'
    facts_id = f'{region_id}_summary_facts'
    notes_id = f'{region_id}_summary_notes'
    frames = []
    frames.extend(
        emit(
            AddSectionDelta(
                event='add_section',
                id=region_id,
                parent_id=context.slot_parent,
                layout='Column',
                title=context.delta.title,
                description=context.delta.description,
            )
        )
    )
    frames.extend(emit(AddSectionDelta(event='add_section', id=body_id, parent_id=region_id, layout='Column')))
    frames.extend(emit(AddSectionDelta(event='add_section', id=facts_id, parent_id=body_id, layout='Row')))
    frames.extend(emit(AddSectionDelta(event='add_section', id=notes_id, parent_id=body_id, layout='Column')))
    return RegionBuildResult(
        archetype=self.archetype_name,
        frames=frames,
        slot_parents={
            'text': notes_id,
            'fact': facts_id,
            'action_primary': notes_id,
            'action_secondary': notes_id,
            'input': notes_id,
            'image': notes_id,
            'list_item': notes_id,
            'flow': notes_id,
            'divider': body_id,
        },
    )


class DetailsArchetypeBuilder(RegionArchetypeBuilder):
  archetype_name = 'details_group'

  def build(self, context: RegionBuildContext, emit: EmitLowLevel) -> RegionBuildResult:
    region_id = context.delta.id
    body_id = f'{region_id}_details_body'
    facts_id = f'{region_id}_details_facts'
    actions_id = f'{region_id}_details_actions'
    frames = []
    frames.extend(
        emit(
            AddSectionDelta(
                event='add_section',
                id=region_id,
                parent_id=context.slot_parent,
                layout='Card',
                title=context.delta.title,
                description=context.delta.description,
            )
        )
    )
    frames.extend(emit(AddSectionDelta(event='add_section', id=body_id, parent_id=region_id, layout='Column')))
    frames.extend(emit(AddSectionDelta(event='add_section', id=facts_id, parent_id=body_id, layout='Column')))
    frames.extend(emit(AddSectionDelta(event='add_section', id=actions_id, parent_id=body_id, layout='Row')))
    return RegionBuildResult(
        archetype=self.archetype_name,
        frames=frames,
        slot_parents={
            'text': body_id,
            'fact': facts_id,
            'action_primary': actions_id,
            'action_secondary': actions_id,
            'input': body_id,
            'image': body_id,
            'list_item': body_id,
            'flow': body_id,
            'divider': body_id,
        },
    )


class ActionsArchetypeBuilder(RegionArchetypeBuilder):
  archetype_name = 'action_panel'

  def build(self, context: RegionBuildContext, emit: EmitLowLevel) -> RegionBuildResult:
    region_id = context.delta.id
    primary_id = f'{region_id}_primary_actions'
    secondary_id = f'{region_id}_secondary_actions'
    notes_id = f'{region_id}_action_notes'
    frames = []
    layout = 'Card' if context.emphasis == 'action-first' or context.delta.importance == 'high' else 'Column'
    frames.extend(
        emit(
            AddSectionDelta(
                event='add_section',
                id=region_id,
                parent_id=context.slot_parent,
                layout=layout,
                title=context.delta.title,
                description=context.delta.description,
            )
        )
    )
    frames.extend(emit(AddSectionDelta(event='add_section', id=primary_id, parent_id=region_id, layout='Row')))
    frames.extend(emit(AddDividerDelta(event='add_divider', id=f'{region_id}_action_divider', parent_id=region_id)))
    frames.extend(emit(AddSectionDelta(event='add_section', id=secondary_id, parent_id=region_id, layout='Row')))
    frames.extend(emit(AddSectionDelta(event='add_section', id=notes_id, parent_id=region_id, layout='Column')))
    return RegionBuildResult(
        archetype=self.archetype_name,
        frames=frames,
        slot_parents={
            'text': notes_id,
            'fact': notes_id,
            'action_primary': primary_id,
            'action_secondary': secondary_id,
            'input': notes_id,
            'image': notes_id,
            'list_item': notes_id,
            'flow': notes_id,
            'divider': notes_id,
        },
    )


class WorkflowArchetypeBuilder(RegionArchetypeBuilder):
  archetype_name = 'workflow_panel'

  def build(self, context: RegionBuildContext, emit: EmitLowLevel) -> RegionBuildResult:
    region_id = context.delta.id
    intro_id = f'{region_id}_workflow_intro'
    flow_id = f'{region_id}_workflow_flow'
    actions_id = f'{region_id}_workflow_actions'
    frames = []
    frames.extend(
        emit(
            AddSectionDelta(
                event='add_section',
                id=region_id,
                parent_id=context.slot_parent,
                layout='Card',
                title=context.delta.title,
                description=context.delta.description,
            )
        )
    )
    frames.extend(emit(AddSectionDelta(event='add_section', id=intro_id, parent_id=region_id, layout='Column')))
    frames.extend(emit(AddDividerDelta(event='add_divider', id=f'{region_id}_workflow_divider', parent_id=region_id)))
    frames.extend(emit(AddSectionDelta(event='add_section', id=flow_id, parent_id=region_id, layout='Column')))
    frames.extend(emit(AddSectionDelta(event='add_section', id=actions_id, parent_id=region_id, layout='Row')))
    return RegionBuildResult(
        archetype=self.archetype_name,
        frames=frames,
        slot_parents={
            'text': intro_id,
            'fact': intro_id,
            'action_primary': actions_id,
            'action_secondary': actions_id,
            'input': intro_id,
            'image': intro_id,
            'list_item': intro_id,
            'flow': flow_id,
            'divider': intro_id,
        },
    )


class SupportingArchetypeBuilder(RegionArchetypeBuilder):
  archetype_name = 'supporting_block'

  def build(self, context: RegionBuildContext, emit: EmitLowLevel) -> RegionBuildResult:
    region_id = context.delta.id
    body_id = f'{region_id}_supporting_body'
    frames = []
    layout = 'Column' if context.delta.importance == 'low' else 'Card'
    frames.extend(
        emit(
            AddSectionDelta(
                event='add_section',
                id=region_id,
                parent_id=context.slot_parent,
                layout=layout,
                title=context.delta.title,
                description=context.delta.description,
            )
        )
    )
    frames.extend(emit(AddSectionDelta(event='add_section', id=body_id, parent_id=region_id, layout='Column')))
    return RegionBuildResult(
        archetype=self.archetype_name,
        frames=frames,
        slot_parents={
            'text': body_id,
            'fact': body_id,
            'action_primary': body_id,
            'action_secondary': body_id,
            'input': body_id,
            'image': body_id,
            'list_item': body_id,
            'flow': body_id,
            'divider': body_id,
        },
    )


class ListArchetypeBuilder(RegionArchetypeBuilder):
  archetype_name = 'list_panel'

  def build(self, context: RegionBuildContext, emit: EmitLowLevel) -> RegionBuildResult:
    region_id = context.delta.id
    body_id = f'{region_id}_list_body'
    list_id = f'{region_id}_list_items'
    frames = []
    layout = 'Card' if context.delta.importance == 'high' else 'Column'
    frames.extend(
        emit(
            AddSectionDelta(
                event='add_section',
                id=region_id,
                parent_id=context.slot_parent,
                layout=layout,
                title=context.delta.title,
                description=context.delta.description,
            )
        )
    )
    frames.extend(emit(AddSectionDelta(event='add_section', id=body_id, parent_id=region_id, layout='Column')))
    frames.extend(emit(AddSectionDelta(event='add_section', id=list_id, parent_id=body_id, layout='List')))
    return RegionBuildResult(
        archetype=self.archetype_name,
        frames=frames,
        slot_parents={
            'text': body_id,
            'fact': body_id,
            'action_primary': body_id,
            'action_secondary': body_id,
            'input': body_id,
            'image': body_id,
            'list_item': list_id,
            'flow': body_id,
            'divider': body_id,
        },
    )


class FormArchetypeBuilder(RegionArchetypeBuilder):
  archetype_name = 'form_panel'

  def build(self, context: RegionBuildContext, emit: EmitLowLevel) -> RegionBuildResult:
    region_id = context.delta.id
    inputs_id = f'{region_id}_form_inputs'
    actions_id = f'{region_id}_form_actions'
    frames = []
    frames.extend(
        emit(
            AddSectionDelta(
                event='add_section',
                id=region_id,
                parent_id=context.slot_parent,
                layout='Card',
                title=context.delta.title,
                description=context.delta.description,
            )
        )
    )
    frames.extend(emit(AddSectionDelta(event='add_section', id=inputs_id, parent_id=region_id, layout='Column')))
    frames.extend(emit(AddDividerDelta(event='add_divider', id=f'{region_id}_form_divider', parent_id=region_id)))
    frames.extend(emit(AddSectionDelta(event='add_section', id=actions_id, parent_id=region_id, layout='Row')))
    return RegionBuildResult(
        archetype=self.archetype_name,
        frames=frames,
        slot_parents={
            'text': inputs_id,
            'fact': inputs_id,
            'action_primary': actions_id,
            'action_secondary': actions_id,
            'input': inputs_id,
            'image': inputs_id,
            'list_item': inputs_id,
            'flow': inputs_id,
            'divider': inputs_id,
        },
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
