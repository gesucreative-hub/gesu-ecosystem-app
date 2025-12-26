# i18n Alerts Sweep - Summary Report

## Overview

This document captures the comprehensive alerts/notifications localization sweep performed on December 23, 2025.

## Inventory (Before)

| Pattern             | Count  |
| ------------------- | ------ |
| `showToast()` calls | 35     |
| `alert({})` dialogs | 10     |
| Native `alert()`    | 2      |
| **Total**           | **47** |

## Inventory (After)

| Pattern                        | Count (Hardcoded) |
| ------------------------------ | ----------------- |
| `showToast()` with literals    | 0                 |
| `alert({})` with literals      | 0                 |
| Native `alert()` with literals | 0                 |
| **Total**                      | **0**             |

## Keys Added

### common.json (EN + ID)

- `alerts.success`, `alerts.error`, `alerts.info`, `alerts.warning`
- `alerts.saved`, `alerts.saving`, `alerts.updated`, `alerts.deleted`
- `alerts.copied`, `alerts.refreshed`, `alerts.queued`, `alerts.canceled`
- `alerts.failed`, `alerts.invalidInput`, `alerts.invalidFile`
- `alerts.noData`, `alerts.notAvailableInBrowser`
- `alerts.jobQueued`, `alerts.jobCanceled`, `alerts.jobsQueued`, `alerts.jobsCanceled`
- `alerts.filesSelected`, `alerts.filesAdded`, `alerts.noFilesSelected`
- `alerts.noFolderSet`, `alerts.updateSuccess`, `alerts.updateFailed`
- `alerts.failedWithReason`, `alerts.pleaseEnterValidUrl`, `alerts.pleaseSelectSourceFile`
- `alerts.convertJobQueued`, `alerts.downloadJobQueued`, `alerts.failedToEnqueueJob`
- `alerts.failedToPickFile`, `alerts.failedToPickFiles`, `alerts.failedToPickFolder`
- `alerts.failedToCancelJob`, `alerts.failedToCancelAllJobs`
- `alerts.failedToOpenFolder`, `alerts.failedToUpdate`
- `alerts.noFilesForBatchConvert`, `alerts.filePickerNotSupported`
- `alerts.folderPickerNotAvailable`, `alerts.cancelNotAvailable`
- `alerts.updateNotAvailable`, `alerts.openFolderNotAvailable`
- `alerts.projectCreated`, `alerts.projectCreatedMessage`
- `alerts.blueprintSaved`, `alerts.blueprintDeleted`
- `alerts.phaseSaved`, `alerts.phaseDeleted`, `alerts.stepSaved`, `alerts.stepDeleted`
- `alerts.maxPhasesReached`, `alerts.maxPhasesMessage`
- `alerts.snapshotSaved`, `alerts.snapshotSaveFailed`
- `alerts.invalidBlueprintFile`, `alerts.failedToParseJson`
- `alerts.projectListRefreshed`

**Total Keys Added:** 60+

## Files Updated

### Component Files

| File                      | Changes                      |
| ------------------------- | ---------------------------- |
| `MediaSuitePage.tsx`      | 33 showToast calls converted |
| `CompassPage.tsx`         | 3 alert() calls converted    |
| `InitiatorPage.tsx`       | 2 alert() calls converted    |
| `TemplatePickerModal.tsx` | 2 alert() calls converted    |

### Locale Files

| File             | Changes                                           |
| ---------------- | ------------------------------------------------- |
| `en/common.json` | Added `alerts` section with 60+ keys              |
| `id/common.json` | Added `alerts` section with 60+ keys (Indonesian) |

## QA Checklist (User Verification)

### Media Suite Page

1. Navigate to Media Suite → Download tab
2. Try to download without URL → Should show "Harap masukkan URL yang valid" (ID)
3. Try to pick file → Should show localized picker errors if not in Electron
4. Queue a job → Should show "Tugas unduh diantrekan" (ID)

### Compass Page

1. Navigate to Compass → Save snapshot
2. Should show "Snapshot berhasil disimpan!" (ID) on success
3. Try to delete snapshots → Confirmation should be localized

### Project Hub

1. Navigate to Generator → Create new project
2. On success → Should show "Proyek Dibuat" dialog with localized message

### Template Picker

1. Open Standards → Templates button
2. Try to import invalid JSON → Should show localized error

## Verification Status

- ✅ All showToast calls use t()
- ✅ All alert() calls use t()
- ✅ Locale parity maintained (EN/ID)
- ⏳ Guardrail script update (optional)
- ⏳ Browser QA (requires localhost:5173)

## Git Commands

```bash
git status
git add apps/gesu-shell/src/pages/MediaSuitePage.tsx \
        apps/gesu-shell/src/pages/CompassPage.tsx \
        apps/gesu-shell/src/pages/InitiatorPage.tsx \
        apps/gesu-shell/src/components/TemplatePickerModal.tsx \
        apps/gesu-shell/src/locales/en/common.json \
        apps/gesu-shell/src/locales/id/common.json \
        docs/I18N_ALERTS_SWEEP.md
git commit -m "i18n: localize alerts/toasts/dialog copy + add common alert keys"
git push
```
