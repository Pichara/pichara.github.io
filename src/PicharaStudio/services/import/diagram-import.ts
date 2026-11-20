/**
 * Diagram import service — parses a JSON file back into a `Diagram`.
 *
 * Never trust imported data: the text is parsed and then validated by
 * `services/persistence.ts` (`validateDiagram`), the same gate used for
 * LocalStorage loads. Anything malformed or with the wrong shape is
 * rejected with a human-readable error instead of reaching the store.
 *
 * Import paths use explicit `.ts` extensions so the Node test runner can
 * resolve them (see `utils/history-stack.ts` for the same convention).
 */

import { parseDiagramText } from "../persistence.ts";
import type { Diagram } from "../../types/index.ts";

/** Result of parsing an imported file. */
export type ParseDiagramResult =
  | { ok: true; diagram: Diagram }
  | { ok: false; error: string };

/**
 * Parse file text as a diagram. Returns the diagram when the JSON parses
 * and passes validation, otherwise a short error message for the UI.
 */
export function parseDiagramJson(text: string): ParseDiagramResult {
  const result = parseDiagramText(text);
  if (result.ok) return result;
  return {
    ok: false,
    error:
      result.reason === "invalid-json"
        ? "That file is not valid JSON."
        : "That file is not a Pichara Studio diagram (missing name, nodes, edges or version).",
  };
}
