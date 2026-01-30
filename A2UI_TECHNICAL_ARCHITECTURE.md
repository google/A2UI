# A2UI Technical Architecture Diagram

## Complete System Flow

```mermaid
graph TB
    subgraph "Agent Side"
        LLM[LLM/Agent<br/>Gemini/Claude/etc]
        A2A_EXT[A2A Extension<br/>A2uiExtension.java]
        JSON_GEN[A2UI JSON Generator<br/>Declarative UI Description]
    end

    subgraph "Transport Layer"
        A2A_PROTO[A2A Protocol<br/>JSONL Messages]
        MSG_TYPES[Message Types:<br/>• surfaceUpdate<br/>• dataModelUpdate<br/>• beginRendering<br/>• deleteSurface]
    end

    subgraph "Client: Message Processing"
        MSG_REC[Message Receiver<br/>Stream Reader]
        PROC[A2uiMessageProcessor<br/>Signal-based Model Builder]
        SIGNALS[Reactive Signals<br/>SignalArray/Map/Object/Set]
        DATA_MODEL[Data Model<br/>JSONPath-based]
    end

    subgraph "Client: Rendering System"
        ROOT[Root Component<br/>a2ui-root]
        REGISTRY[Component Registry<br/>Custom Components]
        RENDER[renderComponentTree<br/>Component Tree Builder]
        LIT[Lit Framework<br/>Template Rendering]
    end

    subgraph "Component System"
        BASE[Base: Root Class<br/>Extends LitElement]
        BUILTIN[Built-in Components<br/>Button, Card, Text, etc.]
        CUSTOM[Custom Components<br/>Registered via Registry]
        TYPES[Type System<br/>A2UITagNameMap]
    end

    subgraph "Data Binding & Reactivity"
        CONTEXT[Data Context Path<br/>e.g., /reservation]
        BINDING[Property Binding<br/>Two-way Data Flow]
        EFFECTS[Signal Effects<br/>Auto Re-render]
        WATCHER[SignalWatcher<br/>Lit Integration]
    end

    subgraph "Event System"
        USER_INTERACT[User Interaction<br/>Click, Input, etc.]
        STATE_EVENT[StateEvent<br/>a2ui.action]
        EVENT_DISPATCH[Event Dispatch<br/>to Client App]
        AGENT_FEEDBACK[Agent Feedback<br/>User Actions]
    end

    subgraph "DOM Output"
        HTML_OUT[HTML Elements<br/>a2ui-button, etc.]
        STYLES[Theme System<br/>CSS Styling]
        DOM[Browser DOM<br/>Rendered UI]
    end

    %% Agent Flow
    LLM -->|Generates UI Intent| JSON_GEN
    JSON_GEN -->|Creates A2UI JSON| A2A_EXT
    A2A_EXT -->|Wraps in A2A Part| A2A_PROTO

    %% Transport
    A2A_PROTO -->|JSONL Stream| MSG_TYPES
    MSG_TYPES -->|Messages| MSG_REC

    %% Message Processing
    MSG_REC -->|Process Messages| PROC
    PROC -->|Builds Reactive Model| SIGNALS
    SIGNALS -->|Stores Data| DATA_MODEL

    %% Rendering
    DATA_MODEL -->|Component Tree| ROOT
    ROOT -->|Looks up Components| REGISTRY
    REGISTRY -->|Custom Components| CUSTOM
    ROOT -->|Standard Components| RENDER
    RENDER -->|Creates Templates| LIT

    %% Component System
    LIT -->|Instantiates| BASE
    BASE -->|Inherits from| BUILTIN
    BASE -->|Can use| CUSTOM
    BUILTIN -->|Type-checked via| TYPES
    CUSTOM -->|Registered in| REGISTRY

    %% Data Binding
    DATA_MODEL -->|Reads from| CONTEXT
    CONTEXT -->|Binds to| BINDING
    BINDING -->|Updates via| EFFECTS
    EFFECTS -->|Watched by| WATCHER
    WATCHER -->|Triggers| LIT

    %% Events
    DOM -->|User Clicks| USER_INTERACT
    USER_INTERACT -->|Creates| STATE_EVENT
    STATE_EVENT -->|Dispatches| EVENT_DISPATCH
    EVENT_DISPATCH -->|Sends to| AGENT_FEEDBACK
    AGENT_FEEDBACK -.->|Updates UI| LLM

    %% DOM Output
    LIT -->|Renders| HTML_OUT
    HTML_OUT -->|Styled by| STYLES
    STYLES -->|Displays in| DOM

    style LLM fill:#e1f5ff
    style PROC fill:#fff4e1
    style ROOT fill:#e8f5e9
    style DATA_MODEL fill:#f3e5f5
    style DOM fill:#ffebee
```

