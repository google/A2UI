# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""A2UI v0.8 Type Definitions."""

from dataclasses import dataclass, field
from typing import Any, TypedDict, Union, Optional


class ValueLiteralString(TypedDict, total=False):
    """A literal string value."""

    literalString: str


class ValueLiteralNumber(TypedDict, total=False):
    """A literal number value."""

    literalNumber: float


class ValueLiteralBoolean(TypedDict, total=False):
    """A literal boolean value."""

    literalBoolean: bool


class ValuePath(TypedDict, total=False):
    """A path reference to the data model."""

    path: str


# A value can be literal or a path reference
A2UIValue = Union[
    str, ValueLiteralString, ValueLiteralNumber, ValueLiteralBoolean, ValuePath
]


class Component(TypedDict, total=False):
    """A2UI Component definition."""

    id: str
    weight: float
    component: dict[str, Any]  # {"ComponentType": {...props}}


class BeginRendering(TypedDict, total=False):
    """Begin rendering message."""

    surfaceId: str
    catalogId: str
    root: str
    styles: dict[str, Any]


class SurfaceUpdate(TypedDict, total=False):
    """Surface update message."""

    surfaceId: str
    components: list[Component]


class DataModelEntry(TypedDict, total=False):
    """A single entry in the data model."""

    key: str
    valueString: str
    valueNumber: float
    valueBoolean: bool
    valueMap: list["DataModelEntry"]


class DataModelUpdate(TypedDict, total=False):
    """Data model update message."""

    surfaceId: str
    path: str
    contents: list[DataModelEntry]


class DeleteSurface(TypedDict, total=False):
    """Delete surface message."""

    surfaceId: str


class A2UIMessage(TypedDict, total=False):
    """A2UI message - contains exactly one action."""

    beginRendering: BeginRendering
    surfaceUpdate: SurfaceUpdate
    dataModelUpdate: DataModelUpdate
    deleteSurface: DeleteSurface


@dataclass
class ComponentNode:
    """A resolved component node with data context."""

    id: str
    comp_type: str
    properties: dict[str, Any]
    data_context_path: str = "/"
    weight: float = 1.0
    children: list["ComponentNode"] = field(default_factory=list)


@dataclass
class Surface:
    """Represents a rendered UI surface."""

    surface_id: str
    root_id: Optional[str] = None
    components: dict[str, Component] = field(default_factory=dict)
    data_model: dict[str, Any] = field(default_factory=dict)
    styles: dict[str, Any] = field(default_factory=dict)
    component_tree: Optional[ComponentNode] = None
