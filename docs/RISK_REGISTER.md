# Risk Register - Pre-Release QC

**Date**: 2025-12-23  
**Sprint**: QC Pass Before "New User Guides"

---

## Risk Summary

| #   | Risk                        | Severity | Likelihood | Impact          | Status       |
| --- | --------------------------- | -------- | ---------- | --------------- | ------------ |
| 1   | i18n data-driven leaks      | Medium   | High       | User confusion  | ✅ CLOSED    |
| 2   | Template name hardcoding    | Medium   | High       | ID users see EN | ✅ CLOSED    |
| 3   | Focus Timer preset EN       | Low      | Medium     | Minor UX        | ✅ CLOSED    |
| 4   | shell:true in yt-dlp update | Low      | Low        | Security        | ✅ Mitigated |
| 5   | localStorage size limits    | Low      | Low        | Data loss       | ✅ Mitigated |
| 6   | External tool missing       | Medium   | Medium     | Feature blocked | ✅ Handled   |
| 7   | Schema migration failure    | High     | Low        | Data loss       | ✅ Mitigated |
| 8   | Concurrent file writes      | Medium   | Low        | Corruption      | ✅ Mitigated |
| 9   | Large job history           | Low      | Medium     | Slow load       | ⚠️ Monitor   |
| 10  | Cosmetic modal EN           | Low      | High       | Minor UX        | ⚠️ Known     |

---

## Detailed Risk Analysis

### Risk 1: i18n Data-Driven Leaks

**Severity**: Medium | **Likelihood**: High | **Impact**: User confusion

**Description**: Template names, blueprint categories, preset names stored/rendered as English text, not localized.

**Evidence**:

- `I18N_FINAL_STATUS.md` documents 134+ total leaks
- Template modal shows "ArchiViz Standard", "Brand Design" in English
- Focus Timer shows "Quick", "Classic", "Deep" preset names

**Mitigation** (Sprint 23):

- ✅ Extended `WorkflowBlueprint` and `FolderTemplate` types with optional `nameKey` property
- ✅ Added `nameKey` to 8 blueprint templates and 9 folder templates
- ✅ Added 26 locale keys to `initiator.json` (EN + ID)
- ✅ Updated render sites to use `t(item.nameKey, item.name)` pattern

**Status**: ✅ CLOSED

### Risk 2: Template Name Hardcoding

**Severity**: Medium | **Likelihood**: High | **Impact**: ID users see EN

**Description**: Blueprint templates and folder templates have hardcoded English names in data structures.

**Evidence**:

- `blueprintTemplates.ts` line 5-100: Template objects use direct `name` property
- `workflowFolderTemplatesService.ts`: Folder names like "01. Brief", "02. Research"

**Mitigation** (Sprint 23):

- ✅ Implemented `nameKey` pattern in data sources
- ✅ Added translations to `id/initiator.json` and `en/initiator.json`
- ✅ Updated `TemplatePickerModal.tsx` and `FolderTemplateEditorModal.tsx` render sites

**Status**: ✅ CLOSED

### Risk 3: Focus Timer Preset EN

**Severity**: Low | **Likelihood**: Medium | **Impact**: Minor UX

**Description**: Preset buttons show "Quick/Classic/Deep" instead of Indonesian.

**Evidence**: Fixed per I18N_BROWSER_QA_RESULTS.md - presets now use locale keys

**Mitigation**: ✅ Resolved in earlier i18n pass

**Status**: ✅ CLOSED

### Risk 4: shell:true in yt-dlp Update

**Severity**: Low | **Likelihood**: Low | **Impact**: Security

**Description**: `spawn('yt-dlp', ['-U'], { shell: true })` could be vulnerable if yt-dlp path were user-controlled.

**Evidence**: `main.js:385`

**Mitigation**:

- ✅ Command is hardcoded, not user input
- ✅ Only internal "Update" button triggers this
- ✅ No path injection possible

**Status**: ✅ ACCEPTABLE RISK

### Risk 5: localStorage Size Limits

**Severity**: Low | **Likelihood**: Low | **Impact**: Data loss

**Description**: Heavy users could hit 5MB localStorage limit.

**Evidence**: 10 stores use localStorage for persistence

**Mitigation**:

- ✅ Session data moved to SQLite database
- ✅ Only compact state (IDs, flags) in localStorage
- ⚠️ No explicit size monitoring

**Recommended Action**: Add quota check in future version

### Risk 6: External Tool Missing

**Severity**: Medium | **Likelihood**: Medium | **Impact**: Feature blocked

**Description**: Media Suite requires yt-dlp/ffmpeg; missing tools would block downloads/conversions.

**Evidence**: `tools-check.js` checks tool availability

**Mitigation**:

- ✅ Status indicators show tool health
- ✅ Graceful error messages if tool missing
- ✅ "Configure" button guides user to fix

**Status**: ✅ HANDLED

### Risk 7: Schema Migration Failure

**Severity**: High | **Likelihood**: Low | **Impact**: Data loss

**Description**: If schema migration fails, user data could be lost or corrupted.

**Evidence**:

- `projectStore.ts:95-100` shows v1→v2 migration
- Migration wraps in try/catch

**Mitigation**:

- ✅ Migrations wrapped in try/catch
- ✅ Unknown versions reset to empty (safe but lossy)
- ⚠️ No backup before migration

**Recommended Action**: Add backup-on-migrate in future version

### Risk 8: Concurrent File Writes

**Severity**: Medium | **Likelihood**: Low | **Impact**: Corruption

**Description**: Multiple writes to same file could corrupt data.

**Evidence**: `fs.promises.writeFile` used in scaffolding, settings

**Mitigation**:

- ✅ Settings use atomic write pattern
- ✅ Project creation is sequential
- ✅ No concurrent write scenarios identified

**Status**: ✅ ACCEPTABLE

### Risk 9: Large Job History

**Severity**: Low | **Likelihood**: Medium | **Impact**: Slow load

**Description**: Media Suite job history could grow large over time.

**Evidence**: `getRecentJobs()` returns all jobs from database

**Mitigation**:

- ⚠️ No pagination implemented
- ⚠️ No auto-cleanup policy
- ✅ SQLite handles queries efficiently

**Recommended Action**: Add LIMIT clause and cleanup policy

### Risk 10: Cosmetic Modal EN

**Severity**: Low | **Likelihood**: High | **Impact**: Minor UX

**Description**: Cosmetic customization modal shows EN labels (Male, Couple, ICON, PET, etc.)

**Evidence**: `I18N_FINAL_STATUS.md` documents ~11 leaks

**Mitigation**:

- ⚠️ Low-priority engagement feature
- ⚠️ Users understand EN terms
- Defer to future polish sprint

**Status**: ⚠️ KNOWN, DEFERRED

---

## Risk Matrix

```
            Low Impact    Medium Impact    High Impact
High Prob   Focus Timer   Template Names
                          i18n Leaks
Med Prob    Job History   Tool Missing
            Cosmetic
Low Prob    localStorage  Concurrent      Schema
            shell:true    Writes          Migration
```

---

_Generated: 2025-12-23_
