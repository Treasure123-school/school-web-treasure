import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Validate URL format
function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}

let supabase: ReturnType<typeof createClient> | null = null;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️ Supabase Storage not configured: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
} else if (!isValidUrl(supabaseUrl)) {
  console.warn(`⚠️ Supabase Storage not configured: Invalid SUPABASE_URL format: ${supabaseUrl}`);
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('✅ Supabase Storage client initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Supabase Storage client:', error);
    supabase = null;
  }
}

export { supabase };

export const STORAGE_BUCKETS = {
  HOMEPAGE: 'homepage-images',
  GALLERY: 'gallery-images',
  PROFILES: 'profile-images',
  STUDY_RESOURCES: 'study-resources',
  GENERAL: 'general-uploads'
} as const;

export async function initializeStorageBuckets() {
  if (!supabase) {
    console.log('📦 Supabase Storage: Not configured, using local filesystem');
    return false;
  }

  try {
    console.log('📦 Initializing Supabase Storage buckets...');
    
    const bucketsToCreate = Object.values(STORAGE_BUCKETS);
    
    for (const bucketName of bucketsToCreate) {
      const { data: existingBucket } = await supabase.storage.getBucket(bucketName);
      
      if (!existingBucket) {
        const { error } = await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
        });
        
        if (error) {
          if (error.message.includes('already exists')) {
            console.log(`  ✅ Bucket "${bucketName}" already exists`);
          } else {
            console.error(`  ❌ Failed to create bucket "${bucketName}":`, error.message);
          }
        } else {
          console.log(`  ✅ Created bucket: ${bucketName}`);
        }
      } else {
        console.log(`  ✅ Bucket "${bucketName}" already exists`);
      }
    }
    
    console.log('✅ Supabase Storage initialization complete');
    return true;
  } catch (error) {
    console.error('❌ Supabase Storage initialization failed:', error);
    return false;
  }
}

export async function uploadFileToSupabase(
  bucket: string,
  filePath: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<{ publicUrl: string; path: string } | null> {
  if (!supabase) {
    throw new Error('Supabase Storage not configured');
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType,
        upsert: true
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      publicUrl,
      path: data.path
    };
  } catch (error) {
    console.error('Failed to upload to Supabase:', error);
    return null;
  }
}

export async function deleteFileFromSupabase(
  bucket: string,
  filePath: string
): Promise<boolean> {
  if (!supabase) {
    throw new Error('Supabase Storage not configured');
  }

  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Supabase delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to delete from Supabase:', error);
    return false;
  }
}

export function getSupabaseFileUrl(bucket: string, filePath: string): string {
  if (!supabase || !supabaseUrl) {
    return `/uploads/${filePath}`;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return publicUrl;
}

export function extractFilePathFromUrl(url: string): string | null {
  if (!url) return null;
  
  // Extract from Supabase URL
  const supabaseMatch = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
  if (supabaseMatch) {
    return supabaseMatch[1];
  }
  
  // Extract from local URL
  const localMatch = url.match(/\/uploads\/(.+)$/);
  if (localMatch) {
    return localMatch[1];
  }
  
  return null;
}

export const isSupabaseStorageEnabled = !!supabase;
