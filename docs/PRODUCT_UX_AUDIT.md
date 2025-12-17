# Product/UX Audit - Gesu Ecosystem v2

**Date:** 2025-12-17  
**Auditor:** AI Technical Lead (Product/UX Partner)  
**Scope:** Holistic finish-first flow evaluation and prioritized improvements

---

## Executive Summary

### What Feels Unsmooth

The app has made significant progress, but the daily workflow lacks cohesion:

1. **Landing confusion** - Dashboard shows system status and module links, not "Today's work"
2. **Compass slider overload** - 7 sliders (Energy + 6 Focus Areas) with unclear daily value
3. **Timer disconnected from tasks** - Timer works but isn't tied to a specific task
4. **Navigation redundancy** - Launcher adds no value over Dashboard
5. **Integration gaps** - Project Hub → Compass flow is there, but unclear which surface is "home" for execution

### Top 5 Immediate Fixes

| Priority | Fix | Impact | Effort |
|----------|-----|--------|--------|
| **P0** | Remove Launcher from nav (hide route, keep code) | Reduces noise | Trivial |
| **P0** | Make Compass the default landing page (change index route) | Aligns with finish-first | Trivial |
| **P1** | Collapse Focus Areas into single "Focus Score" or hide behind expandable section | Reduces slider overload | Small |
| **P1** | Add "Start Timer" button on each Project Hub Task in Compass | Ties timer to task | Medium |
| **P2** | Redesign Dashboard as optional "Settings + Status" surface | Removes noise from daily flow | Small |

---

## User Persona & Principles

### Persona: High-Intensity Creative Worker

- **Distraction-prone**: Needs strong guardrails against context switching
- **Energy-limited**: Max 3 active tasks at any time
- **Finish-first mindset**: Prioritizes completion over planning
- **Minimal friction**: Prefers smart defaults over configuration
- **Wants calm clarity**: Only show relevant info; remove noise

### Design Principles

| Principle | Meaning |
|-----------|---------|
| **Finish-first** | Every screen pushes toward completion, not creation |
| **3-task limit** | Hard guardrail universally enforced |
| **Defaults > Settings** | Hide config; surface actions |
| **One truth** | Single place to see today's tasks |
| **Rescue loops** | Quick paths back when stuck |

---

## Correct User Flow (Target State)

### Flow A: First-Time Setup (Rare Path)
```
1. Open Settings
2. Set WorkflowRoot + ProjectsRoot
3. Verify engines status (optional - only for troubleshooting)
4. Close Settings → Land on Compass
```

### Flow B: Daily Start (Primary Path)
```
1. Open app → Land on Compass (Today surface)
2. See active tasks (max 3) from Project Hub
3. Pick ONE task to focus on
4. Start focus session (timer tied to that task)
5. Distraction Shield prevents navigation during session
6. Mark task done → Timer ends
7. Optional: Add more tasks from Project Hub if under limit
```

### Flow C: When Stuck (Rescue Path)
```
1. Navigate to Refocus
2. Pick state (Overwhelm/Restless/Avoiding/Foggy)
3. Get 1-3 micro actions
4. Start 15-min rescue focus
5. Optional: Lost Mode (3 prompts) → Convert to task
```

### Flow D: Media Execution (Supporting Path)
```
- Use Media Suite as a tool when needed
- Does NOT hijack daily flow
- History self-contained within module
```

---

## Current-State Audit Per Surface

### 1. Dashboard (`/`)

**Current Purpose**: System overview and module links

| Criterion | Score | Notes |
|-----------|-------|-------|
| Purpose clarity | 2/5 | Shows engine status (low priority) instead of today's work |
| Friction | 2/5 | Extra click needed to get to actual work |
| Finish-first alignment | 1/5 | Encourages exploration, not execution |
| Noise level | 4/5 | Engine status, module grid, recent media jobs - irrelevant to daily focus |

**Content Analysis:**
- ❌ **Engine Status pills** - Only relevant for troubleshooting; hide by default
- ❌ **Modules grid** - Navigation exists in sidebar; redundant
- ❌ **Quick Actions (Open folders)** - Power user feature; move to Settings
- ❌ **Recent Activity (Media jobs)** - Module-specific; keep in Media Suite
- ❌ **Footer with paths** - Debug info; hide

**Recommendation:** **REPLACE** with redirect to Compass, or repurpose as "System" settings tab

---

### 2. Launcher (`/launcher`)

**Current Purpose**: Unknown/Legacy

| Criterion | Score | Notes |
|-----------|-------|-------|
| Purpose clarity | 0/5 | Unclear what this adds beyond Dashboard |
| Friction | 5/5 | User wastes time if they land here |
| Finish-first alignment | 0/5 | No execution support |
| Noise level | 5/5 | Entire page is noise |

**Recommendation:** **REMOVE** from navigation (keep code for reference)

---

### 3. Project Hub (`/initiator`)

**Current Purpose**: Project workflow viewer + task selection

