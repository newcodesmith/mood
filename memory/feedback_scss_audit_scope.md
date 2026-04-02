---
name: SCSS audit scope
description: When reviewing/auditing SCSS files, only look at the .scss files themselves — do not cross-reference backend or JS/JSX files
type: feedback
---

Only look at the .scss files for SCSS review tasks.

**Why:** User corrected me when I tried to cross-reference backend/component files during an SCSS cleanup task.

**How to apply:** For SCSS audits (unused styles, duplicates, cleanup), limit scope to the .scss files only. Identify issues like duplicate properties, overridden rules, no-op dark mode overrides, and dead declarations within the stylesheets themselves.
