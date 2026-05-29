import { calculatePaymentStatus, sortMembers } from './paymentLogic.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`❌ FAIL: ${message}`);
  }
}

// Test calculatePaymentStatus
console.log('Testing calculatePaymentStatus...');
assert(calculatePaymentStatus(100, 100, false) === 'paid', 'Full payment sets paid');
assert(calculatePaymentStatus(150, 100, true) === 'paid', 'Overpayment sets paid');
assert(calculatePaymentStatus(50, 100, false) === 'partial', 'Partial payment sets partial');
assert(calculatePaymentStatus(50, 100, true) === 'partial', 'Partial payment on overdue sets partial');
assert(calculatePaymentStatus(0, 100, true) === 'overdue', 'Zero payment on overdue sets overdue');
assert(calculatePaymentStatus(0, 100, false) === 'pending', 'Zero payment on normal sets pending');

// Test sortMembers
console.log('Testing sortMembers...');
const members = [
  { id: 1, payment_status: 'paid' },
  { id: 2, payment_status: 'overdue' },
  { id: 3, payment_status: 'pending' },
  { id: 4, payment_status: 'partial' },
  { id: 5, payment_status: 'exempt' },
];

const sorted = sortMembers(members);
assert(sorted[0].payment_status === 'overdue', 'Overdue should be first');
assert(sorted[1].payment_status === 'partial', 'Partial should be second');
assert(sorted[2].payment_status === 'pending', 'Pending should be third');
assert(sorted[3].payment_status === 'exempt', 'Exempt should be fourth');
assert(sorted[4].payment_status === 'paid', 'Paid should be last');

console.log(`\nTests completed: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
