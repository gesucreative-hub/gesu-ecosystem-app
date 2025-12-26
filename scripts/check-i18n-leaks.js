#!/usr/bin/env node
/**
 * i18n Leak Detection Script
 * Checks for common EN strings and translation key leaks in UI code
 * Run: node scripts/check-i18n-leaks.js
 */

const { execSync } = require('child_process');

// Patterns to detect
const LEAK_PATTERNS = [
    // Previously fixed (Sprint 0.12.7)
    { pattern: `Today's Focus`, description: 'Hardcoded English "Today\'s Focus"' },
    { pattern: 'Select a step to edit', description: 'Hardcoded English step editor placeholder' },
    { pattern: 'Search templates\\.\\.\\.', description: 'Hardcoded English template search placeholder' },
    { pattern: 'New Template(?!\\))', description: 'Hardcoded English "New Template" (not in t() fallback)' },
    { pattern: 'New Blueprint(?!\\))', description: 'Hardcoded English "New Blueprint" (not in t() fallback)' },
    { pattern: 'Saving to local files(?!\\))', description: 'Hardcoded English storage status' },
    
    // Translation key leaks (raw keys appearing in UI)
    { pattern: 'viewModes\\.(?!\\w+\\))', description: 'Raw viewModes.* key leak' },
    { pattern: 'mentalStates\\.(?!\\w+\\))', description: 'Raw mentalStates.* key leak' },
    { pattern: 'workflow\\.steps\\.(?!\\w+\\))', description: 'Raw workflow.steps.* key leak' },
    
    // Hardcoded day/month abbreviations
    { pattern: `\\['Su', 'Mo', 'Tu'`, description: 'Hardcoded weekday array' },
    { pattern: `\\['S', 'M', 'T', 'W'`, description: 'Hardcoded weekday array (narrow)' },
    { pattern: `\\['Jan', 'Feb', 'Mar'`, description: 'Hardcoded month array' },
    
    // Compass domain labels (Sprint 0.12.8)
    { pattern: '\\bMoney\\b.*data.*focusAreas', description: 'Compass domain "Money" in focusAreas context' },
    { pattern: '\\bCreative\\b.*data.*focusAreas', description: 'Compass domain "Creative" in focusAreas context' },
    { pattern: '\\bRelations\\b.*data.*focusAreas', description: 'Compass domain "Relations" in focusAreas context' },
    { pattern: 'Self Care.*data.*focusAreas', description: 'Compass domain "Self Care" in focusAreas context' },
    
    // Project Hub leaks (Sprint 0.12.8)
    { pattern: 'Search projects\\.\\.\\.(?!\\))', description: 'Project search placeholder not wrapped' },
    { pattern: 'Select Blueprint\\.\\.\\.(?!\\))', description: 'Blueprint placeholder not wrapped' },
    { pattern: 'FOLDER (NAME|STRUCTURE)(?!\\))', description: 'Preview headers not wrapped' },
    { pattern: 'Manage structures(?!\\))', description: 'Manage structures not wrapped' },
    
    // Workflow phase/status labels (Sprint 0.12.8)
    { pattern: '\\b(Planning|Execution|Finalize)\\b(?!.*labelKey)(?!.*t\\()', description: 'Phase labels not using labelKey pattern' },
    { pattern: '\\b(Todo|WiP|Done)\\b.*status(?!.*t\\()', description: 'Status labels not mapped with t()' },
    { pattern: '\\bBack\\b(?!.*t\\(["\']common:buttons)', description: 'Back button not using common:buttons.back' },
    
    // Media Suite leaks (Sprint 0.12.8)
    { pattern: 'ENGINE STATUS(?!\\))', description: 'Media Suite ENGINE STATUS header not wrapped' },
    { pattern: 'Enable Safe Throttling(?!\\))', description: 'Throttling toggle label not wrapped' },
    { pattern: 'Job Queue(?!\\))', description: 'Job Queue header not wrapped' },
    
    // === NEW: i18n Sprint (Sprint 0.12.9) ===
    
    // Refocus Protocol leaks (data-driven, must use id+titleKey pattern)
    { pattern: `name: 'The Breath'(?!.*id:)`, description: 'Refocus protocol without id field' },
    { pattern: `name: 'The Hydrate'(?!.*id:)`, description: 'Refocus protocol "The Hydrate" without id' },
    { pattern: `name: 'The Gaze'(?!.*id:)`, description: 'Refocus protocol "The Gaze" without id' },
    { pattern: 'Protocol Complete(?![^}]*t\\()', description: 'Hardcoded "Protocol Complete" not using t()' },
    { pattern: `Did this protocol help(?![^}]*t\\()`, description: 'Feedback question not using t()' },
    
    // Focus Timer leaks (presets, labels)
    { pattern: `l: 'Quick'(?!.*key:)`, description: 'Focus preset "Quick" without key field' },
    { pattern: `l: 'Classic'(?!.*key:)`, description: 'Focus preset "Classic" without key field' },
    { pattern: `l: 'Deep'(?!.*key:)`, description: 'Focus preset "Deep" without key field' },
    { pattern: `action: 'Drink a glass(?!.*id:)`, description: 'Break activity without id field' },
    { pattern: 'Break Activities(?![^}]*t\\()', description: 'Hardcoded "Break Activities" not using t()' },
    { pattern: `>Completed</div>(?![^}]*t\\()`, description: 'Hardcoded "Completed" stat label' },
    { pattern: 'Until Long Break(?![^}]*t\\()', description: 'Hardcoded "Until Long Break" not using t()' },
    { pattern: 'Auto-start next(?![^}]*t\\()', description: 'Hardcoded "Auto-start next" not using t()' },
    { pattern: '>Presets</span>(?![^}]*t\\()', description: 'Hardcoded "Presets" not using t()' },
    { pattern: `showConfig \\? 'Hide'`, description: 'Hardcoded Hide/Custom toggle not using t()' },
    { pattern: `label: 'Focus \\(min\\)'(?![^}]*labelKey)`, description: 'Config label without labelKey pattern' },
    { pattern: `label: 'Short break'(?![^}]*labelKey)`, description: 'Config label without labelKey pattern' },
    { pattern: `>Apply</Button>(?![^}]*t\\()`, description: 'Hardcoded "Apply" button not using t()' },
    
    // Clear Data dropdown leaks (Activity/Compass)
    { pattern: `label: 'Today only'(?![^}]*labelKey)`, description: 'Clear Data option without labelKey' },
    { pattern: `label: 'Last 7 days'(?![^}]*labelKey)`, description: 'Clear Data option without labelKey' },
    { pattern: `label: 'All data'(?![^}]*labelKey)`, description: 'Clear Data option without labelKey' },
    { pattern: `>Today</.*push\\(.*label:`, description: 'History group label hardcoded' },
    { pattern: `>Yesterday</.*push\\(.*label:`, description: 'History group label hardcoded' },
    { pattern: `>Active</span>(?![^}]*t\\()`, description: 'Session "Active" badge not using t()' },
];

