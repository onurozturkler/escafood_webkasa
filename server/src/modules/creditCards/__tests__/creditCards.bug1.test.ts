/**
 * BUG-1 Test: Credit card debt values persistence
 * 
 * Test that sonEkstreBorcu and manualGuncelBorc are correctly saved and retrieved.
 */

import { PrismaClient } from '@prisma/client';
import { CreditCardsService } from '../creditCards.service';

const prisma = new PrismaClient();
const service = new CreditCardsService();

describe('BUG-1: Credit Card Debt Values Persistence', () => {
  let testCardId: string;
  const testUserId = 'test-user-bug1';

  beforeAll(async () => {
    // Create a test bank first
    const testBank = await prisma.bank.create({
      data: {
        name: 'Test Bank BUG1',
        accountNo: 'TEST001',
        isActive: true,
        createdBy: testUserId,
      },
    });

    // Create a test credit card
    const card = await prisma.creditCard.create({
      data: {
        name: 'Test Card BUG1',
        bankId: testBank.id,
        limit: 100000,
        closingDay: 15,
        dueDay: 5,
        sonEkstreBorcu: 0,
        manualGuncelBorc: null,
        isActive: true,
        createdBy: testUserId,
      },
    });
    testCardId = card.id;
  });

  afterAll(async () => {
    // Cleanup
    if (testCardId) {
      await prisma.creditCard.deleteMany({ where: { id: testCardId } });
    }
    await prisma.bank.deleteMany({ where: { name: 'Test Bank BUG1' } });
    await prisma.$disconnect();
  });

  it('should save and retrieve sonEkstreBorcu correctly', async () => {
    const testValue = 15500.50;

    // Save with sonEkstreBorcu
    const saved = await service.bulkSaveCreditCards(
      [
        {
          id: testCardId,
          name: 'Test Card BUG1',
          sonEkstreBorcu: testValue,
          manualGuncelBorc: null,
          isActive: true,
        },
      ],
      testUserId
    );

    expect(saved).toHaveLength(1);
    expect(saved[0].sonEkstreBorcu).toBe(testValue);

    // Retrieve and verify
    const retrieved = await service.getCreditCardById(testCardId);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.sonEkstreBorcu).toBe(testValue);
  });

  it('should save and retrieve manualGuncelBorc correctly', async () => {
    const testValue = 12000.75;

    // Save with manualGuncelBorc
    const saved = await service.bulkSaveCreditCards(
      [
        {
          id: testCardId,
          name: 'Test Card BUG1',
          sonEkstreBorcu: 0,
          manualGuncelBorc: testValue,
          isActive: true,
        },
      ],
      testUserId
    );

    expect(saved).toHaveLength(1);
    expect(saved[0].manualGuncelBorc).toBe(testValue);

    // Retrieve and verify
    const retrieved = await service.getCreditCardById(testCardId);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.manualGuncelBorc).toBe(testValue);
  });

  it('should save both sonEkstreBorcu and manualGuncelBorc together', async () => {
    const testSonEkstre = 15500.50;
    const testGuncel = 12000.75;

    // Save both values
    const saved = await service.bulkSaveCreditCards(
      [
        {
          id: testCardId,
          name: 'Test Card BUG1',
          sonEkstreBorcu: testSonEkstre,
          manualGuncelBorc: testGuncel,
          isActive: true,
        },
      ],
      testUserId
    );

    expect(saved).toHaveLength(1);
    expect(saved[0].sonEkstreBorcu).toBe(testSonEkstre);
    expect(saved[0].manualGuncelBorc).toBe(testGuncel);

    // Retrieve and verify both
    const retrieved = await service.getCreditCardById(testCardId);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.sonEkstreBorcu).toBe(testSonEkstre);
    expect(retrieved!.manualGuncelBorc).toBe(testGuncel);
  });

  it('should allow null for manualGuncelBorc (calculated from operations)', async () => {
    // Save with null manualGuncelBorc
    const saved = await service.bulkSaveCreditCards(
      [
        {
          id: testCardId,
          name: 'Test Card BUG1',
          sonEkstreBorcu: 0,
          manualGuncelBorc: null,
          isActive: true,
        },
      ],
      testUserId
    );

    expect(saved).toHaveLength(1);
    expect(saved[0].manualGuncelBorc).toBeNull();

    // Retrieve and verify
    const retrieved = await service.getCreditCardById(testCardId);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.manualGuncelBorc).toBeNull();
  });

  it('should persist values across listCreditCards calls', async () => {
    const testSonEkstre = 20000;
    const testGuncel = 15000;

    // Save values
    await service.bulkSaveCreditCards(
      [
        {
          id: testCardId,
          name: 'Test Card BUG1',
          sonEkstreBorcu: testSonEkstre,
          manualGuncelBorc: testGuncel,
          isActive: true,
        },
      ],
      testUserId
    );

    // Retrieve via listCreditCards
    const allCards = await service.listCreditCards();
    const card = allCards.find((c) => c.id === testCardId);

    expect(card).not.toBeUndefined();
    expect(card!.sonEkstreBorcu).toBe(testSonEkstre);
    expect(card!.manualGuncelBorc).toBe(testGuncel);
  });
});

