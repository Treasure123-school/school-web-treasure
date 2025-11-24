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

  // MinIO Storage (Optional - has fallback to local storage)
  {
    name: 'MINIO_ENDPOINT',
    required: 'optional',
    description: 'MinIO endpoint for file storage',
    suggestion: 'localhost'
  },
  {
    name: 'MINIO_PORT',
    required: 'optional',
    description: 'MinIO port for file storage',
    suggestion: '9000'
  },
  {
    name: 'MINIO_ACCESS_KEY',
    required: 'optional',
    description: 'MinIO access key for file storage',
    suggestion: 'minioadmin'
  },
  {
    name: 'MINIO_SECRET_KEY',
    required: 'optional',
    description: 'MinIO secret key for file storage',
    suggestion: 'minioadmin'
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


  ENV_VARS.forEach((config) => {
    const value = process.env[config.name];
    const isRequired = config.required === 'always' || (config.required === 'production' && isProduction);

    // Check if missing
    if (!value) {
      if (isRequired) {
        result.missing.push(config.name);
        if (config.suggestion) {
        }
      } else if (config.required === 'optional') {
        result.warnings.push(config.name);
      }
      return;
    }
    // Check if invalid format
    if (config.validateFn && !config.validateFn(value)) {
      result.invalid.push(config.name);
      if (config.suggestion) {
      }
      return;
    }
    // Valid
    result.passed.push(config.name);
    const displayValue = config.name.includes('SECRET') || config.name.includes('KEY') || config.name.includes('PASSWORD')
      ? '***' + value.slice(-4)
      : value.slice(0, 50) + (value.length > 50 ? '...' : '');
  });

  // Summary

  const hasErrors = result.missing.length > 0 || result.invalid.length > 0;

  if (hasErrors) {
    
    if (isProduction && exitOnError) {
      process.exit(1);
    }
  } else {
  }
  return result;
}
