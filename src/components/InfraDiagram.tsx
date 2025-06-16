"use client";
import React, { useEffect, useRef } from "react";
import mermaid from "mermaid";
import type { InfraData } from "../types/infra";

interface InfraDiagramProps {
  data: InfraData;
}

function makeMermaidDiagram(data: InfraData): string {
  const lines: string[] = ["graph TD"];
  if (data.services && Array.isArray(data.services)) {
    data.services.forEach((svc, i) => {
      lines.push(`  svc${i}["${svc.name || "Service"}\\n(${svc.runtime})"]`);
    });
  }
  if (data.databases && Array.isArray(data.databases)) {
    data.databases.forEach((db, j) => {
      lines.push(`  db${j}[(DB: ${db.name || "Database"})]`);
      if (data.services && Array.isArray(data.services) && data.services[0]) {
        lines.push(`  svc0 --> db${j}`);
      }
    });
  }
  if (data.environment) {
    lines.push(`  env[/"Env Vars"/]`);
    lines.push(`  svc0 --> env`);
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
