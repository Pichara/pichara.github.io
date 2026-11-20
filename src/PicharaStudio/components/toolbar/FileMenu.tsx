/**
 * FileMenu — the "File" dropdown in the toolbar.
 *
 * File-ish actions that don't deserve a permanent top-level button live
 * here: New diagram, Diagrams (templates + saved diagrams), Import, and
 * the three exports. The menu closes on Escape, on outside click, on
 * window resize, and after an item is picked.
 *
 * The dropdown is rendered in a portal to `document.body` and placed
 * from the button's bounding rect (`utils/popover-placement.ts`): the
 * toolbar's `backdrop-filter` makes it a containing block for
 * `position: fixed` descendants, so an inline fixed menu is positioned
 * against the toolbar instead of the viewport, and the old code assumed
 * a 200px menu width, which clipped the item text when the menu measured
 * wider. The placement now measures the real menu size and clamps it
 * inside the viewport.
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { placePopover } from "../../utils/popover-placement";

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
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({
    visibility: "hidden",
  });
  const menuRef = useRef<HTMLUListElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Position + measure the menu once it mounts (and on resize): its
  // width is content-driven, so the placement must use the real size.
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const button = buttonRef.current;
      const menu = menuRef.current;
      if (button === null || menu === null) return;
      const rect = button.getBoundingClientRect();
      const size = menu.getBoundingClientRect();
      const { top, left } = placePopover(rect, size, {
        width: window.innerWidth,
        height: window.innerHeight,
      });
      setMenuStyle({ top, left, visibility: "visible" });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open ]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      // The button toggles on click: a mousedown on it must not close
      // the menu first, or the click would reopen it right away.
      if (
        menuRef.current !== null &&
        !menuRef.current.contains(target) &&
        buttonRef.current !== null &&
        !buttonRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        // Capture phase: the editor's own Esc handler clears the
        // selection, and closing the menu must not do that too.
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown, true);
    // A scroll (e.g. of the toolbar on a narrow screen) would leave
    // the menu behind, so close it instead of chasing the button.
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown, true);
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
    <div className="studio-toolbar__menu">
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
      {open
        ? createPortal(
            <ul
              ref={menuRef}
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
              <FileMenuItem onClick={pick(onExportSvg)}>
                Export SVG
              </FileMenuItem>
              <FileMenuItem onClick={pick(onExportPng)}>
                Export PNG
              </FileMenuItem>
            </ul>,
            document.body
          )
        : null}
    </div>
  );
}
