/**
 * sidebar-collapse — collapsed/expanded state of the shape library
 * sidebar on desktop.
 *
 * The collapsed state is UI chrome, not diagram content: it lives in
 * `DiagramStudio` local state (the same place as the mobile drawer
 * state), never in the serializable diagram store.
 *
 * On narrow screens (< 768px) the sidebar is an overlay drawer driven
 * by `mobilePanel` instead: opening the drawer must show the library
 * even when it is collapsed on desktop, so the drawer always wins
 * over the collapsed flag.
 */

import type { MobilePanel } from "./mobile-panels";

/**
 * Next collapsed state after tapping the collapse/expand toggle.
 */
export function toggleShapeLibraryCollapsed(collapsed: boolean): boolean {
  return !collapsed;
}

/**
 * Whether the shape library sidebar should be rendered at all: it is
 * visible when expanded, or whenever the mobile drawer for it is open
 * (the drawer wins over the desktop collapsed flag).
 */
export function isShapeLibraryVisible(
  collapsed: boolean,
  mobilePanel: MobilePanel | null
): boolean {
  return !collapsed || mobilePanel === "shapes";
}
