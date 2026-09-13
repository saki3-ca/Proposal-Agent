import React, { useState } from 'react';
import { ProjectList } from '../components/projects/ProjectList';
import { NewProposalWizard } from '../components/projects/NewProposalWizard';
import { Project } from '../types';

interface ProjectsPageProps {
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  onAddProject: (newProject: Project) => void;
  onClearProposals?: () => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  projects,
  onSelectProject,
  onAddProject,
  onClearProposals
}) => {
  const [showWizard, setShowWizard] = useState(false);

  if (showWizard) {
    return (
      <NewProposalWizard
        onComplete={(newProj) => {
          onAddProject(newProj);
          setShowWizard(false);
          onSelectProject(newProj.id);
        }}
        onCancel={() => setShowWizard(false)}
      />
    );
  }

  return (
    <ProjectList
      projects={projects}
      onSelectProject={onSelectProject}
      onNewProposal={() => setShowWizard(true)}
      onClearProposals={onClearProposals}
    />
  );
};
