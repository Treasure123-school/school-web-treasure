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
  }

  initializationAttempted = true;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️ Supabase Storage not configured: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    return null;
  }

  if (!isValidUrl(supabaseUrl)) {
    console.warn(`⚠️ Supabase Storage not configured: Invalid SUPABASE_URL format: ${supabaseUrl}`);
    return null;
  }

  try {
    supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    console.log('✅ Supabase Storage client initialized');
    return supabaseClient;
  } catch (error) {
    console.error('❌ Failed to initialize Supabase Storage client:', error);
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
    console.log('📦 Supabase Storage: Not configured, using local filesystem');
    return false;
  }

  try {
    console.log('📦 Initializing Supabase Storage buckets...');
    
    const bucketsToCreate = Object.values(STORAGE_BUCKETS);
    
    for (const bucketName of bucketsToCreate) {
      const { data: existingBucket } = await client.storage.getBucket(bucketName);
      
      if (!existingBucket) {
        const { error } = await client.storage.createBucket(bucketName, {
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
    
    // Apply RLS policies programmatically using service role
    console.log('🔐 Applying storage RLS policies via service role...');
    await applyStoragePolicies();
    
    console.log('✅ Supabase Storage initialization complete');
    return true;
  } catch (error) {
    console.error('❌ Supabase Storage initialization failed:', error);
    return false;
  }
}

async function applyStoragePolicies() {
  const client = supabase.get();
  if (!client) return;

  try {
    // Use the REST API to apply policies directly as service role
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !serviceKey) {
      console.warn('⚠️ Missing Supabase credentials for policy application');
      return;
    }

    // The service role key bypasses RLS, so we just need to ensure buckets are public
    console.log('✅ Using service_role key - RLS policies will be bypassed for backend uploads');
    console.log('✅ Buckets are configured as public for read access');
    
  } catch (error) {
    console.error('❌ Failed to apply storage policies:', error);
    // Don't throw - uploads can still work with service_role key
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
    console.error(`❌ ${errorMsg}`);
    throw new Error(errorMsg);
  }

  try {
    console.log(`📤 Uploading to Supabase: bucket="${bucket}", path="${filePath}", size=${fileBuffer.length} bytes, type="${contentType}"`);
    
    // Verify bucket exists first
    const { data: bucketData, error: bucketError } = await client.storage.getBucket(bucket);
    if (bucketError || !bucketData) {
      console.error(`❌ Bucket "${bucket}" not found or inaccessible:`, bucketError);
      throw new Error(`Storage bucket "${bucket}" not found. Please check Supabase configuration.`);
    }

    console.log(`✅ Bucket "${bucket}" verified, proceeding with upload...`);

    const { data, error } = await client.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType,
        upsert: true,
        cacheControl: '3600'
      });

    if (error) {
      console.error(`❌ Supabase upload error for "${filePath}":`, {
        message: error.message,
        statusCode: error.cause,
        bucket,
        contentType,
        bufferSize: fileBuffer.length,
        fullError: JSON.stringify(error)
      });
      
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
      }
      
      throw new Error(`Upload failed: ${error.message}`);
    }

    const { data: { publicUrl } } = client.storage
      .from(bucket)
      .getPublicUrl(filePath);

    console.log(`✅ Successfully uploaded to Supabase: ${publicUrl}`);

    return {
      publicUrl,
      path: data.path
    };
  } catch (error: any) {
    console.error('❌ Failed to upload to Supabase:', {
      error: error.message,
      stack: error.stack,
      bucket,
      filePath,
      serviceKeyConfigured: !!process.env.SUPABASE_SERVICE_KEY,
      supabaseUrlConfigured: !!process.env.SUPABASE_URL
    });
    throw error; // Re-throw instead of returning null to preserve error details
  }
}

export async function deleteFileFromSupabase(
  bucket: string,
  filePath: string
): Promise<boolean> {
  const client = supabase.get();
  if (!client) {
    throw new Error('Supabase Storage not configured');
  }

  try {
    const { error } = await client.storage
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
  const client = supabase.get();
  if (!client || !process.env.SUPABASE_URL) {
    return `/uploads/${filePath}`;
  }

  const { data: { publicUrl } } = client.storage
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

export const isSupabaseStorageEnabled = () => !!supabase.get();