| Criterion | Score | Notes |
|-----------|-------|-------|
| Purpose clarity | 4/5 | Clear: pick project → see steps → send to Compass |
| Friction | 2/5 | Multiple tabs (Workflow/Standards/Generator); unclear which to start with |
| Finish-first alignment | 3/5 | Good for selecting tasks, but user should then go to Compass for execution |
| Noise level | 2/5 | Standards tab and Generator are secondary features |

**Strengths:**
- ✅ Workflow canvas with phases is clear
- ✅ Step detail panel with DoD checklist
- ✅ "Kirim ke Compass" sends tasks correctly
- ✅ Max 3 guardrail enforced

**Issues:**
- ⚠️ **Terminology**: "Kirim ke Compass (Hari ini)" - mixed language
- ⚠️ **Three tabs** when daily flow only needs Workflow
- ⚠️ **No visual connection** to timer/focus session

**Recommendation:** **SIMPLIFY** - Default to Workflow tab; hide Standards/Generator under "Configure" submenu

---

### 4. Compass (`/compass`)

**Current Purpose**: Daily calibration + task execution

| Criterion | Score | Notes |
|-----------|-------|-------|
| Purpose clarity | 2/5 | Too many sections compete for attention |
| Friction | 3/5 | Must scroll past sliders to see actual tasks |
| Finish-first alignment | 2/5 | Calibration sliders dominate; execution tasks are secondary |
| Noise level | 4/5 | 7 sliders, Sessions checklist, Snapshots - cluttered |

**Slider Audit:**

| Slider | Purpose | Daily Value | Recommendation |
|--------|---------|-------------|----------------|
| Energy (1) | Self-assessment | Medium | **KEEP** but simplify (3-state: Low/Medium/High) |
| Focus Areas (6) | Life balance tracking | Low | **HIDE** behind "Details" toggle or remove |
| Sessions Today (4 checkboxes) | Track session types | Low | **REMOVE** or integrate with actual timer sessions |

**Section Audit:**

| Section | Current Position | Issue | Recommendation |
|---------|------------------|-------|----------------|
| Energy Card | Top-left | Prominent but daily toggle suffices | **SIMPLIFY** to 3-button picker |
| Focus Areas Card | Below Energy | 6 sliders is overwhelming | **COLLAPSE** or hide |
| Project Hub Tasks | Below Focus Areas | BURIED! This is the most important section | **MOVE TO TOP** |
| Sessions Today | Right column | Generic checklist, not task-tied | **REMOVE** |
| Snapshots | Right column bottom | Historical logging | **MOVE** to separate "History" view |
| Finish Mode | Conditional top | Good when active | **KEEP** |

**Recommendation:** **REDESIGN** - Tasks first, calibration optional

---

### 5. Refocus (`/refocus`)

**Current Purpose**: Rescue loop when stuck

| Criterion | Score | Notes |
|-----------|-------|-------|
| Purpose clarity | 5/5 | Clear: pick state → get actions → start rescue |
| Friction | 1/5 | Minimal - 2 clicks to start timer |
| Finish-first alignment | 4/5 | Pushes toward action quickly |
| Noise level | 1/5 | Clean, focused UI |

**Strengths:**
- ✅ 4-state picker is visual and fast
- ✅ Context-aware suggested actions
- ✅ 15-min rescue timer integration
- ✅ Lost Mode 3 prompts are minimal

**Issues:**
- Minor: "Back" button goes to Dashboard instead of Compass

**Recommendation:** **KEEP** as-is; adjust "Back" to go to Compass

---

### 6. Media Suite (`/media-suite`)

**Current Purpose**: Media download/conversion tool

| Criterion | Score | Notes |
|-----------|-------|-------|
| Purpose clarity | 5/5 | Clear: add jobs, monitor progress, view history |
| Friction | 1/5 | Low - good tab structure |
| Finish-first alignment | N/A | Supporting tool, not daily flow |
| Noise level | 1/5 | Self-contained |

**Issues:**
- ⚠️ **Padding feels too inset** compared to other pages
- ⚠️ Page uses different internal layout than Compass/Dashboard

**Recommendation:** **KEEP** - only adjust padding for consistency

---

### 7. Settings (`/settings`)

**Current Purpose**: System configuration

| Criterion | Score | Notes |
|-----------|-------|-------|
| Purpose clarity | 4/5 | Configuration surfaces are clear |
| Friction | 2/5 | Some settings (engine paths) rarely change |
| Finish-first alignment | N/A | Setup utility |
| Noise level | 2/5 | Acceptable for settings page |

**Recommendation:** **KEEP** - Consider absorbing Dashboard content here

---

### 8. Timer (FocusTimerPill in Layout)

**Current Purpose**: Global Pomodoro timer

| Criterion | Score | Notes |
|-----------|-------|-------|
| Purpose clarity | 3/5 | Timer works, but unclear what task it's for |
| Friction | 2/5 | Must manually start; no connection to task |
| Finish-first alignment | 2/5 | Timer runs independently of task completion |
| Noise level | 2/5 | Visible in header - good placement |

