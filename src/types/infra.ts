export interface InfraService {
  name?: string;
  runtime?: string;
  rootDir?: string;
  buildCommand?: string;
  startCommand?: string;
  type?: string;
  [key: string]: any; // Allow additional properties
}

export interface InfraDatabase {
  name?: string;
  type?: string;
  version?: string;
  host?: string;
  port?: number;
  [key: string]: any; // Allow additional properties
}

export interface InfraData {
  services?: InfraService[];
  databases?: InfraDatabase[];
  environment?: Record<string, string>;
  [key: string]: any; // Allow additional properties for any kind of infrastructure data
}
