import React, { useState, useRef } from 'react';
import { Project, TenderType, ProposalStatus, ProjectDocument } from '../../types';
import { OdooStatusBar } from '../layout/OdooStatusBar';
import { ArrowRight, ArrowLeft, Upload, FileText, Check, Save, Plus } from 'lucide-react';
import { DocumentProcessingService } from '../../services/documentProcessingService';
import { ProposalDatabaseService } from '../../services/proposalDatabaseService';
import { ProposalPlannerService } from '../../services/proposalPlannerService';
import { ProposalDraftingService } from '../../services/proposalDraftingService';
import { AiService } from '../../services/aiService';

interface NewProposalWizardProps {
  onComplete: (newProject: Project) => void;
  onCancel: () => void;
}

export const NewProposalWizard: React.FC<NewProposalWizardProps> = ({ onComplete, onCancel }) => {
  const [activeStepId, setActiveStepId] = useState('1');
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<ProjectDocument[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pipelineSteps = [
    { id: '1', label: '01 Proposal Info' },
    { id: '2', label: '02 Documents' },
    { id: '3', label: '03 Requirements' },
    { id: '4', label: '04 Matching' },
    { id: '5', label: '05 Style' },
    { id: '6', label: '06 Draft' },
    { id: '7', label: '07 Review' },
    { id: '8', label: '08 Submission' }
  ];

  const currentStep = parseInt(activeStepId, 10);
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    name: '',
    client: '',
    assignedTo: 'SAKIB',
    receiveDate: today,
    submissionDeadline: today,
    tenderType: 'Statutory Audit' as TenderType,
    status: 'Draft' as ProposalStatus,
    remarks: ''
  });

  const processFiles = async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';
      let fileType: 'PDF' | 'DOCX' | 'XLSX' | 'PPTX' | 'Image' | 'TXT' | 'CSV' = 'PDF';

      if (['DOCX', 'DOC'].includes(ext)) fileType = 'DOCX';
      else if (['XLSX', 'XLS'].includes(ext)) fileType = 'XLSX';
      else if (['PPTX', 'PPT'].includes(ext)) fileType = 'PPTX';
      else if (['PNG', 'JPG', 'JPEG'].includes(ext)) fileType = 'Image';
      else if (['TXT', 'MD'].includes(ext)) fileType = 'TXT';
      else if (ext === 'CSV') fileType = 'CSV';

      const fileSizeMb = parseFloat((file.size / (1024 * 1024)).toFixed(2)) || 0.1;

      // Real MarkItDown processing via local FastAPI server
      const res = await DocumentProcessingService.processDocument(file);

      let markdownContent = `# Extracted Markdown: ${file.name}\n\nExtraction pending or failed.`;
      let status = 'file_identified';
      let ocrReq = false;
      let score = 0.90;

      if (res.success && res.document) {
        markdownContent = res.document.markdown;
        ocrReq = res.document.ocrRequired;
        score = res.document.quality.score;
        status = ocrReq ? 'ocr_check' : 'markdown_converted';
      }

      const newDoc: ProjectDocument = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        fileName: file.name,
        fileType: fileType,
        fileSizeMb: fileSizeMb,
        uploadedBy: 'SAKIB',
        uploadDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        processingStatus: status as any,
        ocrRequired: ocrReq,
        ocrCompleted: false,
        isSearchable: true,
        pageCount: Math.max(1, Math.ceil(markdownContent.split('\n\n').length / 3)),
        sourcePath: URL.createObjectURL(file),
        aiConfidence: score,
        version: '1.0',
        markdownContent: markdownContent,
        rawFile: file
      };

      setUploadedDocs((prev) => [...prev, newDoc]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleNext = () => {
    if (currentStep < 8) setActiveStepId((currentStep + 1).toString());
    else {
      if (!formData.name || !formData.client) {
        alert('Proposal Name and Client are required.');
        return;
      }

      const d1 = new Date(formData.submissionDeadline + 'T00:00:00');
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const daysLeft = Math.round((d1.getTime() - now.getTime()) / 86400000);

      const projectId = `p-${Date.now()}`;

      const newProj: Project = {
        id: projectId,
        name: formData.name,
        client: formData.client,
        assignmentTitle: formData.name,
        tenderType: formData.tenderType,
        refNumber: `REF-${Date.now().toString().slice(-4)}`,
        receiveDate: formData.receiveDate,
        submissionDeadline: formData.submissionDeadline,
        daysLeft,
        assignedTo: formData.assignedTo,
        issuingOrg: formData.client,
        manager: formData.assignedTo,
        status: formData.status,
        remarks: formData.remarks,
        completionPercentage: 30,
        mandatoryUnresolvedCount: 1,
        activeStep: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Extract & save requirements if documents were uploaded
      (async () => {
        let allReqs: any[] = [];
        if (uploadedDocs.length > 0) {
          for (const doc of uploadedDocs) {
            if (doc.markdownContent) {
              const extracted = await AiService.extractRequirements(doc.markdownContent, doc.fileName);
              allReqs.push(...extracted);
            }
          }
        }
        ProposalDatabaseService.saveProjectRequirements(projectId, allReqs);
        await ProposalPlannerService.generateContentPlan(newProj, allReqs);
        ProposalDraftingService.initializeDraftFromPlan(projectId);
      })();

      onComplete(newProj);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setActiveStepId((currentStep - 1).toString());
  };

  return (
    <div className="bg-white rounded border border-slate-200 shadow-2xs space-y-4 max-w-4xl mx-auto overflow-hidden">
      {/* Odoo Status Pipeline Bar */}
      <OdooStatusBar
        steps={pipelineSteps}
        activeStepId={activeStepId}
        onSelectStep={(id) => setActiveStepId(id)}
      />

      {/* Form Sheet Container */}
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2">
            <button onClick={handleNext} className="btn-odoo-primary flex items-center space-x-1">
              <Save className="w-3.5 h-3.5" />
              <span>Save & Continue</span>
            </button>
            <button onClick={onCancel} className="btn-odoo-secondary">
              Discard
            </button>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">New Proposal Entry Form</span>
        </div>

        {/* Step 1: Proposal Info */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1">
              Proposal Metadata & Assignment Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Proposal Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., BRAC Bank ESG Audit 2026"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-xs font-bold text-slate-900 focus:border-[#714B67]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Client Name *</label>
                  <input
                    type="text"
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    placeholder="e.g., BRAC Bank PLC"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:border-[#714B67]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned To</label>
                  <input
                    type="text"
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    placeholder="SAKIB"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Receive Date</label>
                    <input
                      type="date"
                      value={formData.receiveDate}
                      onChange={(e) => setFormData({ ...formData, receiveDate: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-xs font-mono text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Deadline *</label>
                    <input
                      type="date"
                      value={formData.submissionDeadline}
                      onChange={(e) => setFormData({ ...formData, submissionDeadline: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-xs font-mono font-bold text-amber-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tender Type</label>
                  <select
                    value={formData.tenderType}
                    onChange={(e) => setFormData({ ...formData, tenderType: e.target.value as TenderType })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-xs font-mono font-bold text-slate-900"
                  >
                    <option value="Statutory Audit">Statutory Audit</option>
                    <option value="Internal Audit">Internal Audit</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Assurance">Assurance</option>
                    <option value="Tax Advisory">Tax Advisory</option>
                    <option value="IT/Cyber Advisory">IT/Cyber Advisory</option>
                    <option value="Audit">Audit</option>
                    <option value="Consultancy">Consultancy</option>
                    <option value="Advisory">Advisory</option>
                    <option value="Management Audit">Management Audit</option>
                    <option value="Fixed Asset Audit">Fixed Asset Audit</option>
                    <option value="Tax">Tax</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ProposalStatus })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-xs font-mono font-bold text-slate-900"
                  >
                    <option value="Draft">Draft</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Under Review">Under Review</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Not Started">Not Started</option>
                    <option value="Assigned To Other Team">Assigned To Other Team</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks</label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                rows={2}
                placeholder="Enter notes or assignment remarks..."
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900"
              />
            </div>
          </div>
        )}

        {/* Step 2: Documents Upload */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1">
              Upload Procurement Documents (TOR / RFP / EOI)
            </h3>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.txt,.png,.jpg,.jpeg,.csv"
              className="hidden"
            />

            {/* Interactive Upload Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  processFiles(e.dataTransfer.files);
                }
              }}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-indigo-600 bg-indigo-50/50 scale-[1.005]'
                  : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-white shadow-2xs'
              }`}
            >
              <Upload className="w-8 h-8 text-[#714B67] mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-900">Click to browse or drag & drop TOR / RFP / Annexure files</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Supports PDF, DOCX, XLSX, PPTX, TXT, CSV up to 50MB</p>
              <div className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#714B67] text-white rounded text-xs font-semibold hover:bg-[#51304A]">
                <Plus className="w-3.5 h-3.5" />
                <span>Select Document Files</span>
              </div>
            </div>

            {/* Uploaded Files Table List */}
            {uploadedDocs.length > 0 && (
              <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-2xs">
                <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Uploaded Documents ({uploadedDocs.length})
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">MarkItDown Extraction Ready</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {uploadedDocs.map((doc) => (
                    <div key={doc.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
                        <div>
                          <h5 className="text-xs font-bold text-slate-900">{doc.fileName}</h5>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {doc.fileSizeMb} MB • {doc.fileType} • Status: {doc.processingStatus}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold rounded">
                        ✓ MarkItDown Processed
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep >= 3 && (
          <div className="p-6 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-600">
            <p className="font-bold text-slate-900">Step {currentStep}: {pipelineSteps[currentStep - 1].label}</p>
            <p>Ready to proceed to full workspace analysis.</p>
          </div>
        )}

        {/* Navigation Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`btn-odoo-secondary flex items-center space-x-1 ${currentStep === 1 ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <button onClick={handleNext} className="btn-odoo-primary flex items-center space-x-1">
            <span>{currentStep === 8 ? 'Add Proposal & Open Workspace' : 'Next Step'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
