// Base type for unknown JSON/YAML content
export type ParsedContent = 
  | string 
  | number 
  | boolean 
  | null 
  | ParsedContent[] 
  | { [key: string]: ParsedContent };

// Type for raw parsed data that can be any valid JSON/YAML structure
export type RawParsedData = ParsedContent;

export interface InfraService {
  name?: string;
  runtime?: string;
  rootDir?: string;
  buildCommand?: string;
  startCommand?: string;
  type?: string;
}

export interface InfraDatabase {
  name?: string;
  type?: string;
  version?: string;
  host?: string;
  port?: number;
}

export interface InfraData {
  services?: InfraService[];
  databases?: InfraDatabase[];
  environment?: Record<string, string>;
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

// Helper function to safely convert ParsedContent to string
export function parseContentToString(content: ParsedContent): string {
  if (typeof content === 'string') return content;
  if (typeof content === 'number' || typeof content === 'boolean') return String(content);
  return '';
}

// Helper function to safely convert ParsedContent to number
export function parseContentToNumber(content: ParsedContent): number | undefined {
  if (typeof content === 'number') return content;
  if (typeof content === 'string') {
    const num = Number(content);
    return isNaN(num) ? undefined : num;
  }
  return undefined;
}
