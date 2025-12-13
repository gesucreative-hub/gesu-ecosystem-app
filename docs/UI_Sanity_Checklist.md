# QA Sanity Checklist - UI Standardization

**Meta Rules**
- [ ] Run this checklist manually after any major UI refactor
- [ ] Mark items as checked [x] when verified

## SECTION 1 — Global & Theming (CRITICAL)
*Goal: Ensure brand identity and readability in both themes*
- [ ] Verify **Light Theme** uses `Indigo` as primary brand color
- [ ] Verify **Dark Theme** uses `Green` as primary brand color
- [ ] Check background/surface contrast is clear (no invisible text)
- [ ] Confirm focus rings appear on `Tab` navigation for all interactive elements
- [ ] Ensure borders are visible but subtle in both themes

## SECTION 2 — Buttons & Interactions
*Goal: Consistent tactile feedback and states*
- [ ] **Primary Button**: Check Default, Hover, Active, Disabled, and Focus states
- [ ] **Secondary Button**: Check Default, Hover (bg change), and Disabled states
- [ ] **Ghost Button**: Check that background only appears on Hover
- [ ] Verify **Browse Buttons** (in Settings) align with their input fields
- [ ] Verify **Back Buttons** navigate correctly and have hover states

## SECTION 3 — Inputs & Selects
*Goal: Clear data entry usability*
- [ ] **Text Inputs**: Borders must be visible, placeholders distinct from value
- [ ] **Disabled Inputs**: Must look visibly distinctive (grayed/faded)
- [ ] **Focus State**: Clicking input triggers Brand color border or Ring
- [ ] **Select Dropdowns**: Chevron visible, menu options readable on bg
- [ ] **Select Hover**: Options highlight correctly when hovered

## SECTION 4 — Tabs & Navigation
*Goal: Smooth switching between contexts*
- [ ] **Active Tab**: clearly emphasized `MediaSuite` or `Settings` tabs
- [ ] **Inactive Tab**: text color is muted
- [ ] **Switching**: specific tab content loads instantly without layout jump
- [ ] **Padding**: Content aligns consistently with tab headers

## SECTION 5 — Layout & Spacing
*Goal: Pixel-perfect structural consistency*
- [ ] **PageContainer**: Confirm `px-6` or `px-8` padding on ALL pages
- [ ] **Card Primitives**: Check internal padding is `p-6`
- [ ] **Responsiveness**: Resize window to ~800px; layout should hold

## SECTION 6 — Scrolling Behavior
*Goal: Natural feeling scroll mechanics*
- [ ] **Main Content Area** scrolls independently (overflow-y-auto)
- [ ] **Sidebar** remains fixed/sticky while scrolling
- [ ] **Scrollbars** are visible when content overflows (not hidden)
- [ ] No "double scrollbar" issues (body + container both scrolling)

## SECTION 7 — Module Spot Checks
*Goal: Verify complex specific components*
- [ ] **Dashboard**: `EngineStatus` badges align (text centered)
- [ ] **Initiator**: Preview card updates cleanly or looks correct static
- [ ] **Media Suite**: "Job Queue" tables are readable/aligned
- [ ] **Settings**: "Card" headers align with content
