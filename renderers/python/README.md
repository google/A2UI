# A2UI Python Renderer

Python implementation of A2UI (Agent to UI) protocol renderer.

## Installation

```bash
pip install -e renderers/python
```

For Reflex support:
```bash
pip install -e "renderers/python[reflex]"
```

## Usage

```python
from a2ui.v0_8 import MessageProcessor, HTMLRenderer

# Create processor
processor = MessageProcessor()

# Process A2UI messages from agent
messages = [...]  # A2UI messages from A2A response
processor.process_messages(messages)

# Render to HTML
renderer = HTMLRenderer(processor)
html = renderer.render_surface("my-surface-id")
```

## Security Notice

**Important**: The sample code provided is for demonstration purposes. When building production applications, treat any agent operating outside of your direct control as potentially untrusted.

All operational data received from an external agent should be handled as untrusted input. Developers are responsible for implementing appropriate security measures including input sanitization, Content Security Policies (CSP), and strict isolation for embedded content.
