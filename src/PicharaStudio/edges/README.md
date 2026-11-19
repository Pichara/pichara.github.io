# Custom Edge Types

Custom React Flow edge components for Pichara Diagram Studio.

Each edge type is a React component that receives its data through React Flow's `EdgeProps<T>` generic. Edge components handle **rendering only**.

## Planned Edge Types

| Type Key | Description | Use Case |
|---|---|---|
| `default` | Standard solid line with arrow | General purpose |
| `dashed` | Dashed line | Optional dependencies, weak references |
| `bidirectional` | Arrows on both ends | Two-way communication |
| `association` | Solid line without arrow | UML association |
| `inheritance` | Line with hollow triangle head | UML inheritance / generalization |
| `composition` | Line with filled diamond head | UML composition |
| `aggregation` | Line with hollow diamond head | UML aggregation |
| `dependency` | Dashed line with open arrow | UML dependency |

## Adding a New Edge Type

1. Optionally define a data interface extending `BaseEdgeData` in `types/edge.ts`.
2. Create the component in this directory.
3. Register the type key in the `edgeTypes` map.

See [Development Guide](../../../docs/architecture/development-guide.md) for detailed instructions.
