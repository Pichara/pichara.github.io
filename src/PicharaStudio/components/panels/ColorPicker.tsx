/**
 * ColorPicker — in-DOM color picker for the Format panel.
 *
 * The native `<input type="color">` opens an OS-level popup that mouse
 * clicks cannot reliably reach: in some browsers (and in automated ones)
 * clicks at the popup's position land on the page behind it instead,
 * closing the picker and deselecting the shape without applying the
 * color. This picker lives in the DOM, so a mouse click always applies:
 * preset swatches apply on click, the hex field commits on Enter, and
 * the native input stays only as the "Custom" path for arbitrary colors.
 *
 * The popover is rendered in a portal to `document.body` and placed from
 * the swatch's bounding rect (`utils/popover-placement.ts`), so no
 * ancestor filter or panel scroll can move or clip it. It closes on
 * Escape (capture phase, so it does not also clear the selection), on an
 * outside click, or after a preset is picked.
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { normalizeHexInput } from "../../utils/apply-style";
import { placePopover } from "../../utils/popover-placement";

/** Preset swatches: Matrix palette first, then the usual hues. */
export const COLOR_PRESETS = [
  "#071a0e",
  "#4bcc7b",
  "#eafff0",
  "#030a07",
  "#ffffff",
  "#9ca3af",
  "#000000",
  "#7c3aed",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06c80f",
  "#06b6d4",
  "#3b82f6",
  "#ec4899",
];

interface ColorPickerProps {
  /** Field label (Fill, Border, Text, Line). */
  label: string;
  /** Current color as `#rrggbb`. */
  value: string;
  /** Applies a picked color. */
  onChange: (value: string) => void;
  /** Runs when the picker closes (ends the color-edit undo session). */
  onBlur: () => void;
}

export default function ColorPicker({
  label,
  value,
  onChange,
  onBlur,
}: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({
    visibility: "hidden",
  });
  const [hexText, setHexText] = useState(value);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    onBlur();
  }, [onBlur]);

  // Position + measure the popover once it mounts (and on resize): its
  // size is content-driven, so the placement must use the real size.
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const button = buttonRef.current;
      const popover = popoverRef.current;
      if (button === null || popover === null) return;
      const rect = button.getBoundingClientRect();
      const size = popover.getBoundingClientRect();
      const { top, left } = placePopover(rect, size, {
        width: window.innerWidth,
        height: window.innerHeight,
      });
      setPopoverStyle({ top, left, visibility: "visible" });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open ]);

  // Close on Escape (capture phase: the editor's own Esc handler clears
  // the selection, and closing the picker must not do that too) and on
  // an outside mousedown.
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        popoverRef.current !== null &&
        !popoverRef.current.contains(target) &&
        buttonRef.current !== null &&
        !buttonRef.current.contains(target)
      ) {
        close();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close();
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [open, close]);

  // Hex commits on Enter only: committing on blur would fire when the
  // user clicks a preset (the field blurs first) and swallow the click.
  // An invalid value just reverts to the current color.
  const commitHex = useCallback(() => {
    const normalized = normalizeHexInput(hexText);
    if (normalized === null) {
      setHexText(value);
      return;
    }
    if (normalized !== value) onChange(normalized);
    close();
  }, [hexText, value, onChange, close]);

  return (
    <label className="format-panel__field">
      <span className="format-panel__label">{label}</span>
      <span className="format-panel__color-row">
        <button
          ref={buttonRef}
          type="button"
          className="format-panel__color-input color-picker__swatch"
          style={{ backgroundColor: value }}
          onClick={() => {
            setHexText(value);
            setOpen((current) => !current);
          }}
          aria-label={`${label} color ${value}`}
          aria-haspopup="dialog"
          aria-expanded={open}
          title={`${label}: ${value} — click to change`}
        />
        <code className="format-panel__color-value">{value}</code>
      </span>
      {open
        ? createPortal(
            <div
              ref={popoverRef}
              className="color-picker__popover"
              role="dialog"
              aria-label={`${label} color picker`}
              style={popoverStyle}
            >
              <div
                className="color-picker__presets"
                role="group"
                aria-label="Preset colors"
              >
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="color-picker__preset"
                    style={{ backgroundColor: preset }}
                    onClick={() => {
                      if (preset !== value) onChange(preset);
                      close();
                    }}
                    aria-label={`Use ${preset}`}
                    title={preset}
                  />
                ))}
              </div>
              <label className="color-picker__hex-row">
                <span className="color-picker__row-label">Hex</span>
                <input
                  type="text"
                  className="color-picker__hex-input"
                  value={hexText}
                  onChange={(event) => setHexText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") commitHex();
                  }}
                  onBlur={() => setHexText(value)}
                  aria-label="Hex color — Enter to apply"
                  spellCheck={false}
                />
              </label>
              <label className="color-picker__custom-row">
                <span className="color-picker__row-label">Custom</span>
                <input
                  type="color"
                  className="color-picker__custom-input"
                  value={value}
                  onChange={(event) => onChange(event.target.value)}
                  aria-label={`Custom ${label.toLowerCase()} color`}
                />
              </label>
              <p className="color-picker__hint">
                Pick a swatch, or type a hex color and press Enter.
              </p>
            </div>,
            document.body
          )
        : null}
    </label>
  );
}
