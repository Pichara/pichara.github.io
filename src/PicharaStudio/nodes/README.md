# Custom Node Types

Custom React Flow node components for Pichara Diagram Studio.

Each node type is a React component that receives its data through React Flow's `NodeProps<T>` generic. Node components handle **rendering only** — they do not manage state or perform business logic.

## Organization

| Directory | Category | Examples |
|---|---|---|
| `base/` | Generic reusable shapes | Rectangle, rounded rectangle, diamond, ellipse, parallelogram |
| `shapes/` | Basic geometric shapes | Circle, hexagon, triangle, cylinder, cloud |
| `architecture/` | Software architecture | Service, database, queue, API gateway, load balancer, cache |
| `uml/` | UML diagrams | Class box, interface, actor, use case, state, activity |
| `database/` | ERD diagrams | Table, column group, foreign key indicator |

## Adding a New Node Type

1. Define a data interface extending `BaseNodeData` in `types/node.ts`.
2. Create the component in the appropriate category directory.
3. Register the type key in the `nodeTypes` map (see `index.ts` once created).
4. Add the shape to the sidebar library under the correct diagram category.

See [Development Guide](../../../docs/architecture/development-guide.md) for detailed instructions and code examples.
