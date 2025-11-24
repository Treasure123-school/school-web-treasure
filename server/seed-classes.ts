import { db } from './storage';
import { classes } from '@shared/schema';

/**
 * Seed script to populate classes from KG1 to SSS3 for Nigerian school system
 */
async function seedClasses() {
  console.log('🌱 Starting to seed classes...');

  const classesToCreate = [
    // Kindergarten (2 classes)
    { name: 'KG1', level: 'Kindergarten', capacity: 25 },
    { name: 'KG2', level: 'Kindergarten', capacity: 25 },
    
    // Primary School (6 classes)
    { name: 'Primary 1', level: 'Primary', capacity: 30 },
    { name: 'Primary 2', level: 'Primary', capacity: 30 },
    { name: 'Primary 3', level: 'Primary', capacity: 30 },
    { name: 'Primary 4', level: 'Primary', capacity: 30 },
    { name: 'Primary 5', level: 'Primary', capacity: 30 },
    { name: 'Primary 6', level: 'Primary', capacity: 30 },
    
    // Junior Secondary School (3 classes)
    { name: 'JSS 1', level: 'Junior Secondary', capacity: 35 },
    { name: 'JSS 2', level: 'Junior Secondary', capacity: 35 },
    { name: 'JSS 3', level: 'Junior Secondary', capacity: 35 },
    
    // Senior Secondary School (3 classes)
    { name: 'SSS 1', level: 'Senior Secondary', capacity: 35 },
    { name: 'SSS 2', level: 'Senior Secondary', capacity: 35 },
    { name: 'SSS 3', level: 'Senior Secondary', capacity: 35 },
  ];

  try {
    // Insert all classes
    const insertedClasses = await db.insert(classes).values(classesToCreate).returning();
    
    console.log(`✅ Successfully created ${insertedClasses.length} classes:`);
    insertedClasses.forEach((cls: typeof insertedClasses[0]) => {
      console.log(`   - ${cls.name} (${cls.level}) - Capacity: ${cls.capacity}`);
    });
    
    console.log('\n🎉 Class seeding completed successfully!');
    console.log(`Total classes created: ${insertedClasses.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding classes:', error);
    throw error;
  }
}

// Run the seed function
seedClasses()
  .then(() => {
    console.log('✅ Seed script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });
