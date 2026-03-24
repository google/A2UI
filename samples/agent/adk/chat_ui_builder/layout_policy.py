from __future__ import annotations

from intent_plan import IntentPlan, SectionIntent
from layout_ir import (
    ActionPanel,
    CardRegion,
    DetailsRegion,
    FlowContent,
    FlowRegion,
    FormRegion,
    HeroRegion,
    LayoutIRFactory,
    LayoutPage,
    LayoutNode,
    ListRegion,
    SplitRegion,
    SummaryRegion,
)


class BaseLayoutPolicy:
  page_kind = 'overview'

  def build(self, plan: IntentPlan) -> LayoutPage:
    raise NotImplementedError

  def section_to_region(self, section: SectionIntent) -> LayoutNode:
    child_regions = [self.section_to_region(child) for child in section.children]
    content = []
    content.extend(LayoutIRFactory.content_from_texts(section.texts))
    content.extend(LayoutIRFactory.content_from_facts(section.facts))
    content.extend(LayoutIRFactory.content_from_inputs(section.inputs))
    if section.flow:
      content.append(FlowContent(id=f'{section.id}_flow', kind='flow', title=section.flow.title, flow=section.flow))
    if section.role == 'actions':
      content.extend(LayoutIRFactory.content_from_actions(section.actions))
      return ActionPanel(
          id=section.id or 'actions_panel',
          role=section.role,
          title=section.title,
          description=section.summary,
          content=content,
          children=child_regions,
      )
    if section.role == 'form' or section.content_type == 'form':
      content.extend(LayoutIRFactory.content_from_actions(section.actions))
      return FormRegion(
          id=section.id or 'form_region',
          role=section.role,
          title=section.title,
          description=section.summary,
          content=content,
          children=child_regions,
      )
    if section.role == 'list' or section.content_type == 'list':
      content.extend(LayoutIRFactory.content_from_list_items(section.list_items))
      return ListRegion(
          id=section.id or 'list_region',
          role=section.role,
          title=section.title,
          description=section.summary,
          content=content,
          children=child_regions,
      )
    if section.role == 'workflow' or section.content_type == 'flow':
      content.extend(LayoutIRFactory.content_from_actions(section.actions))
      return FlowRegion(
          id=section.id or 'workflow_region',
          role=section.role,
          title=section.title,
          description=section.summary,
          content=content,
          children=child_regions,
      )
    if section.role == 'hero':
      return HeroRegion(
          id=section.id or 'hero_region',
          role=section.role,
          title=section.title,
          description=section.summary,
          content=content,
          children=child_regions,
      )
    if section.role == 'summary':
      return SummaryRegion(
          id=section.id or 'summary_region',
          role=section.role,
          title=section.title,
          description=section.summary,
          content=content,
          children=child_regions,
      )
    return DetailsRegion(
        id=section.id or 'details_region',
        role=section.role,
        title=section.title,
        description=section.summary,
        content=content,
        children=child_regions,
    )

  def page(self, plan: IntentPlan, children: list[LayoutNode]) -> LayoutPage:
    return LayoutPage(
        surface_id=plan.surface_id,
        title=plan.title,
        summary=plan.summary,
        density=plan.density,
        theme=plan.theme,
        children=children,
    )


class ApprovalWorkflowPolicy(BaseLayoutPolicy):
  page_kind = 'approval_workflow'

  def build(self, plan: IntentPlan) -> LayoutPage:
    top: list[LayoutNode] = []
    left: list[LayoutNode] = []
    right: list[LayoutNode] = []
    for section in plan.sections:
      region = self.section_to_region(section)
      if section.role in {'hero', 'summary'}:
        top.append(region)
      elif section.role in {'workflow', 'details', 'form', 'list'}:
        left.append(region)
      else:
        right.append(region)
    children = list(top)
    if right:
      children.append(SplitRegion(id='main_split_region', role='split', left=left or [SummaryRegion(id='fallback_summary_region', role='summary', title='摘要')], right=right))
    else:
      children.extend(left)
    return self.page(plan, children)


class DashboardPolicy(BaseLayoutPolicy):
  page_kind = 'dashboard'

  def build(self, plan: IntentPlan) -> LayoutPage:
    top: list[LayoutNode] = []
    left: list[LayoutNode] = []
    right: list[LayoutNode] = []
    for section in plan.sections:
      region = self.section_to_region(section)
      if section.role == 'hero':
        top.append(region)
      elif section.role in {'summary', 'insights'}:
        left.append(region)
      else:
        right.append(region)
    children = list(top)
    if left and right:
      children.append(SplitRegion(id='dashboard_split_region', role='split', left=left, right=right))
    else:
      children.extend(left)
      children.extend(right)
    return self.page(plan, children)


class FormPolicy(BaseLayoutPolicy):
  page_kind = 'form'

  def build(self, plan: IntentPlan) -> LayoutPage:
    top: list[LayoutNode] = []
    form_regions: list[LayoutNode] = []
    footer: list[LayoutNode] = []
    for section in plan.sections:
      region = self.section_to_region(section)
      if section.role in {'hero', 'summary'}:
        top.append(region)
      elif section.role == 'actions':
        footer.append(region)
      else:
        form_regions.append(region)
    return self.page(plan, top + form_regions + footer)


class ResultPolicy(BaseLayoutPolicy):
  page_kind = 'result'

  def build(self, plan: IntentPlan) -> LayoutPage:
    top: list[LayoutNode] = []
    rest: list[LayoutNode] = []
    for section in plan.sections:
      region = self.section_to_region(section)
      if section.role in {'hero', 'summary'}:
        top.append(region)
      else:
        rest.append(region)
    return self.page(plan, top + rest)


class DefaultPolicy(BaseLayoutPolicy):
  page_kind = 'overview'

  def build(self, plan: IntentPlan) -> LayoutPage:
    children = [self.section_to_region(section) for section in plan.sections]
    return self.page(plan, children)


class LayoutPolicyEngine:
  def __init__(self) -> None:
    self.policies = {
        'approval_workflow': ApprovalWorkflowPolicy(),
        'dashboard': DashboardPolicy(),
        'form': FormPolicy(),
        'result': ResultPolicy(),
        'overview': DefaultPolicy(),
        'detail': DefaultPolicy(),
        'workflow': ApprovalWorkflowPolicy(),
    }

  def build(self, plan: IntentPlan) -> LayoutPage:
    policy = self.policies.get(plan.page_kind, DefaultPolicy())
    return policy.build(plan)
