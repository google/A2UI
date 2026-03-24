from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
  sys.path.insert(0, str(ROOT))

from models import AddRegionActionDelta, AddRegionDelta, AddRegionFactDelta, InitPlanDelta
from skeleton_compiler import SkeletonCompiler


def _slot_component_ids(frames: list[object]) -> set[str]:
  component_ids: set[str] = set()
  for frame in frames:
    surface_update = getattr(frame, 'surfaceUpdate', None)
    if not surface_update:
      continue
    for component in surface_update.components:
      component_ids.add(component.id)
  return component_ids


def test_actions_region_uses_single_action_row_for_both_priorities() -> None:
  compiler = SkeletonCompiler()
  compiler.apply(
      InitPlanDelta(
          event='init_plan',
          title='Action page',
          page_kind='overview',
          emphasis='balanced',
          layout_hint='single_column',
      )
  )

  frames = compiler.apply(
      AddRegionDelta(
          event='add_region',
          id='actions_region',
          role='actions',
          title='Actions',
      )
  )

  binding = compiler.regions['actions_region']
  assert binding.parent_for('action_primary') == 'actions_region_actions'
  assert binding.parent_for('action_secondary') == 'actions_region_actions'
  assert 'actions_region_primary_actions' not in _slot_component_ids(frames)
  assert 'actions_region_secondary_actions' not in _slot_component_ids(frames)


def test_summary_text_and_actions_land_directly_on_region() -> None:
  compiler = SkeletonCompiler()
  compiler.apply(InitPlanDelta(event='init_plan', title='Summary page'))
  compiler.apply(AddRegionDelta(event='add_region', id='summary_region', role='summary', title='Summary'))

  binding = compiler.regions['summary_region']
  assert binding.parent_for('text') == 'summary_region'
  assert binding.parent_for('fact') == 'summary_region_summary_facts'
  assert binding.parent_for('action_primary') == 'summary_region'
  assert binding.parent_for('action_secondary') == 'summary_region'


def test_pending_region_deltas_flush_through_compact_slot_mapping() -> None:
  compiler = SkeletonCompiler()
  compiler.apply(InitPlanDelta(event='init_plan', title='Detail page'))

  compiler.apply(
      AddRegionActionDelta(
          event='add_region_action',
          id='details_cta',
          region_id='details_region',
          label='Review',
          action_name='review',
          primary=True,
      )
  )
  compiler.apply(
      AddRegionFactDelta(
          event='add_region_fact',
          id='details_fact',
          region_id='details_region',
          label='Owner',
          value='Ops',
      )
  )

  frames = compiler.apply(AddRegionDelta(event='add_region', id='details_region', role='details', title='Details'))
  component_ids = _slot_component_ids(frames)

  assert 'details_region_details_actions' in component_ids
  assert 'details_region_details_facts' in component_ids
  assert 'details_cta' in component_ids
  assert 'details_fact' in component_ids
