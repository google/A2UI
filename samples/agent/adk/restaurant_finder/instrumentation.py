import time
import contextvars
from dataclasses import dataclass, field
from typing import List
import logging

logger = logging.getLogger(__name__)

@dataclass
class InferenceStat:
    duration_ms: float

@dataclass
class ToolCallStat:
    tool_name: str
    duration_ms: float

@dataclass
class RequestStats:
    start_time: float = 0.0
    inferences: List[InferenceStat] = field(default_factory=list)
    tool_calls: List[ToolCallStat] = field(default_factory=list)

_request_stats = contextvars.ContextVar("request_stats", default=None)

def start_request():
    logger.info("instrumentation.start_request called")
    _request_stats.set(RequestStats(start_time=time.time()))

def end_request():
    stats = _request_stats.get()
    if stats:
        total_duration = (time.time() - stats.start_time) * 1000
        logger.info(f"Total request time: {total_duration:.2f} milliseconds")
        logger.info(f"Number of inferences: {len(stats.inferences)}")
        for i, inf in enumerate(stats.inferences):
            logger.info(f"    - Inference {i}: {inf.duration_ms:.2f} milliseconds")
        
        if stats.tool_calls:
            logger.info("Tool calls:")
            for tool in stats.tool_calls:
                logger.info(f"   - {tool.tool_name}: {tool.duration_ms:.2f} milliseconds")
    else:
        logger.warning("No request stats found for end_request")

def track_inference(duration_ms: float):
    stats = _request_stats.get()
    if stats:
        stats.inferences.append(InferenceStat(duration_ms=duration_ms))
    else:
        logger.warning(f"track_inference: No request stats found! Duration: {duration_ms}ms")

def track_tool_call(tool_name: str, duration_ms: float):
    stats = _request_stats.get()
    if stats:
        stats.tool_calls.append(ToolCallStat(tool_name=tool_name, duration_ms=duration_ms))
    else:
        logger.warning(f"track_tool_call: No request stats found! Tool: {tool_name}")
