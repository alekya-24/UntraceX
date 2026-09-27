import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  Download,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Info,
  Wand2,
  RefreshCw,
  Check,
  ArrowRight,
  ShieldAlert,
  FileCode,
  Layers
} from 'lucide-react';
import { api } from '../api/client';

export default function Analyze() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Core document state
  const [docId, setDocId] = useState(searchParams.get('doc_id') || null);
  const [documentData, setDocumentData] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [compareData, setCompareData] = useState(null);

  // Tabs & Forms
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'paste'
  const [pastedText, setPastedText] = useState('');
  const [pastedTitle, setPastedTitle] = useState('');

  // Loading states
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [improving, setImproving] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [error, setError] = useState('');

  // Interactive selection states
  const [selectedSignalIndex, setSelectedSignalIndex] = useState(null);
  const [selectedMetadataKeys, setSelectedMetadataKeys] = useState(new Set());
  const [editableText, setEditableText] = useState('');
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [diffViewMode, setDiffViewMode] = useState('side-by-side'); // 'side-by-side' | 'before' | 'after'

  // Load document when doc_id is present
  useEffect(() => {
    const id = searchParams.get('doc_id');
    if (id) {
      setDocId(id);
      loadDocumentAndAnalyze(id);
    }
  }, [searchParams]);

  const loadDocumentAndAnalyze = async (id) => {
    try {
      setError('');
      setScanning(true);

      // 1. Fetch document data
      const doc = await api.getDocument(id);
      setDocumentData(doc);
      setEditableText(doc.extracted_text || '');

      // 2. Perform or fetch AI & metadata analysis
      let analysis;
      if (!doc.analysis) {
        analysis = await api.analyzeDocument(id);
      } else {
        analysis = await api.getAnalysis(id);
      }
      setAnalysisData(analysis);

      // Pre-select removable metadata keys
      const removableKeys = new Set();
      if (analysis.metadata) {
        analysis.metadata.forEach((m) => {
          if (m.removable && m.value !== 'Not available') {
            removableKeys.add(m.name);
          }
        });
      }
      setSelectedMetadataKeys(removableKeys);

      // 3. Load comparison if document has been cleaned/improved
      if (doc.status === 'Cleaned' || doc.has_cleaned) {
        const comp = await api.compareDocument(id);
        setCompareData(comp);
      }
    } catch (err) {
      setError(err.message || 'Failed to inspect document.');
    } finally {
      setScanning(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.uploadDocument(formData);
      navigate(`/analyze?doc_id=${res.id}`, { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to upload document.');
      setUploading(false);
    }
  };

  const handlePastedTextSubmit = async (e) => {
    e.preventDefault();
    if (!pastedText.trim()) {
      setError('Please enter some text content.');
      return;
    }
    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('pasted_text', pastedText);
      if (pastedTitle.trim()) {
        formData.append('filename_override', pastedTitle.trim());
      }
      const res = await api.uploadDocument(formData);
      navigate(`/analyze?doc_id=${res.id}`, { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to process pasted text.');
      setUploading(false);
    }
  };

  const handleLoadSample = async (type) => {
    try {
      setError('');
      setUploading(true);
      const res = await api.loadSample(type);
      navigate(`/analyze?doc_id=${res.id}`, { replace: true });
    } catch (err) {
      setError('Sample load failed: ' + err.message);
      setUploading(false);
    }
  };

  const toggleMetadataKey = (key) => {
    const updated = new Set(selectedMetadataKeys);
    if (updated.has(key)) {
      updated.delete(key);
    } else {
      updated.add(key);
    }
    setSelectedMetadataKeys(updated);
  };

  const toggleSelectAllMetadata = () => {
    if (!analysisData?.metadata) return;
    const removableList = analysisData.metadata.filter(
      (m) => m.removable && m.value !== 'Not available'
    );
    if (selectedMetadataKeys.size === removableList.length) {
      setSelectedMetadataKeys(new Set());
    } else {
      setSelectedMetadataKeys(new Set(removableList.map((m) => m.name)));
    }
  };

  const handleCleanMetadata = async () => {
    if (selectedMetadataKeys.size === 0) {
      alert('Please select at least one metadata property to remove.');
      return;
    }

    try {
      setError('');
      setCleaning(true);
      await api.cleanDocument(docId, Array.from(selectedMetadataKeys));
      
      // Refresh document and analysis
      const updatedDoc = await api.getDocument(docId);
      const updatedAnalysis = await api.getAnalysis(docId);
      const comp = await api.compareDocument(docId);
      
      setDocumentData(updatedDoc);
      setAnalysisData(updatedAnalysis);
      setCompareData(comp);
      setSelectedMetadataKeys(new Set());
    } catch (err) {
      setError(err.message || 'Failed to remove metadata.');
    } finally {
      setCleaning(false);
    }
  };

  const handleImproveText = async () => {
    try {
      setError('');
      setImproving(true);
      const customPayload = showTextEditor ? editableText : null;
      const res = await api.improveText(docId, customPayload);

      // Update local state with improved text and comparison
      const updatedDoc = await api.getDocument(docId);
      const updatedAnalysis = await api.getAnalysis(docId);
      const comp = await api.compareDocument(docId);

      setDocumentData(updatedDoc);
      setAnalysisData(updatedAnalysis);
      setCompareData(comp);
      setEditableText(res.improved_text);
    } catch (err) {
      setError(err.message || 'Failed to improve text.');
    } finally {
      setImproving(false);
    }
  };

  const handleDownload = async (version = 'cleaned') => {
    if (!documentData) return;
    try {
      await api.downloadFile(docId, version, documentData.filename);
    } catch (err) {
      alert('Download error: ' + err.message);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Helper to render document text with RED and YELLOW highlights
  const renderHighlightedText = (fullText, signals) => {
    if (!fullText) return <span className="text-slate-400">No content available.</span>;
    if (!signals || signals.length === 0) {
      return <span>{fullText}</span>;
    }

    // Sort signals by start offset
    const sortedSignals = [...signals].sort((a, b) => a.start - b.start);
    const elements = [];
    let lastIndex = 0;

    sortedSignals.forEach((sig, idx) => {
      // Unhighlighted text before this signal
      if (sig.start > lastIndex) {
        elements.push(
          <span key={`text-${lastIndex}`}>
            {fullText.substring(lastIndex, sig.start)}
          </span>
        );
      }

      // Highlighted segment
      const isSelected = selectedSignalIndex === idx;
      const highlightClass =
        sig.level === 'high'
          ? 'bg-red-50 text-red-900 border-b-2 border-red-500 font-medium px-1 rounded-xs cursor-pointer hover:bg-red-100 transition-colors'
          : 'bg-amber-50 text-amber-900 border-b-2 border-amber-400 font-medium px-1 rounded-xs cursor-pointer hover:bg-amber-100 transition-colors';

      elements.push(
        <mark
          key={`sig-${idx}`}
          onClick={() => setSelectedSignalIndex(isSelected ? null : idx)}
          className={`${highlightClass} ${isSelected ? 'ring-2 ring-slate-900' : ''}`}
          title={`Click to inspect pattern: ${sig.reason}`}
        >
          {fullText.substring(sig.start, sig.end)}
        </mark>
      );

      lastIndex = sig.end;
    });

    // Trailing unhighlighted text
    if (lastIndex < fullText.length) {
      elements.push(
        <span key={`text-${lastIndex}`}>
          {fullText.substring(lastIndex)}
        </span>
      );
    }

    return elements;
  };

  // ---------------- VIEW 1: UPLOAD SCREEN ----------------
  if (!docId || (!documentData && !uploading && !scanning)) {
    return (
      <div className="p-8 max-w-4xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Upload & Analyze</h1>
          <p className="text-xs text-slate-500 mt-1">
            Detect AI-related writing characteristics and inspect document metadata.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Upload Tabs */}
        <div className="flex border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 px-4 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'upload'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Upload File
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`pb-2.5 px-4 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'paste'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Paste Text
          </button>
        </div>

        {activeTab === 'upload' ? (
          <div>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
              }}
              className="border-2 border-dashed border-slate-300 hover:border-slate-400 bg-white rounded-lg p-12 text-center cursor-pointer transition-colors shadow-2xs group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.pptx,.txt"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                }}
              />

              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200 group-hover:bg-slate-100 transition-colors">
                <UploadCloud className="w-6 h-6 text-slate-600" />
              </div>

              <h2 className="text-lg font-bold text-slate-900 mb-1">UPLOAD YOUR DOCUMENT</h2>
              <p className="text-xs text-slate-500 mb-2">Drag and drop your file here</p>
              <p className="text-xs font-mono font-medium text-slate-500 tracking-wider mb-6">
                PDF • DOCX • PPTX • TXT
              </p>

              <button
                type="button"
                className="px-5 py-2.5 bg-slate-900 group-hover:bg-slate-800 text-white text-xs font-semibold tracking-wider uppercase rounded-md transition-colors shadow-xs"
              >
                Choose File
              </button>
            </div>

            {/* Quick Demo Samples */}
            <div className="mt-8 bg-white border border-slate-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-slate-800">
                <Sparkles className="w-4 h-4 text-slate-500" />
                <span>Pre-loaded test documents with AI-related indicators:</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                Select a sample document containing both embedded metadata and detectable formulaic writing patterns:
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleLoadSample('pdf')}
                  className="text-xs px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded font-medium transition-colors"
                >
                  Load Sample PDF
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSample('docx')}
                  className="text-xs px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded font-medium transition-colors"
                >
                  Load Sample DOCX
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSample('pptx')}
                  className="text-xs px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded font-medium transition-colors"
                >
                  Load Sample PPTX
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePastedTextSubmit} className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Document Title (Optional)
              </label>
              <input
                type="text"
                placeholder="My_Essay.txt"
                value={pastedTitle}
                onChange={(e) => setPastedTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Paste Text Content
              </label>
              <textarea
                rows={10}
                required
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste your text content here to analyze linguistic indicators..."
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900 placeholder:text-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold tracking-wider uppercase rounded-md transition-colors"
            >
              {uploading ? 'Processing...' : 'Analyze Pasted Text'}
            </button>
          </form>
        )}
      </div>
    );
  }

  // ---------------- VIEW 2: SCANNING STATE ----------------
  if (scanning || uploading) {
    return (
      <div className="p-8 max-w-4xl mx-auto w-full">
        <div className="bg-white border border-slate-200 rounded-lg p-10 text-center">
          <div className="w-10 h-10 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-base font-bold text-slate-900 tracking-wider uppercase mb-3">
            Scanning document...
          </h2>
          <div className="space-y-1 text-xs text-slate-500 max-w-sm mx-auto">
            <p>Extracting content...</p>
            <p>Checking document information...</p>
            <p>Analyzing writing patterns...</p>
          </div>
        </div>
      </div>
    );
  }

  const aiPercentage = analysisData?.ai_likelihood ?? 0;
  const humanPercentage = analysisData?.human_likelihood ?? (100 - aiPercentage);
  const signals = analysisData?.signals || [];
  const metadataList = analysisData?.metadata || [];

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
      {/* Top Header / Breadcrumb */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/analyze')}
            className="text-xs text-slate-500 hover:text-slate-900 font-medium"
          >
            ← Upload another file
          </button>
          <span className="text-slate-300">|</span>
          <span className="text-xs font-semibold text-slate-800">{documentData?.filename}</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
            {documentData?.file_type}
          </span>
          <span className="text-xs text-slate-400 font-mono">
            {formatFileSize(documentData?.file_size)}
          </span>
        </div>

        {documentData?.has_cleaned && (
          <button
            onClick={() => handleDownload('cleaned')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download Cleaned File
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* ====================================================
          SECTION 1: AI CONTENT RESULT (User Specification)
         ==================================================== */}
      <section className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
          <span>1. AI CONTENT RESULT</span>
          <span className="text-[10px] font-mono text-slate-400">Statistical Cadence & Pattern Assessment</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* AI-Generated Estimate */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-lg text-center">
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              ESTIMATED AI-GENERATED CONTENT
            </div>
            <div className={`text-4xl font-black tracking-tight ${aiPercentage >= 65 ? 'text-red-600' : aiPercentage >= 35 ? 'text-amber-600' : 'text-slate-800'}`}>
              {aiPercentage}%
            </div>
            <div className="mt-2">
              <span
                className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wide ${
                  aiPercentage >= 65
                    ? 'bg-red-100 text-red-800'
                    : aiPercentage >= 35
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {aiPercentage >= 65
                  ? 'ELEVATED AI-RELATED INDICATORS'
                  : aiPercentage >= 35
                  ? 'MODERATE AI-RELATED INDICATORS'
                  : 'LOW AI-RELATED INDICATORS'}
              </span>
            </div>
          </div>

          {/* Human-Like Content Estimate */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-lg text-center">
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              HUMAN-LIKE CONTENT
            </div>
            <div className="text-4xl font-black text-slate-800 tracking-tight">
              {humanPercentage}%
            </div>
            <div className="mt-2">
              <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wide bg-slate-200 text-slate-700">
                Natural Cadence Balance
              </span>
            </div>
          </div>

          {/* Analytical Disclaimer (Required in spec) */}
          <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-lg text-xs text-slate-600 leading-relaxed">
            <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-500" />
              <span>Analytical Estimate Notice</span>
            </div>
            <p className="text-[11px] text-slate-500">
              “This is an analytical estimate based on linguistic characteristics. It is not definitive proof of AI authorship.”
            </p>
            <p className="text-[10px] text-slate-400 mt-2">
              Linguistic characteristics alone cannot prove authorship with certainty.
            </p>
          </div>
        </div>
      </section>

      {/* ====================================================
          SECTION 2: AI-RELATED TEXT HIGHLIGHTS & TRACE PANEL
         ==================================================== */}
      <section className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
          <span>2. AI-RELATED TEXT HIGHLIGHTS</span>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
              <span className="text-slate-600 text-[11px]">High indicator</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              <span className="text-slate-600 text-[11px]">Moderate indicator</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
              <span className="text-slate-600 text-[11px]">No significant indicator</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Document Content View */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                DOCUMENT CONTENT
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowTextEditor(!showTextEditor)}
                  className="text-[11px] text-slate-600 hover:text-slate-900 underline font-medium"
                >
                  {showTextEditor ? 'Show Highlighted Preview' : 'Edit Text Manually'}
                </button>
              </div>
            </div>

            {showTextEditor ? (
              <textarea
                rows={14}
                value={editableText}
                onChange={(e) => setEditableText(e.target.value)}
                className="w-full flex-1 p-4 font-mono text-xs text-slate-900 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
              />
            ) : (
              <div className="flex-1 min-h-[260px] max-h-[420px] overflow-y-auto p-4 bg-slate-50/70 border border-slate-200 rounded font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-wrap select-text">
                {renderHighlightedText(editableText || documentData?.extracted_text, signals)}
              </div>
            )}

            {/* AI Text Improvement Action Button */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[11px] text-slate-500">
                Rewrites formulaic phrasing to introduce natural human sentence variation.
              </div>
              <button
                type="button"
                disabled={improving}
                onClick={handleImproveText}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs tracking-wider uppercase rounded transition-colors disabled:opacity-50 shadow-xs"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>{improving ? 'Improving...' : 'IMPROVE SELECTED TEXT'}</span>
              </button>
            </div>
          </div>

          {/* AI Trace Panel */}
          <div className="lg:col-span-5 flex flex-col bg-slate-50/50 border border-slate-200 rounded-lg p-4">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center justify-between pb-2 border-b border-slate-200">
              <span>AI-RELATED WRITING INDICATORS</span>
              <span className="text-[10px] text-slate-500 font-mono font-normal">
                {signals.length} flagged
              </span>
            </div>

            {signals.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No significant AI-related indicators detected.</p>
                <p className="text-[11px] text-slate-400 mt-1">Text exhibits natural structural cadence variation.</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[360px] pr-1">
                {signals.map((sig, idx) => {
                  const isSelected = selectedSignalIndex === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedSignalIndex(isSelected ? null : idx)}
                      className={`p-3 rounded border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-white border-slate-900 ring-1 ring-slate-900 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              sig.level === 'high' ? 'bg-red-500' : 'bg-amber-400'
                            }`}
                          />
                          <span>Detected pattern: {sig.reason}</span>
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
                            sig.level === 'high'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {sig.level}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2 rounded text-[11px] font-mono text-slate-700 mb-1.5 italic border border-slate-100 line-clamp-3">
                        "{sig.text}"
                      </div>

                      <div className="text-[11px] text-slate-500">
                        <strong>Reason:</strong> {sig.reason}. Characteristic of automated structural regularity.
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ====================================================
          SECTION 3: METADATA INFORMATION & REMOVAL
         ==================================================== */}
      <section className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
          <span>3. METADATA INFORMATION</span>
          <span className="text-[10px] text-slate-400 font-mono">
            Highlighted in RED 🔴 to indicate detected information
          </span>
        </div>

        {/* Note on Metadata separation */}
        <div className="mb-4 px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 flex items-start gap-2">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>
            <strong>Separation Notice:</strong> Visible document text and file header metadata are separate systems. Metadata properties reside in file attributes rather than document text.
          </span>
        </div>

        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              DOCUMENT METADATA
            </span>
            <button
              type="button"
              onClick={toggleSelectAllMetadata}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              {selectedMetadataKeys.size ===
              metadataList.filter((m) => m.removable && m.value !== 'Not available').length
                ? 'Deselect All'
                : 'Select All'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {metadataList.map((item) => {
              const hasValue = item.value && item.value !== 'Not available';
              const isChecked = selectedMetadataKeys.has(item.name);

              return (
                <div
                  key={item.name}
                  className="p-3 bg-white border border-slate-200 rounded-md flex items-start justify-between gap-3 hover:border-slate-300 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" title="Detected Information" />
                      <span className="text-xs font-bold text-slate-800">{item.name}</span>
                      {item.removed && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          REMOVED
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-xs mt-1 font-mono truncate ${
                        hasValue ? 'text-slate-700' : 'text-slate-400 italic'
                      }`}
                      title={item.value}
                    >
                      {item.value || 'Not available'}
                    </div>
                  </div>

                  {item.removable && !item.removed && hasValue ? (
                    <label className="flex items-center gap-1.5 cursor-pointer shrink-0 select-none text-xs text-slate-700 hover:text-slate-900 mt-0.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleMetadataKey(item.name)}
                        className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-0 cursor-pointer"
                      />
                      <span className="text-[11px] font-medium">Remove</span>
                    </label>
                  ) : !item.removable ? (
                    <span className="text-[10px] text-slate-400 font-medium shrink-0">
                      Non-removable
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Remove Selected Information Button */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Removes selected header properties directly from the binary package.
          </div>
          <button
            type="button"
            disabled={cleaning || selectedMetadataKeys.size === 0}
            onClick={handleCleanMetadata}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs tracking-wider uppercase rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
          >
            {cleaning ? 'Removing selected information...' : `REMOVE SELECTED INFORMATION (${selectedMetadataKeys.size})`}
          </button>
        </div>
      </section>

      {/* ====================================================
          SECTION 4: BEFORE / AFTER CLEANING (User Specification)
         ==================================================== */}
      {compareData && (
        <section className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>4. BEFORE / AFTER CLEANING</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500">Difference Highlighting:</span>
              <span className="px-1.5 py-0.5 bg-red-100 text-red-800 font-mono text-[10px] rounded font-semibold">
                RED: Removed
              </span>
              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-mono text-[10px] rounded font-semibold">
                GREEN: Added
              </span>
            </div>
          </div>

          {/* Side-by-Side Content Comparison (Desktop) / Stacked (Mobile) */}
          <div className="mb-6">
            <div className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wide">
              DOCUMENT TEXT COMPARISON
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* BEFORE */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="font-bold text-xs text-slate-800 mb-2 flex items-center justify-between pb-1 border-b border-slate-200">
                  <span>BEFORE</span>
                  <span className="text-[10px] text-slate-500 font-mono">Original Document Text</span>
                </div>
                <div className="font-mono text-xs text-slate-700 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
                  {compareData.original_text}
                </div>
              </div>

              {/* AFTER WITH DIFF HIGHLIGHTS */}
              <div className="p-4 bg-white border border-slate-200 rounded-lg">
                <div className="font-bold text-xs text-slate-800 mb-2 flex items-center justify-between pb-1 border-b border-slate-200">
                  <span>AFTER</span>
                  <span className="text-[10px] text-emerald-700 font-mono">Cleaned & Improved Text</span>
                </div>
                <div className="font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
                  {compareData.diff_chunks && compareData.diff_chunks.length > 0 ? (
                    compareData.diff_chunks.map((chunk, idx) => {
                      if (chunk.type === 'removed') {
                        return (
                          <span
                            key={idx}
                            className="bg-red-100 text-red-900 line-through px-0.5 rounded-xs"
                          >
                            {chunk.text}
                          </span>
                        );
                      }
                      if (chunk.type === 'added') {
                        return (
                          <span
                            key={idx}
                            className="bg-emerald-100 text-emerald-900 font-semibold px-0.5 rounded-xs"
                          >
                            {chunk.text}
                          </span>
                        );
                      }
                      return <span key={idx}>{chunk.text}</span>;
                    })
                  ) : (
                    <span>{compareData.cleaned_text}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* METADATA BEFORE / AFTER (User Specification) */}
          <div className="mb-6 pt-4 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wide">
              METADATA BEFORE / AFTER
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-slate-50 border border-slate-200 rounded p-4">
                <div className="font-bold text-slate-800 mb-2 font-sans flex items-center justify-between pb-1 border-b border-slate-200">
                  <span>METADATA BEFORE</span>
                  <span className="text-[10px] text-slate-500">Original Headers</span>
                </div>
                <div className="space-y-1.5">
                  {Object.entries(compareData.metadata_before || {}).map(([key, val]) => (
                    <div key={key} className="flex justify-between border-b border-slate-200 pb-1">
                      <span className="text-slate-500">{key}:</span>
                      <span className="font-semibold text-slate-800">{val || 'Not available'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-emerald-50/40 border border-emerald-200 rounded p-4">
                <div className="font-bold text-slate-800 mb-2 font-sans flex items-center justify-between pb-1 border-b border-emerald-100">
                  <span>METADATA AFTER</span>
                  <span className="text-[10px] text-emerald-700">Cleaned Properties</span>
                </div>
                <div className="space-y-1.5">
                  {Object.entries(compareData.metadata_after || {}).map(([key, val]) => (
                    <div key={key} className="flex justify-between border-b border-emerald-100 pb-1">
                      <span className="text-slate-500">{key}:</span>
                      <span
                        className={`font-semibold ${
                          val === 'Removed' ? 'text-emerald-700 font-bold' : 'text-slate-700'
                        }`}
                      >
                        {val || 'Not available'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Download Cleaned File Action */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-lg">
            <div>
              <div className="text-sm font-bold text-slate-900">YOUR CLEANED DOCUMENT IS READY</div>
              <div className="text-xs text-slate-500">
                Generated directly by UntraceX backend with sanitized headers.
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownload('original')}
                className="px-3 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded transition-colors"
              >
                VIEW BEFORE (ORIGINAL)
              </button>
              <button
                type="button"
                onClick={() => handleDownload('cleaned')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold tracking-wide uppercase rounded shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>DOWNLOAD CLEANED FILE</span>
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
