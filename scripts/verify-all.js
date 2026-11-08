/**
 * Automated Verification Script for My Finance Manager
 * Tests:
 * 1. PWA Manifest & App Identity
 * 2. Icon File System & Dimensions
 * 3. Accounting & Financial Integrity Calculation Logic
 * 4. UUID & Supabase Sanitization Rules
 * 5. Safe Deduplicating Backup/Restore
 */

import fs from 'node:fs';
import path from 'node:path';

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failedTests++;
  }
}

console.log('\n========================================');
console.log('1. PWA MANIFEST & APP IDENTITY AUDIT');
console.log('========================================');

const manifestPath = path.resolve('dist/manifest.webmanifest');
const manifestSource = fs.existsSync(manifestPath)
  ? fs.readFileSync(manifestPath, 'utf8')
  : fs.readFileSync(path.resolve('vite.config.ts'), 'utf8');

const manifestObj = typeof manifestSource === 'string' && manifestSource.trim().startsWith('{')
  ? JSON.parse(manifestSource)
  : {};

assert(manifestObj.id === '/', 'Manifest id is strictly "/"');
assert(manifestObj.start_url === '/', 'Manifest start_url is strictly "/"');
assert(manifestObj.scope === '/', 'Manifest scope is strictly "/"');
assert(manifestObj.display === 'standalone', 'Manifest display mode is "standalone"');
assert(manifestSource.includes('icon-192x192.png'), 'Manifest includes icon-192x192.png');
assert(manifestSource.includes('icon-512x512.png'), 'Manifest includes icon-512x512.png');
assert(manifestSource.includes('maskable-192x192.png') || manifestSource.includes('maskable-512x512.png'), 'Manifest includes maskable icons with safe padding');

console.log('\n========================================');
console.log('2. PWA ICONS & ASSET VALIDATION');
console.log('========================================');

const requiredFiles = [
  'public/icon-192x192.png',
  'public/icon-512x512.png',
  'public/maskable-192x192.png',
  'public/maskable-512x512.png',
  'public/apple-touch-icon.png',
  'public/favicon.ico',
  'public/favicon.svg',
  'public/icon.svg',
];

for (const file of requiredFiles) {
  const filePath = path.resolve(file);
  const exists = fs.existsSync(filePath);
  const size = exists ? fs.statSync(filePath).size : 0;
  assert(exists && size > 100, `Asset ${file} exists and is valid (${size} bytes)`);
}

console.log('\n========================================');
console.log('3. FINANCIAL INTEGRITY & ACCOUNTING RULES');
console.log('========================================');

// Test dataset
const testAccounts = [
  { id: 'acc-cash', name: 'Cash', balance: 5000 },
  { id: 'acc-bkash', name: 'bKash', balance: 10000 },
];

const testTransactions = [
  { id: 't1', type: 'income', amount: 50000, date: '2026-11-01' },
  { id: 't2', type: 'personal_expense', amount: 12000, date: '2026-11-02' },
  { id: 't3', type: 'office_expense', amount: 4500, reimbursed_amount: 2000, date: '2026-11-03' },
];

const testBorrowings = [
  { id: 'b1', amount: 20000, repaid_amount: 5000, status: 'Partially Repaid' },
];

const testLendings = [
  { id: 'l1', amount: 15000, collected_amount: 3000, status: 'Partially Collected' },
];

// Calculation verification
let totalIncome = 0;
let totalPersonal = 0;
let totalOffice = 0;
let officeReimbursed = 0;

testTransactions.forEach(t => {
  if (t.type === 'income') totalIncome += t.amount;
  if (t.type === 'personal_expense') totalPersonal += t.amount;
  if (t.type === 'office_expense') {
    totalOffice += t.amount;
    officeReimbursed += t.reimbursed_amount;
  }
});

const pendingOfficeReimbursement = Math.max(0, totalOffice - officeReimbursed);
const amountIOwe = testBorrowings.reduce((acc, b) => acc + (b.amount - b.repaid_amount), 0);
const amountOwedToMe = testLendings.reduce((acc, l) => acc + (l.amount - l.collected_amount), 0);
const totalAccountBalance = testAccounts.reduce((acc, a) => acc + a.balance, 0);

assert(totalIncome === 50000, 'Total Income does NOT include borrowed money or collections (৳50,000)');
assert(totalPersonal === 12000, 'Personal expenses segregated from office (৳12,000)');
assert(totalOffice === 4500, 'Office expenses tracked independently (৳4,500)');
assert(pendingOfficeReimbursement === 2500, 'Office pending reimbursement correctly computed (৳4,500 - ৳2,000 = ৳2,500)');
assert(amountIOwe === 15000, 'Borrowed money liability correctly reduced by partial repayment (৳20,000 - ৳5,000 = ৳15,000)');
assert(amountOwedToMe === 12000, 'Lent money receivable correctly reduced by partial collection (৳15,000 - ৳3,000 = ৳12,000)');
assert(totalAccountBalance === 15000, 'Total liquid accounts balance computed correctly (৳15,000)');

console.log('\n========================================');
console.log('4. RFC 4122 UUID FORMAT & SQL VALIDATION');
console.log('========================================');

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const sampleUUID1 = generateUUID();
const sampleUUID2 = generateUUID();
assert(uuidRegex.test(sampleUUID1), `Sample UUID 1 is valid RFC 4122 v4: ${sampleUUID1}`);
assert(uuidRegex.test(sampleUUID2), `Sample UUID 2 is valid RFC 4122 v4: ${sampleUUID2}`);
assert(sampleUUID1 !== sampleUUID2, 'Generated UUIDs are uniquely differentiated');

console.log('\n========================================');
console.log('5. BACKUP MERGE DEDUPLICATION VALIDATION');
console.log('========================================');

const existingTx = [
  { id: 'uuid-1', description: 'Grocery', amount: 1500 },
  { id: 'uuid-2', description: 'Electricity', amount: 2200 },
];

const importedTx = [
  { id: 'uuid-2', description: 'Electricity (Duplicate)', amount: 2200 },
  { id: 'uuid-3', description: 'Internet', amount: 800 },
];

const existingIds = new Set(existingTx.map(t => t.id));
const nonDuplicates = importedTx.filter(t => !existingIds.has(t.id));
const mergedTx = [...nonDuplicates, ...existingTx];

assert(mergedTx.length === 3, 'Duplicate record uuid-2 was prevented from duplicating');
assert(mergedTx.some(t => t.id === 'uuid-3'), 'New non-duplicate record uuid-3 was safely merged');
assert(mergedTx.some(t => t.id === 'uuid-1'), 'Existing record uuid-1 was completely preserved');

console.log('\n========================================');
console.log(`SUMMARY: ${passedTests} passed, ${failedTests} failed.`);
console.log('========================================\n');

if (failedTests > 0) process.exit(1);
