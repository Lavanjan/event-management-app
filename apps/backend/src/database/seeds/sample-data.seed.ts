import { DataSource } from 'typeorm';
import { InventoryItem, Event } from '../entities';

export class SampleDataSeed {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.createSampleInventory(queryRunner);
      await this.createSampleEvents(queryRunner);

      await queryRunner.commitTransaction();
      console.log('✅ Sample data seeded successfully');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('❌ Error seeding sample data:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async createSampleInventory(queryRunner: any): Promise<void> {
    const inventoryRepository = queryRunner.manager.getRepository(InventoryItem);
    
    const inventoryItems = [
      {
        name: 'Round Table (8-person)',
        description: 'Standard round table that seats 8 people',
        unitPrice: 25.00,
        quantity: 20,
        availableQuantity: 20,
        metadata: { category: 'furniture', weight: '50lbs', dimensions: '60" diameter' }
      },
      {
        name: 'Chiavari Chair',
        description: 'Elegant gold chiavari chair',
        unitPrice: 8.50,
        quantity: 200,
        availableQuantity: 200,
        metadata: { category: 'furniture', color: 'gold', stackable: true }
      },
      {
        name: 'White Linen Tablecloth',
        description: '120" round white linen tablecloth',
        unitPrice: 12.00,
        quantity: 50,
        availableQuantity: 50,
        metadata: { category: 'linens', size: '120"', color: 'white' }
      },
      {
        name: 'Centerpiece - Floral Arrangement',
        description: 'Seasonal floral centerpiece arrangement',
        unitPrice: 35.00,
        quantity: 30,
        availableQuantity: 30,
        metadata: { category: 'decor', type: 'floral', seasonal: true }
      },
      {
        name: 'Sound System Package',
        description: 'Complete sound system with microphones',
        unitPrice: 150.00,
        quantity: 5,
        availableQuantity: 5,
        metadata: { category: 'av_equipment', includes: ['speakers', 'microphones', 'mixer'] }
      },
      {
        name: 'LED Uplighting',
        description: 'Color-changing LED uplight fixture',
        unitPrice: 15.00,
        quantity: 40,
        availableQuantity: 40,
        metadata: { category: 'lighting', color_changing: true, wireless: true }
      },
      {
        name: 'Cocktail Table',
        description: 'High-top cocktail table with linen',
        unitPrice: 18.00,
        quantity: 15,
        availableQuantity: 15,
        metadata: { category: 'furniture', height: '42"', includes_linen: true }
      },
      {
        name: 'Dance Floor Section',
        description: '4x4 ft portable dance floor section',
        unitPrice: 8.00,
        quantity: 64,
        availableQuantity: 64,
        metadata: { category: 'flooring', size: '4x4 ft', portable: true }
      }
    ];

    for (const itemData of inventoryItems) {
      const existingItem = await inventoryRepository.findOne({
        where: { name: itemData.name }
      });

      if (!existingItem) {
        const item = inventoryRepository.create(itemData);
        await inventoryRepository.save(item);
      }
    }
  }

  private async createSampleEvents(queryRunner: any): Promise<void> {
    const eventRepository = queryRunner.manager.getRepository(Event);
    
    const now = new Date();
    const events = [
      {
        name: 'Annual Corporate Gala',
        description: 'Elegant corporate gala dinner for 200 guests',
        startDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000), // 6 hours later
        location: 'Grand Ballroom, Downtown Hotel',
        maxAttendees: 200,
        requiredAdvancePercentage: 50,
        balancePaymentWindowDays: 14,
        allowInventoryAllocation: true,
      },
      {
        name: 'Wedding Reception - Smith & Johnson',
        description: 'Outdoor wedding reception with garden theme',
        startDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        endDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000), // 8 hours later
        location: 'Riverside Gardens Venue',
        maxAttendees: 150,
        requiredAdvancePercentage: 60,
        balancePaymentWindowDays: 7,
        allowInventoryAllocation: true,
      },
      {
        name: 'Tech Conference 2024',
        description: 'Annual technology conference with multiple sessions',
        startDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        endDate: new Date(now.getTime() + 62 * 24 * 60 * 60 * 1000), // 3 days later
        location: 'Convention Center',
        maxAttendees: 500,
        requiredAdvancePercentage: 30,
        balancePaymentWindowDays: 21,
        allowInventoryAllocation: true,
      },
      {
        name: 'Birthday Party - Sweet 16',
        description: 'Sweet 16 birthday party with DJ and catering',
        startDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        endDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000), // 5 hours later
        location: 'Community Center Hall',
        maxAttendees: 80,
        requiredAdvancePercentage: 40,
        balancePaymentWindowDays: 3,
        allowInventoryAllocation: true,
      }
    ];

    for (const eventData of events) {
      const existingEvent = await eventRepository.findOne({
        where: { name: eventData.name }
      });

      if (!existingEvent) {
        const event = eventRepository.create(eventData);
        await eventRepository.save(event);
      }
    }
  }
}
