"use client";
import React, { useRef, useState, useCallback } from "react";
import InfraDiagram from "./InfraDiagram";
import type { InfraData, RawParsedData, ValidationResult } from "../types/infra";
import { exportAsJSON, formatFileSize, isSupportedFileType, generateInfraSummary } from "../utils/fileUtils";

interface UploadResult {
  name: string;
  size: number;
  preview: string;
  type: string;
  parsed?: InfraData;
  rawParsed?: RawParsedData;
  parseError?: string;
  error?: string;
  validation?: ValidationResult;
  suggestions?: string[];
}

export default function FileUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // File validation
  const validateFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (file.size > maxSize) {
      return 'File size must be less than 10MB';
    }

    if (!isSupportedFileType(file.name)) {
      return 'Please upload a valid configuration file (JSON, YAML, XML, TOML, etc.)';
    }

    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const error = validateFile(file);
      if (error) {
        setUploadResult({ error, name: file.name, size: file.size, preview: '', type: '' });
        return;
      }
    }
    setSelectedFile(file);
    setUploadResult(null);
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      const error = validateFile(file);
      if (error) {
        setUploadResult({ error, name: file.name, size: file.size, preview: '', type: '' });
        return;
      }
      setSelectedFile(file);
      setUploadResult(null);
    }
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsLoading(true);
    setUploadResult(null);

    try {
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
        const errorData = await res.json().catch(() => ({}));
        setUploadResult({ 
          error: errorData.error || `Upload failed with status ${res.status}`, 
          name: selectedFile.name, 
          size: selectedFile.size, 
          preview: "", 
          type: "" 
        });
      }
    } catch (error) {
      setUploadResult({ 
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        name: selectedFile.name, 
        size: selectedFile.size, 
        preview: "", 
        type: "" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Clear file handler
  const handleClearFile = () => {
    setSelectedFile(null);
    setUploadResult(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  // Export handlers
  const handleExportNormalized = () => {
    if (uploadResult?.parsed) {
      const filename = selectedFile?.name.split('.')[0] || 'infrastructure';
      exportAsJSON(uploadResult.parsed, `${filename}_normalized`);
    }
  };

  const handleExportRaw = () => {
    if (uploadResult?.rawParsed) {
      const filename = selectedFile?.name.split('.')[0] || 'infrastructure';
      exportAsJSON(uploadResult.rawParsed, `${filename}_raw`);
    }
  };

  const handleExportSummary = () => {
    if (uploadResult?.parsed) {
      const summary = generateInfraSummary(uploadResult.parsed);
      const filename = selectedFile?.name.split('.')[0] || 'infrastructure';
      exportAsJSON(summary, `${filename}_summary`);
    }
  };

  return (
    <div className="flex flex-col items-center mt-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Infrastructure Analyzer</h2>
        <p className="text-gray-300">Upload your configuration file to visualize your infrastructure</p>
      </div>

      {/* Drag & Drop Zone */}
      <div 
        className={`
          relative border-2 border-dashed rounded-lg p-8 mb-6 w-full max-w-2xl transition-all duration-200
          ${isDragOver 
            ? 'border-blue-400 bg-blue-900/20' 
            : 'border-gray-600 hover:border-gray-500'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <label htmlFor="file-input" className="cursor-pointer">
            <span className="text-lg font-medium text-white">
              Drop your file here, or <span className="text-blue-400 underline">browse</span>
            </span>
            <input
              ref={inputRef}
              id="file-input"
              type="file"
              accept=".tf,.yaml,.yml,.json,.toml,.xml,.config,.conf,.properties,.env"
              className="hidden"
              onChange={handleFileChange}
              disabled={isLoading}
            />
          </label>
          <p className="text-sm text-gray-400 mt-2">
            Supports JSON, YAML, XML, TOML, Docker Compose, Kubernetes, Terraform and more
          </p>
          <p className="text-xs text-gray-500 mt-1">Maximum file size: 10MB</p>
        </div>
      </div>

      {/* Selected File Info */}
      {selectedFile && (
        <div className="bg-gray-800 rounded-lg p-4 mb-4 w-full max-w-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-green-600 rounded-full p-2">
                <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">{selectedFile.name}</p>
                <p className="text-gray-400 text-sm">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                className={`px-4 py-2 rounded font-medium transition-colors ${
                  isLoading 
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                onClick={handleUpload}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Analyzing...</span>
                  </div>
                ) : (
                  'Analyze'
                )}
              </button>
              <button
                className="px-4 py-2 rounded font-medium bg-gray-600 text-white hover:bg-gray-700 transition-colors"
                onClick={handleClearFile}
                disabled={isLoading}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {uploadResult && (
        <div className="w-full max-w-4xl">
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            {uploadResult.error && (
              <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2">
                  <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-400 font-medium">Error</span>
                </div>
                <p className="text-red-300 mt-1">{uploadResult.error}</p>
              </div>
            )}
            
            {uploadResult.parseError && (
              <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2">
                  <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-yellow-400 font-medium">Parse Warning</span>
                </div>
                <p className="text-yellow-300 mt-1">{uploadResult.parseError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <span className="text-gray-400 font-medium">File Name:</span>
                <p className="text-white">{uploadResult.name}</p>
              </div>
              <div>
                <span className="text-gray-400 font-medium">File Size:</span>
                <p className="text-white">{uploadResult.size} bytes</p>
              </div>
              <div>
                <span className="text-gray-400 font-medium">Detected Type:</span>
                <p className="text-white uppercase">{uploadResult.type}</p>
              </div>
            </div>

            {uploadResult.preview && (
              <div className="mb-4">
                <span className="text-gray-400 font-medium block mb-2">File Preview:</span>
                <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 border border-gray-700">
                  {uploadResult.preview}
                </pre>
              </div>
            )}

            {/* Validation Results */}
            {uploadResult.validation && (
              <div className={`mb-4 rounded-lg p-4 border ${
                uploadResult.validation.confidence === 'high' 
                  ? 'bg-green-900/20 border-green-500/30' 
                  : uploadResult.validation.confidence === 'medium'
                  ? 'bg-yellow-900/20 border-yellow-500/30'
                  : 'bg-blue-900/20 border-blue-500/30'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  {uploadResult.validation.confidence === 'high' ? (
                    <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : uploadResult.validation.confidence === 'medium' ? (
                    <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className={`font-medium ${
                    uploadResult.validation.confidence === 'high' 
                      ? 'text-green-400' 
                      : uploadResult.validation.confidence === 'medium'
                      ? 'text-yellow-400'
                      : 'text-blue-400'
                  }`}>
                    Validation: {uploadResult.validation.confidence.toUpperCase()} Confidence
                  </span>
                  {uploadResult.validation.detectedFormat && (
                    <span className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded">
                      {uploadResult.validation.detectedFormat}
                    </span>
                  )}
                </div>
                {uploadResult.suggestions && uploadResult.suggestions.length > 0 && (
                  <div className="space-y-1">
                    {uploadResult.suggestions.map((suggestion, index) => (
                      <p key={index} className="text-sm text-gray-300 flex items-start">
                        <span className="mr-2 mt-1">•</span>
                        <span>{suggestion}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {uploadResult.parsed && (
              <>
                {/* Infrastructure Summary */}
                <div className="mb-6">
                  {(() => {
                    const summary = generateInfraSummary(uploadResult.parsed);
                    return (
                      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold text-white">Infrastructure Summary</h3>
                          <div className="flex space-x-2">
                            <button
                              onClick={handleExportSummary}
                              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              Export Summary
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-400">{summary.services}</div>
                            <div className="text-sm text-gray-400">Services</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-400">{summary.databases}</div>
                            <div className="text-sm text-gray-400">Databases</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-400">{summary.environments}</div>
                            <div className="text-sm text-gray-400">Env Variables</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-400">{summary.totalComponents}</div>
                            <div className="text-sm text-gray-400">Total Components</div>
                          </div>
                        </div>
                        {(summary.details.serviceTypes.length > 0 || summary.details.databaseTypes.length > 0 || summary.details.runtimes.length > 0) && (
                          <div className="border-t border-gray-600 pt-3">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              {summary.details.serviceTypes.length > 0 && (
                                <div>
                                  <span className="text-gray-400 font-medium">Service Types:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {summary.details.serviceTypes.map(type => (
                                      <span key={type} className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded text-xs">{type}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {summary.details.databaseTypes.length > 0 && (
                                <div>
                                  <span className="text-gray-400 font-medium">Database Types:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {summary.details.databaseTypes.map(type => (
                                      <span key={type} className="px-2 py-1 bg-green-600/20 text-green-300 rounded text-xs">{type}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {summary.details.runtimes.length > 0 && (
                                <div>
                                  <span className="text-gray-400 font-medium">Runtimes:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {summary.details.runtimes.map(runtime => (
                                      <span key={runtime} className="px-2 py-1 bg-purple-600/20 text-purple-300 rounded text-xs">{runtime}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 font-medium">Normalized Infrastructure Structure:</span>
                    <button
                      onClick={handleExportNormalized}
                      className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      Export Normalized
                    </button>
                  </div>
                  <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto text-xs text-green-400 border border-gray-700">
                    {JSON.stringify(uploadResult.parsed, null, 2)}
                  </pre>
                </div>
                {uploadResult.rawParsed && (
                  <div className="mb-6">
                    <details className="bg-gray-700 rounded-lg">
                      <summary className="p-4 cursor-pointer text-gray-400 font-medium hover:text-white flex items-center justify-between">
                        <span>Raw Parsed Data (Click to expand)</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportRaw();
                          }}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors ml-4"
                        >
                          Export Raw
                        </button>
                      </summary>
                      <pre className="bg-gray-900 rounded-b-lg p-4 overflow-x-auto text-xs text-blue-400 max-h-60 overflow-y-auto border-t border-gray-600">
                        {JSON.stringify(uploadResult.rawParsed, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
                <InfraDiagram data={uploadResult.parsed} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
