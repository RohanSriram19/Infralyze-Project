// Base type for unknown JSON/YAML content
// This recursive type can represent any valid JSON/YAML structure
export type ParsedContent = 
  | string 
  | number 
  | boolean 
  | null 
  | ParsedContent[] 
  | { [key: string]: ParsedContent };

// Type for raw parsed data that can be any valid JSON/YAML structure
// Used to maintain the original parsed structure before normalization
export type RawParsedData = ParsedContent;

// Core interface representing a service/application component
export interface InfraService {
  name?: string;        // Service identifier
  runtime?: string;     // Runtime environment (e.g., Node.js, Python, Java)
  rootDir?: string;     // Working directory path
  buildCommand?: string; // Command to build the service
  startCommand?: string; // Command to start the service
  type?: string;        // Service type (web, api, worker, etc.)
}

// Core interface representing a database component
export interface InfraDatabase {
  name?: string;        // Database identifier
  type?: string;        // Database type (PostgreSQL, MySQL, MongoDB, etc.)
  version?: string;     // Database version
  host?: string;        // Database host
  port?: number;        // Database port
}

// Main data structure representing parsed infrastructure configuration
export interface InfraData {
  services?: InfraService[];                // Array of service/application components
  databases?: InfraDatabase[];              // Array of database components
  environment?: Record<string, string>;     // Environment variables
  // Index signature allows for additional dynamic properties from various config formats
  [key: string]: ParsedContent | InfraService[] | InfraDatabase[] | Record<string, string> | undefined;
}

// Helper type for service-like objects during parsing
export interface ParsedServiceLike {
  name?: ParsedContent;
  id?: ParsedContent;
  type?: ParsedContent;
  kind?: ParsedContent;
  runtime?: ParsedContent;
  image?: ParsedContent;
  version?: ParsedContent;
  buildCommand?: ParsedContent;
  build?: ParsedContent;
  startCommand?: ParsedContent;
  command?: ParsedContent;
  cmd?: ParsedContent;
  rootDir?: ParsedContent;
  workingDir?: ParsedContent;
  path?: ParsedContent;
}

// Helper type for database-like objects during parsing
export interface ParsedDatabaseLike {
  name?: ParsedContent;
  id?: ParsedContent;
  type?: ParsedContent;
  engine?: ParsedContent;
  version?: ParsedContent;
  host?: ParsedContent;
  hostname?: ParsedContent;
  port?: ParsedContent;
}

/**
 * Safely converts ParsedContent to string
 * Handles various data types and provides fallback for complex types
 * @param content - The parsed content to convert
 * @returns String representation of the content
 */
export function parseContentToString(content: ParsedContent): string {
  if (typeof content === 'string') return content;
  if (typeof content === 'number' || typeof content === 'boolean') return String(content);
  return '';
}

/**
 * Safely converts ParsedContent to number
 * Attempts to parse strings as numbers, returns undefined for invalid values
 * @param content - The parsed content to convert
 * @returns Number value or undefined if conversion fails
 */
export function parseContentToNumber(content: ParsedContent): number | undefined {
  if (typeof content === 'number') return content;
  if (typeof content === 'string') {
    const num = Number(content);
    return isNaN(num) ? undefined : num;
  }
  return undefined;
}

/**
 * Validates if parsed content follows common infrastructure configuration patterns
 * Provides helpful suggestions for better file structure
 * @param data - The parsed content to validate
 * @returns Validation result with suggestions
 */
export interface ValidationResult {
  isValid: boolean;
  confidence: 'high' | 'medium' | 'low';
  suggestions: string[];
  detectedFormat?: string;
}

export function validateInfraStructure(data: ParsedContent): ValidationResult {
  const result: ValidationResult = {
    isValid: false,
    confidence: 'low',
    suggestions: []
  };

  if (!data || typeof data !== 'object') {
    result.suggestions.push('File should contain a valid JSON or YAML object structure');
    return result;
  }

  if (Array.isArray(data)) {
    result.isValid = true;
    result.confidence = 'medium';
    result.detectedFormat = 'Service Array';
    result.suggestions.push('Detected array of services - consider wrapping in a "services" key for better organization');
    return result;
  }

  const obj = data as { [key: string]: ParsedContent };
  const keys = Object.keys(obj);
  
  // Check for common infrastructure patterns
  const infraKeys = ['services', 'applications', 'apps', 'components', 'containers'];
  const dbKeys = ['databases', 'db', 'data', 'storage'];
  const configKeys = ['environment', 'env', 'config', 'variables'];
  const k8sKeys = ['apiVersion', 'kind', 'metadata', 'spec'];
  const dockerKeys = ['version', 'services', 'volumes', 'networks'];
  const tfKeys = ['resource', 'provider', 'variable', 'output'];
  
  let matches = 0;
  const detectedFormats: string[] = [];

  // Check for Kubernetes manifest
  if (k8sKeys.some(key => keys.includes(key))) {
    matches += 3;
    detectedFormats.push('Kubernetes');
    result.suggestions.push('Kubernetes manifest detected - extracting container and service information');
  }

  // Check for Docker Compose
  if (dockerKeys.some(key => keys.includes(key)) && obj.services) {
    matches += 3;
    detectedFormats.push('Docker Compose');
    result.suggestions.push('Docker Compose file detected - excellent structure for multi-service applications');
  }

  // Check for Terraform
  if (tfKeys.some(key => keys.includes(key))) {
    matches += 2;
    detectedFormats.push('Terraform');
    result.suggestions.push('Terraform configuration detected - extracting infrastructure resources');
  }

  // Check for general infrastructure patterns
  if (infraKeys.some(key => keys.includes(key))) {
    matches += 2;
    result.suggestions.push('Service definitions found - structure looks good');
  }

  if (dbKeys.some(key => keys.includes(key))) {
    matches += 1;
    result.suggestions.push('Database configurations detected');
  }

  if (configKeys.some(key => keys.includes(key))) {
    matches += 1;
    result.suggestions.push('Environment variables found');
  }

  // Determine confidence and validity
  if (matches >= 3) {
    result.isValid = true;
    result.confidence = 'high';
    result.detectedFormat = detectedFormats.join(' + ');
  } else if (matches >= 1) {
    result.isValid = true;
    result.confidence = 'medium';
    result.detectedFormat = detectedFormats.length > 0 ? detectedFormats.join(' + ') : 'Generic Config';
  } else {
    result.isValid = true; // Still try to parse
    result.confidence = 'low';
    result.detectedFormat = 'Unknown Format';
    result.suggestions.push('No standard infrastructure patterns detected, but will attempt to extract any meaningful data');
  }

  // Add helpful suggestions based on structure
  if (keys.length > 10) {
    result.suggestions.push('Large configuration detected - consider organizing into sections');
  }

  if (keys.some(key => key.includes('password') || key.includes('secret') || key.includes('key'))) {
    result.suggestions.push('⚠️  Potential sensitive data detected - ensure secrets are properly managed');
  }

  return result;
}
