# QA Checklist - Pre-Release Verification

**Sprint**: Before "New User Guides"  
**Prerequisite**: App running via `pnpm run dev:desktop`

---

## Quick Verification (~10 min)

### 1. App Launch

- [ ] App opens without console errors
- [ ] Sidebar renders with all navigation items
- [ ] Language toggle works (EN ↔ ID)

### 2. Dashboard

- [ ] Calendar widget shows correct month/year
- [ ] Weekly chart displays (no empty state if data exists)
- [ ] Focus timer pill in sidebar updates correctly

### 3. Activity Page

- [ ] Date navigation works (prev/next)
- [ ] View mode switching (Daily/Weekly/Monthly/Yearly)
- [ ] Heatmap renders with colored cells
- [ ] Clear data dropdown shows localized options

### 4. Compass Page

- [ ] Energy slider responds to input
- [ ] Radar chart labels are localized
- [ ] Snapshot save works (toast appears)
- [ ] Clear history dropdown works

### 5. Refocus Page

- [ ] Mental state selection works
- [ ] Protocol cards display with localized names
- [ ] Protocol completion flow works
- [ ] Feedback submission works

---

## Media Suite (~5 min)

### 6. Download Tab

- [ ] Engine status indicators show (green/yellow/red)
- [ ] URL input accepts valid URLs
- [ ] Preset dropdown shows options
- [ ] Queue download button works (or shows error if no URL)

### 7. Convert Tab

- [ ] File picker opens system dialog
- [ ] Category/Preset dropdowns work
- [ ] Output folder can be changed

### 8. Queue Tab

- [ ] Job list loads (or empty state shows)
- [ ] Filter dropdown works
- [ ] Status badges display correctly

---

## Project Hub (~5 min)

### 9. Generator Tab

- [ ] Project name input works
- [ ] Project type dropdown works
- [ ] Blueprint selection works
- [ ] Folder preview updates live
- [ ] Generate button creates project (or shows error)

### 10. Workflow Tab

- [ ] Project selector shows projects
- [ ] Workflow canvas renders nodes
- [ ] Step detail panel opens on click
- [ ] DoD checkboxes work

### 11. Standards Tab

- [ ] Blueprint list loads
- [ ] Blueprint editor opens
- [ ] Phase/step editing works
- [ ] Save button persists changes

---

## Settings (~3 min)

### 12. Paths Configuration

- [ ] Workflow Root shows current path
- [ ] Browse button opens folder picker
- [ ] Changes persist after restart

### 13. External Tools

- [ ] Tool status indicators show
- [ ] Check/Refresh button works
- [ ] Configure links work

### 14. Theme/Language

- [ ] Theme toggle works (Light/Dark)
- [ ] Language toggle persists

---

## i18n Spot Checks

### 15. Indonesian Mode

- [ ] Switch to ID language
- [ ] Dashboard title: "Dasbor" (not "Dashboard")
- [ ] Activity charts: "Fokus Hari Ini" (not "Today's Focus")
- [ ] Compass domains: "Keuangan, Kreatif, Relasi" (not "Money, Creative, Relations")
- [ ] Refocus protocols: Indonesian names shown
- [ ] No raw keys visible (no `viewModes.daily` etc.)

### 16. Known Acceptable Gaps (Don't Fail For These)

- [ ] Template names may show English (ArchiViz Standard, etc.)
- [ ] Engine names stay English (FFMPEG, YT-DLP, NODEJS)
- [ ] Some modal content may fallback to English

---

## Regression Guards

### 17. Leak Detection Script

```bash
node apps/gesu-shell/scripts/check-i18n-leaks.js
# Expected: Exit code 0, no leaks found
```

### 18. TypeScript Check

```bash
cd apps/gesu-shell && pnpm tsc --noEmit
# Expected: No errors (warnings acceptable)
```

### 19. Build Test

```bash
pnpm run build:desktop
# Expected: Successful build
```

---

## Sign-Off

| Tester | Date | Pass/Fail | Notes |
| ------ | ---- | --------- | ----- |
|        |      |           |       |

---

_Generated: 2025-12-23_
