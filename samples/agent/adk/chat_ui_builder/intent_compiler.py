from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Iterable

from layout_ir import (
    ActionContent,
    ActionPanel,
    CardRegion,
    DetailsRegion,
    FactContent,
    FlowContent,
    FlowRegion,
    FormRegion,
    HeroRegion,
    InputContent,
    LayoutNode,
    LayoutPage,
    ListItemContent,
    ListRegion,
    SplitRegion,
    SummaryRegion,
    TextContent,
)
from models import A2UIFrame, ComponentNode, DataMapEntry


@dataclass
class CompileResult:
  root_id: str
  components: list[ComponentNode] = field(default_factory=list)
  data_frames: list[A2UIFrame] = field(default_factory=list)


class IntentFrameCompiler:
  def __init__(self) -> None:
    self.surface_id = 'main'
    self.used_ids: set[str] = set()

  def compile(self, page: LayoutPage) -> list[A2UIFrame]:
    self.surface_id = page.surface_id
    self.used_ids = set()

    compiled_children = [self._compile_node(node) for node in page.children]
    child_root_ids = [result.root_id for result in compiled_children]
    child_components = [component for result in compiled_children for component in result.components]
    data_frames = [frame for result in compiled_children for frame in result.data_frames]

    frame_card_id = self._use_id('surface_frame_card')
    frame_content_id = self._use_id('surface_frame_card__content')
    intro_card_id = self._use_id('surface_intro_card')
    intro_content_id = self._use_id('surface_intro_card__content')
    title_id = self._use_id('surface_intro_card__title')
    summary_id = self._use_id('surface_intro_card__summary')
    intro_children = [title_id] + ([summary_id] if page.summary else [])
    frame_children = [intro_card_id] + child_root_ids

    components = [
        ComponentNode(
            id='root',
            component={
                'Column': {
                    'children': {'explicitList': [frame_card_id]},
                    'alignment': 'stretch',
                    'distribution': 'start',
                }
            },
        ),
        ComponentNode(id=frame_card_id, component={'Card': {'child': frame_content_id}}),
        ComponentNode(
            id=frame_content_id,
            component={
                'Column': {
                    'children': {'explicitList': frame_children},
                    'alignment': 'stretch',
                    'distribution': 'start',
                }
            },
        ),
        ComponentNode(id=intro_card_id, component={'Card': {'child': intro_content_id}}),
        ComponentNode(
            id=intro_content_id,
            component={
                'Column': {
                    'children': {'explicitList': intro_children},
                    'alignment': 'stretch',
                    'distribution': 'start',
                }
            },
        ),
        ComponentNode(id=title_id, component={'Text': {'text': {'path': '/title'}, 'usageHint': 'h1'}}),
    ]
    if page.summary:
      components.append(ComponentNode(id=summary_id, component={'Text': {'text': {'path': '/summary'}, 'usageHint': 'body'}}))
    components.extend(child_components)

    header_entries = [DataMapEntry(key='title', valueString=page.title)]
    if page.summary:
      header_entries.append(DataMapEntry(key='summary', valueString=page.summary))

    return [
        A2UIFrame(beginRendering={'surfaceId': self.surface_id, 'root': 'root', 'styles': page.theme.model_dump(exclude_none=True) if page.theme else None}),
        A2UIFrame(surfaceUpdate={'surfaceId': self.surface_id, 'components': components}),
        self._data_update('/', header_entries),
        *data_frames,
    ]

  def _compile_node(self, node: LayoutNode) -> CompileResult:
    if isinstance(node, SplitRegion):
      return self._compile_split_region(node)
    if isinstance(node, ActionPanel):
      return self._compile_action_panel(node)
    if isinstance(node, ListRegion):
      return self._compile_list_region(node)
    if isinstance(node, (HeroRegion, SummaryRegion, DetailsRegion, FlowRegion, FormRegion, CardRegion)):
      return self._compile_card_region(node)
    raise ValueError(f'Unsupported layout node: {type(node).__name__}')

  def _compile_split_region(self, node: SplitRegion) -> CompileResult:
    split_id = self._use_id(node.id)
    left_column_id = self._use_id(f'{node.id}__left')
    right_column_id = self._use_id(f'{node.id}__right')
    left_results = [self._compile_node(child) for child in node.left]
    right_results = [self._compile_node(child) for child in node.right]
    components = [
        ComponentNode(
            id=split_id,
            component={'Row': {'children': {'explicitList': [left_column_id, right_column_id]}, 'alignment': 'stretch', 'distribution': 'start'}},
        ),
        ComponentNode(
            id=left_column_id,
            component={'Column': {'children': {'explicitList': [result.root_id for result in left_results]}, 'alignment': 'stretch', 'distribution': 'start'}},
        ),
        ComponentNode(
            id=right_column_id,
            component={'Column': {'children': {'explicitList': [result.root_id for result in right_results]}, 'alignment': 'stretch', 'distribution': 'start'}},
        ),
    ]
    for result in left_results + right_results:
      components.extend(result.components)
    data_frames = [frame for result in left_results + right_results for frame in result.data_frames]
    return CompileResult(root_id=split_id, components=components, data_frames=data_frames)

  def _compile_card_region(self, node: CardRegion) -> CompileResult:
    card_id = self._use_id(node.id)
    content_id = self._use_id(f'{card_id}__content')
    children_ids: list[str] = []
    components = [ComponentNode(id=card_id, component={'Card': {'child': content_id}})]
    data_frames: list[A2UIFrame] = []

    if node.title:
      title_id = self._use_id(f'{card_id}__title')
      children_ids.append(title_id)
      components.append(ComponentNode(id=title_id, component={'Text': {'text': {'path': f'/sections/{card_id}/title'}, 'usageHint': 'h2'}}))
      data_frames.append(self._data_update(f'/sections/{card_id}', [DataMapEntry(key='title', valueString=node.title)]))
    if node.description:
      desc_id = self._use_id(f'{card_id}__description')
      children_ids.append(desc_id)
      components.append(ComponentNode(id=desc_id, component={'Text': {'text': {'path': f'/sections/{card_id}/description'}, 'usageHint': 'body'}}))
      data_frames.append(self._data_update(f'/sections/{card_id}', [DataMapEntry(key='description', valueString=node.description)]))

    for item in node.content:
      result = self._compile_content(item)
      children_ids.append(result.root_id)
      components.extend(result.components)
      data_frames.extend(result.data_frames)

    for child in node.children:
      result = self._compile_node(child)
      children_ids.append(result.root_id)
      components.extend(result.components)
      data_frames.extend(result.data_frames)

    components.append(
        ComponentNode(
            id=content_id,
            component={'Column': {'children': {'explicitList': children_ids}, 'alignment': 'stretch', 'distribution': 'start'}},
        )
    )
    return CompileResult(root_id=card_id, components=components, data_frames=data_frames)

  def _compile_action_panel(self, node: ActionPanel) -> CompileResult:
    action_items = [item for item in node.content if isinstance(item, ActionContent)]
    other_items = [item for item in node.content if not isinstance(item, ActionContent)]
    action_row_id = self._use_id(f'{node.id}__actions_row')
    action_results = [self._compile_content(item) for item in action_items]
    row_component = ComponentNode(
        id=action_row_id,
        component={'Row': {'children': {'explicitList': [result.root_id for result in action_results]}, 'alignment': 'center', 'distribution': 'start'}},
    )
    action_region = CardRegion(
        id=node.id,
        role=node.role,
        title=node.title,
        description=node.description,
        content=other_items,
        children=[],
    )
    result = self._compile_card_region(action_region)
    content_id = f'{node.id}__content'
    content_node = next(component for component in result.components if component.id == content_id)
    current_children = list(content_node.component['Column']['children']['explicitList'])
    current_children.append(action_row_id)
    content_node.component['Column']['children']['explicitList'] = current_children
    result.components.append(row_component)
    for action_result in action_results:
      result.components.extend(action_result.components)
      result.data_frames.extend(action_result.data_frames)
    return result

  def _compile_list_region(self, node: ListRegion) -> CompileResult:
    list_items = [item for item in node.content if isinstance(item, ListItemContent)]
    other_items = [item for item in node.content if not isinstance(item, ListItemContent)]
    list_id = self._use_id(f'{node.id}__list')
    item_results = [self._compile_content(item) for item in list_items]
    list_component = ComponentNode(
        id=list_id,
        component={'List': {'children': {'explicitList': [result.root_id for result in item_results]}, 'direction': 'vertical', 'alignment': 'stretch'}},
    )
    list_region = CardRegion(id=node.id, role=node.role, title=node.title, description=node.description, content=other_items, children=[])
    result = self._compile_card_region(list_region)
    content_id = f'{node.id}__content'
    content_node = next(component for component in result.components if component.id == content_id)
    current_children = list(content_node.component['Column']['children']['explicitList'])
    current_children.append(list_id)
    content_node.component['Column']['children']['explicitList'] = current_children
    result.components.append(list_component)
    for item_result in item_results:
      result.components.extend(item_result.components)
      result.data_frames.extend(item_result.data_frames)
    return result

  def _compile_content(self, item: object) -> CompileResult:
    if isinstance(item, TextContent):
      return self._compile_text(item)
    if isinstance(item, FactContent):
      return self._compile_fact(item)
    if isinstance(item, ActionContent):
      return self._compile_action(item)
    if isinstance(item, InputContent):
      return self._compile_input(item)
    if isinstance(item, ListItemContent):
      return self._compile_list_item(item)
    if isinstance(item, FlowContent):
      return self._compile_flow(item)
    raise ValueError(f'Unsupported content item: {type(item).__name__}')

  def _compile_text(self, item: TextContent) -> CompileResult:
    text_id = self._use_id(item.id)
    usage_hint = item.usage_hint if len(item.text) <= 120 or item.usage_hint in {'body', 'caption'} else 'body'
    return CompileResult(
        root_id=text_id,
        components=[ComponentNode(id=text_id, component={'Text': {'text': {'path': f'/content/{text_id}/text'}, 'usageHint': usage_hint}})],
        data_frames=[self._data_update(f'/content/{text_id}', [DataMapEntry(key='text', valueString=item.text)])],
    )

  def _compile_fact(self, item: FactContent) -> CompileResult:
    group_id = self._use_id(item.id)
    label_id = self._use_id(f'{group_id}__label')
    value_id = self._use_id(f'{group_id}__value')
    components = [
        ComponentNode(id=group_id, component={'Column': {'children': {'explicitList': [label_id, value_id]}, 'alignment': 'stretch', 'distribution': 'start'}}),
        ComponentNode(id=label_id, component={'Text': {'text': {'path': f'/content/{group_id}/label'}, 'usageHint': 'caption'}}),
        ComponentNode(id=value_id, component={'Text': {'text': {'path': f'/content/{group_id}/value'}, 'usageHint': 'body'}}),
    ]
    data = self._data_update(
        f'/content/{group_id}',
        [DataMapEntry(key='label', valueString=item.label), DataMapEntry(key='value', valueString=item.value)],
    )
    return CompileResult(root_id=group_id, components=components, data_frames=[data])

  def _compile_action(self, item: ActionContent) -> CompileResult:
    button_id = self._use_id(item.id)
    label_id = self._use_id(f'{button_id}__label')
    components = [
        ComponentNode(id=button_id, component={'Button': {'child': label_id, 'primary': item.primary, 'action': {'name': item.action_name}}}),
        ComponentNode(id=label_id, component={'Text': {'text': {'path': f'/content/{button_id}/label'}, 'usageHint': 'body'}}),
    ]
    data = self._data_update(f'/content/{button_id}', [DataMapEntry(key='label', valueString=item.label)])
    return CompileResult(root_id=button_id, components=components, data_frames=[data])

  def _compile_input(self, item: InputContent) -> CompileResult:
    input_id = self._use_id(item.id)
    props: dict[str, object] = {'label': {'literalString': item.label}}
    data_frames: list[A2UIFrame] = []
    if item.component == 'TextField':
      props['text'] = {'path': item.path}
      if item.text_field_type:
        props['textFieldType'] = item.text_field_type
    elif item.component == 'CheckBox':
      props['value'] = {'path': item.path}
    elif item.component == 'Slider':
      props['value'] = {'path': item.path}
      if item.min_value is not None:
        props['minValue'] = item.min_value
      if item.max_value is not None:
        props['maxValue'] = item.max_value
    elif item.component == 'MultipleChoice':
      props['selections'] = {'path': item.path}
      props['options'] = [{'label': {'literalString': option.label}, 'value': option.value} for option in (item.options or [])]
    elif item.component == 'DateTimeInput':
      props['value'] = {'path': item.path}
      props['enableDate'] = bool(item.enable_date if item.enable_date is not None else True)
      props['enableTime'] = bool(item.enable_time if item.enable_time is not None else True)
    components = [ComponentNode(id=input_id, component={item.component: props})]
    if item.value is not None:
      parent_path, leaf = item.path.rsplit('/', 1)
      entry = self._value_entry(leaf, item.value)
      data_frames.append(self._data_update(parent_path or '/', [entry]))
    return CompileResult(root_id=input_id, components=components, data_frames=data_frames)

  def _compile_list_item(self, item: ListItemContent) -> CompileResult:
    wrapper_id = self._use_id(item.id)
    title_id = self._use_id(f'{wrapper_id}__title')
    children = [title_id]
    components = [ComponentNode(id=title_id, component={'Text': {'text': {'path': f'/content/{wrapper_id}/title'}, 'usageHint': 'body'}})]
    data_entries = [DataMapEntry(key='title', valueString=item.title)]
    if item.detail:
      detail_id = self._use_id(f'{wrapper_id}__detail')
      children.append(detail_id)
      components.append(ComponentNode(id=detail_id, component={'Text': {'text': {'path': f'/content/{wrapper_id}/detail'}, 'usageHint': 'caption'}}))
      data_entries.append(DataMapEntry(key='detail', valueString=item.detail))
    components.insert(0, ComponentNode(id=wrapper_id, component={'Column': {'children': {'explicitList': children}, 'alignment': 'stretch', 'distribution': 'start'}}))
    return CompileResult(root_id=wrapper_id, components=components, data_frames=[self._data_update(f'/content/{wrapper_id}', data_entries)])

  def _compile_flow(self, item: FlowContent) -> CompileResult:
    flow_id = self._use_id(item.id)
    spec_json = json.dumps({'title': item.title, 'nodes': [node.model_dump() for node in item.flow.nodes], 'edges': [edge.model_dump() for edge in item.flow.edges]}, ensure_ascii=False)
    components = [ComponentNode(id=flow_id, component={'FlowDiagram': {'spec': {'path': f'/content/{flow_id}/spec'}}})]
    data = self._data_update(f'/content/{flow_id}', [DataMapEntry(key='spec', valueString=spec_json)])
    return CompileResult(root_id=flow_id, components=components, data_frames=[data])

  def _value_entry(self, key: str, value: object) -> DataMapEntry:
    if isinstance(value, bool):
      return DataMapEntry(key=key, valueBoolean=value)
    if isinstance(value, (int, float)):
      return DataMapEntry(key=key, valueNumber=float(value))
    if isinstance(value, list):
      return DataMapEntry(key=key, valueMap=[self._value_entry(str(index), item) for index, item in enumerate(value)])
    return DataMapEntry(key=key, valueString=str(value))

  def _data_update(self, path: str, contents: Iterable[DataMapEntry]) -> A2UIFrame:
    return A2UIFrame(dataModelUpdate={'surfaceId': self.surface_id, 'path': path, 'contents': list(contents)})

  def _use_id(self, candidate: str) -> str:
    if candidate not in self.used_ids:
      self.used_ids.add(candidate)
      return candidate
    suffix = 2
    while f'{candidate}_{suffix}' in self.used_ids:
      suffix += 1
    resolved = f'{candidate}_{suffix}'
    self.used_ids.add(resolved)
    return resolved
