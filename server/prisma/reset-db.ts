// --- FILE: server/prisma/reset-db.ts
/**
 * Reset database script
 * 
 * WARNING: This will DELETE ALL data except users!
 * 
 * Usage: npx ts-node prisma/reset-db.ts
 * 
 * This script:
 * 1. Deletes all loan installments
 * 2. Deletes all loans
 * 3. Deletes all transactions
 * 4. Deletes all credit card operations
 * 5. Deletes all credit cards
 * 6. Deletes all cheques
 * 7. Deletes all attachments
 * 8. Deletes all banks
 * 9. Deletes all customers
 * 10. Deletes all suppliers
 * 11. Keeps all users (they are seeded separately)
 * 
 * After running this, only users will remain in the database.
 * All business data (banks, cards, cheques, transactions) must be created through the UI.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('⚠️  WARNING: This will delete ALL business data!');
  console.log('Only users will remain.');
  console.log('');
  
  // Delete in order to respect foreign key constraints
  // Delete in order to respect foreign key constraints
  console.log('Deleting all loan installments...');
  await prisma.loanInstallment.deleteMany({});
  console.log('✓ Loan installments deleted');
  
  console.log('Deleting all loans...');
  await prisma.loan.deleteMany({});
  console.log('✓ Loans deleted');
  
  console.log('Deleting all transactions...');
  await prisma.transaction.deleteMany({});
  console.log('✓ Transactions deleted');
  
  console.log('Deleting all credit card operations...');
  await prisma.creditCardOperation.deleteMany({});
  console.log('✓ Credit card operations deleted');
  
  console.log('Deleting all credit cards...');
  await prisma.creditCard.deleteMany({});
  console.log('✓ Credit cards deleted');
  
  console.log('Deleting all cheques...');
  await prisma.cheque.deleteMany({});
  console.log('✓ Cheques deleted');
  
  console.log('Deleting all attachments...');
  await prisma.attachment.deleteMany({});
  console.log('✓ Attachments deleted');
  
  console.log('Deleting all banks...');
  await prisma.bank.deleteMany({});
  console.log('✓ Banks deleted');
  
  console.log('Deleting all customers...');
  await prisma.customer.deleteMany({});
  console.log('✓ Customers deleted');
  
  console.log('Deleting all suppliers...');
  await prisma.supplier.deleteMany({});
  console.log('✓ Suppliers deleted');
  
  console.log('');
  console.log('✅ Database reset complete!');
  console.log('Only users remain. All business data has been deleted.');
  console.log('You can now start the application and create banks/cards/transactions through the UI.');
}

main()
  .catch((e) => {
    console.error('❌ Database reset failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

