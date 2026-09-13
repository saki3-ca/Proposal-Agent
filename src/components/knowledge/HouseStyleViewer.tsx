import React, { useState, useEffect, useRef } from 'react';
import { Upload, CheckCircle2, AlertTriangle, FileText, Layers, RefreshCw, Palette, Type, Layout, ShieldAlert, BookOpen, ChevronRight, Info } from 'lucide-react';
import { HouseStyleProfile } from '../../types';
import { HouseStyleService } from '../../services/houseStyleService';
import { ReferenceProposalAnalyzer } from '../../services/referenceProposalAnalyzer';

export const HouseStyleViewer: React.FC = () => {
  const [profile, setProfile] = useState<HouseStyleProfile>(HouseStyleService.getActiveProfile());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'typography' | 'sections' | 'boilerplate' | 'restrictions'>('overview');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProfile(HouseStyleService.getActiveProfile());
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);

    setIsAnalyzing(true);
    setAnalysisError(null);

    const newProfiles: HouseStyleProfile[] = [];

    for (const file of files) {
      const result = await ReferenceProposalAnalyzer.analyzeReferenceProposal(file);
      if (result.success && result.profile) {
        newProfiles.push(result.profile);
      } else {
        setAnalysisError(result.error || `Failed to analyze reference proposal: ${file.name}`);
      }
    }

    if (newProfiles.length > 0) {
      let finalProfile: HouseStyleProfile;
      if (newProfiles.length === 1) {
        finalProfile = newProfiles[0];
      } else {
        finalProfile = HouseStyleService.consolidateProfiles(newProfiles);
      }

      HouseStyleService.saveProfile(finalProfile);
      setProfile(finalProfile);
    }

    setIsAnalyzing(false);
  };

  const handleResetToBaseline = () => {
    const baseline = HouseStyleService.getDefaultBaselineProfile();
    setProfile(baseline);
    setAnalysisError(null);
  };

  const getConfidenceBadge = (confidence: number) => {
    let label = 'LOW';
    let bg = 'bg-red-50 text-red-800 border-red-200';
    if (confidence >= 0.90) {
      label = 'VERY HIGH (0.90+)';
      bg = 'bg-emerald-50 text-emerald-800 border-emerald-300';
    } else if (confidence >= 0.70) {
      label = 'HIGH (0.70 - 0.89)';
      bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (confidence >= 0.40) {
      label = 'MEDIUM (0.40 - 0.69)';
      bg = 'bg-amber-50 text-amber-800 border-amber-200';
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${bg}`}>
        Confidence: {label}
      </span>
    );
  };

  const getSourceTypeBadge = (sourceType: string, status: string) => {
    if (sourceType === 'DEFAULT_BASELINE' || status === 'REFERENCE_REQUIRED') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
          <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-700" />
          Status = REFERENCE_REQUIRED (Default Baseline Fallback)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-700" />
        Extracted ACNABIN House Style ({profile.metadata.sourceCount} Reference Proposal{profile.metadata.sourceCount > 1 ? 's' : ''})
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        multiple
        accept=".docx"
        className="hidden"
      />

      {/* Header Banner */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900">ACNABIN House Style Profile</h2>
              {getSourceTypeBadge(profile.metadata.sourceType, profile.metadata.status)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {profile.metadata.sourceType === 'DEFAULT_BASELINE'
                ? 'No actual reference proposal has been uploaded yet. Baseline template active for testing.'
                : `Profile extracted programmatically from ${profile.metadata.sourceDocuments.join(', ')}.`}
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
              className="px-3.5 py-1.5 bg-[#714B67] hover:bg-[#51304A] text-white text-xs font-bold rounded shadow-2xs transition-colors flex items-center space-x-1.5 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing DOCX...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Reference Proposal (.docx)</span>
                </>
              )}
            </button>

            {profile.metadata.sourceType !== 'DEFAULT_BASELINE' && (
              <button
                onClick={handleResetToBaseline}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded border border-slate-200 transition-colors"
              >
                Reset to Baseline
              </button>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {analysisError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{analysisError}</span>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex items-center space-x-1 overflow-x-auto bg-white p-1 rounded border">
        {[
          { id: 'overview', label: 'Style Overview', icon: Layout },
          { id: 'typography', label: 'Typography & Colors', icon: Palette },
          { id: 'sections', label: 'Section Architecture', icon: Layers },
          { id: 'boilerplate', label: 'Boilerplate Candidates', icon: BookOpen },
          { id: 'restrictions', label: 'Content Restrictions', icon: ShieldAlert }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-semibold flex items-center space-x-1.5 rounded transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#714B67] text-white font-bold shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Document Properties */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
              <Layout className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Document Geometry</h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Page Size:</span>
                <span className="font-mono font-semibold text-slate-900">{profile.document.pageSize}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Orientation:</span>
                <span className="capitalize font-semibold text-slate-900">{profile.document.orientation}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Margins (Top/Bottom):</span>
                <span className="font-mono text-slate-900">{profile.document.margins.top} / {profile.document.margins.bottom}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Margins (Left/Right):</span>
                <span className="font-mono text-slate-900">{profile.document.margins.left} / {profile.document.margins.right}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Header/Footer Distance:</span>
                <span className="font-mono text-slate-900">{profile.document.headerDistance}</span>
              </div>
            </div>
          </div>

          {/* Metadata & Source Attribution */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Source Traceability</h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Source Type:</span>
                <span className="font-mono font-bold text-indigo-700">{profile.metadata.sourceType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Reference Count:</span>
                <span className="font-mono font-bold text-slate-900">{profile.metadata.sourceCount} File(s)</span>
              </div>
              <div className="py-1 border-b border-slate-50">
                <span className="text-slate-500 block mb-1">Source Documents:</span>
                {profile.metadata.sourceDocuments.length > 0 ? (
                  profile.metadata.sourceDocuments.map((doc, i) => (
                    <span key={i} className="inline-block bg-slate-100 border border-slate-200 rounded px-2 py-0.5 text-[11px] font-mono mr-1 mb-1 text-slate-800">
                      {doc}
                    </span>
                  ))
                ) : (
                  <span className="text-amber-700 italic">None (Default baseline template active)</span>
                )}
              </div>
              <div className="pt-1 flex items-center justify-between">
                {getConfidenceBadge(profile.metadata.confidence)}
              </div>
            </div>
          </div>

          {/* Header & Footer Layout */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
              <Type className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Header & Footer Layout</h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Running Header:</span>
                <span className="font-semibold text-slate-900">{profile.header.detected ? 'Detected (Logo + Title)' : 'None'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Page Numbering:</span>
                <span className="font-semibold text-slate-900">{profile.footer.pageNumbering ? 'Page X of Y' : 'None'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Confidentiality Line:</span>
                <span className="font-semibold text-slate-900 text-[11px]">{profile.footer.confidentialityText}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Thin Navy Separator Rule:</span>
                <span className="font-semibold text-emerald-700">{profile.header.rule ? '✓ Present' : 'Absent'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TYPOGRAPHY & COLORS */}
      {activeTab === 'typography' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Color Palette */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              ACNABIN Document Color Palette
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded border border-slate-200 flex items-center space-x-3">
                <div className="w-8 h-8 rounded border shadow-2xs shrink-0" style={{ backgroundColor: profile.colors.primary }} />
                <div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">Primary Navy</span>
                  <span className="font-mono font-bold text-slate-800">{profile.colors.primary}</span>
                </div>
              </div>

              <div className="p-2.5 rounded border border-slate-200 flex items-center space-x-3">
                <div className="w-8 h-8 rounded border shadow-2xs shrink-0" style={{ backgroundColor: profile.colors.accent }} />
                <div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">Heading Accent (H1/H2)</span>
                  <span className="font-mono font-bold text-slate-800">{profile.colors.accent}</span>
                </div>
              </div>

              <div className="p-2.5 rounded border border-slate-200 flex items-center space-x-3">
                <div className="w-8 h-8 rounded border shadow-2xs shrink-0" style={{ backgroundColor: profile.colors.tableHeaderColor }} />
                <div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">Table Header Fill</span>
                  <span className="font-mono font-bold text-slate-800">{profile.colors.tableHeaderColor}</span>
                </div>
              </div>

              <div className="p-2.5 rounded border border-slate-200 flex items-center space-x-3">
                <div className="w-8 h-8 rounded border shadow-2xs shrink-0" style={{ backgroundColor: profile.colors.alternateRowColor }} />
                <div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">Alternate Row Fill</span>
                  <span className="font-mono font-bold text-slate-800">{profile.colors.alternateRowColor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Font Rules */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Typography & Heading Rules
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-2 bg-slate-50 rounded border border-slate-200 flex justify-between items-center">
                <span>Body Text Font:</span>
                <span className="font-mono font-bold text-slate-900">{profile.typography.bodyFont} ({profile.typography.bodyFontSize})</span>
              </div>

              <div className="p-2 bg-slate-50 rounded border border-slate-200 flex justify-between items-center" style={{ color: profile.colors.headingColors.h1 }}>
                <span className="font-bold text-sm">H1 Heading:</span>
                <span className="font-mono font-bold">{profile.headings.h1.size} • Bold • {profile.headings.h1.color}</span>
              </div>

              <div className="p-2 bg-slate-50 rounded border border-slate-200 flex justify-between items-center" style={{ color: profile.colors.headingColors.h2 }}>
                <span className="font-bold text-xs">H2 Subheading:</span>
                <span className="font-mono font-bold">{profile.headings.h2.size} • Bold • {profile.headings.h2.color}</span>
              </div>

              <div className="p-2 bg-slate-50 rounded border border-slate-200 flex justify-between items-center" style={{ color: profile.colors.headingColors.h3 }}>
                <span className="font-semibold text-xs">H3 Subsection:</span>
                <span className="font-mono font-bold">{profile.headings.h3.size} • Bold • {profile.headings.h3.color}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SECTION ARCHITECTURE */}
      {activeTab === 'sections' && (
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Detected Proposal Section Hierarchy ({profile.sectionArchitecture.orderedSections.length} Sections)
            </h3>
            <span className="text-[11px] font-mono text-slate-500">Scheme: {profile.sectionArchitecture.numberingScheme}</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {profile.sectionArchitecture.orderedSections.map((sec, idx) => (
              <div key={idx} className="py-2 px-2 hover:bg-slate-50 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-[10px] text-slate-400 w-6">{idx + 1}.</span>
                  <span className={`font-semibold ${sec.level === 1 ? 'text-slate-900 font-bold' : 'text-slate-600 pl-4'}`}>
                    {sec.title}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-mono text-[10px]">
                    Level {sec.level}
                  </span>
                  {sec.sourceDocument && (
                    <span className="text-[10px] text-slate-400 font-mono">{sec.sourceDocument}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: BOILERPLATE CANDIDATES */}
      {activeTab === 'boilerplate' && (
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Detected Reusable Boilerplate Candidates
            </h3>
            <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">
              Status = CANDIDATE (Validation against KB required before drafting)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {profile.boilerplate.candidates.map((cand, idx) => (
              <div key={idx} className="p-3 rounded border border-slate-200 bg-slate-50/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{cand.sectionTitle}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                    {cand.status} ({(cand.confidence * 100).toFixed(0)}%)
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 italic">"{cand.sampleText}"</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: CONTENT RESTRICTIONS */}
      {activeTab === 'restrictions' && (
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Reference-Specific Content Restrictions (reusability = REFERENCE_SPECIFIC)
            </h3>
          </div>

          <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-900 space-y-1">
            <p className="font-bold">Strict Rule: Factual Content Separation</p>
            <p className="text-[11px] text-red-800">
              The following entities were extracted from reference proposals but MUST NOT be blindly reused as generic ACNABIN boilerplate during future proposal generation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <span className="font-bold text-slate-700 block uppercase text-[10px]">Client Names & Assignment Entities:</span>
              <div className="space-y-1">
                {profile.restrictions.clientSpecificContent.length > 0 ? (
                  profile.restrictions.clientSpecificContent.map((c, i) => (
                    <div key={i} className="p-1.5 bg-slate-50 border border-slate-200 rounded font-mono text-[11px] text-slate-800 flex justify-between">
                      <span>{c}</span>
                      <span className="text-red-700 font-bold">REFERENCE_SPECIFIC</span>
                    </div>
                  ))
                ) : (
                  <span className="text-slate-400 italic">No specific client names detected in reference text.</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-slate-700 block uppercase text-[10px]">Protected Categories:</span>
              <div className="space-y-1 font-mono text-[11px]">
                <div className="p-1.5 bg-slate-50 border border-slate-200 rounded text-slate-800">
                  <span className="text-slate-500">Dates:</span> {profile.restrictions.dates.join(', ') || 'N/A'}
                </div>
                <div className="p-1.5 bg-slate-50 border border-slate-200 rounded text-slate-800">
                  <span className="text-slate-500">Monetary Amounts:</span> {profile.restrictions.monetaryValues.join(', ') || 'N/A'}
                </div>
                <div className="p-1.5 bg-slate-50 border border-slate-200 rounded text-slate-800">
                  <span className="text-slate-500">Personnel Claims:</span> {profile.restrictions.personnel.join(', ') || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
