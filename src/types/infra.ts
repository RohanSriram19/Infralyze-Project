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

/**
 * Extracts metadata from infrastructure configuration
 * Provides additional context about the configuration structure
 * @param data - The parsed infrastructure data
 * @returns Metadata about the configuration
 */
export interface ConfigMetadata {
  totalProperties: number;
  hasNestedStructures: boolean;
  estimatedComplexity: 'simple' | 'moderate' | 'complex';
  potentialIssues: string[];
  recommendations: string[];
}

export function extractConfigMetadata(data: ParsedContent): ConfigMetadata {
  const metadata: ConfigMetadata = {
    totalProperties: 0,
    hasNestedStructures: false,
    estimatedComplexity: 'simple',
    potentialIssues: [],
    recommendations: []
  };

  if (!data || typeof data !== 'object') {
    metadata.potentialIssues.push('Configuration is not a structured object');
    return metadata;
  }

  const analyzeObject = (obj: ParsedContent, depth = 0): void => {
    if (typeof obj === 'object' && obj !== null) {
      if (Array.isArray(obj)) {
        metadata.totalProperties += obj.length;
        obj.forEach(item => analyzeObject(item, depth + 1));
      } else {
        const objectData = obj as { [key: string]: ParsedContent };
        const keys = Object.keys(objectData);
        metadata.totalProperties += keys.length;
        
        if (depth > 0) {
          metadata.hasNestedStructures = true;
        }

        keys.forEach(key => {
          const value = objectData[key];
          // Check for common issues
          if (key.toLowerCase().includes('password') && typeof value === 'string' && value.length > 0) {
            metadata.potentialIssues.push(`Plaintext password found in property: ${key}`);
          }
          
          if (key.toLowerCase().includes('secret') && typeof value === 'string' && value.length > 0) {
            metadata.potentialIssues.push(`Plaintext secret found in property: ${key}`);
          }

          analyzeObject(value, depth + 1);
        });
      }
    }
  };

  analyzeObject(data);

  // Determine complexity
  if (metadata.totalProperties > 50 || (metadata.hasNestedStructures && metadata.totalProperties > 20)) {
    metadata.estimatedComplexity = 'complex';
    metadata.recommendations.push('Consider breaking down large configurations into smaller, focused files');
  } else if (metadata.totalProperties > 15 || metadata.hasNestedStructures) {
    metadata.estimatedComplexity = 'moderate';
    metadata.recommendations.push('Configuration structure looks well-organized');
  }

  // Add security recommendations
  if (metadata.potentialIssues.some(issue => issue.includes('password') || issue.includes('secret'))) {
    metadata.recommendations.push('Use environment variables or secret management systems for sensitive data');
    metadata.recommendations.push('Consider using .env files or external secret stores');
  }

  // Add structural recommendations
  if (!metadata.hasNestedStructures && metadata.totalProperties > 10) {
    metadata.recommendations.push('Consider organizing properties into logical groups');
  }

  return metadata;
}

/**
 * Optimized validation for large configuration files
 * Uses early returns and selective analysis for better performance
 * @param data - The parsed infrastructure data
 * @returns Quick validation result focused on critical patterns
 */
export function quickValidateInfraStructure(data: ParsedContent): Pick<ValidationResult, 'isValid' | 'confidence' | 'detectedFormat'> {
  if (!data || typeof data !== 'object') {
    return { isValid: false, confidence: 'low', detectedFormat: undefined };
  }

  if (Array.isArray(data)) {
    return { isValid: true, confidence: 'medium', detectedFormat: 'Service Array' };
  }

  const obj = data as { [key: string]: ParsedContent };
  const keys = Object.keys(obj);
  
  // Fast pattern detection - check most common patterns first
  if (keys.includes('apiVersion') && keys.includes('kind')) {
    return { isValid: true, confidence: 'high', detectedFormat: 'Kubernetes' };
  }
  
  if (keys.includes('services') && keys.includes('version')) {
    return { isValid: true, confidence: 'high', detectedFormat: 'Docker Compose' };
  }
  
  if (keys.some(key => ['services', 'applications', 'apps'].includes(key))) {
    return { isValid: true, confidence: 'medium', detectedFormat: 'Service Config' };
  }
  
  return { isValid: true, confidence: 'low', detectedFormat: 'Generic Config' };
}

/**
 * Enhanced service interface with additional cloud-native properties
 * Supports modern deployment patterns and container orchestration
 */
export interface EnhancedInfraService extends InfraService {
  // Container properties
  image?: string;           // Container image name
  tag?: string;             // Image tag/version
  registry?: string;        // Container registry URL
  
  // Resource requirements
  cpu?: string;             // CPU requirements (e.g., "100m", "0.5")
  memory?: string;          // Memory requirements (e.g., "128Mi", "1Gi")
  storage?: string;         // Storage requirements
  
  // Network configuration
  ports?: number[];         // Exposed ports
  protocol?: 'HTTP' | 'HTTPS' | 'TCP' | 'UDP';
  
