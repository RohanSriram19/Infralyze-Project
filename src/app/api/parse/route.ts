import { NextRequest, NextResponse } from "next/server";
import YAML from "yaml";
import type { 
  InfraData, 
  InfraService,
  RawParsedData, 
  ParsedContent, 
  ParsedServiceLike, 
  ParsedDatabaseLike,
  ValidationResult
} from "../../../types/infra";
import { validateInfraStructure } from "../../../types/infra";

// Helper function to safely convert ParsedContent to string
function parseContentToString(content: ParsedContent | undefined): string {
  if (content === undefined || content === null) return '';
  if (typeof content === 'string') return content;
  if (typeof content === 'number' || typeof content === 'boolean') return String(content);
  return '';
}

// Helper function to safely convert ParsedContent to number
function parseContentToNumber(content: ParsedContent | undefined): number | undefined {
  if (content === undefined || content === null) return undefined;
  if (typeof content === 'number') return content;
  if (typeof content === 'string') {
    const num = Number(content);
    return isNaN(num) ? undefined : num;
  }
  return undefined;
}

// Helper function to safely parse YAML
function safeYamlParse(content: string): { success: boolean; data?: RawParsedData; error?: string } {
  try {
    const parsed = YAML.parse(content) as RawParsedData;
    return { success: true, data: parsed };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// Helper function to detect content type by analyzing the content
function detectContentType(content: string, filename: string): "json" | "yaml" | "unknown" {
  const trimmedContent = content.trim();
  
  // First check file extension
  const lowerFilename = filename.toLowerCase();
  if (lowerFilename.endsWith('.json')) return "json";
  if (lowerFilename.endsWith('.yaml') || lowerFilename.endsWith('.yml')) return "yaml";
  
  // Then analyze content structure
  if (trimmedContent.startsWith('{') && trimmedContent.endsWith('}')) return "json";
  if (trimmedContent.startsWith('[') && trimmedContent.endsWith(']')) return "json";
  
  // Check for YAML indicators
  if (trimmedContent.includes('---') || 
      /^[a-zA-Z_][a-zA-Z0-9_]*:\s/.test(trimmedContent) ||
      /^\s*-\s/.test(trimmedContent)) {
    return "yaml";
  }
  
  return "unknown";
}

// Enhanced JSON parsing with better error messages
function safeJsonParseEnhanced(content: string): { success: boolean; data?: RawParsedData; error?: string; suggestion?: string } {
  try {
    const parsed = JSON.parse(content) as RawParsedData;
    return { success: true, data: parsed };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    let suggestion = '';
    
    if (error.includes('Unexpected token')) {
      suggestion = 'Check for missing quotes, commas, or brackets in your JSON structure';
    } else if (error.includes('Unexpected end')) {
      suggestion = 'Your JSON appears to be incomplete - check for missing closing brackets or braces';
    } else if (error.includes('position')) {
      suggestion = 'There\'s a syntax error in your JSON - try validating it with a JSON formatter';
    }
    
    return { success: false, error, suggestion };
  }
}

// Helper function to safely validate infrastructure data
function safeValidateInfraStructure(data?: RawParsedData): ValidationResult | null {
  if (!data) return null;
  try {
    return validateInfraStructure(data);
  } catch (e) {
    console.error('Validation error:', e);
    return null;
  }
}

// Helper function to check if ParsedContent is an object
function isObjectContent(content: ParsedContent): content is { [key: string]: ParsedContent } {
  return typeof content === 'object' && content !== null && !Array.isArray(content);
}

// Helper function to check if ParsedContent is an array
function isArrayContent(content: ParsedContent): content is ParsedContent[] {
  return Array.isArray(content);
}

// Helper function to normalize parsed data to InfraData format
function normalizeToInfraData(data: RawParsedData | undefined): InfraData {
  if (!data || typeof data !== 'object') {
    return {};
  }

  const result: InfraData = {};

  // Handle different possible structures
  if (isArrayContent(data)) {
    // If data is an array, treat each item as a service
    result.services = data.map((item, index) => {
      const serviceItem = isObjectContent(item) ? item as ParsedServiceLike : {};
      return {
        name: parseContentToString(serviceItem.name || serviceItem.id) || `Service ${index + 1}`,
        type: parseContentToString(serviceItem.type || serviceItem.kind) || 'unknown',
        runtime: parseContentToString(serviceItem.runtime || serviceItem.image || serviceItem.version),
        buildCommand: parseContentToString(serviceItem.buildCommand || serviceItem.build),
        startCommand: parseContentToString(serviceItem.startCommand || serviceItem.command || serviceItem.cmd),
        rootDir: parseContentToString(serviceItem.rootDir || serviceItem.workingDir || serviceItem.path)
      };
    });
  } else if (isObjectContent(data)) {
    // Handle object structures
    const dataObj = data as { [key: string]: ParsedContent };
    
    if (dataObj.services || dataObj.applications || dataObj.apps) {
      const services = dataObj.services || dataObj.applications || dataObj.apps;
      if (isArrayContent(services)) {
        result.services = services.map((svc) => {
          const serviceItem = isObjectContent(svc) ? svc as ParsedServiceLike : {};
          return {
            name: parseContentToString(serviceItem.name || serviceItem.id) || 'Unknown Service',
            type: parseContentToString(serviceItem.type || serviceItem.kind) || 'service',
            runtime: parseContentToString(serviceItem.runtime || serviceItem.image || serviceItem.version),
            buildCommand: parseContentToString(serviceItem.buildCommand || serviceItem.build),
            startCommand: parseContentToString(serviceItem.startCommand || serviceItem.command || serviceItem.cmd),
            rootDir: parseContentToString(serviceItem.rootDir || serviceItem.workingDir || serviceItem.path)
          };
        });
      } else if (isObjectContent(services)) {
        // Handle services defined as object keys
        const servicesObj = services as { [key: string]: ParsedContent };
        result.services = Object.entries(servicesObj).map(([key, value]) => {
          const serviceItem = isObjectContent(value) ? value as ParsedServiceLike : {};
          return {
            name: key,
            type: parseContentToString(serviceItem.type || serviceItem.kind) || 'service',
            runtime: parseContentToString(serviceItem.runtime || serviceItem.image || serviceItem.version),
            buildCommand: parseContentToString(serviceItem.buildCommand || serviceItem.build),
            startCommand: parseContentToString(serviceItem.startCommand || serviceItem.command || serviceItem.cmd),
            rootDir: parseContentToString(serviceItem.rootDir || serviceItem.workingDir || serviceItem.path)
          };
        });
      }
    }

    if (dataObj.databases || dataObj.db || dataObj.data) {
      const databases = dataObj.databases || dataObj.db || dataObj.data;
      if (isArrayContent(databases)) {
        result.databases = databases.map((db) => {
          const dbItem = isObjectContent(db) ? db as ParsedDatabaseLike : {};
          return {
            name: parseContentToString(dbItem.name || dbItem.id) || 'Unknown Database',
            type: parseContentToString(dbItem.type || dbItem.engine) || 'database',
            version: parseContentToString(dbItem.version),
            host: parseContentToString(dbItem.host || dbItem.hostname),
            port: parseContentToNumber(dbItem.port)
          };
        });
      } else if (isObjectContent(databases)) {
        const databasesObj = databases as { [key: string]: ParsedContent };
        result.databases = Object.entries(databasesObj).map(([key, value]) => {
          const dbItem = isObjectContent(value) ? value as ParsedDatabaseLike : {};
          return {
            name: key,
            type: parseContentToString(dbItem.type || dbItem.engine) || 'database',
            version: parseContentToString(dbItem.version),
            host: parseContentToString(dbItem.host || dbItem.hostname),
            port: parseContentToNumber(dbItem.port)
          };
        });
      }
    }

    if (dataObj.environment || dataObj.env || dataObj.envVars || dataObj.variables) {
      const env = dataObj.environment || dataObj.env || dataObj.envVars || dataObj.variables;
      if (isObjectContent(env)) {
        const envObj = env as { [key: string]: ParsedContent };
        const environment: Record<string, string> = {};
        Object.entries(envObj).forEach(([key, value]) => {
          environment[key] = parseContentToString(value);
        });
        result.environment = environment;
      }
    }

    // If no recognized structure, try to extract any meaningful data
    if (!result.services && !result.databases && !result.environment) {
      // Look for any object that might represent a service or component
      const possibleServices: InfraService[] = [];
      
      Object.entries(dataObj).forEach(([key, value]) => {
        if (isObjectContent(value)) {
          const serviceItem = value as ParsedServiceLike;
          possibleServices.push({
            name: key,
            type: parseContentToString(serviceItem.type || serviceItem.kind) || 'component',
            runtime: parseContentToString(serviceItem.runtime || serviceItem.image || serviceItem.version),
            buildCommand: parseContentToString(serviceItem.buildCommand || serviceItem.build),
            startCommand: parseContentToString(serviceItem.startCommand || serviceItem.command || serviceItem.cmd),
            rootDir: parseContentToString(serviceItem.rootDir || serviceItem.workingDir || serviceItem.path)
          });
        }
      });
      
      if (possibleServices.length > 0) {
        result.services = possibleServices;
      }
    }
  }

  return result;
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const content = await (file as File).text();
  const filename = (file as File).name;

  let parsed: InfraData | null = null;
  let rawParsed: RawParsedData | undefined = undefined;
  let type: "yaml" | "json" | "unknown" = "unknown";
  let parseError: string | null = null;
  let validation: ValidationResult | null = null;
  let suggestions: string[] = [];

  // Detect content type
  type = detectContentType(content, filename);

  // Try to parse based on detected type first, then fallback to other formats
  if (type === "json") {
    const jsonResult = safeJsonParseEnhanced(content);
    if (jsonResult.success) {
      rawParsed = jsonResult.data;
      validation = safeValidateInfraStructure(jsonResult.data);
      parsed = normalizeToInfraData(jsonResult.data);
      suggestions = validation?.suggestions || [];
    } else {
      // Fallback to YAML if JSON parsing fails
      const yamlResult = safeYamlParse(content);
      if (yamlResult.success) {
        rawParsed = yamlResult.data;
        validation = safeValidateInfraStructure(yamlResult.data);
        parsed = normalizeToInfraData(yamlResult.data);
        type = "yaml";
        suggestions = validation?.suggestions || [];
        suggestions.unshift(`Note: File parsed as YAML despite .json extension. ${jsonResult.suggestion || ''}`);
      } else {
        parseError = `JSON parse error: ${jsonResult.error}${jsonResult.suggestion ? ` (${jsonResult.suggestion})` : ''}. YAML parse error: ${yamlResult.error}`;
      }
    }
  } else if (type === "yaml") {
    const yamlResult = safeYamlParse(content);
    if (yamlResult.success) {
      rawParsed = yamlResult.data;
      validation = safeValidateInfraStructure(yamlResult.data);
      parsed = normalizeToInfraData(yamlResult.data);
      suggestions = validation?.suggestions || [];
    } else {
      // Fallback to JSON if YAML parsing fails
      const jsonResult = safeJsonParseEnhanced(content);
      if (jsonResult.success) {
        rawParsed = jsonResult.data;
        validation = safeValidateInfraStructure(jsonResult.data);
        parsed = normalizeToInfraData(jsonResult.data);
        type = "json";
        suggestions = validation?.suggestions || [];
        suggestions.unshift("Note: File parsed as JSON despite YAML-like extension");
      } else {
        parseError = `YAML parse error: ${yamlResult.error}. JSON parse error: ${jsonResult.error}${jsonResult.suggestion ? ` (${jsonResult.suggestion})` : ''}`;
      }
    }
  } else {
    // Try both formats for unknown types
    const jsonResult = safeJsonParseEnhanced(content);
    const yamlResult = safeYamlParse(content);
    
    if (jsonResult.success) {
      rawParsed = jsonResult.data;
      validation = safeValidateInfraStructure(jsonResult.data);
      parsed = normalizeToInfraData(jsonResult.data);
      type = "json";
      suggestions = validation?.suggestions || [];
    } else if (yamlResult.success) {
      rawParsed = yamlResult.data;
      validation = safeValidateInfraStructure(yamlResult.data);
      parsed = normalizeToInfraData(yamlResult.data);
      type = "yaml";
      suggestions = validation?.suggestions || [];
    } else {
      parseError = `Could not parse as JSON or YAML. JSON error: ${jsonResult.error}${jsonResult.suggestion ? ` (${jsonResult.suggestion})` : ''}. YAML error: ${yamlResult.error}`;
    }
  }

  return NextResponse.json({
    name: filename,
    size: (file as File).size,
    preview: content.slice(0, 500),
    type,
    parsed,
    rawParsed,
    parseError,
    validation,
    suggestions,
  });
}