## Component Rendering Pipeline

```mermaid
sequenceDiagram
    participant Agent
    participant Transport
    participant Processor
    participant Root
    participant Component
    participant Lit
    participant DOM

    Agent->>Transport: Generate A2UI JSON
    Note over Agent: surfaceUpdate message<br/>with components array
    
    Transport->>Processor: Stream JSONL Messages
    Processor->>Processor: Parse Messages
    Processor->>Processor: Build Signal-based Model
    
    Processor->>Root: Set childComponents (Signal)
    Root->>Root: renderComponentTree()
    
    alt Custom Component
        Root->>Root: Check componentRegistry
        Root->>Component: Instantiate Custom Element
    else Standard Component
        Root->>Root: Switch on component.type
        Root->>Component: Create Lit Template
    end
    
    Component->>Lit: html`<a2ui-button>`
    Lit->>DOM: Render to DOM
    
    DOM->>Component: User Interaction
    Component->>Root: Dispatch StateEvent
    Root->>Transport: Send Event to Agent
    Transport->>Agent: User Action Data
```

## Data Binding Flow

```mermaid
graph LR
    subgraph "Agent Updates Data"
        AGENT_UPDATE["Agent sends<br/>dataModelUpdate"]
        PATH["Path: /reservation/guests"]
        VALUE["Value: 2"]
    end

    subgraph "Signal System"
        SIGNAL_UPDATE[Signal Updates<br/>Reactive Model]
        SUBSCRIBE[Components Subscribe<br/>to Data Paths]
    end

    subgraph "Component Rendering"
        READ_DATA[Component Reads<br/>from Context Path]
        RENDER_UPDATE[Lit Re-renders<br/>Affected Components]
    end

    subgraph "User Interaction"
        USER_CHANGE[User Changes Value<br/>in TextField]
        WRITE_DATA[Component Writes<br/>to Data Model]
        SIGNAL_NOTIFY[Signal Notifies<br/>Subscribers]
    end

    AGENT_UPDATE -->|Updates| PATH
    PATH -->|Sets| VALUE
    VALUE -->|Triggers| SIGNAL_UPDATE
    SIGNAL_UPDATE -->|Notifies| SUBSCRIBE
    SUBSCRIBE -->|Reads| READ_DATA
    READ_DATA -->|Updates| RENDER_UPDATE

    USER_CHANGE -->|Modifies| WRITE_DATA
    WRITE_DATA -->|Updates| SIGNAL_NOTIFY
    SIGNAL_NOTIFY -->|Triggers| RENDER_UPDATE

    style AGENT_UPDATE fill:#e1f5ff
    style SIGNAL_UPDATE fill:#fff4e1
    style RENDER_UPDATE fill:#e8f5e9
    style WRITE_DATA fill:#f3e5f5
```

## Component Type System

```mermaid
graph TD
    subgraph "Type Definitions"
        TAG_MAP[A2UITagNameMap<br/>Type-safe Tag Mapping]
        COMP_TYPES[Component Types<br/>Button, Card, Text, etc.]
        CUSTOM_TYPES[Custom Types<br/>Registered Components]
    end

    subgraph "Component Classes"
        ROOT_CLASS[Root Class<br/>Base Component]
        BUILTIN_CLASS[Built-in Classes<br/>Button, Card, etc.]
        CUSTOM_CLASS[Custom Classes<br/>User-defined]
    end

    subgraph "Registration"
        REGISTRY["ComponentRegistry<br/>Type to Constructor Map"]
        REGISTER["register Function<br/>Type-safe Registration"]
    end

    subgraph "Instantiation"
        INSTANCE["instanceOf Function<br/>Tag to Instance"]
        CTOR["Constructor Lookup<br/>customElements.get"]
        NEW["new Constructor<br/>Type-safe Creation"]
    end

    TAG_MAP -->|Maps| COMP_TYPES
    TAG_MAP -->|Extends| CUSTOM_TYPES
    COMP_TYPES -->|Implemented by| BUILTIN_CLASS
    CUSTOM_TYPES -->|Implemented by| CUSTOM_CLASS
    BUILTIN_CLASS -->|Extends| ROOT_CLASS
    CUSTOM_CLASS -->|Extends| ROOT_CLASS

    CUSTOM_CLASS -->|Registered via| REGISTER
    REGISTER -->|Stores in| REGISTRY
    REGISTRY -->|Looked up by| INSTANCE
    INSTANCE -->|Finds| CTOR
    CTOR -->|Creates| NEW

    style TAG_MAP fill:#e1f5ff
    style REGISTRY fill:#fff4e1
    style INSTANCE fill:#e8f5e9
```

