# @a2ui/react

React implementation of A2UI.

**Important:** The sample code provided is for demonstration purposes and illustrates the mechanics of A2UI and the Agent-to-Agent (A2A) protocol. When building production applications, it is critical to treat any agent operating outside of your direct control as a potentially untrusted entity.

All operational data received from an external agent—including its AgentCard, messages, artifacts, and task statuses—should be handled as untrusted input. For example, a malicious agent could provide crafted data in its fields (e.g., name, skills.description) that, if used without sanitization to construct prompts for a Large Language Model (LLM), could expose your application to prompt injection attacks.

Similarly, any UI definition or data stream received must be treated as untrusted. Malicious agents could attempt to spoof legitimate interfaces to deceive users (phishing), inject malicious scripts via property values (XSS), or generate excessive layout complexity to degrade client performance (DoS). If your application supports optional embedded content (such as iframes or web views), additional care must be taken to prevent exposure to malicious external sites.

**Developer Responsibility:** Failure to properly validate data and strictly sandbox rendered content can introduce severe vulnerabilities. Developers are responsible for implementing appropriate security measures—such as input sanitization, Content Security Policies (CSP), strict isolation for optional embedded content, and secure credential handling—to protect their systems and users.

## Installation

```bash
npm install @a2ui/react @douyinfe/semi-ui react react-dom
```

## Usage

```tsx
import { A2UIProvider, Surface, MessageProcessor } from '@a2ui/react';

// Create a message processor instance
const processor = new MessageProcessor();

function App() {
  return (
    <A2UIProvider processor={processor}>
      <Surface surfaceId="main" />
    </A2UIProvider>
  );
}
```

## Features

- Full A2UI v0.8 protocol support
- React 18/19 compatible
- Semi UI component library integration
- TypeScript support
- Customizable component catalog

## Components

This renderer maps A2UI components to Semi UI:

| A2UI Component | Semi UI Component |
|----------------|-------------------|
| Text | Typography + MarkdownRender |
| Button | Button |
| Image | Image |
| Icon | Icon |
| Video | Native video element |
| Audio | AudioPlayer |
| Row | CSS Flex (row) |
| Column | CSS Flex (column) |
| Card | Card |
| List | Custom scroll container |
| Tabs | Tabs |
| Modal | Modal |
| TextField | Input / TextArea / InputNumber |
| Checkbox | Checkbox |
| DateTimeInput | DatePicker / TimePicker |
| MultipleChoice | Select / RadioGroup |
| Slider | Slider |
| Divider | Divider |

## Building

This package depends on the Lit renderer. Before building, ensure the Lit renderer is built:

```bash
# Build the Lit renderer first
cd ../lit
npm install
npm run build

# Then build this package
cd ../react
npm install
npm run build
```

## License

Apache-2.0
