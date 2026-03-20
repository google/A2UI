from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from typing import Any

from models import (
    A2UIFrame,
    AddButtonDelta,
    AddDividerDelta,
    AddFlowDiagramDelta,
    AddImageDelta,
    AddInputDelta,
    AddKeyValueDelta,
    AddSectionDelta,
    AddTextDelta,
    AppendListItemDelta,
    ComponentNode,
    DataMapEntry,
    InitSurfaceDelta,
)

logger = logging.getLogger(__name__)


@dataclass
class ContainerState:
  component_id: str
  container_type: str
  child_ids: list[str] = field(default_factory=list)


class FrameCompiler:
  def __init__(self) -> None:
    self.surface_id = 'main'
    self.root_id = 'root'
    self.initialized = False
    self.containers: dict[str, ContainerState] = {}
    self.list_item_counts: dict[str, int] = {}
    self.used_ids: set[str] = set()
    self.aliases: dict[str, str] = {}
    self.auto_sections: dict[str, str] = {}
    self.page_parent_id = self.root_id

  def apply(self, delta: Any) -> list[A2UIFrame]:
    logger.info('Compiling delta type=%s payload=%s', type(delta).__name__, delta.model_dump())
    if isinstance(delta, InitSurfaceDelta):
      return self._init_surface(delta)
    if isinstance(delta, AddSectionDelta):
      return self._add_section(delta)
    if isinstance(delta, AddTextDelta):
      return self._add_text(delta)
    if isinstance(delta, AddKeyValueDelta):
      return self._add_key_value(delta)
    if isinstance(delta, AddImageDelta):
      return self._add_image(delta)
    if isinstance(delta, AddButtonDelta):
      return self._add_button(delta)
    if isinstance(delta, AddFlowDiagramDelta):
      return self._add_flow_diagram(delta)
    if isinstance(delta, AddInputDelta):
      return self._add_input(delta)
    if isinstance(delta, AddDividerDelta):
      return self._add_divider(delta)
    if isinstance(delta, AppendListItemDelta):
      return self._append_list_item(delta)
    return []

  def _resolve_parent_id(self, parent_id: str) -> str:
    return self.aliases.get(parent_id, parent_id)

  def _ensure_container(self, parent_id: str) -> ContainerState:
    canonical_parent_id = self._resolve_parent_id(parent_id)
    if canonical_parent_id not in self.containers:
      raise ValueError(f'Unknown parent/container id: {parent_id}')
    return self.containers[canonical_parent_id]

  def _register_id(self, requested_id: str) -> str:
    base = requested_id.strip() or 'node'
    if base not in self.used_ids:
      self.used_ids.add(base)
      self.aliases.setdefault(requested_id, base)
      return base

    suffix = 2
    while f'{base}_{suffix}' in self.used_ids:
      suffix += 1
    canonical = f'{base}_{suffix}'
    logger.warning('Duplicate component id detected: %s -> %s', requested_id, canonical)
    self.used_ids.add(canonical)
    return canonical

  def _helper_id(self, base: str, suffix: str) -> str:
    candidate = f'{base}__{suffix}'
    if candidate not in self.used_ids:
      self.used_ids.add(candidate)
      return candidate
    counter = 2
    while f'{candidate}_{counter}' in self.used_ids:
      counter += 1
    resolved = f'{candidate}_{counter}'
    self.used_ids.add(resolved)
    return resolved

  def _append_child(self, parent_id: str, child_id: str) -> None:
    parent = self._ensure_container(parent_id)
    if parent.component_id == child_id:
      raise ValueError(f'Child id {child_id} cannot equal parent id {parent.component_id}')
    if child_id not in parent.child_ids:
      parent.child_ids.append(child_id)

  def _ensure_auto_section(self, bucket: str, title: str) -> list[A2UIFrame]:
    existing = self.auto_sections.get(bucket)
    if existing and existing in self.containers:
      return []

    section_id = f'auto_{bucket}_card'
    frames = self._add_section(
        AddSectionDelta(
            event='add_section',
            id=section_id,
            parent_id=self.page_parent_id,
            layout='Card',
            title=title,
        )
    )
    self.auto_sections[bucket] = section_id
    return frames

  def _wrap_root_primitive(self, parent_id: str, bucket: str, title: str) -> tuple[list[A2UIFrame], str]:
    if parent_id != self.root_id:
      return [], parent_id

    prefix_frames = self._ensure_auto_section(bucket, title)
    return prefix_frames, self.auto_sections[bucket]

  def _surface_update(self, components: list[ComponentNode]) -> A2UIFrame:
    frame = A2UIFrame(surfaceUpdate={'surfaceId': self.surface_id, 'components': components})
    logger.debug('Compiled surfaceUpdate frame=%s', frame.model_dump(exclude_none=True))
    return frame

  def _data_update(self, path: str, contents: list[DataMapEntry]) -> A2UIFrame:
    frame = A2UIFrame(dataModelUpdate={'surfaceId': self.surface_id, 'path': path, 'contents': contents})
    logger.debug('Compiled dataModelUpdate frame=%s', frame.model_dump(exclude_none=True))
    return frame

  def _container_component(self, container: ContainerState) -> ComponentNode:
    if container.container_type == 'Row':
      component = {
          'Row': {
              'children': {'explicitList': container.child_ids},
              'alignment': 'center',
              'distribution': 'start',
          }
      }
    elif container.container_type == 'List':
      component = {
          'List': {
              'children': {'explicitList': container.child_ids},
              'direction': 'vertical',
              'alignment': 'stretch',
          }
      }
    else:
      component = {
          'Column': {
              'children': {'explicitList': container.child_ids},
              'alignment': 'stretch',
              'distribution': 'start',
          }
      }
    return ComponentNode(id=container.component_id, component=component)

  def _init_surface(self, delta: InitSurfaceDelta) -> list[A2UIFrame]:
    self.surface_id = delta.surface_id
    self.initialized = True
    self.used_ids = {self.root_id}
    self.aliases = {self.root_id: self.root_id}
    self.containers = {
        self.root_id: ContainerState(component_id=self.root_id, container_type='Column')
    }

    frame_card_id = self._register_id('surface_frame_card')
    frame_content_id = self._helper_id(frame_card_id, 'content')
    intro_card_id = self._register_id('surface_intro_card')
    intro_content_id = self._helper_id(intro_card_id, 'content')
    title_id = self._helper_id(intro_card_id, 'title')
    root_children = [frame_card_id]
    components = [
        ComponentNode(
            id=self.root_id,
            component={
                'Column': {
                    'children': {'explicitList': root_children},
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
                    'children': {'explicitList': [intro_card_id]},
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
                    'children': {'explicitList': [title_id]},
                    'alignment': 'stretch',
                    'distribution': 'start',
                }
            },
        ),
        ComponentNode(id=title_id, component={'Text': {'text': {'path': '/title'}, 'usageHint': 'h1'}}),
    ]
    data_entries = [DataMapEntry(key='title', valueString=delta.title)]

    if delta.summary:
      summary_id = self._helper_id(intro_card_id, 'summary')
      components.append(
          ComponentNode(id=summary_id, component={'Text': {'text': {'path': '/summary'}, 'usageHint': 'body'}})
      )
      components[4] = ComponentNode(
          id=intro_content_id,
          component={
              'Column': {
                  'children': {'explicitList': [title_id, summary_id]},
                  'alignment': 'stretch',
                  'distribution': 'start',
              }
          },
      )
      data_entries.append(DataMapEntry(key='summary', valueString=delta.summary))

    self.containers[self.root_id].child_ids = root_children
    self.containers[frame_card_id] = ContainerState(component_id=frame_content_id, container_type='Column')
    self.containers[frame_card_id].child_ids = [intro_card_id]
    self.containers[intro_card_id] = ContainerState(component_id=intro_content_id, container_type='Column')
    self.containers[intro_card_id].child_ids = [title_id] + ([summary_id] if delta.summary else [])
    self.auto_sections = {}
    self.page_parent_id = frame_card_id

    begin = A2UIFrame(
        beginRendering={
            'surfaceId': self.surface_id,
            'root': self.root_id,
            'styles': delta.theme.model_dump(exclude_none=True) if delta.theme else None,
        }
    )
    logger.debug('Compiled beginRendering frame=%s', begin.model_dump(exclude_none=True))
    return [begin, self._surface_update(components), self._data_update('/', data_entries)]

  def _add_section(self, delta: AddSectionDelta) -> list[A2UIFrame]:
    actual_parent_id = self.page_parent_id if delta.parent_id == self.root_id else delta.parent_id
    parent = self._ensure_container(actual_parent_id)
    section_id = self._register_id(delta.id)
    if section_id == parent.component_id:
      raise ValueError(f'Section id {section_id} cannot equal parent id {parent.component_id}')

    components: list[ComponentNode] = []
    emitted_data: list[A2UIFrame] = []

    if delta.layout == 'Card':
      content_id = self._helper_id(section_id, 'content')
      self._append_child(actual_parent_id, section_id)
      self.containers[section_id] = ContainerState(component_id=content_id, container_type='Column')
      components.append(ComponentNode(id=section_id, component={'Card': {'child': content_id}}))
      explicit_children: list[str] = []
      if delta.title:
        title_id = self._helper_id(section_id, 'title')
        explicit_children.append(title_id)
        components.append(
            ComponentNode(
                id=title_id,
                component={'Text': {'text': {'path': f'/sections/{section_id}/title'}, 'usageHint': 'h2'}},
            )
        )
        emitted_data.append(self._data_update(f'/sections/{section_id}', [DataMapEntry(key='title', valueString=delta.title)]))
      if delta.description:
        desc_id = self._helper_id(section_id, 'description')
        explicit_children.append(desc_id)
        components.append(
            ComponentNode(
                id=desc_id,
                component={'Text': {'text': {'path': f'/sections/{section_id}/description'}, 'usageHint': 'body'}},
            )
        )
        emitted_data.append(
            self._data_update(f'/sections/{section_id}', [DataMapEntry(key='description', valueString=delta.description)])
        )
      components.append(
          ComponentNode(
              id=content_id,
              component={
                  'Column': {
                      'children': {'explicitList': explicit_children},
                      'alignment': 'stretch',
                      'distribution': 'start',
                  }
              },
          )
      )
    else:
      self._append_child(actual_parent_id, section_id)
      self.containers[section_id] = ContainerState(component_id=section_id, container_type=delta.layout)
      explicit_children: list[str] = []
      if delta.title:
        title_id = self._helper_id(section_id, 'title')
        explicit_children.append(title_id)
        components.append(
            ComponentNode(
                id=title_id,
                component={'Text': {'text': {'path': f'/sections/{section_id}/title'}, 'usageHint': 'h2'}},
            )
        )
        emitted_data.append(self._data_update(f'/sections/{section_id}', [DataMapEntry(key='title', valueString=delta.title)]))
      if delta.description:
        desc_id = self._helper_id(section_id, 'description')
        explicit_children.append(desc_id)
        components.append(
            ComponentNode(
                id=desc_id,
                component={'Text': {'text': {'path': f'/sections/{section_id}/description'}, 'usageHint': 'body'}},
            )
        )
        emitted_data.append(
            self._data_update(f'/sections/{section_id}', [DataMapEntry(key='description', valueString=delta.description)])
        )
      self.containers[section_id].child_ids = explicit_children
      components.append(self._container_component(self.containers[section_id]))

    parent_component = self._container_component(parent)
    return [self._surface_update([parent_component] + components)] + emitted_data

  def _add_text(self, delta: AddTextDelta) -> list[A2UIFrame]:
    prefix_frames, parent_id = self._wrap_root_primitive(delta.parent_id, 'overview', '关键信息')
    parent = self._ensure_container(parent_id)
    text_id = self._register_id(delta.id)
    if text_id == parent.component_id:
      raise ValueError(f'Text id {text_id} cannot equal parent id {parent.component_id}')
    self._append_child(parent_id, text_id)
    parent_update = self._container_component(parent)
    text_component = ComponentNode(
        id=text_id,
        component={'Text': {'text': {'path': f'/content/{text_id}/text'}, 'usageHint': delta.usage_hint}},
    )
    return prefix_frames + [
        self._surface_update([parent_update, text_component]),
        self._data_update(f'/content/{text_id}', [DataMapEntry(key='text', valueString=delta.text)]),
    ]

  def _add_key_value(self, delta: AddKeyValueDelta) -> list[A2UIFrame]:
    prefix_frames, parent_id = self._wrap_root_primitive(delta.parent_id, 'overview', '关键信息')
    parent = self._ensure_container(parent_id)
    group_id = self._register_id(delta.id)
    if group_id == parent.component_id:
      raise ValueError(f'Key/value id {group_id} cannot equal parent id {parent.component_id}')
    label_id = self._helper_id(group_id, 'label')
    value_id = self._helper_id(group_id, 'value')
    self._append_child(parent_id, group_id)
    parent_update = self._container_component(parent)
    group = ComponentNode(
        id=group_id,
        component={
            'Column': {
                'children': {'explicitList': [label_id, value_id]},
                'alignment': 'stretch',
                'distribution': 'start',
            }
        },
    )
    label = ComponentNode(id=label_id, component={'Text': {'text': {'path': f'/content/{group_id}/label'}, 'usageHint': 'caption'}})
    value = ComponentNode(id=value_id, component={'Text': {'text': {'path': f'/content/{group_id}/value'}, 'usageHint': 'body'}})
    return prefix_frames + [
        self._surface_update([parent_update, group, label, value]),
        self._data_update(
            f'/content/{group_id}',
            [
                DataMapEntry(key='label', valueString=delta.label),
                DataMapEntry(key='value', valueString=delta.value),
            ],
        ),
    ]

  def _add_image(self, delta: AddImageDelta) -> list[A2UIFrame]:
    prefix_frames, parent_id = self._wrap_root_primitive(delta.parent_id, 'overview', '关键信息')
    parent = self._ensure_container(parent_id)
    image_id = self._register_id(delta.id)
    if image_id == parent.component_id:
      raise ValueError(f'Image id {image_id} cannot equal parent id {parent.component_id}')
    self._append_child(parent_id, image_id)
    parent_update = self._container_component(parent)
    image_props: dict[str, Any] = {'url': {'path': f'/content/{image_id}/url'}}
    if delta.usage_hint:
      image_props['usageHint'] = delta.usage_hint
    image = ComponentNode(id=image_id, component={'Image': image_props})
    return prefix_frames + [
        self._surface_update([parent_update, image]),
        self._data_update(f'/content/{image_id}', [DataMapEntry(key='url', valueString=delta.url)]),
    ]

  def _add_button(self, delta: AddButtonDelta) -> list[A2UIFrame]:
    prefix_frames, parent_id = self._wrap_root_primitive(delta.parent_id, 'actions', '可执行操作')
    parent = self._ensure_container(parent_id)
    button_id = self._register_id(delta.id)
    if button_id == parent.component_id:
      raise ValueError(f'Button id {button_id} cannot equal parent id {parent.component_id}')
    text_id = self._helper_id(button_id, 'label')
    self._append_child(parent_id, button_id)
    parent_update = self._container_component(parent)
    button = ComponentNode(
        id=button_id,
        component={
            'Button': {
                'child': text_id,
                'primary': delta.primary,
                'action': {'name': delta.action_name},
            }
        },
    )
    label = ComponentNode(id=text_id, component={'Text': {'text': {'path': f'/content/{button_id}/label'}, 'usageHint': 'body'}})
    return prefix_frames + [
        self._surface_update([parent_update, button, label]),
        self._data_update(f'/content/{button_id}', [DataMapEntry(key='label', valueString=delta.label)]),
    ]

  def _add_flow_diagram(self, delta: AddFlowDiagramDelta) -> list[A2UIFrame]:
    prefix_frames, parent_id = self._wrap_root_primitive(delta.parent_id, 'diagram', '流程图')
    parent = self._ensure_container(parent_id)
    diagram_id = self._register_id(delta.id)
    if diagram_id == parent.component_id:
      raise ValueError(f'Flow diagram id {diagram_id} cannot equal parent id {parent.component_id}')
    self._append_child(parent_id, diagram_id)
    parent_update = self._container_component(parent)
    diagram_component = ComponentNode(
        id=diagram_id,
        component={
            'FlowDiagram': {
                'spec': {'path': f'/content/{diagram_id}/spec'},
            }
        },
    )
    spec_json = json.dumps(
        {
            'title': delta.title,
            'nodes': [node.model_dump() for node in delta.nodes],
            'edges': [edge.model_dump() for edge in delta.edges],
        },
        ensure_ascii=False,
    )
    return prefix_frames + [
        self._surface_update([parent_update, diagram_component]),
        self._data_update(
            f'/content/{diagram_id}',
            [DataMapEntry(key='spec', valueString=spec_json)],
        ),
    ]

  def _add_input(self, delta: AddInputDelta) -> list[A2UIFrame]:
    prefix_frames, parent_id = self._wrap_root_primitive(delta.parent_id, 'form', '待填写信息')
    parent = self._ensure_container(parent_id)
    input_id = self._register_id(delta.id)
    if input_id == parent.component_id:
      raise ValueError(f'Input id {input_id} cannot equal parent id {parent.component_id}')
    self._append_child(parent_id, input_id)
    parent_update = self._container_component(parent)
    props: dict[str, Any] = {'label': {'literalString': delta.label}}
    payload: DataMapEntry | None = None

    if delta.component == 'TextField':
      props['text'] = {'path': delta.path}
      if delta.text_field_type:
        props['textFieldType'] = delta.text_field_type
      if delta.value is not None:
        payload = DataMapEntry(key=delta.path.split('/')[-1], valueString=str(delta.value))
    elif delta.component == 'CheckBox':
      props['value'] = {'path': delta.path}
      if delta.value is not None:
        payload = DataMapEntry(key=delta.path.split('/')[-1], valueBoolean=bool(delta.value))
    elif delta.component == 'Slider':
      props['value'] = {'path': delta.path}
      if delta.min_value is not None:
        props['minValue'] = delta.min_value
      if delta.max_value is not None:
        props['maxValue'] = delta.max_value
      if delta.value is not None:
        payload = DataMapEntry(key=delta.path.split('/')[-1], valueNumber=float(delta.value))
    elif delta.component == 'MultipleChoice':
      props['selections'] = {'path': delta.path}
      props['options'] = [
          {'label': {'literalString': option.label}, 'value': option.value}
          for option in (delta.options or [])
      ]
      if delta.value is not None:
        values = [str(v) for v in (delta.value if isinstance(delta.value, list) else [delta.value])]
        payload = DataMapEntry(
            key=delta.path.split('/')[-1],
            valueMap=[DataMapEntry(key=str(i), valueString=value) for i, value in enumerate(values)],
        )
    elif delta.component == 'DateTimeInput':
      props = {
          'label': {'literalString': delta.label},
          'value': {'path': delta.path},
          'enableDate': bool(delta.enable_date if delta.enable_date is not None else True),
          'enableTime': bool(delta.enable_time if delta.enable_time is not None else True),
      }
      if delta.value is not None:
        payload = DataMapEntry(key=delta.path.split('/')[-1], valueString=str(delta.value))

    component = ComponentNode(id=input_id, component={delta.component: props})
    frames = prefix_frames + [self._surface_update([parent_update, component])]
    if payload:
      parent_path, leaf = delta.path.rsplit('/', 1)
      frames.append(
          self._data_update(
              parent_path or '/',
              [DataMapEntry(key=leaf, **payload.model_dump(exclude_none=True, exclude={'key'}))],
          )
      )
    return frames

  def _add_divider(self, delta: AddDividerDelta) -> list[A2UIFrame]:
    prefix_frames, parent_id = self._wrap_root_primitive(delta.parent_id, 'overview', '关键信息')
    parent = self._ensure_container(parent_id)
    divider_id = self._register_id(delta.id)
    if divider_id == parent.component_id:
      raise ValueError(f'Divider id {divider_id} cannot equal parent id {parent.component_id}')
    self._append_child(parent_id, divider_id)
    parent_update = self._container_component(parent)
    divider = ComponentNode(id=divider_id, component={'Divider': {'axis': 'horizontal'}})
    return prefix_frames + [self._surface_update([parent_update, divider])]

  def _append_list_item(self, delta: AppendListItemDelta) -> list[A2UIFrame]:
    prefix_frames, parent_id = self._wrap_root_primitive(delta.parent_id, 'list', '列表内容')
    parent = self._ensure_container(parent_id)
    item_index = self.list_item_counts.get(parent.component_id, 0) + 1
    self.list_item_counts[parent.component_id] = item_index
    item_prefix = self._register_id(f'{delta.id}_{item_index}')
    wrapper_id = self._helper_id(item_prefix, 'wrapper')
    title_id = self._helper_id(item_prefix, 'title')
    detail_id = self._helper_id(item_prefix, 'detail')

    if wrapper_id == parent.component_id:
      raise ValueError(f'List item wrapper id {wrapper_id} cannot equal parent id {parent.component_id}')

    self._append_child(parent_id, wrapper_id)
    parent_update = self._container_component(parent)
    wrapper_children = [title_id] + ([detail_id] if delta.detail else [])
    wrapper = ComponentNode(
        id=wrapper_id,
        component={
            'Card': {
                'child': self._helper_id(item_prefix, 'content')
            }
        },
    )
    content_id = wrapper.component['Card']['child']
    content = ComponentNode(
        id=content_id,
        component={
            'Column': {
                'children': {'explicitList': wrapper_children},
                'alignment': 'stretch',
                'distribution': 'start',
            }
        },
    )
    title = ComponentNode(
        id=title_id,
        component={'Text': {'text': {'path': f'/lists/{parent.component_id}/{item_prefix}/title'}, 'usageHint': 'body'}},
    )
    components = [parent_update, wrapper, content, title]
    contents = [DataMapEntry(key='title', valueString=delta.title)]
    if delta.detail:
      components.append(
          ComponentNode(
              id=detail_id,
              component={'Text': {'text': {'path': f'/lists/{parent.component_id}/{item_prefix}/detail'}, 'usageHint': 'caption'}},
          )
      )
      contents.append(DataMapEntry(key='detail', valueString=delta.detail))
    return prefix_frames + [
        self._surface_update(components),
        self._data_update(f'/lists/{parent.component_id}/{item_prefix}', contents),
    ]
