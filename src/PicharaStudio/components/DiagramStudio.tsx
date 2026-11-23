/**
 * DiagramStudio — root component of the diagram editor.
 *
 * Layout: toolbar on top, shape library on the left, React Flow canvas
 * in the middle, status bar at the bottom. The canvas takes the full
 * width between the library and the right edge: formatting is no longer
 * a right-side panel — it opens as a popup above the clicked item
 * (right-click or the F key; see
 * `components/panels/FormatPopup.tsx`). This component is lazy-loaded
 * by the router, so the portfolio never downloads editor code until
 * the user opens /diagram.
 *
 * On narrow screens (< 768px) the shape library becomes an overlay
 * drawer: hidden until opened from the toolbar, so the canvas keeps
 * the full width. See DiagramStudio.css for the breakpoint rules.
 */

import { useCallback, useRef, useState } from "react";
import Toolbar from "./toolbar/Toolbar";
import ShapeLibrary from "./sidebar/ShapeLibrary";
import DiagramCanvas from "./canvas/DiagramCanvas";
import StatusBar from "./status-bar/StatusBar";
import ShortcutsDialog from "./dialogs/ShortcutsDialog";
import type { FormatPopupAnchor } from "./panels/FormatPopup";
import { useDiagramPersistence } from "../hooks/useDiagramPersistence";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import {
  toggleMobilePanel,
  type MobilePanel,
} from "../utils/mobile-panels";
import {
  isShapeLibraryVisible,
  toggleShapeLibraryCollapsed,
} from "../utils/sidebar-collapse";
import "./DiagramStudio.css";

export default function DiagramStudio() {
  const { saveFailed } = useDiagramPersistence();
  // Shortcuts dialog state lives here so both the "?" key (handled by
  // the hook) and the toolbar "?" button can open it. Stable callback
  // so the hook does not re-register its listener on every render.
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const openShortcuts = useCallback(() => setShortcutsOpen(true), []);

  // Where the format popup anchors, or null when it is closed. The
  // popup itself renders inside the canvas (it needs the React Flow
  // tree to convert the selection's flow bounds to screen pixels);
  // the anchor lives here so the F key (handled above the canvas) can
  // open it for the current selection, while right-click opens it at
  // the click point (see DiagramCanvas).
  const [formatAnchor, setFormatAnchor] =
    useState<FormatPopupAnchor | null>(null);
  const closeFormatPopup = useCallback(() => setFormatAnchor(null), []);
  const openFormatForSelection = useCallback(
    () => setFormatAnchor({ kind: "selection" }),
    []
  );
  const openFormatAtPoint = useCallback(
    (x: number, y: number) => setFormatAnchor({ kind: "point", x, y }),
    []
  );
  useKeyboardShortcuts(openShortcuts, openFormatForSelection);

  // Which side panel is open as an overlay drawer on narrow screens.
  // Ignored on desktop, where the shape library is always visible.
  const [mobilePanel, setMobilePanel] = useState<MobilePanel | null>(null);

  // Whether the shape library sidebar is collapsed on desktop. UI
  // chrome only — it never enters the serializable diagram state.
  // On narrow screens the drawer state above wins over this flag
  // (see isShapeLibraryVisible), so collapsing here cannot break
  // opening the library drawer on a phone.
  const [shapesCollapsed, setShapesCollapsed] = useState(false);
  const toggleShapesCollapsed = useCallback(
    () => setShapesCollapsed((current) => toggleShapeLibraryCollapsed(current)),
    []
  );

  // Ref to the `.studio-canvas` wrapper, shared by the canvas and the
  // shape library: click-to-add measures the actual canvas pane through
  // it instead of guessing from the window size (see ShapeLibrary).
  const canvasRef = useRef<HTMLDivElement>(null);

  return (
    <div className="studio-root">
      <Toolbar
        saveFailed={saveFailed}
        mobilePanel={mobilePanel}
        onToggleMobilePanel={(panel) =>
          setMobilePanel((current) => toggleMobilePanel(current, panel))
        }
        onShowShortcuts={openShortcuts}
      />
      <main className="studio-main">
        {isShapeLibraryVisible(shapesCollapsed, mobilePanel) ? (
          <ShapeLibrary
            canvasRef={canvasRef}
            isMobileOpen={mobilePanel === "shapes"}
            onClose={() => setMobilePanel(null)}
            onCollapse={toggleShapesCollapsed}
          />
        ) : null}
        {shapesCollapsed && mobilePanel !== "shapes" ? (
          <div className="shape-library-rail">
            <button
              type="button"
              className="studio-button shape-library-rail__button"
              onClick={toggleShapesCollapsed}
              aria-label="Expand shape library"
              title="Expand shape library"
            >
              ›
            </button>
          </div>
        ) : null}
        <div className="studio-main__canvas">
          <DiagramCanvas
            canvasRef={canvasRef}
            formatAnchor={formatAnchor}
            onOpenFormatAtPoint={openFormatAtPoint}
            onCloseFormat={closeFormatPopup}
          />
        </div>
      </main>
      <StatusBar />
      {shortcutsOpen ? (
        <ShortcutsDialog onClose={() => setShortcutsOpen(false)} />
      ) : null}
    </div>
  );
}
