import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDiagramSvg,
  diagramExportBounds,
  diagramFileName,
  escapeXml,
  scalePolygonPoints,
} from "../src/PicharaStudio/services/export/diagram-export.ts";
import { parseDiagramJson } from "../src/PicharaStudio/services/import/diagram-import.ts";
import { serializeDiagram } from "../src/PicharaStudio/services/persistence.ts";
import { computeEdgePath } from "../src/PicharaStudio/utils/edge-path.ts";

/** Two connected shapes, as the canvas would store them. */
function fixtureDiagram() {
  return {
    id: "diagram-1",
    name: "My Diagram",
    description: "",
    diagramType: "general",
    nodes: [
      {
        id: "n1",
        type: "shape-rectangle",
        position: { x: 100, y: 50 },
        width: 180,
        height: 60,
        data: { label: "Start <here>", shape: "rectangle" },
      },
      {
        id: "n2",
        type: "shape-diamond",
        position: { x: 100, y: 300 },
        width: 180,
        height: 60,
        data: { label: "Decide?", shape: "diamond" },
      },
    ],
    edges: [
      {
        id: "e1",
        type: "default",
        source: "n1",
        target: "n2",
        data: { label: "yes", style: { lineType: "curved" } },
      },
    ],
    viewport: { x: 0, y: 0, zoom: 1 },
    metadata: {
      createdAt: "2026-11-19T00:00:00.000Z",
      updatedAt: "2026-11-19T00:00:00.000Z",
      version: "1.0.0",
    },
  };
}

// --- bounds ----------------------------------------------------------------

test("diagramExportBounds pads the node area by 40px", () => {
  const bounds = diagramExportBounds(fixtureDiagram());
  assert.deepEqual(bounds, { x: 60, y: 10, width: 260, height: 390 });
});

test("diagramExportBounds falls back to a blank 400x300 canvas", () => {
  assert.deepEqual(diagramExportBounds({ ...fixtureDiagram(), nodes: [] }), {
    x: 0,
    y: 0,
    width: 400,
    height: 300,
  });
});

// --- SVG -------------------------------------------------------------------

test("buildDiagramSvg renders nodes, edge path, arrow and labels", () => {
  const svg = buildDiagramSvg(fixtureDiagram());
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg, /viewBox="60 10 260 390"/);
  // Rectangle node as <rect>, diamond as <polygon>.
  assert.match(svg, /<rect[^>]*width="180\.0"[^>]*height="60\.0"/);
  assert.match(svg, /<polygon points="90\.0,0\.0 180\.0,30\.0 90\.0,60\.0 0\.0,30\.0"/);
  // Edge path + arrowhead marker in the default edge color.
  assert.match(svg, /<path d="M 190 110 C 190[^"]*, 190[^"]*, 190 300"/);
  assert.match(svg, /<marker id="arrow-0"/);
  assert.match(svg, /marker-end="url\(#arrow-0\)"/);
  // Labels, with the node label XML-escaped.
  assert.match(svg, />Start &lt;here&gt;</);
  assert.match(svg, />Decide\?</);
  assert.match(svg, />yes</);
});

