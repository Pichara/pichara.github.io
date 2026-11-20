/**
 * FileMenu — the "File" dropdown in the toolbar.
 *
 * File-ish actions that don't deserve a permanent top-level button live
 * here: New diagram, Diagrams (templates + saved diagrams), Import, and
 * the three exports. The menu closes on Escape, on outside click, on
 * window resize, and after an item is picked.
 *
 * The dropdown is positioned `fixed` from the button's bounding rect
 * (instead of `absolute` inside the toolbar) so it is never clipped by
 * the toolbar's horizontal scroll on narrow screens.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

interface FileMenuProps {
  onNew: () => void;
  onOpenLibrary: () => void;
  onImport: () => void;
  onExportJson: () => void;
  onExportSvg: () => void;
  onExportPng: () => void;
}

interface FileMenuItemProps {
  onClick: () => void;
  children: ReactNode;
}

function FileMenuItem({ onClick, children }: FileMenuItemProps) {
  return (
    <li role="none">
      <button
        type="button"
        className="studio-toolbar__menu-item"
        role="menuitem"
        onClick={onClick}
      >
        {children}
      </button>
    </li>
  );
}

export default function FileMenu({
  onNew,
  onOpenLibrary,
  onImport,
  onExportJson,
  onExportSvg,
  onExportPng,
}: FileMenuProps) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const button = buttonRef.current;
      if (button === null) return;
      const rect = button.getBoundingClientRect();
      setMenuStyle({
        top: rect.bottom + 6,
        // Right-aligned with the button, clamped inside the viewport.
        left: Math.max(8, rect.right - 200),
      });
    };
    const close = () => setOpen(false);
    const handlePointerDown = (event: MouseEvent) => {
      if (
        menuRef.current !== null &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    place();
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", place);
    // A scroll (e.g. of the toolbar on a narrow screen) would leave
    // the fixed menu behind, so close it instead of chasing the button.
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  const pick = useCallback(
    (action: () => void) => () => {
      setOpen(false);
      action();
    },
    []
  );

  return (
    <div className="studio-toolbar__menu" ref={menuRef}>
      <button
        ref={buttonRef}
        type="button"
        className="studio-button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        File
      </button>
      {open ? (
        <ul
          className="studio-toolbar__menu-list"
          role="menu"
          aria-label="File"
          style={menuStyle}
        >
          <FileMenuItem onClick={pick(onNew)}>New diagram</FileMenuItem>
          <FileMenuItem onClick={pick(onOpenLibrary)}>
            Diagrams…
          </FileMenuItem>
          <FileMenuItem onClick={pick(onImport)}>Import…</FileMenuItem>
          <li
            className="studio-toolbar__menu-separator"
            role="separator"
            aria-hidden="true"
          />
          <FileMenuItem onClick={pick(onExportJson)}>
            Export JSON
          </FileMenuItem>
          <FileMenuItem onClick={pick(onExportSvg)}>Export SVG</FileMenuItem>
          <FileMenuItem onClick={pick(onExportPng)}>Export PNG</FileMenuItem>
        </ul>
      ) : null}
    </div>
  );
}
