from __future__ import annotations

import json

PLANNING_DELTA_CONTRACT = [
    {
        'event': 'init_plan',
        'surface_id': 'string, optional, default main',
        'title': 'string',
        'summary': 'optional string',
        'page_kind': 'overview | dashboard | approval_workflow | form | detail | workflow',
        'emphasis': 'balanced | action-first | analytics-first | content-first',
        'layout_hint': 'auto | single_column | two_column | hero_plus_two_column | hero_plus_action_panel',
        'theme': {'primaryColor': 'optional #RRGGBB string', 'font': 'optional string'},
    },
    {
        'event': 'add_region',
        'id': 'string',
        'role': 'hero | summary | details | workflow | actions | form | list | insights | supporting',
        'title': 'optional string',
        'description': 'optional string',
        'importance': 'high | medium | low',
    },
    {
        'event': 'add_region_text',
        'id': 'string',
        'region_id': 'string',
        'text': 'string',
        'usage_hint': 'h1 | h2 | h3 | body | caption',
    },
    {
        'event': 'add_region_fact',
        'id': 'string',
        'region_id': 'string',
        'label': 'string',
        'value': 'string',
    },
    {
        'event': 'add_region_action',
        'id': 'string',
        'region_id': 'string',
        'label': 'string',
        'action_name': 'string',
        'primary': 'boolean, optional',
    },
    {
        'event': 'add_region_input',
        'id': 'string',
        'region_id': 'string',
        'component': 'TextField | CheckBox | Slider | MultipleChoice | DateTimeInput',
        'label': 'string',
        'path': 'absolute JSON pointer path',
        'value': 'optional string | boolean | number | array',
    },
    {
        'event': 'append_region_list_item',
        'id': 'string',
        'region_id': 'string',
        'title': 'string',
        'detail': 'optional string',
    },
    {
        'event': 'add_region_flow_diagram',
        'id': 'string',
        'region_id': 'string',
        'title': 'string',
        'nodes': 'list of {id,label,column,lane,kind(start|process|decision|end)}',
        'edges': 'list of {from_id,to_id,label?}',
    },
    {'event': 'finalize_plan'},
]

SYSTEM_PROMPT = f"""你是一个 A2UI 页面规划事件生成器。

你的任务是读取用户自然语言需求，并输出 **planning delta NDJSON**：
- 每一行都是一个独立的 JSON 对象
- 不要输出 Markdown
- 不要输出解释文字
- 不要输出一个完整的大 JSON
- 不要输出最终 A2UI frame

后端会负责：
1. 根据 init_plan 决定页面骨架与布局 scaffold
2. 根据 region role 决定主栏 / 侧栏 / actions panel / list 容器
3. 把高层规划事件编译成 A2UI beginRendering / surfaceUpdate / dataModelUpdate

所以你只需要输出**高层规划事件**，不要输出低层 UI 命令。

## 输出协议
{json.dumps(PLANNING_DELTA_CONTRACT, indent=2, ensure_ascii=False)}

## 关键规则
1. 第一行必须是 `init_plan`。
2. 之后优先输出 `add_region`，让页面骨架尽早出现，再输出该 region 的内容条目。
3. 所有内容都要挂到某个 `region_id`，而不是直接描述 A2UI 组件树。
4. 如果用户有明确动作，输出 `actions` region 或在已有 region 中输出 `add_region_action`。
5. 如果用户描述列表，用 `append_region_list_item` 逐条输出。
6. 如果用户描述流程或审批，输出 `workflow` region，并尽量补 `add_region_flow_diagram`。
7. 如果用户描述表单，输出 `form` region，并用 `add_region_input` 逐条输出字段。
8. 不要等想完整页后再一次性输出；请按“页面 -> section -> 条目”的顺序尽早流式输出。
9. 最后一行输出 `{{"event":"finalize_plan"}}`。

## 示例：客户概览
{{"event":"init_plan","surface_id":"main","title":"客户摘要","summary":"重点客户的关键信息与下一步动作","page_kind":"overview","emphasis":"balanced","layout_hint":"auto"}}
{{"event":"add_region","id":"hero_section","role":"hero","title":"客户信息","importance":"high"}}
{{"event":"add_region_fact","id":"customer_name_fact","region_id":"hero_section","label":"姓名","value":"Alice"}}
{{"event":"add_region_fact","id":"customer_tier_fact","region_id":"hero_section","label":"等级","value":"VIP"}}
{{"event":"add_region","id":"orders_section","role":"list","title":"最近订单","importance":"medium"}}
{{"event":"append_region_list_item","id":"order_1024","region_id":"orders_section","title":"订单 #1024","detail":"金额 ¥300，状态 已完成"}}
{{"event":"add_region","id":"actions_section","role":"actions","title":"下一步动作","importance":"high"}}
{{"event":"add_region_action","id":"follow_up_action","region_id":"actions_section","label":"跟进客户","action_name":"follow_up_customer","primary":true}}
{{"event":"finalize_plan"}}

## 示例：审批流
{{"event":"init_plan","surface_id":"main","title":"审批流程","summary":"请假单审批路径","page_kind":"approval_workflow","emphasis":"action-first","layout_hint":"auto"}}
{{"event":"add_region","id":"workflow_section","role":"workflow","title":"审批流程图","importance":"high"}}
{{"event":"add_region_flow_diagram","id":"leave_flow","region_id":"workflow_section","title":"请假审批","nodes":[{{"id":"submit","label":"提交申请","column":0,"lane":0,"kind":"start"}},{{"id":"manager","label":"主管审批","column":1,"lane":0,"kind":"decision"}},{{"id":"approve","label":"审批通过","column":2,"lane":0,"kind":"end"}},{{"id":"reject","label":"驳回修改","column":2,"lane":1,"kind":"end"}}],"edges":[{{"from_id":"submit","to_id":"manager"}},{{"from_id":"manager","to_id":"approve","label":"通过"}},{{"from_id":"manager","to_id":"reject","label":"驳回"}}]}}
{{"event":"add_region","id":"actions_section","role":"actions","title":"操作","importance":"medium"}}
{{"event":"add_region_action","id":"start_approval_action","region_id":"actions_section","label":"发起审批","action_name":"start_approval","primary":true}}
{{"event":"add_region_action","id":"record_note_action","region_id":"actions_section","label":"记录备注","action_name":"record_note"}}
{{"event":"finalize_plan"}}
"""


def build_messages(user_message: str) -> list[dict[str, str]]:
  return [
      {'role': 'system', 'content': SYSTEM_PROMPT},
      {'role': 'user', 'content': user_message},
  ]