let hasLeaks = false;
let totalLeaks = 0;

console.log('🔍 Checking for i18n leaks...\n');

LEAK_PATTERNS.forEach(({ pattern, description }) => {
    try {
        // Run ripgrep to find pattern in .tsx files
        const result = execSync(
            `rg "${pattern}" apps/gesu-shell/src --type tsx --count --quiet`,
            { encoding: 'utf-8', stdio: 'pipe' }
        );
        
        // If we get output, there are matches
        const matches = result.trim().split('\n').filter(Boolean);
        if (matches.length > 0) {
            hasLeaks = true;
            totalLeaks += matches.length;
            console.log(`❌ ${description}`);
            console.log(`   Found in ${matches.length} file(s)`);
            
            // Show first 3 matches
            const sample = execSync(
                `rg "${pattern}" apps/gesu-shell/src --type tsx -n`,
                { encoding: 'utf-8', stdio: 'pipe' }
            ).trim().split('\n').slice(0, 3);
            
            sample.forEach(line => console.log(`   ${line}`));
            console.log('');
        }
    } catch (err) {
        // rg exits with code 1 if no matches found, which is what we want
        if (err.status === 1) {
            console.log(`✅ ${description} - OK`);
        } else {
            console.error(`⚠️  Error checking pattern: ${description}`);
            console.error(err.message);
        }
    }
});

console.log('\n' + '='.repeat(60));
if (hasLeaks) {
    console.log(`❌ FAILED: Found ${totalLeaks} potential i18n leaks`);
    console.log('Run fixes and then re-check with: npm run check:i18n-leaks');
    process.exit(1);
} else {
    console.log('✅ PASSED: No i18n leaks detected');
    process.exit(0);
}
