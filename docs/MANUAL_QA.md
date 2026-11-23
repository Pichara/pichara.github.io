# Portfolio redesign — manual QA checklist

This checklist is **not** satisfied by CI. Review before merging.

- [ ] Open the PR artifact `portfolio-preview-dist` in a local static server (`npm run preview` after `npm run build` is easier).
- [ ] Verify classic green Matrix streams are visible at initial load and continuously behind all sections during scrolling.
- [ ] Confirm the animation is smooth and does not interfere with navigation, project links, or the contact form.
- [ ] Use the Rain ON/OFF switch and verify the canvas animation stops and resumes.
- [ ] Enable OS reduced-motion preference and check the animation is disabled on initial load.
- [ ] Test mobile navigation at 320px, 390px, 768px, 1024px and desktop widths.
- [ ] Check text contrast/readability over the animated background and keyboard focus on controls.
- [ ] Verify all six previous projects, titles, repository links, images, and tags remain intact.
- [ ] Verify the Delta Elevator experience details against the owner's LinkedIn/profile.
- [ ] Submit a safe Formspree test message and confirm successful delivery.
- [ ] Check browser console for errors, image loading, and page layout overflow.

**CI:** `npm run check` runs TypeScript + animation-model tests; `npm run build` performs a typechecked Vite production build on PRs. Nothing deploys from a PR.

## Pichara Diagram Studio (`/diagram`)

- [ ] Add a shape, undo (Ctrl+Z or toolbar Undo) — the shape disappears; redo brings it back. Buttons disable when their stack is empty.
- [ ] Drag a node, undo — it returns to its pre-drag position in one step.
- [ ] Connect two nodes, undo — the edge disappears; delete a node, undo — it comes back with its edges.
- [ ] Undo past the first action does nothing; a new action after undo clears redo.
- [ ] Reload the page — the undone state is what autosave persisted.
- [ ] Zoom to fit (toolbar button or Ctrl+0) frames all shapes; Grid/Snap toggles hide the dots and stop snapping; Delete removes the selection (with its edges) in one undo step, Ctrl+A selects all, Esc clears the selection.
- [ ] Add several shapes one after another — the camera never moves and the zoom never jumps. Then Zoom to fit (toolbar or Ctrl+0) frames every shape, including the last one added, with margin on all sides.
- [ ] Empty diagram shows the "Start your diagram" hint on the canvas; it disappears as soon as a shape is added and never blocks dragging or clicking.
- [ ] Press "?" (or the toolbar "?" button) — the shortcuts dialog lists every shortcut; Esc closes it without clearing the selection.
- [ ] Hover a shape — its border brightens and the connection handles grow; drag it — the cursor grabs. Select a polygon — its own outline highlights, not just the resize handles.
- [ ] Drag on empty canvas draws a marquee that selects the shapes inside it; pan with Space+drag or middle/right mouse. Select 2+ shapes and Group (toolbar or Ctrl+G) — a dashed container appears and dragging it moves the members together; Ungroup (Ctrl+Shift+G) dissolves it with the shapes in place. Deleting a group deletes its members; copy/paste of a group keeps the members inside.
- [ ] Right-click a shape — the format popup opens above it; clicking a color swatch opens an in-page picker; clicking a preset swatch applies the color at once (one undo step per pick); typing a hex value and pressing Enter applies it; Esc closes the picker without clearing the selection. The toolbar "Format" button and the F key open the same popup above the current selection.
- [ ] Open the File menu at desktop width — every item's text is fully visible, none clipped at the edges; clicking File again closes the menu; Esc closes it without clearing the selection.
- [ ] File → New diagram opens an in-app confirm dialog (not a browser popup); confirming clears the canvas, cancelling keeps it. Same for Import, template use, opening a saved diagram, and Delete in the Diagrams dialog.
- [ ] Zoom to fit, then undo (Ctrl+Z) — the content undoes but the zoom stays where it was; undo never moves the camera.
