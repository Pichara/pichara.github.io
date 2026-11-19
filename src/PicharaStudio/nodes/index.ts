/**
 * Custom node type registry — maps React Flow node type keys to components.
 *
 * Add a new node type by creating its component and adding one entry here;
 * existing types never need to change.
 */

import type { NodeTypes } from "@xyflow/react";
import BaseShapeNode from "./base/BaseShapeNode";

export const customNodeTypes: NodeTypes = {
  "shape-rectangle": BaseShapeNode,
  "shape-diamond": BaseShapeNode,
  "shape-ellipse": BaseShapeNode,
};
