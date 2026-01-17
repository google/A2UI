# Digital Botanist - Reflex Client

A Python-based web client for the Digital Botanist A2A agent, built with [Reflex](https://reflex.dev/).

## Prerequisites

- Python 3.10+
- Digital Botanist agent running on `http://localhost:10004`

## Getting Started

### 1. Start the Digital Botanist Agent

```bash
cd samples/agent/adk/digital_botanist
python -m __main__
```

Verify the agent is running at `http://localhost:10004`.

### 2. Install Dependencies

```bash
cd samples/client/reflex/botanist
pip install -r requirements.txt
```

### 3. Initialize Reflex (first time only)

```bash
reflex init
```

### 4. Run the Client

```bash
reflex run
```

The client will be available at `http://localhost:3000`.

## Features

- **Plant Search**: Search for plants by name or description
- **Quick Actions**: One-click buttons for common searches
- **A2UI Rendering**: Renders A2UI responses from the botanist agent
- **Responsive Design**: Green-themed design matching other botanist clients

## Project Structure

```
botanist/
├── botanist/
│   ├── __init__.py      # Package initialization
│   ├── botanist.py      # Main application and state
│   ├── a2ui_renderer.py # A2UI message processing
│   └── style.py         # CSS styling
├── requirements.txt     # Python dependencies
└── rxconfig.py         # Reflex configuration
```

## License

Copyright 2025 Google LLC. Licensed under the Apache License, Version 2.0.
