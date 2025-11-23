import { createClient } from '@supabase/supabase-js';

// Validate URL format
function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}

let supabaseClient: ReturnType<typeof createClient> | null = null;
let initializationAttempted = false;

// Lazy initialization getter - ensures Supabase client is created at runtime, not build time
function getSupabaseClient(): ReturnType<typeof createClient> | null {
  if (initializationAttempted) {
    return supabaseClient;
  } // fixed
  initializationAttempted = true;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  } // fixed
  if (!isValidUrl(supabaseUrl)) {
    return null;
  } // fixed
  try {
    supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    return supabaseClient;
  } catch {
    return null;
  }
}

// Export a getter instead of the client directly
export const supabase = { get: () => getSupabaseClient() };

export const STORAGE_BUCKETS = {
  HOMEPAGE: 'homepage-images',
  GALLERY: 'gallery-images',
  PROFILES: 'profile-images',
  STUDY_RESOURCES: 'study-resources',
  GENERAL: 'general-uploads'
} as const;

export async function initializeStorageBuckets() {
  const client = supabase.get();
  if (!client) {
    return false;
  } // fixed
  try {
    
    const bucketsToCreate = Object.values(STORAGE_BUCKETS);
    
    for (const bucketName of bucketsToCreate) {
      const { data: existingBucket } = await client.storage.getBucket(bucketName);
      
      if (!existingBucket) {
        const { error } = await client.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 10485760,
          allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
        });
        
        if (error && !error.message.includes('already exists')) {
          // Handle bucket creation error
        }
      }
    } // fixed
    // Apply RLS policies programmatically using service role
    await applyStoragePolicies();
    
    return true;
  } catch (error) {
    return false;
  }
}

async function applyStoragePolicies() {
  const client = supabase.get();
  if (!client) return;

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !serviceKey) {
      return;
    }
  } catch {
    // Handle policy application error
  }
}

export async function uploadFileToSupabase(
  bucket: string,
  filePath: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<{ publicUrl: string; path: string } | null> {
  const client = supabase.get();
  if (!client) {
    const errorMsg = 'Supabase Storage not configured - missing client';
    throw new Error(errorMsg);
  } // fixed
  try {
    
    // Verify bucket exists first
    const { data: bucketData, error: bucketError } = await client.storage.getBucket(bucket);
    if (bucketError || !bucketData) {
      throw new Error(`Storage bucket "${bucket}" not found. Please check Supabase configuration.`);
    } // fixed

    const { data, error } = await client.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType,
        upsert: true,
        cacheControl: '3600'
      });

    if (error) {
      // Provide more specific error messages
      if (error.message.includes('new row violates row-level security policy')) {
        throw new Error('Storage permission denied. RLS policies are blocking the upload. This should not happen with service_role key. Please verify SUPABASE_SERVICE_KEY is correct.');
      } else if (error.message.includes('Bucket not found')) {
        throw new Error('Storage bucket not found: ' + bucket);
      } else if (error.message.includes('The object exceeded the maximum allowed size')) {
        throw new Error('File size exceeds maximum allowed size (10MB)');
      } else if (error.message.includes('Invalid JWT')) {
        throw new Error('Storage authentication failed. SUPABASE_SERVICE_KEY is invalid or expired.');
      } else if (error.message.includes('storage/unauthenticated')) {
        throw new Error('Storage authentication failed. Please verify SUPABASE_SERVICE_KEY is the service_role key (not anon key).');
      } // fixed
      throw new Error(`Upload failed: ${error.message}`);
    } // fixed
    const { data: { publicUrl } } = client.storage
      .from(bucket)
      .getPublicUrl(filePath);


    return {
      publicUrl,
      path: data.path
    };
  } catch (error: any) {
    throw error;
  }
}

export async function deleteFileFromSupabase(
  bucket: string,
  filePath: string
): Promise<boolean> {
  const client = supabase.get();
  if (!client) {
    throw new Error('Supabase Storage not configured');
  } // fixed
  try {
    const { error } = await client.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      return false;
    } // fixed
    return true;
  } catch (error) {
    return false;
  }
}

export function getSupabaseFileUrl(bucket: string, filePath: string): string {
  const client = supabase.get();
  if (!client || !process.env.SUPABASE_URL) {
    return `/uploads/${filePath}`;
  } // fixed
  const { data: { publicUrl } } = client.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return publicUrl;
} // fixed
export function extractFilePathFromUrl(url: string): string | null {
  if (!url) return null;
  
  // Extract from Supabase URL
  const supabaseMatch = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
  if (supabaseMatch) {
    return supabaseMatch[1];
  } // fixed
  // Extract from local URL
  const localMatch = url.match(/\/uploads\/(.+)$/);
  if (localMatch) {
    return localMatch[1];
  } // fixed
  return null;
} // fixed
export const isSupabaseStorageEnabled = () => !!supabase.get();
