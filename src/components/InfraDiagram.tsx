"use client";
import React, { useEffect, useRef } from "react";
import mermaid from "mermaid";
import type { InfraData } from "../types/infra";

interface InfraDiagramProps {
  data: InfraData;
}

function makeMermaidDiagram(data: InfraData): string {
  const lines: string[] = ["graph TD"];
  
  // Handle services
  if (data.services && Array.isArray(data.services) && data.services.length > 0) {
    data.services.forEach((svc, i) => {
      const serviceName = svc.name || `Service ${i + 1}`;
      const serviceType = svc.type || svc.runtime || 'Unknown';
      const displayName = `${serviceName}\\n(${serviceType})`;
      lines.push(`  svc${i}["${displayName}"]`);
      
      // Add styling based on service type
      if (svc.type?.toLowerCase().includes('web') || svc.type?.toLowerCase().includes('frontend')) {
        lines.push(`  svc${i} --> |frontend| style_frontend`);
      } else if (svc.type?.toLowerCase().includes('api') || svc.type?.toLowerCase().includes('backend')) {
        lines.push(`  svc${i} --> |backend| style_backend`);
      }
    });
  }
  
  // Handle databases
  if (data.databases && Array.isArray(data.databases) && data.databases.length > 0) {
    data.databases.forEach((db, j) => {
      const dbName = db.name || `Database ${j + 1}`;
      const dbType = db.type || 'DB';
      lines.push(`  db${j}[(${dbType}: ${dbName})]`);
      
      // Connect first service to databases if services exist
      if (data.services && data.services.length > 0) {
        lines.push(`  svc0 --> db${j}`);
      }
    });
  }
  
  // Handle environment variables
  if (data.environment && Object.keys(data.environment).length > 0) {
    lines.push(`  env[/"Environment Variables"/]`);
    if (data.services && data.services.length > 0) {
      lines.push(`  svc0 --> env`);
    }
  }
  
  // If no recognized structure, try to visualize any data
  if (!data.services?.length && !data.databases?.length && !data.environment) {
    const keys = Object.keys(data).filter(key => key !== 'services' && key !== 'databases' && key !== 'environment');
    if (keys.length > 0) {
      keys.forEach((key, i) => {
        const value = data[key];
        let nodeType = 'component';
        
        if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value)) {
            nodeType = `array[${value.length}]`;
          } else {
            nodeType = 'object';
          }
        } else {
          nodeType = typeof value;
        }
        
        lines.push(`  comp${i}["${key}\\n(${nodeType})"]`);
      });
      
      // Connect components
      for (let i = 1; i < keys.length; i++) {
        lines.push(`  comp0 --> comp${i}`);
      }
    }
  }
  
  // If still no content, show a placeholder
  if (lines.length === 1) {
    lines.push(`  placeholder["No recognizable infrastructure components\\nfound in the file"]`);
  }
  
  return lines.join("\n");
}

export default function InfraDiagram({ data }: InfraDiagramProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data || !ref.current) return;
    const diagram = makeMermaidDiagram(data);
    mermaid.initialize({ startOnLoad: false, theme: "dark" });

    mermaid.render("theGraph", diagram).then(({ svg }) => {
      if (ref.current) {
        ref.current.innerHTML = svg;
      }
    });
  }, [data]);

  if (!data) return null;

  return (
    <div className="my-8 w-full max-w-3xl mx-auto bg-gray-900 rounded p-4">
      <div className="mb-2 text-gray-400 font-semibold">Infrastructure Diagram:</div>
      <div ref={ref}></div>
      <pre className="text-xs text-gray-500 mt-4">
        {makeMermaidDiagram(data)}
      </pre>
    </div>
  );
}
