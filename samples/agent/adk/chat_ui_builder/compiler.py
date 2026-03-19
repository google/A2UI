from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from models import (
    A2UIFrame,
    AddButtonDelta,
    AddDividerDelta,
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


@dataclass
class ContainerState:
  component_id: str
  container_type: str
  child_ids: list[str] = field(default_factory=list)


class FrameCompiler:
  def __init__(self) -> None:
    self.surface_id = "main"
    self.root_id = "root"
    self.initialized = False
    self.containers: dict[str, ContainerState] = {}
    self.children: dict[str, list[str]] = {}
    self.list_item_counts: dict[str, int] = {}

  def apply(self, delta: Any) -> list[A2UIFrame]:
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
    if isinstance(delta, AddInputDelta):
      return self._add_input(delta)
    if isinstance(delta, AddDividerDelta):
      return self._add_divider(delta)
    if isinstance(delta, AppendListItemDelta):
      return self._append_list_item(delta)
    return []

  def _ensure_container(self, parent_id: str) -> ContainerState:
    if parent_id not in self.containers:
      raise ValueError(f"Unknown parent/container id: {parent_id}")
    return self.containers[parent_id]

  def _append_child(self, parent_id: str, child_id: str) -> None:
    container = self._ensure_container(parent_id)
    container.child_ids.append(child_id)

  def _surface_update(self, components: list[ComponentNode]) -> A2UIFrame:
    return A2UIFrame(surfaceUpdate={"surfaceId": self.surface_id, "components": components})

  def _data_update(self, path: str, contents: list[DataMapEntry]) -> A2UIFrame:
    return A2UIFrame(dataModelUpdate={"surfaceId": self.surface_id, "path": path, "contents": contents})

  def _container_component(self, container: ContainerState) -> ComponentNode:
    if container.container_type == "Row":
      component = {
          "Row": {
              "children": {"explicitList": container.child_ids},
              "alignment": "center",
              "distribution": "start",
          }
      }
    elif container.container_type == "List":
      component = {
          "List": {
              "children": {"explicitList": container.child_ids},
              "direction": "vertical",
              "alignment": "stretch",
          }
      }
    else:
      component = {
          "Column": {
              "children": {"explicitList": container.child_ids},
              "alignment": "stretch",
              "distribution": "start",
          }
      }
    return ComponentNode(id=container.component_id, component=component)

  def _init_surface(self, delta: InitSurfaceDelta) -> list[A2UIFrame]:
    self.surface_id = delta.surface_id
    self.initialized = True
    self.containers = {
        self.root_id: ContainerState(component_id=self.root_id, container_type="Column")
    }
    components = [
        ComponentNode(
            id=self.root_id,
            component={"Column": {"children": {"explicitList": []}, "alignment": "stretch", "distribution": "start"}},
        )
    ]
    data_entries = [DataMapEntry(key="title", valueString=delta.title)]
    if delta.summary:
      data_entries.append(DataMapEntry(key="summary", valueString=delta.summary))
      summary_id = "surface_summary"
      title_id = "surface_title"
      self.containers[self.root_id].child_ids.extend([title_id, summary_id])
      components[0] = ComponentNode(
          id=self.root_id,
          component={"Column": {"children": {"explicitList": [title_id, summary_id]}, "alignment": "stretch", "distribution": "start"}},
      )
      components.extend(
          [
              ComponentNode(id=title_id, component={"Text": {"text": {"path": "/title"}, "usageHint": "h1"}}),
              ComponentNode(id=summary_id, component={"Text": {"text": {"path": "/summary"}, "usageHint": "body"}}),
          ]
      )
    else:
      title_id = "surface_title"
      self.containers[self.root_id].child_ids.append(title_id)
      components[0] = ComponentNode(
          id=self.root_id,
          component={"Column": {"children": {"explicitList": [title_id]}, "alignment": "stretch", "distribution": "start"}},
      )
      components.append(ComponentNode(id=title_id, component={"Text": {"text": {"path": "/title"}, "usageHint": "h1"}}))

    return [
        A2UIFrame(beginRendering={"surfaceId": self.surface_id, "root": self.root_id, "styles": delta.theme.model_dump(exclude_none=True) if delta.theme else None}),
        self._surface_update(components),
        self._data_update("/", data_entries),
    ]

  def _add_section(self, delta: AddSectionDelta) -> list[A2UIFrame]:
    parent = self._ensure_container(delta.parent_id)
    components: list[ComponentNode] = []
    emitted_data: list[A2UIFrame] = []

    if delta.layout == "Card":
      content_id = f"{delta.id}__content"
      self._append_child(delta.parent_id, delta.id)
      self.containers[delta.id] = ContainerState(component_id=content_id, container_type="Column")
      components.append(ComponentNode(id=delta.id, component={"Card": {"child": content_id}}))
      explicit_children: list[str] = []
      if delta.title:
        title_id = f"{delta.id}__title"
        explicit_children.append(title_id)
        components.append(ComponentNode(id=title_id, component={"Text": {"text": {"path": f"/sections/{delta.id}/title"}, "usageHint": "h2"}}))
      if delta.description:
        desc_id = f"{delta.id}__description"
        explicit_children.append(desc_id)
        components.append(ComponentNode(id=desc_id, component={"Text": {"text": {"path": f"/sections/{delta.id}/description"}, "usageHint": "body"}}))
      components.append(ComponentNode(id=content_id, component={"Column": {"children": {"explicitList": explicit_children}, "alignment": "stretch", "distribution": "start"}}))
      if delta.title:
        emitted_data.append(self._data_update(f"/sections/{delta.id}", [DataMapEntry(key="title", valueString=delta.title)]))
      if delta.description:
        emitted_data.append(self._data_update(f"/sections/{delta.id}", [DataMapEntry(key="description", valueString=delta.description)]))
    else:
      self._append_child(delta.parent_id, delta.id)
      self.containers[delta.id] = ContainerState(component_id=delta.id, container_type=delta.layout)
      explicit_children: list[str] = []
      if delta.title:
        title_id = f"{delta.id}__title"
        explicit_children.append(title_id)
        components.append(ComponentNode(id=title_id, component={"Text": {"text": {"path": f"/sections/{delta.id}/title"}, "usageHint": "h2"}}))
        emitted_data.append(self._data_update(f"/sections/{delta.id}", [DataMapEntry(key="title", valueString=delta.title)]))
      if delta.description:
        desc_id = f"{delta.id}__description"
        explicit_children.append(desc_id)
        components.append(ComponentNode(id=desc_id, component={"Text": {"text": {"path": f"/sections/{delta.id}/description"}, "usageHint": "body"}}))
        emitted_data.append(self._data_update(f"/sections/{delta.id}", [DataMapEntry(key="description", valueString=delta.description)]))
      section_state = self.containers[delta.id]
      section_state.child_ids = explicit_children
      components.append(self._container_component(section_state))

    parent_component = self._container_component(parent)
    return [self._surface_update([parent_component] + components)] + emitted_data

  def _add_text(self, delta: AddTextDelta) -> list[A2UIFrame]:
    parent = self._ensure_container(delta.parent_id)
    self._append_child(delta.parent_id, delta.id)
    parent_update = self._container_component(parent)
    text_component = ComponentNode(id=delta.id, component={"Text": {"text": {"path": f"/content/{delta.id}/text"}, "usageHint": delta.usage_hint}})
    return [self._surface_update([parent_update, text_component]), self._data_update(f"/content/{delta.id}", [DataMapEntry(key="text", valueString=delta.text)])]

  def _add_key_value(self, delta: AddKeyValueDelta) -> list[A2UIFrame]:
    parent = self._ensure_container(delta.parent_id)
    row_id = delta.id
    label_id = f"{delta.id}__label"
    value_id = f"{delta.id}__value"
    self._append_child(delta.parent_id, row_id)
    parent_update = self._container_component(parent)
    row = ComponentNode(id=row_id, component={"Row": {"children": {"explicitList": [label_id, value_id]}, "alignment": "center", "distribution": "spaceBetween"}})
    label = ComponentNode(id=label_id, component={"Text": {"text": {"path": f"/content/{delta.id}/label"}, "usageHint": "caption"}})
    value = ComponentNode(id=value_id, component={"Text": {"text": {"path": f"/content/{delta.id}/value"}, "usageHint": "body"}})
    return [
        self._surface_update([parent_update, row, label, value]),
        self._data_update(f"/content/{delta.id}", [DataMapEntry(key="label", valueString=delta.label), DataMapEntry(key="value", valueString=delta.value)]),
    ]

  def _add_image(self, delta: AddImageDelta) -> list[A2UIFrame]:
    parent = self._ensure_container(delta.parent_id)
    self._append_child(delta.parent_id, delta.id)
    parent_update = self._container_component(parent)
    image_props: dict[str, Any] = {"url": {"path": f"/content/{delta.id}/url"}}
    if delta.usage_hint:
      image_props["usageHint"] = delta.usage_hint
    image = ComponentNode(id=delta.id, component={"Image": image_props})
    return [self._surface_update([parent_update, image]), self._data_update(f"/content/{delta.id}", [DataMapEntry(key="url", valueString=delta.url)])]

  def _add_button(self, delta: AddButtonDelta) -> list[A2UIFrame]:
    parent = self._ensure_container(delta.parent_id)
    text_id = f"{delta.id}__label"
    self._append_child(delta.parent_id, delta.id)
    parent_update = self._container_component(parent)
    button = ComponentNode(
        id=delta.id,
        component={
            "Button": {
                "child": text_id,
                "primary": delta.primary,
                "action": {"name": delta.action_name},
            }
        },
    )
    label = ComponentNode(id=text_id, component={"Text": {"text": {"path": f"/content/{delta.id}/label"}, "usageHint": "body"}})
    return [self._surface_update([parent_update, button, label]), self._data_update(f"/content/{delta.id}", [DataMapEntry(key="label", valueString=delta.label)])]

  def _add_input(self, delta: AddInputDelta) -> list[A2UIFrame]:
    parent = self._ensure_container(delta.parent_id)
    self._append_child(delta.parent_id, delta.id)
    parent_update = self._container_component(parent)
    props: dict[str, Any] = {"label": {"literalString": delta.label}}
    payload: DataMapEntry | None = None

    if delta.component == "TextField":
      props["text"] = {"path": delta.path}
      if delta.text_field_type:
        props["textFieldType"] = delta.text_field_type
      if delta.value is not None:
        payload = DataMapEntry(key=delta.path.split("/")[-1], valueString=str(delta.value))
    elif delta.component == "CheckBox":
      props["value"] = {"path": delta.path}
      if delta.value is not None:
        payload = DataMapEntry(key=delta.path.split("/")[-1], valueBoolean=bool(delta.value))
    elif delta.component == "Slider":
      props["value"] = {"path": delta.path}
      if delta.min_value is not None:
        props["minValue"] = delta.min_value
      if delta.max_value is not None:
        props["maxValue"] = delta.max_value
      if delta.value is not None:
        payload = DataMapEntry(key=delta.path.split("/")[-1], valueNumber=float(delta.value))
    elif delta.component == "MultipleChoice":
      props["selections"] = {"path": delta.path}
      props["options"] = [{"label": {"literalString": option.label}, "value": option.value} for option in (delta.options or [])]
      if delta.value is not None:
        values = [str(v) for v in (delta.value if isinstance(delta.value, list) else [delta.value])]
        payload = DataMapEntry(
            key=delta.path.split("/")[-1],
            valueMap=[DataMapEntry(key=str(i), valueString=value) for i, value in enumerate(values)],
        )
    elif delta.component == "DateTimeInput":
      props = {
          "label": {"literalString": delta.label},
          "value": {"path": delta.path},
          "enableDate": bool(delta.enable_date if delta.enable_date is not None else True),
          "enableTime": bool(delta.enable_time if delta.enable_time is not None else True),
      }
      if delta.value is not None:
        payload = DataMapEntry(key=delta.path.split("/")[-1], valueString=str(delta.value))

    component = ComponentNode(id=delta.id, component={delta.component: props})
    frames = [self._surface_update([parent_update, component])]
    if payload:
      parent_path, leaf = delta.path.rsplit("/", 1)
      frames.append(
          self._data_update(
              parent_path or "/",
              [DataMapEntry(key=leaf, **payload.model_dump(exclude_none=True, exclude={"key"}))],
          )
      )
    return frames

  def _add_divider(self, delta: AddDividerDelta) -> list[A2UIFrame]:
    parent = self._ensure_container(delta.parent_id)
    self._append_child(delta.parent_id, delta.id)
    parent_update = self._container_component(parent)
    divider = ComponentNode(id=delta.id, component={"Divider": {"axis": "horizontal"}})
    return [self._surface_update([parent_update, divider])]

  def _append_list_item(self, delta: AppendListItemDelta) -> list[A2UIFrame]:
    parent = self._ensure_container(delta.parent_id)
    item_index = self.list_item_counts.get(delta.parent_id, 0) + 1
    self.list_item_counts[delta.parent_id] = item_index
    wrapper_id = f"{delta.id}__item_{item_index}"
    title_id = f"{wrapper_id}__title"
    detail_id = f"{wrapper_id}__detail"
    self._append_child(delta.parent_id, wrapper_id)
    parent_update = self._container_component(parent)
    wrapper_children = [title_id] + ([detail_id] if delta.detail else [])
    wrapper = ComponentNode(id=wrapper_id, component={"Column": {"children": {"explicitList": wrapper_children}, "alignment": "stretch", "distribution": "start"}})
    title = ComponentNode(id=title_id, component={"Text": {"text": {"path": f"/lists/{delta.parent_id}/{wrapper_id}/title"}, "usageHint": "body"}})
    components = [parent_update, wrapper, title]
    contents = [DataMapEntry(key="title", valueString=delta.title)]
    if delta.detail:
      components.append(ComponentNode(id=detail_id, component={"Text": {"text": {"path": f"/lists/{delta.parent_id}/{wrapper_id}/detail"}, "usageHint": "caption"}}))
      contents.append(DataMapEntry(key="detail", valueString=delta.detail))
    return [self._surface_update(components), self._data_update(f"/lists/{delta.parent_id}/{wrapper_id}", contents)]
