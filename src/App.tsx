import React, { useState, useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectWorkspace } from './components/projects/ProjectWorkspace';
import { DocumentLibraryPage } from './pages/DocumentLibraryPage';
import { SettingsPage } from './pages/SettingsPage';
import { ScratchWorkspaceModal } from './components/workspace/ScratchWorkspaceModal';
import { ProposalProgressModal } from './components/workspace/ProposalProgressModal';
import { INITIAL_PROJECTS, ATTENTION_ITEMS, DEMO_USER } from './services/mockData';
import { Project, User } from './types';
import { ProposalDatabaseService } from './services/proposalDatabaseService';
import { ProposalPreparationService } from './services/proposalPreparationService';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(DEMO_USER);
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isScratchOpen, setIsScratchOpen] = useState(false);
  const [progressModalProject, setProgressModalProject] = useState<Project | null>(null);

  const loadDatabaseProposals = async () => {
    const loaded = await ProposalDatabaseService.fetchProposals();
    setProjects(loaded);
  };

  useEffect(() => {
    loadDatabaseProposals();

    // Listen for live background proposal processing updates
    const handleProcessingUpdate = (event: any) => {
      const updatedProject = event.detail?.project as Project;
      if (updatedProject) {
        setProjects((prev) =>
          prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
        );
        setProgressModalProject((prev) =>
          prev && prev.id === updatedProject.id ? updatedProject : prev
        );
      }
    };

    window.addEventListener('acnabin_proposal_processing_update', handleProcessingUpdate);
    return () => {
      window.removeEventListener('acnabin_proposal_processing_update', handleProcessingUpdate);
    };
  }, []);

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    if (!path.startsWith('/projects/')) {
      setSelectedProjectId(null);
    }
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentPath(`/projects/${projectId}`);
  };

  const handleAddProject = async (newProject: Project) => {
    const updated = await ProposalDatabaseService.saveProject(newProject);
    setProjects(updated);
  };

  const handleClearProposals = () => {
    const cleared = ProposalDatabaseService.clearAllProposals();
    setProjects(cleared);
    setSelectedProjectId(null);
  };

  const handleDeleteProject = async (projectId: string) => {
    const remaining = await ProposalDatabaseService.deleteProject(projectId);
    setProjects(remaining);
    if (selectedProjectId === projectId) {
      setSelectedProjectId(null);
    }
  };

  const handleGlobalUpload = () => {
    if (currentPath.startsWith('/projects/')) {
      setCurrentPath(currentPath);
    } else {
      setCurrentPath('/document-library');
    }
  };

  const handleOpenProgressModal = (project: Project) => {
    setProgressModalProject(project);
  };

  const handleRetryPreparation = (project: Project) => {
    const reqs = ProposalDatabaseService.getProjectRequirements(project.id) || [];
    const torModel = ProposalDatabaseService.getProjectTorModel(project.id);
    ProposalPreparationService.startPreparation(project, reqs, torModel);
  };

  if (!currentUser) {
    return <LoginPage onLogin={(user) => setCurrentUser(user)} />;
  }

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];
  const activeProjectsCount = projects.filter((p) => p.status !== 'Approved' && p.status !== 'Rejected' && p.status !== 'Submitted').length;

  return (
    <>
      <AppLayout
        currentPath={currentPath}
        onNavigate={handleNavigate}
        activeProjectName={selectedProjectId ? selectedProject?.name : undefined}
        activeProjectsCount={activeProjectsCount}
        currentUser={currentUser}
        onLogout={() => setCurrentUser(null)}
        onQuickAnalyzeTor={() => setIsScratchOpen(true)}
        onGlobalUpload={handleGlobalUpload}
      >
        {currentPath === '/' && (
          <DashboardPage
            projects={projects}
            attentionItems={ATTENTION_ITEMS}
            onNavigate={handleNavigate}
            onNewProposal={() => setCurrentPath('/projects')}
            onQuickAnalyzeTor={() => setIsScratchOpen(true)}
            onRefreshProposals={loadDatabaseProposals}
            onClearProposals={handleClearProposals}
            onDeleteProposal={handleDeleteProject}
            onOpenProgressModal={handleOpenProgressModal}
          />
        )}

        {currentPath === '/projects' && (
          <ProjectsPage
            projects={projects}
            onSelectProject={handleSelectProject}
            onAddProject={handleAddProject}
            onClearProposals={handleClearProposals}
          />
        )}

        {currentPath.startsWith('/projects/') && selectedProject && (
          <ProjectWorkspace project={selectedProject} onNavigate={handleNavigate} />
        )}

        {currentPath === '/document-library' && <DocumentLibraryPage />}

        {currentPath === '/settings' && <SettingsPage />}
      </AppLayout>

      {/* Quick Analyze TOR Scratch Workspace Modal */}
      <ScratchWorkspaceModal
        isOpen={isScratchOpen}
        onClose={() => setIsScratchOpen(false)}
        onConvertToProject={(newProj) => {
          handleAddProject(newProj);
          setProgressModalProject(newProj);
        }}
        onOpenExistingProject={(projId) => {
          handleSelectProject(projId);
        }}
      />

      {/* Live Proposal Preparation Progress Modal */}
      <ProposalProgressModal
        isOpen={!!progressModalProject}
        project={progressModalProject}
        onClose={() => setProgressModalProject(null)}
        onOpenWorkspace={(proj) => {
          setProgressModalProject(null);
          handleSelectProject(proj.id);
        }}
        onRetry={handleRetryPreparation}
      />
    </>
  );
}

export default App;
