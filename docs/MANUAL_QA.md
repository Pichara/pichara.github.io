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
