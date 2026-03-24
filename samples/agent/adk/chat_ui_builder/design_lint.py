from __future__ import annotations

from intent_plan import IntentPlan, PlanAction, PlanTextBlock, SectionIntent, slugify


class DesignLint:
  def normalize(self, plan: IntentPlan) -> IntentPlan:
    normalized = plan.model_copy(deep=True)

    if not normalized.summary:
      normalized.summary = f'{normalized.title}的结构化页面摘要'

    self._ensure_summary_section(normalized)
    self._merge_page_actions(normalized)
    self._limit_primary_actions(normalized)
    self._limit_sections(normalized)
    return normalized

  def _ensure_summary_section(self, plan: IntentPlan) -> None:
    has_summary = any(section.role in {'hero', 'summary'} for section in plan.sections)
    if has_summary:
      return
    plan.sections.insert(
        0,
        SectionIntent(
            id='auto_summary_section',
            role='summary',
            importance='high',
            content_type='summary',
            title='摘要',
            summary=plan.summary,
            texts=[PlanTextBlock(id='auto_summary_text', text=plan.summary or plan.title, usage_hint='body')],
        ),
    )

  def _merge_page_actions(self, plan: IntentPlan) -> None:
    actions: list[PlanAction] = []
    if plan.primary_action:
      primary = plan.primary_action.model_copy(deep=True)
      primary.primary = True
      if not primary.id:
        primary.id = 'page_primary_action'
      actions.append(primary)
    actions.extend(action.model_copy(deep=True) for action in plan.secondary_actions)
    if not actions:
      return

    action_section = next((section for section in plan.sections if section.role == 'actions'), None)
    if not action_section:
      action_section = SectionIntent(
          id='actions_section',
          role='actions',
          importance='high',
          content_type='actions',
          interaction_priority='high',
          title='下一步',
      )
      plan.sections.append(action_section)

    existing_ids = {action.id for action in action_section.actions}
    for action in actions:
      if action.id not in existing_ids:
        action_section.actions.append(action)
        existing_ids.add(action.id)

  def _limit_primary_actions(self, plan: IntentPlan) -> None:
    first_primary_seen = False
    for section in plan.sections:
      for action in section.actions:
        if action.primary and not first_primary_seen:
          first_primary_seen = True
        elif action.primary:
          action.primary = False
    if plan.primary_action and not first_primary_seen:
      plan.primary_action.primary = True

  def _limit_sections(self, plan: IntentPlan) -> None:
    max_sections = 4 if plan.density == 'compact' else 5
    if len(plan.sections) <= max_sections:
      return

    scored = sorted(plan.sections, key=self._section_score, reverse=True)
    kept = scored[:max_sections]
    dropped = scored[max_sections:]
    if dropped:
      supporting = next((section for section in kept if section.role == 'supporting'), None)
      if not supporting:
        supporting = SectionIntent(
            id='supporting_section',
            role='supporting',
            importance='low',
            content_type='summary',
            title='补充信息',
        )
        kept.append(supporting)
      for section in dropped:
        supporting.texts.append(
            PlanTextBlock(
                id=f'{slugify(section.id or section.role, "supporting")}_lint_text',
                text=f'{section.title or section.role}：{section.summary or "已折叠为补充信息"}',
                usage_hint='caption',
            )
        )
    plan.sections = kept[: max_sections + 1]

  def _section_score(self, section: SectionIntent) -> int:
    role_score = {
        'hero': 100,
        'summary': 90,
        'workflow': 85,
        'form': 80,
        'actions': 75,
        'details': 70,
        'list': 65,
        'insights': 60,
        'supporting': 40,
    }
    importance_score = {'high': 30, 'medium': 15, 'low': 0}
    return role_score.get(section.role, 50) + importance_score.get(section.importance, 0)
