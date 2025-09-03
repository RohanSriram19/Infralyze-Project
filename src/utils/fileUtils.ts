/**
 * Utility functions for file handling and data export
 */

/**
 * Downloads a text file with the given content
 * @param content - The content to download
 * @param filename - The filename for the download
 * @param mimeType - The MIME type of the file
 */
export function downloadTextFile(content: string, filename: string, mimeType = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Downloads JSON data as a formatted file
 * @param data - The data to export as JSON
 * @param filename - The filename (without extension)
 */
export function exportAsJSON(data: unknown, filename: string): void {
  const content = JSON.stringify(data, null, 2);
  downloadTextFile(content, `${filename}.json`, 'application/json');
}

/**
 * Formats file size in human-readable format
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Validates if a file extension is supported
 * @param filename - The filename to check
 * @returns True if the file extension is supported
 */
export function isSupportedFileType(filename: string): boolean {
  const supportedExtensions = [
    '.json', '.yaml', '.yml', '.toml', '.xml', 
    '.config', '.conf', '.properties', '.env',
    '.tf', '.hcl', '.dockerfile'
  ];
  
  const lowerFilename = filename.toLowerCase();
  return supportedExtensions.some(ext => lowerFilename.endsWith(ext));
}

/**
 * Generates a summary of parsed infrastructure data
 * @param data - The infrastructure data
 * @returns Summary object with counts and details
 */
export function generateInfraSummary(data: { 
  services?: Array<{ type?: string; runtime?: string }>;
  databases?: Array<{ type?: string }>;
  environment?: Record<string, string>;
}) {
  const summary = {
    services: 0,
    databases: 0,
    environments: 0,
    totalComponents: 0,
    details: {
      serviceTypes: new Set<string>(),
      databaseTypes: new Set<string>(),
      runtimes: new Set<string>()
    }
  };

  if (data?.services && Array.isArray(data.services)) {
    summary.services = data.services.length;
    data.services.forEach((service) => {
      if (service.type) summary.details.serviceTypes.add(service.type);
      if (service.runtime) summary.details.runtimes.add(service.runtime);
    });
  }

  if (data?.databases && Array.isArray(data.databases)) {
    summary.databases = data.databases.length;
    data.databases.forEach((db) => {
      if (db.type) summary.details.databaseTypes.add(db.type);
    });
  }

  if (data?.environment && typeof data.environment === 'object') {
    summary.environments = Object.keys(data.environment).length;
  }

  summary.totalComponents = summary.services + summary.databases;

  return {
    ...summary,
    details: {
      serviceTypes: Array.from(summary.details.serviceTypes),
      databaseTypes: Array.from(summary.details.databaseTypes),
      runtimes: Array.from(summary.details.runtimes)
    }
  };
}
