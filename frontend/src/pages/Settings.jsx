import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, HardDrive, CheckCircle2, Lock } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6 pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Account details and system configuration.
        </p>
      </div>

      <div className="space-y-6">
        {/* User Account Info */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-500" />
            <span>User Profile</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <span className="text-slate-500 block mb-1">Full Name</span>
              <span className="font-semibold text-slate-900 text-sm">{user?.name || 'User'}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <span className="text-slate-500 block mb-1">Email Address</span>
              <span className="font-semibold text-slate-900 text-sm">{user?.email || 'N/A'}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <span className="text-slate-500 block mb-1">Account ID</span>
              <span className="font-mono text-slate-700 text-xs">{user?.id || 'N/A'}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <span className="text-slate-500 block mb-1">Session Security</span>
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                JWT Authenticated (Local SQLite storage)
              </span>
            </div>
          </div>
        </div>

        {/* Cleaning Engine Capabilities */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-500" />
            <span>Document Cleaning Engine</span>
          </h2>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="p-3 border border-slate-200 rounded bg-slate-50/50">
              <strong className="text-slate-800 block mb-1">Supported File Formats:</strong>
              <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                <li><span className="font-mono font-semibold">PDF</span>: Author, Title, Subject, Creator, Producer, Keywords, Creation & Mod Dates, XMP stream stripping.</li>
                <li><span className="font-mono font-semibold">DOCX</span>: Core Properties (Author, Last Modified By, Title, Subject, Keywords, Comments, Revision) & Extended App Properties (Company, Application).</li>
                <li><span className="font-mono font-semibold">PPTX</span>: Core Properties (Author, Last Modified By, Title, Subject, Keywords, Comments, Revision) & Extended App Properties (Company, Application).</li>
                <li><span className="font-mono font-semibold">TXT</span>: File encoding verification, whitespace and BOM normalization without fabricating false metadata.</li>
              </ul>
            </div>

            <div className="p-3 border border-slate-200 rounded bg-slate-50/50 flex items-start gap-2">
              <HardDrive className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">Local Integrity Guarantee:</strong>
                <p className="mt-0.5 text-slate-500">
                  UntraceX runs entirely on your local Python server and SQLite database. No external cloud AI endpoints, no telemetry, and no ML classifiers are invoked.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