## Message Processing Details

```mermaid
graph TB
    subgraph "Input: JSONL Messages"
        MSG1["surfaceUpdate message"]
        MSG2["dataModelUpdate message"]
        MSG3["beginRendering message"]
    end

    subgraph "A2uiMessageProcessor"
        PARSE[Parse JSON Messages]
        VALIDATE[Validate Schema]
        BUILD[Build Component Map]
        DATA_BUILD[Build Data Model]
    end

    subgraph "Signal-based Storage"
        COMP_MAP["Component Map<br/>id to ComponentNode"]
        DATA_STORE["Data Store<br/>SignalMap/Object"]
        SURFACE_MAP["Surface Map<br/>surfaceId to Surface"]
    end

    subgraph "Output: Reactive Model"
        GET_SURFACES[getSurfaces<br/>Returns Surface Map]
        GET_COMPONENTS[getComponents<br/>Returns Component Array]
        GET_DATA[getData<br/>Returns Signal-based Data]
    end

    MSG1 -->|Process| PARSE
    MSG2 -->|Process| PARSE
    MSG3 -->|Process| PARSE

    PARSE -->|Validate| VALIDATE
    VALIDATE -->|If surfaceUpdate| BUILD
    VALIDATE -->|If dataModelUpdate| DATA_BUILD

    BUILD -->|Store| COMP_MAP
    DATA_BUILD -->|Store| DATA_STORE
    BUILD -->|Store| SURFACE_MAP

    COMP_MAP -->|Accessed via| GET_COMPONENTS
    DATA_STORE -->|Accessed via| GET_DATA
    SURFACE_MAP -->|Accessed via| GET_SURFACES

    style PARSE fill:#e1f5ff
    style DATA_STORE fill:#fff4e1
    style GET_SURFACES fill:#e8f5e9
```

## Event Flow: User Interaction to Agent

```mermaid
sequenceDiagram
    participant User
    participant Button
    participant Root
    participant EventSystem
    participant ClientApp
    participant Transport
    participant Agent

    User->>Button: Clicks Button
    Button->>Button: @click Handler
    Button->>Root: Create StateEvent
    Note over Button,Root: eventType: a2ui.action<br/>dataContextPath: /reservation<br/>sourceComponentId: btn1
    
    Root->>EventSystem: dispatchEvent(StateEvent)
    EventSystem->>ClientApp: Event Listener Receives
    ClientApp->>ClientApp: Extract Action Data
    ClientApp->>ClientApp: Include Data Context
    
    ClientApp->>Transport: Send to Agent
    Note over ClientApp,Transport: A2A Message with<br/>User Action Data
    
    Transport->>Agent: Deliver Action
    Agent->>Agent: Process User Action
    Agent->>Agent: Generate Response
    
    Agent->>Transport: Send Updated UI
    Transport->>ClientApp: A2UI Messages
    ClientApp->>Root: Update Component Tree
    Root->>Button: Re-render if Needed
```

## Key Technical Concepts

### 1. **Declarative UI Generation**
- Agent generates JSON describing UI intent, not implementation
- Components are referenced by type (e.g., "Button") not code
- Client maps types to native implementations

### 2. **Reactive Data Model**
- Signal-based reactivity for efficient updates
- JSONPath-like data context paths
- Automatic re-rendering when data changes

### 3. **Type Safety**
- TypeScript ensures tag names map to correct classes
- Component properties are type-checked
- Custom components follow interface contracts

### 4. **Extensibility**
- Component registry for custom components
- Framework-agnostic (same JSON works across renderers)
- Open catalog system for component definitions

### 5. **Security**
- No code execution from agent
- Only pre-approved components can be rendered
- Data binding is declarative, not executable
