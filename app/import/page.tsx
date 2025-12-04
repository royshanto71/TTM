'use client';

import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { 
  generateTemplate, 
  validateImportData, 
  bulkInsertData,
  ImportData,
  ValidationError 
} from '@/lib/importHelpers';
import { Download, Upload, CheckCircle, AlertCircle, FileJson } from 'lucide-react';

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [jsonData, setJsonData] = useState<ImportData | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDownloadTemplate = () => {
    generateTemplate();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setImportResults(null);
    setValidationErrors([]);

    if (!selectedFile.name.endsWith('.json')) {
      setValidationErrors([{ field: 'file', message: 'Please select a JSON file' }]);
      return;
    }

    try {
      const text = await selectedFile.text();
      const data = JSON.parse(text);
      setJsonData(data);

      const validation = validateImportData(data);
      if (!validation.valid) {
        setValidationErrors(validation.errors);
      }
    } catch (error: any) {
      setValidationErrors([{ field: 'file', message: `Invalid JSON: ${error.message}` }]);
    }
  };

  const handleImport = async () => {
    if (!jsonData) return;

    setImporting(true);
    setImportResults(null);

    try {
      const results = await bulkInsertData(jsonData);
      setImportResults(results);
      setJsonData(null);
      setFile(null);
    } catch (error: any) {
      setValidationErrors([{ field: 'import', message: error.message }]);
    } finally {
      setImporting(false);
    }
  };

  const getTotalCounts = () => {
    if (!jsonData) return { students: 0, classes: 0, payments: 0, notes: 0 };
    return {
      students: jsonData.students?.length || 0,
      classes: jsonData.classes?.length || 0,
      payments: jsonData.payments?.length || 0,
      notes: jsonData.notes?.length || 0,
    };
  };

  const counts = getTotalCounts();
  const hasValidData = jsonData && validationErrors.length === 0;

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Import Data</h1>
          <p className="text-gray-400">Bulk import students, classes, payments, and notes from a JSON file.</p>
        </div>

        {/* Template Download Section */}
        <Card>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-indigo-500/10">
              <Download className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2">Download Template</h2>
              <p className="text-gray-400 mb-4">
                Download a sample JSON template to see the expected format and structure for importing data.
              </p>
              <Button onClick={handleDownloadTemplate} variant="ghost">
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </div>
          </div>
        </Card>

        {/* File Upload Section */}
        <Card>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-500/10">
                <Upload className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Upload JSON File</h2>
                <p className="text-sm text-gray-400">Select or drag and drop your JSON file here</p>
              </div>
            </div>

            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-500/5'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <FileJson className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-300 mb-2">
                {file ? file.name : 'Drag and drop your JSON file here'}
              </p>
              <p className="text-sm text-gray-500 mb-4">or</p>
              <label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <span className="cursor-pointer inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 px-4 py-3 text-base min-h-[44px] bg-transparent border border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600 active:scale-95">
                  Browse Files
                </span>
              </label>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <h3 className="font-bold text-red-400">Validation Errors</h3>
                </div>
                <ul className="space-y-1 text-sm text-red-300">
                  {validationErrors.map((error, index) => (
                    <li key={index}>
                      {error.section && `[${error.section}${error.index !== undefined ? ` #${error.index + 1}` : ''}] `}
                      {error.field}: {error.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>

        {/* Preview Section */}
        {jsonData && validationErrors.length === 0 && (
          <Card>
            <h2 className="text-xl font-bold mb-4">Data Preview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-sm text-gray-400">Students</p>
                <p className="text-2xl font-bold text-indigo-400">{counts.students}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-sm text-gray-400">Classes</p>
                <p className="text-2xl font-bold text-green-400">{counts.classes}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-sm text-gray-400">Payments</p>
                <p className="text-2xl font-bold text-yellow-400">{counts.payments}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-sm text-gray-400">Notes</p>
                <p className="text-2xl font-bold text-purple-400">{counts.notes}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleImport} 
                disabled={importing || !hasValidData}
                className="flex-1"
              >
                {importing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import Data
                  </>
                )}
              </Button>
              <Button 
                onClick={() => {
                  setFile(null);
                  setJsonData(null);
                  setValidationErrors([]);
                }} 
                variant="ghost"
              >
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* Import Results */}
        {importResults && (
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <h2 className="text-xl font-bold">Import Complete</h2>
            </div>
            
            <div className="space-y-3">
              {Object.entries(importResults).map(([key, value]: [string, any]) => (
                <div key={key} className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold capitalize">{key}</h3>
                    <span className="text-sm text-gray-400">
                      {value.success} succeeded, {value.failed} failed
                    </span>
                  </div>
                  {value.errors.length > 0 && (
                    <div className="text-sm text-red-400">
                      Errors: {value.errors.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
