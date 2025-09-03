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
