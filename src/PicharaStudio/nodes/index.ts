/**
 * Custom node type registry — maps React Flow node type keys to components.
 *
 * Add a new node type by creating its component and adding one entry here;
 * existing types never need to change.
 */

import type { NodeTypes } from "@xyflow/react";
import BaseShapeNode from "./base/BaseShapeNode";
import GroupNode from "./group/GroupNode";
import { GROUP_NODE_TYPE } from "../constants";

export const customNodeTypes: NodeTypes = {
  "shape-rectangle": BaseShapeNode,
  "shape-diamond": BaseShapeNode,
  "shape-ellipse": BaseShapeNode,
  "shape-triangle": BaseShapeNode,
  "shape-parallelogram": BaseShapeNode,
  "shape-hexagon": BaseShapeNode,
  "shape-pentagon": BaseShapeNode,
  [GROUP_NODE_TYPE]: GroupNode,
};
