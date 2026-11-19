# Architecture Overview — Pichara Diagram Studio

## System Context

Pichara Diagram Studio is a client-side diagram editor embedded within the Pichara.io portfolio website. It shares the same Vite build, the same deployment pipeline, and the same GitHub Pages hosting — but operates as an independent feature module with its own component tree, state management, and routing path.

```mermaid
flowchart LR
    subgraph GH["GitHub Pages"]
        direction TB
        Portfolio["Portfolio Site<br/>(/)"]
        Editor["Diagram Studio<br/>(/diagram)"]
    end

    User["User"] -->|browses portfolio| Portfolio
    User -->|opens editor| Editor
    Editor -->|lazy loaded| ReactFlow["React Flow Canvas"]
    Editor -->|persists locally| Storage["Browser LocalStorage"]
    Editor -->|exports files| Files["JSON / SVG / PNG"]
```

## Application Boundaries

### Portfolio (existing)

- **Path:** `/`
- **Components:** `src/components/` — Hero, About, Experience, Projects, Contact
- **Data:** `src/data.ts` — static profile, timeline, and project data
- **Styling:** `src/index.css` — dark-green Matrix-inspired theme
- **Animation:** `src/effects/` — Matrix digital rain engine

### Diagram Studio (new)

- **Path:** `/diagram`
- **Module root:** `src/PicharaStudio/`
- **Rendering:** React Flow (`@xyflow/react`) infinite canvas
- **State:** Zustand stores for diagram data, editor UI, and history
- **Persistence:** LocalStorage + file export/import — no backend

The two boundaries communicate only through the router. The portfolio does not import diagram editor code, and the diagram editor does not import portfolio components.

## Module Architecture

```mermaid
flowchart TD
    subgraph Entry["Application Entry"]
        Main["main.tsx"]
        Router["React Router"]
    end

    subgraph Portfolio["Portfolio Module"]
        App["App.tsx"]
        Components["src/components/*"]
    end

    subgraph Studio["PicharaStudio Module"]
        direction TB
        StudioRoot["Studio Root Component"]

        subgraph UI["UI Layer"]
            Toolbar["Toolbar"]
            Sidebar["Sidebar / Shape Library"]
            Canvas["Canvas (React Flow)"]
            Panels["Properties Panel"]
            StatusBar["Status Bar"]
        end

        subgraph Domain["Domain Layer"]
            Types["types/"]
            Nodes["nodes/ (custom node types)"]
            Edges["edges/ (custom edge types)"]
            Constants["constants/"]
        end

        subgraph State["State Layer"]
            DiagramStore["Diagram Store"]
            UIStore["UI Store"]
            HistoryStore["History Store"]
        end

        subgraph Services["Service Layer"]
            ExportSvc["Export (JSON/SVG/PNG)"]
            ImportSvc["Import (JSON)"]
            Templates["Diagram Templates"]
        end

        subgraph Utils["Utilities"]
            IdGen["ID Generation"]
            Geometry["Geometry Math"]
            Serialization["Serialization Helpers"]
        end
    end

    Main --> Router
    Router -->|"/"| App
    Router -->|"/diagram"| StudioRoot
    App --> Components

    StudioRoot --> UI
    UI --> State
    UI --> Domain
    State --> Domain
    Services --> Domain
    Services --> Utils
    State --> Utils
```

## Data Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Canvas Component
    participant S as Diagram Store (Zustand)
    participant H as History Store
    participant N as Custom Node
    participant E as Export Service

    U->>C: Drag node onto canvas
    C->>S: addNode(nodeData)
    S->>H: pushHistory(snapshot)
    S->>C: State update (re-render)
    C->>N: Render custom node component

    U->>C: Connect two nodes
    C->>S: addEdge(edgeData)
    S->>H: pushHistory(snapshot)
    S->>C: State update (re-render)

    U->>C: Press Ctrl+Z
    C->>H: undo()
    H->>S: restoreSnapshot(previous)
    S->>C: State update (re-render)

    U->>C: Export diagram
    C->>E: exportToJSON(diagramState)
    E->>U: Download .json file
```

## Diagram Rendering

React Flow (`@xyflow/react`) is the rendering engine. It provides:

- **Infinite canvas** with pan and zoom
- **Node rendering** via custom React components
- **Edge rendering** with configurable path types (bezier, step, smoothstep, straight)
- **Built-in interactions:** drag, select, multi-select, connect, resize
- **Minimap, controls, and background** components

Pichara Diagram Studio extends React Flow by:

1. **Registering custom node types** — Each diagram category (flowchart, UML, ERD, etc.) defines its own node components in `nodes/`.
2. **Registering custom edge types** — Specialized edge renderers for different diagram styles.
3. **Managing state externally** — React Flow's internal state is synchronized with Zustand stores so that undo/redo, serialization, and persistence work correctly.

## State Management Strategy

```mermaid
flowchart LR
    subgraph Stores["Zustand Stores"]
        DS["Diagram Store<br/>nodes, edges, viewport"]
        US["UI Store<br/>panels, selection, tools"]
        HS["History Store<br/>undo/redo stack"]
    end

    subgraph Consumers["Consumers"]
        Canvas["Canvas"]
        Toolbar["Toolbar"]
        Props["Properties Panel"]
        Sidebar["Sidebar"]
        Export["Export Service"]
    end

    DS --> Canvas
    DS --> Export
    US --> Toolbar
    US --> Props
    US --> Sidebar
    HS --> DS
```

**Diagram Store:** The source of truth for all diagram data — nodes, edges, viewport position, and diagram metadata. This store's state must be fully JSON-serializable at all times.

**UI Store:** Transient editor state — which panel is open, current tool mode, selection state, zoom level display. Not persisted.

**History Store:** Maintains an undo/redo stack of diagram snapshots. Operates on the Diagram Store's state.

## Routing Strategy

The application will use `react-router-dom` with `HashRouter` for GitHub Pages compatibility:

| Path | Component | Description |
|---|---|---|
| `/` | `App` (portfolio) | Existing portfolio site |
| `/diagram` | `DiagramStudio` (lazy loaded) | Diagram editor application |

`HashRouter` is chosen over `BrowserRouter` because GitHub Pages does not support server-side URL rewriting. With `HashRouter`, the URL becomes `https://pichara.github.io/#/diagram`, which works without any server configuration.

## Technology Rationale

See [ADR-001: Diagram Rendering Engine](../decisions/001-diagram-rendering-engine.md) for the React Flow selection rationale.

**Why Zustand over Redux / Context / Jotai:**
- Minimal boilerplate — no providers, reducers, or action creators.
- Works outside React — services and utilities can read/write state.
- Fine-grained subscriptions — components re-render only when their selected slice changes.
- Small bundle (~1 KB gzipped).
- Immer middleware available for complex immutable updates.

**Why HashRouter over BrowserRouter:**
- GitHub Pages serves a single `index.html` and does not support URL rewriting.
- `BrowserRouter` would require a `404.html` hack that is fragile.
- `HashRouter` works out of the box with no server configuration.
- The trade-off (hash in URL) is acceptable for a tool application.
