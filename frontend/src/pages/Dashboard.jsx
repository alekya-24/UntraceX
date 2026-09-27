import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, CheckCircle2, Trash2, ArrowRight, Download, Sparkles } from 'lucide-react';
import { api } from '../api/client';

export default function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await api.listDocuments();
      setDocuments(data);
    } catch (err) {
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this document and its metadata history?')) return;
    try {
      await api.deleteDocument(id);
      setDocuments(documents.filter((d) => d.id !== id));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleDownloadCleaned = async (doc, e) => {
    e.stopPropagation();
    try {
      await api.downloadFile(doc.id, 'cleaned', doc.filename);
    } catch (err) {
      alert('Download error: ' + err.message);
    }
  };

  const handleLoadSample = async (type) => {
    try {
      setSampleLoading(true);
      const res = await api.loadSample(type);
      navigate(`/analyze?doc_id=${res.id}`);
    } catch (err) {
      alert('Failed to load sample: ' + err.message);
    } finally {
      setSampleLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      {/* Top Banner / Hero */}
      <div className="bg-white border border-slate-200 rounded-lg p-8 mb-8 shadow-xs">
        <div className="max-w-2xl">
          <div className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-wider rounded mb-3">
            Inspect. Detect. Clean.
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
            UNTRACEX
          </h1>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            Analyze your documents for AI-related writing indicators and document metadata, then clean supported information.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => navigate('/analyze')}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-md transition-colors shadow-xs"
            >
              <UploadCloud className="w-4 h-4" />
              <span>UPLOAD DOCUMENT</span>
            </button>

            <div className="text-xs text-slate-500 font-mono tracking-wide px-3 py-2 bg-slate-50 border border-slate-200 rounded-md">
              Supported formats: <strong className="text-slate-800 font-semibold">PDF • DOCX • PPTX • TXT</strong>
            </div>
          </div>

          {/* Quick Demo Preload Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 mr-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-slate-400" />
              Quick sample demonstration:
            </span>
            <button
              disabled={sampleLoading}
              onClick={() => handleLoadSample('pdf')}
              className="text-xs px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50"
            >
              Sample PDF
            </button>
            <button
              disabled={sampleLoading}
              onClick={() => handleLoadSample('docx')}
              className="text-xs px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50"
            >
              Sample DOCX
            </button>
            <button
              disabled={sampleLoading}
              onClick={() => handleLoadSample('pptx')}
              className="text-xs px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50"
            >
              Sample PPTX
            </button>
          </div>
        </div>
      </div>

      {/* Recent Documents Section */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Recent Documents</h2>
            <p className="text-xs text-slate-500">Your uploaded and inspected document catalog</p>
          </div>
          {documents.length > 0 && (
            <button
              onClick={() => navigate('/history')}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <span>View all in History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-400">Loading documents...</div>
        ) : error ? (
          <div className="py-8 text-center text-sm text-red-600">{error}</div>
        ) : documents.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-600 font-medium">No documents uploaded yet.</p>
            <p className="text-xs text-slate-400 mt-1">Upload a PDF, DOCX, PPTX, or TXT file to inspect writing indicators and metadata.</p>
            <button
              onClick={() => navigate('/analyze')}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-md transition-colors"
            >
              Upload First Document
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3">Filename</th>
                  <th className="py-3 px-3">File type</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">AI Estimate</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.slice(0, 6).map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => navigate(`/analyze?doc_id=${doc.id}`)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-800 hover:text-blue-600 transition-colors truncate max-w-xs">
                          {doc.filename}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {doc.file_type}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-500">
                      {formatDate(doc.created_at)}
                    </td>
                    <td className="py-3 px-3">
                      {doc.ai_likelihood !== null && doc.ai_likelihood !== undefined ? (
                        <span
                          className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                            doc.ai_likelihood >= 65
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : doc.ai_likelihood >= 35
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {doc.ai_likelihood}%
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                          doc.status === 'Cleaned'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : doc.status === 'Scanned'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            doc.status === 'Cleaned'
                              ? 'bg-emerald-500'
                              : doc.status === 'Scanned'
                              ? 'bg-blue-500'
                              : 'bg-slate-400'
                          }`}
                        />
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        {doc.has_cleaned && (
                          <button
                            title="Download Cleaned Document"
                            onClick={(e) => handleDownloadCleaned(doc, e)}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          title="Delete Document"
                          onClick={(e) => handleDelete(doc.id, e)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
