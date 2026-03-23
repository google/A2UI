from __future__ import annotations

import json
from dataclasses import dataclass

from pydantic import ValidationError

from models import SKELETON_DELTA_ADAPTER, FinalizeDelta, SkeletonDelta


@dataclass
class PlanningDeltaRecord:
  raw_line: str
  delta: SkeletonDelta


class PlanningDeltaStreamParser:
  def __init__(self) -> None:
    self._buffer = ''
    self.raw_output = ''
    self.seen_planning_delta = False

  def feed(self, chunk: str) -> tuple[list[PlanningDeltaRecord], list[str]]:
    self.raw_output += chunk
    self._buffer += chunk
    return self._drain()

  def finish(self) -> tuple[list[PlanningDeltaRecord], list[str]]:
    parsed, rejected = self._drain()
    tail = self._buffer.strip()
    self._buffer = ''
    if not tail or tail == '```' or tail.startswith('```'):
      return parsed, rejected
    record = self._parse_line(tail)
    if record is not None:
      parsed.append(record)
    else:
      rejected.append(tail)
    return parsed, rejected

  def _drain(self) -> tuple[list[PlanningDeltaRecord], list[str]]:
    parsed: list[PlanningDeltaRecord] = []
    rejected: list[str] = []
    while '\n' in self._buffer:
      raw_line, self._buffer = self._buffer.split('\n', 1)
      line = raw_line.strip()
      if not line or line == '```' or line.startswith('```'):
        continue
      record = self._parse_line(line)
      if record is not None:
        parsed.append(record)
      else:
        rejected.append(line)
    return parsed, rejected

  def _parse_line(self, line: str) -> PlanningDeltaRecord | None:
    try:
      payload = json.loads(line)
      delta = SKELETON_DELTA_ADAPTER.validate_python(payload)
    except (json.JSONDecodeError, ValidationError, ValueError):
      return None
    self.seen_planning_delta = True
    if isinstance(delta, FinalizeDelta):
      delta.event = 'finalize_plan'
    return PlanningDeltaRecord(raw_line=line, delta=delta)
