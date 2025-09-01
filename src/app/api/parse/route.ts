import { NextRequest, NextResponse } from "next/server";
import YAML from "yaml";
import type { InfraData } from "../../../types/infra";

// Helper function to safely parse JSON
function safeJsonParse(content: string): { success: boolean; data?: any; error?: string } {
  try {
    const parsed = JSON.parse(content);
    return { success: true, data: parsed };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// Helper function to safely parse YAML
function safeYamlParse(content: string): { success: boolean; data?: any; error?: string } {
  try {
    const parsed = YAML.parse(content);
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

// Helper function to normalize parsed data to InfraData format
function normalizeToInfraData(data: any): InfraData {
  if (!data || typeof data !== 'object') {
    return {};
  }

  const result: InfraData = {};

  // Handle different possible structures
  if (Array.isArray(data)) {
    // If data is an array, treat each item as a service
    result.services = data.map((item, index) => ({
      name: item?.name || item?.id || `Service ${index + 1}`,
      type: item?.type || item?.kind || 'unknown',
      runtime: item?.runtime || item?.image || item?.version,
      buildCommand: item?.buildCommand || item?.build,
      startCommand: item?.startCommand || item?.command || item?.cmd,
      rootDir: item?.rootDir || item?.workingDir || item?.path
    }));
  } else {
    // Handle object structures
    if (data.services || data.applications || data.apps) {
      const services = data.services || data.applications || data.apps;
      if (Array.isArray(services)) {
        result.services = services.map((svc: any) => ({
          name: svc?.name || svc?.id || 'Unknown Service',
          type: svc?.type || svc?.kind || 'service',
          runtime: svc?.runtime || svc?.image || svc?.version,
          buildCommand: svc?.buildCommand || svc?.build,
          startCommand: svc?.startCommand || svc?.command || svc?.cmd,
          rootDir: svc?.rootDir || svc?.workingDir || svc?.path
        }));
      } else if (typeof services === 'object') {
        // Handle services defined as object keys
        result.services = Object.entries(services).map(([key, value]: [string, any]) => ({
          name: key,
          type: value?.type || value?.kind || 'service',
          runtime: value?.runtime || value?.image || value?.version,
          buildCommand: value?.buildCommand || value?.build,
          startCommand: value?.startCommand || value?.command || value?.cmd,
          rootDir: value?.rootDir || value?.workingDir || value?.path
        }));
      }
    }

    if (data.databases || data.db || data.data) {
      const databases = data.databases || data.db || data.data;
      if (Array.isArray(databases)) {
        result.databases = databases.map((db: any) => ({
          name: db?.name || db?.id || 'Unknown Database',
          type: db?.type || db?.engine || 'database',
          version: db?.version,
          host: db?.host || db?.hostname,
          port: db?.port
        }));
      } else if (typeof databases === 'object') {
        result.databases = Object.entries(databases).map(([key, value]: [string, any]) => ({
          name: key,
          type: value?.type || value?.engine || 'database',
          version: value?.version,
          host: value?.host || value?.hostname,
          port: value?.port
        }));
      }
    }

    if (data.environment || data.env || data.envVars || data.variables) {
      const env = data.environment || data.env || data.envVars || data.variables;
      if (typeof env === 'object' && !Array.isArray(env)) {
        result.environment = env;
      }
    }

    // If no recognized structure, try to extract any meaningful data
    if (!result.services && !result.databases && !result.environment) {
      // Look for any object that might represent a service or component
      const possibleServices: any[] = [];
      
      Object.entries(data).forEach(([key, value]: [string, any]) => {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          possibleServices.push({
            name: key,
            type: value?.type || value?.kind || 'component',
            runtime: value?.runtime || value?.image || value?.version,
            buildCommand: value?.buildCommand || value?.build,
            startCommand: value?.startCommand || value?.command || value?.cmd,
            rootDir: value?.rootDir || value?.workingDir || value?.path
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
  let rawParsed: any = null;
  let type: "yaml" | "json" | "unknown" = "unknown";
  let parseError: string | null = null;

  // Detect content type
  type = detectContentType(content, filename);

  // Try to parse based on detected type first, then fallback to other formats
  if (type === "json") {
    const jsonResult = safeJsonParse(content);
    if (jsonResult.success) {
      rawParsed = jsonResult.data;
      parsed = normalizeToInfraData(jsonResult.data);
    } else {
      // Fallback to YAML if JSON parsing fails
      const yamlResult = safeYamlParse(content);
      if (yamlResult.success) {
        rawParsed = yamlResult.data;
        parsed = normalizeToInfraData(yamlResult.data);
        type = "yaml";
      } else {
        parseError = `JSON parse error: ${jsonResult.error}. YAML parse error: ${yamlResult.error}`;
      }
    }
  } else if (type === "yaml") {
    const yamlResult = safeYamlParse(content);
    if (yamlResult.success) {
      rawParsed = yamlResult.data;
      parsed = normalizeToInfraData(yamlResult.data);
    } else {
      // Fallback to JSON if YAML parsing fails
      const jsonResult = safeJsonParse(content);
      if (jsonResult.success) {
        rawParsed = jsonResult.data;
        parsed = normalizeToInfraData(jsonResult.data);
        type = "json";
      } else {
        parseError = `YAML parse error: ${yamlResult.error}. JSON parse error: ${jsonResult.error}`;
      }
    }
  } else {
    // Try both formats for unknown types
    const jsonResult = safeJsonParse(content);
    const yamlResult = safeYamlParse(content);
    
    if (jsonResult.success) {
      rawParsed = jsonResult.data;
      parsed = normalizeToInfraData(jsonResult.data);
      type = "json";
    } else if (yamlResult.success) {
      rawParsed = yamlResult.data;
      parsed = normalizeToInfraData(yamlResult.data);
      type = "yaml";
    } else {
      parseError = `Could not parse as JSON or YAML. JSON error: ${jsonResult.error}. YAML error: ${yamlResult.error}`;
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
  });
}