**Missing Links:**
1. **Task → Timer**: When starting timer, show which task it's for
2. **Timer → Task**: When timer ends, prompt to mark task done
3. **Sound hook**: No audio notification on phase completion
4. **Session history**: No log of completed focus sessions per task

**Recommendation:** **INTEGRATE** timer with specific tasks; add sound support

---

## Findings Summary

### Critical Issues (P0)

| ID | Issue | Evidence | Impact |
|----|-------|----------|--------|
| F1 | Dashboard is noise, not signal | Shows engine status, not tasks | User wastes time navigating |
| F2 | Launcher has no purpose | Empty/redundant page | Confusion |
| F3 | Compass sliders dominate over tasks | 7 sliders vs 1 task list | Anti-finish-first |

### Major Issues (P1)

| ID | Issue | Evidence | Impact |
|----|-------|----------|--------|
| F4 | Timer not tied to task | Timer pill has no task context | Disconnected execution |
| F5 | Focus Areas of unclear value | 6 sliders for life balance | Daily friction |
| F6 | Project Hub Tasks buried in Compass | Below 2 slider cards | Critical content hidden |

### Minor Issues (P2)

| ID | Issue | Evidence | Impact |
|----|-------|----------|--------|
| F7 | Media Suite padding inconsistent | Different internal margins | Visual polish |
| F8 | "Back" buttons go to Dashboard | Should go to Compass | Navigation friction |
| F9 | Sessions Today is generic | Not tied to actual tasks | Redundant UI |

---

## Recommendations: Prioritized Backlog

### P0 - Immediate (Sprint 18)

| Change | Files | Acceptance Criteria |
|--------|-------|---------------------|
| Make Compass the home route | `App.tsx` | `<Route index element={<CompassPage />} />` |
| Hide Launcher from sidebar | `Layout.tsx` | Remove NavItem for /launcher |
| Move "Project Hub Tasks" to top of Compass | `CompassPage.tsx` | Task list above Energy card |

### P1 - Short Term (Sprint 19)

| Change | Files | Acceptance Criteria |
|--------|-------|---------------------|
| Collapse Focus Areas behind toggle | `CompassPage.tsx` | "Show Focus Details" expander |
| Simplify Energy to 3-state picker | `CompassPage.tsx` | Low/Medium/High buttons, not slider |
| Add "Start Focus" button on each task | `CompassPage.tsx` | Button starts timer with task context |
| Remove Sessions Today checklist | `CompassPage.tsx` | Delete section |

### P2 - Future Sprints

| Change | Files | Acceptance Criteria |
|--------|-------|---------------------|
| Move Dashboard content to Settings | Multiple | Engine status in Settings "System" tab |
| Add sound on timer phase complete | `focusTimerStore.ts` | Audio plays when focus ends |
| Normalize page padding | `PageContainer.tsx` | Consistent density across pages |
| Log timer sessions per task | New store | Session history in Compass |

---

## Proposed Next Sprint: Sprint 18 - Smoothness

### Goal
Make the app feel smooth by aligning navigation with finish-first flow.

### Acceptance Criteria

- [ ] Opening app lands on Compass (not Dashboard)
- [ ] Launcher removed from sidebar navigation
- [ ] Project Hub Tasks card is first visible item in Compass (above Energy)
- [ ] No regressions in existing flows
- [ ] Canvas panning still works in Project Hub

### Files Likely to Change

| File | Change |
|------|--------|
| `App.tsx` | Change index route from DashboardPage to CompassPage |
| `Layout.tsx` | Remove Launcher NavItem |
| `CompassPage.tsx` | Reorder sections (Tasks → Energy → Focus → Sessions → Snapshots) |

### Estimated Effort
Small - 2-4 hours of focused work

---

## Regression Risks & QA Checklist

### Regression Risks

| Risk | Mitigation |
|------|------------|
| Existing Dashboard bookmarks break | Dashboard still accessible at /dashboard (optional redirect) |
| Project Hub canvas pan breaks | Test explicitly after any CompassPage changes |
| Timer pill disappears | Layout.tsx unchanged except NavItem removal |

### QA Checklist for Sprint 18

- [ ] App opens to Compass
- [ ] Project Hub Tasks visible immediately (no scroll)
- [ ] Can add tasks from Project Hub → appear in Compass
- [ ] Can toggle task done in Compass
- [ ] Max 3 task limit still enforced
- [ ] Timer pill visible and functional
- [ ] Distraction Shield modal still appears during active session
- [ ] Canvas panning works in Project Hub
- [ ] Media Suite fully functional
- [ ] Refocus 15-min rescue timer works

---

## Appendix: Page Density Reference

Current PageContainer padding: `pt-16 pb-6 px-6 sm:px-8`

**Recommendation for consistency:**

| Density | Padding | Use Case |
|---------|---------|----------|
| `compact` | `pt-6 pb-4 px-4` | Media Suite (data-heavy) |
| `normal` | `pt-8 pb-6 px-6` | Compass, Refocus |
| `spacious` | `pt-16 pb-8 px-8` | Settings, Dashboard |

Consider adding `density` prop to PageContainer.

---

*End of Audit*
