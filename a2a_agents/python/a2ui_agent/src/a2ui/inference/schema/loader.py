# Copyright 2026 Google LLC
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

import json
from json.decoder import JSONDecodeError
import os
import importlib.resources
from typing import List, Dict, Any

from abc import ABC, abstractmethod

ENCODING = "utf-8"


class A2uiSchemaLoader(ABC):
  """Abstract base class for loading schema files."""

  @abstractmethod
  def load(self, filename: str) -> Any:
    """Loads a JSON file."""
    pass


class FileSystemLoader(A2uiSchemaLoader):
  """Loads schema files from the local filesystem.

  This loader assumes that all referenced schema files are located in the
  same flat directory structure.
  """

  def __init__(self, base_dir: str):
    self.base_dir = base_dir

  def load(self, filename: str) -> Any:
    path = os.path.join(self.base_dir, filename)
    with open(path, "r", encoding=ENCODING) as f:
      return json.load(f)


class PackageLoader(A2uiSchemaLoader):
  """Loads schema files from package resources.

  This loader assumes that all referenced schema files are located in the
  same flat package structure.
  """

  def __init__(self, package_path: str):
    self.package_path = package_path

  def load(self, filename: str) -> Any:
    try:
      traversable = importlib.resources.files(self.package_path)
      resource_path = traversable.joinpath(filename)
      with resource_path.open("r", encoding=ENCODING) as f:
        return json.load(f)
    except (ModuleNotFoundError, FileNotFoundError, JSONDecodeError) as e:
      raise IOError(
          f"Could not load package resource {filename} in {self.package_path}: {e}"
      ) from e
