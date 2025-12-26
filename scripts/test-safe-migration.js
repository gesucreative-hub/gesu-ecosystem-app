#!/usr/bin/env node
/**
 * S0-1 Safe Migrations Test Script
 * 
 * Tests the safe migration behavior for localStorage stores.
 * Run in Node.js with a mock localStorage or browser DevTools console.
 * 
 * Usage:
 * 1. Open the app in development mode
 * 2. Open DevTools console
 * 3. Copy and paste this script to run tests
 * 
 * Expected results: All tests should pass with ✓
 */

// Test utilities
const TEST_RESULTS = [];

function log(message) {
    console.log(message);
}

function pass(testName) {
    TEST_RESULTS.push({ name: testName, passed: true });
    log(`  ✓ ${testName}`);
}

function fail(testName, reason) {
    TEST_RESULTS.push({ name: testName, passed: false, reason });
    log(`  ✗ ${testName}: ${reason}`);
}

function assert(condition, testName, failReason) {
    if (condition) {
        pass(testName);
    } else {
        fail(testName, failReason);
    }
}

// Test constants
const PROJECT_STORE_KEY = 'gesu-projects';
const BACKUP_PREFIX = 'gesu-backup-';

// --- Test 1: FUTURE_VERSION scenario ---
async function testFutureVersion() {
    log('\n[TEST] FUTURE_VERSION scenario for projectStore');
    
    // Save current state for restoration
    const originalData = localStorage.getItem(PROJECT_STORE_KEY);
    const originalBackupCount = countBackups(PROJECT_STORE_KEY);
    
    try {
        // Set up test data with future version
        const testData = {
            schemaVersion: 999, // Future version
            projects: [{ id: 'test-project', name: 'Test Project' }],
            activeProjectId: 'test-project'
        };
        localStorage.setItem(PROJECT_STORE_KEY, JSON.stringify(testData));
        
        // Force reload - in real scenario, page refresh would trigger this
        // For now, check if the store module has loadState
        
        // Check assertions
        const newBackupCount = countBackups(PROJECT_STORE_KEY);
        assert(
            newBackupCount > originalBackupCount,
            'Backup created for FUTURE_VERSION',
            `Expected ${originalBackupCount + 1} backups, got ${newBackupCount}`
        );
        
        // Verify original data preserved in backup
        const backups = getBackups(PROJECT_STORE_KEY);
        if (backups.length > 0) {
            const latestBackup = backups[0];
            assert(
                latestBackup.includes('"schemaVersion":999') || 
                latestBackup.includes('"schemaVersion": 999'),
                'Original raw preserved in backup',
                'Backup does not contain original schemaVersion'
            );
        }
        
        // Verify original localStorage key NOT modified
        const currentData = localStorage.getItem(PROJECT_STORE_KEY);
        assert(
            currentData === JSON.stringify(testData),
            'Original key NOT mutated',
            'Original localStorage key was modified'
        );
        
    } finally {
        // Restore original data
        if (originalData) {
            localStorage.setItem(PROJECT_STORE_KEY, originalData);
        } else {
            localStorage.removeItem(PROJECT_STORE_KEY);
        }
    }
}

// --- Test 2: CORRUPT scenario ---
async function testCorrupt() {
    log('\n[TEST] CORRUPT scenario for projectStore');
    
    const originalData = localStorage.getItem(PROJECT_STORE_KEY);
    const originalBackupCount = countBackups(PROJECT_STORE_KEY);
    
    try {
        // Set up corrupted data
        const corruptData = '{corrupted:true';
        localStorage.setItem(PROJECT_STORE_KEY, corruptData);
        
        // Check assertions
        const newBackupCount = countBackups(PROJECT_STORE_KEY);
        assert(
            newBackupCount > originalBackupCount,
            'Backup created for CORRUPT',
            `Expected ${originalBackupCount + 1} backups, got ${newBackupCount}`
        );
        
        // Verify original raw preserved
        const backups = getBackups(PROJECT_STORE_KEY);
        if (backups.length > 0) {
            const latestBackup = backups[0];
            assert(
                latestBackup.includes('{corrupted:true'),
                'Corrupted raw preserved in backup',
                'Backup does not contain original corrupted data'
            );
        }
        
        // Verify original key NOT modified
        const currentData = localStorage.getItem(PROJECT_STORE_KEY);
        assert(
            currentData === corruptData,
            'Original key NOT mutated (CORRUPT)',
            'Original localStorage key was modified'
        );
        
    } finally {
        if (originalData) {
            localStorage.setItem(PROJECT_STORE_KEY, originalData);
        } else {
            localStorage.removeItem(PROJECT_STORE_KEY);
        }
    }
}

// --- Test 3: MIGRATION_NEEDED scenario ---
async function testMigration() {
    log('\n[TEST] MIGRATION_NEEDED scenario for projectStore (v1 -> v2)');
    
    const originalData = localStorage.getItem(PROJECT_STORE_KEY);
    const originalBackupCount = countBackups(PROJECT_STORE_KEY);
    
    try {
        // Set up v1 data
        const v1Data = {
            schemaVersion: 1,
            projects: [{ id: 'old-project', name: 'SERAYA Test Project' }],
            activeProjectId: 'old-project'
        };
        localStorage.setItem(PROJECT_STORE_KEY, JSON.stringify(v1Data));
        
        // Check that backup was created BEFORE migration
        // Note: Migration happens on loadState(), so we check backup exists
        const newBackupCount = countBackups(PROJECT_STORE_KEY);
        assert(
            newBackupCount > originalBackupCount,
            'Backup created BEFORE migration',
            `Expected ${originalBackupCount + 1} backups, got ${newBackupCount}`
        );
        
        // Verify backup contains v1 data
        const backups = getBackups(PROJECT_STORE_KEY);
        if (backups.length > 0) {
            const latestBackup = backups[0];
            assert(
                latestBackup.includes('"schemaVersion":1') || 
                latestBackup.includes('"schemaVersion": 1'),
                'Pre-migration backup contains v1 data',
                'Backup does not contain v1 schemaVersion'
            );
        }
        
    } finally {
        if (originalData) {
            localStorage.setItem(PROJECT_STORE_KEY, originalData);
        } else {
            localStorage.removeItem(PROJECT_STORE_KEY);
        }
    }
}

// --- Helper functions ---

function countBackups(storeKey) {
    let count = 0;
    const prefix = `${BACKUP_PREFIX}${storeKey}-`;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
            count++;
        }
    }
    return count;
}

function getBackups(storeKey) {
    const backups = [];
    const prefix = `${BACKUP_PREFIX}${storeKey}-`;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
            backups.push(localStorage.getItem(key));
        }
    }
    return backups.sort().reverse(); // Newest first by timestamp in key
}

// --- Run all tests ---

async function runAllTests() {
    log('='.repeat(60));
    log('S0-1 Safe Migrations Test Suite');
    log('='.repeat(60));
    
    await testFutureVersion();
    await testCorrupt();
    await testMigration();
    
    log('\n' + '='.repeat(60));
    const passed = TEST_RESULTS.filter(r => r.passed).length;
    const total = TEST_RESULTS.length;
    log(`Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
        log('✅ All tests passed!');
    } else {
        log('❌ Some tests failed. Check output above.');
    }
    log('='.repeat(60));
    
    return TEST_RESULTS;
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
    runAllTests();
} else {
    console.log('This test script should be run in browser DevTools console.');
    console.log('1. Open the Gesu Ecosystem app');
    console.log('2. Open DevTools (F12)');
    console.log('3. Copy and paste this script into Console');
}
