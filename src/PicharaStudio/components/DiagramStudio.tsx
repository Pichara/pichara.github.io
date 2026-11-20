/**
 * DiagramStudio — root component of the diagram editor.
 *
 * Layout: toolbar on top, shape library on the left, React Flow canvas in
 * the middle, format panel on the right, status bar at the bottom. This
 * component is lazy-loaded by the router, so the portfolio never downloads
 * editor code until the user opens /diagram.
 *
 * On narrow screens (< 768px) the two side panels become overlay drawers:
 * hidden until opened from the toolbar, so the canvas keeps the full
 * width. See DiagramStudio.css for the breakpoint rules.
 */

import { useCallback, useState } from "react";
import Toolbar from "./toolbar/Toolbar";
import ShapeLibrary from "./sidebar/ShapeLibrary";
import DiagramCanvas from "./canvas/DiagramCanvas";
import FormatPanel from "./panels/FormatPanel";
import StatusBar from "./status-bar/StatusBar";
import ShortcutsDialog from "./dialogs/ShortcutsDialog";
import { useDiagramPersistence } from "../hooks/useDiagramPersistence";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import {
  toggleMobilePanel,
  type MobilePanel,
} from "../utils/mobile-panels";
import "./DiagramStudio.css";

export default function DiagramStudio() {
  const { saveFailed } = useDiagramPersistence();
  // Shortcuts dialog state lives here so both the "?" key (handled by
  // the hook) and the toolbar "?" button can open it. Stable callback
  // so the hook does not re-register its listener on every render.
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const openShortcuts = useCallback(() => setShortcutsOpen(true), []);
  useKeyboardShortcuts(openShortcuts);

  // Which side panel is open as an overlay drawer on narrow screens.
  // Ignored on desktop, where both panels are always visible.
  const [mobilePanel, setMobilePanel] = useState<MobilePanel | null>(null);

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
        <ShapeLibrary
          isMobileOpen={mobilePanel === "shapes"}
          onClose={() => setMobilePanel(null)}
        />
        <div className="studio-main__canvas">
          <DiagramCanvas />
        </div>
        <FormatPanel
          isMobileOpen={mobilePanel === "format"}
          onClose={() => setMobilePanel(null)}
        />
      </main>
      <StatusBar />
      {shortcutsOpen ? (
        <ShortcutsDialog onClose={() => setShortcutsOpen(false)} />
      ) : null}
    </div>
  );
}