test("buildDiagramSvg skips edges whose endpoint node is missing", () => {
  const diagram = fixtureDiagram();
  diagram.edges = [
    { ...diagram.edges[0], target: "gone" },
  ];
  const svg = buildDiagramSvg(diagram);
  assert.doesNotMatch(svg, /<path d="M 190 110/);
  assert.match(svg, />Start &lt;here&gt;</);
});

test("buildDiagramSvg renders an empty diagram as a blank canvas", () => {
  const svg = buildDiagramSvg({ ...fixtureDiagram(), nodes: [], edges: [] });
  assert.match(svg, /viewBox="0 0 400 300"/);
  assert.doesNotMatch(svg, /<polygon|<ellipse/);
});

test("buildDiagramSvg draws group members at absolute positions under the group outline", () => {
  const diagram = fixtureDiagram();
  // n1 joins a group at (76, 26); its stored position is relative.
  diagram.nodes = [
    {
      id: "g1",
      type: "group",
      position: { x: 76, y: 26 },
      width: 228,
      height: 108,
      data: { label: "Group" },
    },
    {
      ...diagram.nodes[0],
      position: { x: 24, y: 24 },
      parentId: "g1",
    },
    diagram.nodes[1],
  ];
  const svg = buildDiagramSvg(diagram);
  // Group outline (dashed) comes before the member shape in the markup.
  const groupIndex = svg.indexOf('stroke-dasharray="6 4"');
  const memberIndex = svg.indexOf(">Start &lt;here&gt;<");
  assert.ok(groupIndex !== -1, "group outline missing");
  assert.ok(memberIndex !== -1, "member label missing");
  assert.ok(groupIndex < memberIndex, "group must render under its members");
  assert.match(svg, />Group</);
  // The member rect is at its absolute position (100, 50), not (24, 24).
  assert.match(svg, /<rect x="100\.0" y="50\.0" width="180\.0" height="60\.0"/);
  // Bounds cover the group, so the viewBox starts at the group minus padding.
  assert.match(svg, /viewBox="36 -14 /);
});

// --- helpers ---------------------------------------------------------------

test("escapeXml escapes markup characters", () => {
  assert.equal(escapeXml('a <b> & "c"'), "a &lt;b&gt; &amp; &quot;c&quot;");
});

test("scalePolygonPoints maps 0–100 points to pixel size", () => {
  assert.equal(
    scalePolygonPoints("50,0 100,50 50,100 0,50", 180, 60),
    "90.0,0.0 180.0,30.0 90.0,60.0 0.0,30.0"
  );
});

test("diagramFileName slugifies the diagram name", () => {
  assert.equal(diagramFileName(fixtureDiagram(), "json"), "my-diagram.json");
  assert.equal(
    diagramFileName({ ...fixtureDiagram(), name: "  " }, "svg"),
    "diagram.svg"
  );
  assert.equal(
    diagramFileName({ ...fixtureDiagram(), name: "Q3 Plan!" }, "png"),
    "q3-plan.png"
  );
});

// --- edge paths ------------------------------------------------------------

test("computeEdgePath draws a straight line between the handles", () => {
  const path = computeEdgePath(
    { x: 0, y: 0, width: 100, height: 50 },
    { x: 0, y: 200, width: 100, height: 50 },
    "straight"
  );
  assert.equal(path.d, "M 50 50 L 50 200");
  assert.deepEqual(
    { x: path.labelX, y: path.labelY },
    { x: 50, y: 125 }
  );
});

test("computeEdgePath steps through the vertical midpoint for orthogonal", () => {
  const path = computeEdgePath(
    { x: 0, y: 0, width: 100, height: 50 },
    { x: 300, y: 200, width: 100, height: 50 },
    "orthogonal"
  );
  assert.equal(path.d, "M 50 50 L 50 125 L 350 125 L 350 200");
  assert.deepEqual(
    { x: path.labelX, y: path.labelY },
    { x: 200, y: 125 }
  );
});

test("computeEdgePath curves vertically for the curved line type", () => {
  const path = computeEdgePath(
    { x: 0, y: 0, width: 100, height: 50 },
    { x: 0, y: 200, width: 100, height: 50 },
    "curved"
  );
  assert.equal(path.d, "M 50 50 C 50 125, 50 125, 50 200");
  assert.deepEqual(
    { x: path.labelX, y: path.labelY },
    { x: 50, y: 125 }
  );
});

// --- JSON import -----------------------------------------------------------

test("parseDiagramJson round-trips a serialized diagram", () => {
  const diagram = fixtureDiagram();
  const result = parseDiagramJson(serializeDiagram(diagram));
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.diagram.name, "My Diagram");
    assert.equal(result.diagram.nodes.length, 2);
    assert.equal(result.diagram.edges.length, 1);
  }
});

test("parseDiagramJson rejects malformed JSON", () => {
  const result = parseDiagramJson("{not json");
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /not valid JSON/);
});

test("parseDiagramJson rejects valid JSON with the wrong shape", () => {
  const missingNodes = parseDiagramJson(
    JSON.stringify({ id: "x", name: "x" })
  );
  assert.equal(missingNodes.ok, false);
  const wrongVersion = parseDiagramJson(
    JSON.stringify({ ...fixtureDiagram(), metadata: {} })
  );
  assert.equal(wrongVersion.ok, false);
  const array = parseDiagramJson(JSON.stringify([1, 2, 3]));
  assert.equal(array.ok, false);
});
