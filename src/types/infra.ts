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
}
