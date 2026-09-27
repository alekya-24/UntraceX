import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Trash2, ExternalLink } from 'lucide-react';
import { api } from '../api/client';

export default function History() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await api.listDocuments();
      setDocuments(data);
    } catch (err) {
      setError(err.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this document and all its history?')) return;
    try {
      await api.deleteDocument(id);
      setDocuments(documents.filter((d) => d.id !== id));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleDownload = async (doc, version, e) => {
    e.stopPropagation();
    try {
      await api.downloadFile(doc.id, version, doc.filename);
    } catch (err) {
      alert('Download error: ' + err.message);
    }
  };

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6 pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">History</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review your private document history, AI estimates, and sanitized files.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-400">Loading document history...</div>
        ) : documents.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-600 font-medium">No documents uploaded yet.</p>
            <p className="text-xs text-slate-400 mt-1">Uploaded and cleaned documents will appear here.</p>
            <button
              onClick={() => navigate('/analyze')}
              className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md transition-colors"
            >
              Analyze a Document
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3">Filename</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">AI Estimate</th>
                  <th className="py-3 px-3">Cleaning Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => navigate(`/analyze?doc_id=${doc.id}`)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                          <span className="font-medium text-slate-900 hover:text-blue-600 transition-colors block">
                            {doc.filename}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {doc.file_type}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-xs text-slate-600 font-medium">
                      {formatDate(doc.created_at)}
                    </td>
                    <td className="py-3.5 px-3">
                      {doc.ai_likelihood !== null && doc.ai_likelihood !== undefined ? (
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                              doc.ai_likelihood >= 65
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : doc.ai_likelihood >= 35
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            AI estimate: {doc.ai_likelihood}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Not analyzed</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full ${
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
                        {doc.status === 'Cleaned' ? 'Metadata cleaned' : doc.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          title="Open Inspection"
                          onClick={() => navigate(`/analyze?doc_id=${doc.id}`)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors text-xs flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                        {doc.has_cleaned && (
                          <button
                            title="Download Cleaned Document"
                            onClick={(e) => handleDownload(doc, 'cleaned', e)}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded transition-colors text-xs flex items-center gap-1 font-medium"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
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