  // Health checks
  healthCheck?: string;     // Health check endpoint
  readinessProbe?: string;  // Readiness probe configuration
  
  // Scaling
  replicas?: number;        // Number of instances
  autoScale?: boolean;      // Auto-scaling enabled
  
  // Environment
  secrets?: string[];       // Required secrets
  configMaps?: string[];    // Required config maps
}

/**
 * Converts basic InfraService to EnhancedInfraService with intelligent defaults
 * Extracts additional properties from various configuration formats
 * @param service - Basic service definition
 * @param rawData - Original parsed data for context
 * @returns Enhanced service with additional properties
 */
export function enhanceInfraService(service: InfraService, rawData?: ParsedContent): EnhancedInfraService {
  const enhanced: EnhancedInfraService = { ...service };

  // Extract image information from runtime or other fields
  if (service.runtime?.includes(':')) {
    const [image, tag] = service.runtime.split(':');
    enhanced.image = image;
    enhanced.tag = tag;
  }

  // Set intelligent defaults based on service type
  if (service.type) {
    switch (service.type.toLowerCase()) {
      case 'web':
      case 'frontend':
        enhanced.protocol = 'HTTP';
        enhanced.ports = enhanced.ports || [80, 3000];
        enhanced.healthCheck = enhanced.healthCheck || '/health';
        break;
      case 'api':
      case 'backend':
        enhanced.protocol = 'HTTPS';
        enhanced.ports = enhanced.ports || [443, 8080];
        enhanced.healthCheck = enhanced.healthCheck || '/api/health';
        break;
      case 'database':
      case 'db':
        enhanced.protocol = 'TCP';
        enhanced.ports = enhanced.ports || [5432, 3306, 27017];
        break;
    }
  }

  // Extract additional properties from raw data if available
  if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
    const rawObj = rawData as { [key: string]: ParsedContent };
    
    // Try to find service-specific configuration
    const serviceName = service.name?.toLowerCase();
    if (serviceName && rawObj[serviceName]) {
      const serviceConfig = rawObj[serviceName];
      if (typeof serviceConfig === 'object' && !Array.isArray(serviceConfig)) {
        const config = serviceConfig as { [key: string]: ParsedContent };
        
        // Extract resource requirements
        if (config.resources && typeof config.resources === 'object') {
          const resources = config.resources as { [key: string]: ParsedContent };
          enhanced.cpu = parseContentToString(resources.cpu);
          enhanced.memory = parseContentToString(resources.memory);
        }
        
        // Extract scaling info
        if (config.replicas) {
          enhanced.replicas = parseContentToNumber(config.replicas);
        }
        
        if (config.autoscaling || config.autoScale) {
          enhanced.autoScale = true;
        }
      }
    }
  }

  return enhanced;
}

/**
 * Validates enhanced service configuration for completeness and best practices
 * @param service - Enhanced service to validate
 * @returns Validation result with specific recommendations
 */
export function validateEnhancedService(service: EnhancedInfraService): {
  isComplete: boolean;
  score: number; // 0-100
  recommendations: string[];
} {
  const result = {
    isComplete: false,
    score: 0,
    recommendations: [] as string[]
  };

  let score = 0;

  // Basic properties (20 points)
  if (service.name) score += 10;
  if (service.type) score += 10;

  // Container properties (20 points)  
  if (service.image) score += 10;
  if (service.tag) score += 5;
  if (service.registry) score += 5;

  // Resource management (20 points)
  if (service.cpu) score += 10;
  if (service.memory) score += 10;

  // Network configuration (20 points)
  if (service.ports && service.ports.length > 0) score += 10;
  if (service.protocol) score += 5;
  if (service.healthCheck) score += 5;

  // Operational readiness (20 points)
  if (service.replicas !== undefined) score += 5;
  if (service.autoScale) score += 5;
  if (service.readinessProbe) score += 5;
  if (service.secrets || service.configMaps) score += 5;

  result.score = score;
  result.isComplete = score >= 70;

  // Generate recommendations
  if (!service.name) result.recommendations.push('Add a descriptive service name');
  if (!service.type) result.recommendations.push('Specify service type (web, api, database, etc.)');
  if (!service.image) result.recommendations.push('Define container image for deployment');
  if (!service.cpu || !service.memory) result.recommendations.push('Set resource limits (CPU/memory) for better resource management');
  if (!service.healthCheck) result.recommendations.push('Add health check endpoint for monitoring');
  if (service.replicas === undefined) result.recommendations.push('Define replica count for scalability');
  if (!service.readinessProbe) result.recommendations.push('Configure readiness probe for zero-downtime deployments');

  if (result.score >= 90) {
    result.recommendations.push('Excellent configuration! Service is production-ready');
  } else if (result.score >= 70) {
    result.recommendations.push('Good configuration with room for improvement');
  } else {
    result.recommendations.push('Configuration needs significant improvements before production deployment');
  }

  return result;
}
