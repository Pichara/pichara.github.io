/**
 * DiagramStudio — root component of the diagram editor.
 *
 * Layout: toolbar on top, React Flow canvas filling the middle, status bar
 * at the bottom. This component is lazy-loaded by the router, so the
 * portfolio never downloads editor code until the user opens /diagram.
 */

import Toolbar from "./toolbar/Toolbar";
import DiagramCanvas from "./canvas/DiagramCanvas";
import StatusBar from "./status-bar/StatusBar";
import { useDiagramPersistence } from "../hooks/useDiagramPersistence";
import "./DiagramStudio.css";

export default function DiagramStudio() {
  const { saveFailed } = useDiagramPersistence();

  return (
    <div className="studio-root">
      <Toolbar saveFailed={saveFailed} />
      <main className="studio-main">
        <DiagramCanvas />
      </main>
      <StatusBar />
    </div>
  );
}
