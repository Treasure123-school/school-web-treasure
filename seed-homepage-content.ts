import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./shared/schema";

const sql = postgres(process.env.DATABASE_URL!, {
  ssl: { rejectUnauthorized: false }
});
const db = drizzle(sql, { schema });

async function seedHomepageContent() {
  try {
    console.log('Adding homepage content...');
    
    const homepageContent = [
      {
        contentType: 'hero_image',
        imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800',
        altText: 'Treasure-Home School beautiful campus with students learning',
        caption: 'Welcome to Treasure-Home School - Where Honesty and Success Unite',
        isActive: true,
        displayOrder: 1
      },
      {
        contentType: 'gallery_preview_1',
        imageUrl: 'https://images.unsplash.com/photo-1497486751825-1233686d5d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
        altText: 'Students engaged in interactive classroom learning',
        caption: 'Interactive Learning Environment',
        isActive: true,
        displayOrder: 1
      },
      {
        contentType: 'gallery_preview_2',
        imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
        altText: 'Students participating in sports and physical activities',
        caption: 'Sports and Physical Development',
        isActive: true,
        displayOrder: 2
      },
      {
        contentType: 'gallery_preview_3',
        imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
        altText: 'Students conducting hands-on science experiments',
        caption: 'Science and Innovation',
        isActive: true,
        displayOrder: 3
      }
    ];

    for (const content of homepageContent) {
      await db.insert(schema.homePageContent).values(content).onConflictDoNothing();
    }

    console.log('✅ Homepage content added successfully');
    
  } catch (error) {
    console.error('❌ Error seeding homepage content:', error);
  } finally {
    await sql.end();
  }
}

seedHomepageContent();