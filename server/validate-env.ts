// Environment Variable Validation Script
// Run this to verify all required environment variables are set

interface EnvVarConfig {
  name: string;
  required: 'always' | 'production' | 'optional';
  description: string;
  validateFn?: (value: string) => boolean;
  suggestion?: string;
}

const ENV_VARS: EnvVarConfig[] = [
  // Critical - Always Required
  {
    name: 'DATABASE_URL',
    required: 'always',
    description: 'PostgreSQL connection string',
    validateFn: (val) => val.startsWith('postgresql://') || val.startsWith('postgres://'),
    suggestion: 'postgresql://user:password@host:port/database'
  },

  // Critical - Production Required
  {
    name: 'NODE_ENV',
    required: 'production',
    description: 'Environment mode (production/development)',
    validateFn: (val) => ['production', 'development'].includes(val),
    suggestion: 'production'
  },
  {
    name: 'JWT_SECRET',
    required: 'production',
    description: 'Secret for JWT token signing',
    validateFn: (val) => val.length >= 32,
    suggestion: 'Generate with: openssl rand -base64 48'
  },
  {
    name: 'SESSION_SECRET',
    required: 'production',
    description: 'Secret for session encryption',
    validateFn: (val) => val.length >= 32,
    suggestion: 'Generate with: openssl rand -base64 48'
  },
  {
    name: 'FRONTEND_URL',
    required: 'production',
    description: 'Frontend URL for CORS',
    validateFn: (val) => val.startsWith('http://') || val.startsWith('https://'),
    suggestion: 'https://your-app.vercel.app'
  },
  {
    name: 'BACKEND_URL',
    required: 'production',
    description: 'Backend URL for redirects',
    validateFn: (val) => val.startsWith('http://') || val.startsWith('https://'),
    suggestion: 'https://your-backend.onrender.com'
  },

  // Critical - Supabase Storage (ALWAYS REQUIRED for uploads)
  {
    name: 'SUPABASE_URL',
    required: 'always',
    description: 'Supabase project URL for file storage (CRITICAL for uploads)',
    validateFn: (val) => val.includes('supabase.co'),
    suggestion: 'https://your-project.supabase.co'
  },
  {
    name: 'SUPABASE_SERVICE_KEY',
    required: 'always',
    description: 'Supabase service role key for file storage (CRITICAL for uploads)',
    validateFn: (val) => val.length > 50,
    suggestion: 'Get from Supabase Dashboard → Settings → API (use service_role key, NOT anon key)'
  },
];

interface ValidationResult {
  missing: string[];
  invalid: string[];
  warnings: string[];
  passed: string[];
}

export function validateEnvironment(exitOnError = false): ValidationResult {
  const isProduction = process.env.NODE_ENV === 'production';
  const result: ValidationResult = {
    missing: [],
    invalid: [],
    warnings: [],
    passed: []
  };

  console.log('\n🔍 Validating Environment Variables...\n');

  ENV_VARS.forEach((config) => {
    const value = process.env[config.name];
    const isRequired = config.required === 'always' || (config.required === 'production' && isProduction);

    // Check if missing
    if (!value) {
      if (isRequired) {
        result.missing.push(config.name);
        console.error(`❌ MISSING (${config.required.toUpperCase()}): ${config.name}`);
        console.error(`   ${config.description}`);
        if (config.suggestion) {
          console.error(`   Suggestion: ${config.suggestion}`);
        }
      } else if (config.required === 'optional') {
        result.warnings.push(config.name);
        console.warn(`⚠️  OPTIONAL: ${config.name} not set`);
        console.warn(`   ${config.description}`);
      }
      return;
    }

    // Check if invalid format
    if (config.validateFn && !config.validateFn(value)) {
      result.invalid.push(config.name);
      console.error(`❌ INVALID: ${config.name}`);
      console.error(`   ${config.description}`);
      if (config.suggestion) {
        console.error(`   Expected format: ${config.suggestion}`);
      }
      return;
    }

    // Valid
    result.passed.push(config.name);
    const displayValue = config.name.includes('SECRET') || config.name.includes('KEY') || config.name.includes('PASSWORD')
      ? '***' + value.slice(-4)
      : value.slice(0, 50) + (value.length > 50 ? '...' : '');
    console.log(`✅ ${config.name}: ${displayValue}`);
  });

  // Summary
  console.log('\n📊 Validation Summary:');
  console.log(`   ✅ Passed: ${result.passed.length}`);
  console.log(`   ❌ Missing: ${result.missing.length}`);
  console.log(`   ❌ Invalid: ${result.invalid.length}`);
  console.log(`   ⚠️  Warnings: ${result.warnings.length}`);

  const hasErrors = result.missing.length > 0 || result.invalid.length > 0;

  if (hasErrors) {
    console.error('\n🚨 CRITICAL: Missing or invalid environment variables detected!');
    console.error('   Fix these issues before deploying to production.\n');
    
    if (isProduction && exitOnError) {
      console.error('   Exiting due to production environment validation failure...\n');
      process.exit(1);
    }
  } else {
    console.log('\n✅ All required environment variables are properly configured!\n');
  }

  return result;
}
