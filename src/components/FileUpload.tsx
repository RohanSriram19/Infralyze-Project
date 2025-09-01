"use client";
import React, { useRef, useState } from "react";
import InfraDiagram from "./InfraDiagram";
import type { InfraData, RawParsedData } from "../types/infra";

interface UploadResult {
  name: string;
  size: number;
  preview: string;
  type: string;
  parsed?: InfraData;
  rawParsed?: RawParsedData;
  parseError?: string;
  error?: string;
}

export default function FileUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setUploadResult(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append("file", selectedFile);

    const res = await fetch("/api/parse", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data: UploadResult = await res.json();
      setUploadResult(data);
    } else {
      setUploadResult({ error: "Upload failed", name: "", size: 0, preview: "", type: "" });
    }
  };

  return (
    <div className="flex flex-col items-center mt-8">
      <label className="block mb-2 text-white text-lg font-semibold" htmlFor="file-input">
        Upload your configuration file (JSON, YAML, or any structured data):
      </label>
      <input
        ref={inputRef}
        id="file-input"
        type="file"
        accept=".tf,.yaml,.yml,.json,.toml,.xml,.config,.conf,.properties,.env"
        className="block text-white file:mr-4 file:py-2 file:px-4
          file:rounded-lg file:border-0 file:text-sm file:font-semibold
          file:bg-blue-600 file:text-white hover:file:bg-blue-700"
        onChange={handleFileChange}
      />
      {selectedFile && (
        <>
          <p className="mt-4 text-green-400">
            Selected file: <span className="font-mono">{selectedFile.name}</span>
          </p>
          <button
            className="mt-4 px-4 py-2 rounded bg-blue-700 text-white hover:bg-blue-800"
            onClick={handleUpload}
          >
            Upload
          </button>
        </>
      )}
      {uploadResult && (
        <div className="mt-6 p-4 rounded bg-gray-800 text-white max-w-xl w-full">
          {uploadResult.error && (
            <div className="text-red-400">{uploadResult.error}</div>
          )}
          {uploadResult.parseError && (
            <div className="text-red-400">{uploadResult.parseError}</div>
          )}
          <div>
            <span className="font-semibold">File Name:</span> {uploadResult.name}
          </div>
          <div>
            <span className="font-semibold">File Size:</span> {uploadResult.size} bytes
          </div>
          <div className="mt-2">
            <span className="font-semibold">Preview:</span>
            <pre className="bg-gray-900 rounded p-2 overflow-x-auto mt-1 text-sm">
              {uploadResult.preview}
            </pre>
          </div>
          {uploadResult.parsed && !uploadResult.parseError && (
            <>
              <div className="mt-6">
                <div className="font-semibold mb-2">Normalized Infrastructure Structure:</div>
                <pre className="bg-gray-900 rounded p-2 overflow-x-auto text-xs">
                  {JSON.stringify(uploadResult.parsed, null, 2)}
                </pre>
              </div>
              {uploadResult.rawParsed && (
                <div className="mt-4">
                  <div className="font-semibold mb-2">Raw Parsed Data:</div>
                  <pre className="bg-gray-900 rounded p-2 overflow-x-auto text-xs max-h-60 overflow-y-auto">
                    {JSON.stringify(uploadResult.rawParsed, null, 2)}
                  </pre>
                </div>
              )}
              <InfraDiagram data={uploadResult.parsed} />
            </>
          )}
          {uploadResult.parsed && uploadResult.parseError && (
            <div className="mt-6">
              <div className="font-semibold mb-2 text-yellow-400">Partial Parse (with errors):</div>
              <pre className="bg-gray-900 rounded p-2 overflow-x-auto text-xs">
                {JSON.stringify(uploadResult.parsed, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
