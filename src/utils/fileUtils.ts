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

/**
 * Estimates deployment complexity based on infrastructure configuration
 * @param data - The infrastructure data to analyze
 * @returns Complexity assessment with recommendations
 */
export function estimateDeploymentComplexity(data: {
  services?: Array<{ type?: string; runtime?: string }>;
  databases?: Array<{ type?: string }>;
  environment?: Record<string, string>;
}) {
  let complexity = 0;
  const factors: string[] = [];
  const recommendations: string[] = [];

  const serviceCount = data?.services?.length || 0;
  const databaseCount = data?.databases?.length || 0;
  const envVarCount = data?.environment ? Object.keys(data.environment).length : 0;

  // Service complexity
  if (serviceCount === 0) {
    factors.push('No services defined');
    recommendations.push('Define at least one service for deployment');
  } else if (serviceCount <= 3) {
    complexity += 1;
    factors.push(`${serviceCount} service(s) - Simple microservice setup`);
    recommendations.push('Consider container orchestration for production');
  } else if (serviceCount <= 10) {
    complexity += 2;
    factors.push(`${serviceCount} services - Moderate complexity`);
    recommendations.push('Use Kubernetes or Docker Compose for orchestration');
    recommendations.push('Implement service discovery and load balancing');
  } else {
    complexity += 3;
    factors.push(`${serviceCount} services - High complexity`);
    recommendations.push('Consider microservice governance and API gateway');
    recommendations.push('Implement distributed tracing and monitoring');
    recommendations.push('Use service mesh for inter-service communication');
  }

  // Database complexity
  if (databaseCount > 0) {
    complexity += Math.min(databaseCount, 2);
    factors.push(`${databaseCount} database(s) detected`);
    if (databaseCount > 1) {
      recommendations.push('Consider data consistency patterns for multiple databases');
      recommendations.push('Implement database connection pooling');
    }
  }

  // Environment variable complexity
  if (envVarCount > 0) {
    if (envVarCount > 20) {
      complexity += 1;
      factors.push(`${envVarCount} environment variables - Consider config management`);
      recommendations.push('Use config maps or external configuration services');
    } else {
      factors.push(`${envVarCount} environment variables`);
    }
  }

  // Determine overall complexity level
  let level: 'simple' | 'moderate' | 'complex' | 'enterprise';
  if (complexity <= 1) {
    level = 'simple';
    recommendations.push('Perfect for containerized deployment');
  } else if (complexity <= 3) {
    level = 'moderate';
    recommendations.push('Consider CI/CD pipeline for automated deployment');
  } else if (complexity <= 5) {
    level = 'complex';
    recommendations.push('Implement infrastructure as code (IaC)');
    recommendations.push('Use blue-green or canary deployment strategies');
  } else {
    level = 'enterprise';
    recommendations.push('Consider enterprise-grade orchestration platform');
    recommendations.push('Implement comprehensive monitoring and observability');
    recommendations.push('Use GitOps for deployment automation');
  }

  return {
    level,
    score: complexity,
    factors,
    recommendations: [...new Set(recommendations)] // Remove duplicates
  };
}

/**
 * Generates deployment readiness checklist
 * @param data - Infrastructure data to analyze
 * @returns Checklist with completion status
 */
export function generateDeploymentChecklist(data: {
  services?: Array<{ 
    name?: string; 
    type?: string; 
    runtime?: string;
    buildCommand?: string;
    startCommand?: string;
  }>;
  databases?: Array<{ type?: string; host?: string; port?: number }>;
  environment?: Record<string, string>;
}) {
  const checklist = [
    {
      category: 'Services',
      items: [
        {
          name: 'At least one service defined',
          completed: (data?.services?.length || 0) > 0,
          required: true
        },
        {
          name: 'All services have names',
          completed: data?.services?.every(s => s.name) || false,
          required: true
        },
        {
          name: 'Services have defined types',
          completed: data?.services?.every(s => s.type) || false,
          required: false
        },
        {
          name: 'Build commands specified',
          completed: data?.services?.some(s => s.buildCommand) || false,
          required: false
        },
        {
          name: 'Start commands specified',
          completed: data?.services?.some(s => s.startCommand) || false,
          required: true
        }
      ]
    },
    {
      category: 'Data Layer',
      items: [
        {
          name: 'Database configuration present',
          completed: (data?.databases?.length || 0) > 0,
          required: false
        },
        {
          name: 'Database connection details specified',
          completed: data?.databases?.some(db => db.host && db.port) || false,
          required: false
        }
      ]
    },
    {
      category: 'Configuration',
      items: [
        {
          name: 'Environment variables defined',
          completed: Object.keys(data?.environment || {}).length > 0,
          required: false
        },
        {
          name: 'Production environment configured',
          completed: Object.keys(data?.environment || {}).some(key => 
            key.toLowerCase().includes('env') || 
            key.toLowerCase().includes('node_env')
          ),
          required: true
        }
      ]
    }
  ];

  const totalItems = checklist.reduce((sum, category) => sum + category.items.length, 0);
  const completedItems = checklist.reduce((sum, category) => 
    sum + category.items.filter(item => item.completed).length, 0
  );
  const requiredItems = checklist.reduce((sum, category) => 
    sum + category.items.filter(item => item.required).length, 0
  );
  const completedRequired = checklist.reduce((sum, category) => 
    sum + category.items.filter(item => item.required && item.completed).length, 0
  );

  return {
    checklist,
    summary: {
      totalItems,
      completedItems,
      requiredItems,
      completedRequired,
      completionPercentage: Math.round((completedItems / totalItems) * 100),
      readyForDeployment: completedRequired === requiredItems
    }
  };
}
