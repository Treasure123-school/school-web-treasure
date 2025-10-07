
import { db } from './storage';
import { academicTerms } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function seedAcademicTerms() {
  try {
    console.log('🎓 Checking for academic terms...');
    
    const existingTerms = await db.select().from(academicTerms);
    
    if (existingTerms.length === 0) {
      console.log('📚 No terms found. Creating default academic terms...');
      
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;
      const academicYear = `${currentYear}/${nextYear}`;
      
      const defaultTerms = [
        {
          name: 'First Term',
          year: academicYear,
          startDate: `${currentYear}-09-01`,
          endDate: `${currentYear}-12-15`,
          isCurrent: true
        },
        {
          name: 'Second Term',
          year: academicYear,
          startDate: `${nextYear}-01-06`,
          endDate: `${nextYear}-04-10`,
          isCurrent: false
        },
        {
          name: 'Third Term',
          year: academicYear,
          startDate: `${nextYear}-04-21`,
          endDate: `${nextYear}-07-18`,
          isCurrent: false
        }
      ];
      
      for (const term of defaultTerms) {
        await db.insert(academicTerms).values(term);
        console.log(`✅ Created term: ${term.name} (${term.year})`);
      }
      
      console.log('🎓 Academic terms seeded successfully!');
    } else {
      console.log(`✅ Found ${existingTerms.length} existing academic terms`);
    }
  } catch (error) {
    console.error('❌ Failed to seed academic terms:', error);
    throw error;
  }
}
