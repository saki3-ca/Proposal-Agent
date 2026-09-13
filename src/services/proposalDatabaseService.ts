import { Project } from '../types';
import { INITIAL_PROJECTS } from './mockData';

const DB_KEY = 'acnabin_proposal_db_projects';

export class ProposalDatabaseService {
  /**
   * Calculates days remaining for a proposal deadline: Math.round((deadline - now) / 86400000)
   */
  static calculateDaysLeft(deadlineStr: string): number | undefined {
    if (!deadlineStr) return undefined;
    const deadlineDate = new Date(deadlineStr + 'T00:00:00');
    if (isNaN(deadlineDate.getTime())) return undefined;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.round((deadlineDate.getTime() - now.getTime()) / 86400000);
  }

  /**
   * Loads proposal projects directly from database / local persistence store.
   * Recalculates daysLeft for accuracy based on current date.
   */
  static async fetchProposals(): Promise<Project[]> {
    try {
      const stored = localStorage.getItem(DB_KEY);
      let projects: Project[] = stored ? JSON.parse(stored) : [];

      if (!stored) {
        localStorage.setItem(DB_KEY, JSON.stringify([]));
      }

      // Ensure daysLeft is dynamically fresh
      const updated = projects.map((p) => ({
        ...p,
        daysLeft: p.submissionDeadline ? ProposalDatabaseService.calculateDaysLeft(p.submissionDeadline) : p.daysLeft
      }));

      return updated;
    } catch (e) {
      console.error('Error fetching proposals from database:', e);
      return INITIAL_PROJECTS;
    }
  }

  /**
   * Saves or updates a project in the database.
   */
  static async saveProject(project: Project): Promise<Project[]> {
    try {
      const projects = await ProposalDatabaseService.fetchProposals();
      const existingIdx = projects.findIndex((p) => p.id === project.id);
      let newProjects: Project[];

      if (existingIdx >= 0) {
        newProjects = [...projects];
        newProjects[existingIdx] = {
          ...project,
          daysLeft: project.submissionDeadline ? ProposalDatabaseService.calculateDaysLeft(project.submissionDeadline) : project.daysLeft,
          updatedAt: new Date().toISOString()
        };
      } else {
        newProjects = [
          {
            ...project,
            daysLeft: project.submissionDeadline ? ProposalDatabaseService.calculateDaysLeft(project.submissionDeadline) : project.daysLeft,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          ...projects
        ];
      }

      localStorage.setItem(DB_KEY, JSON.stringify(newProjects));
      return newProjects;
    } catch (e) {
      console.error('Error saving project to database:', e);
      return INITIAL_PROJECTS;
    }
  }

  /**
   * Resets database back to default initial seed.
   */
  static resetDatabase(): Project[] {
    localStorage.setItem(DB_KEY, JSON.stringify([]));
    return [];
  }

  /**
   * Clears all proposals from database so user can start fresh.
   */
  static clearAllProposals(): Project[] {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify([]));
    } catch (e) {
      console.warn('Failed to clear proposals:', e);
    }
    return [];
  }

  /**
   * Save extracted requirements per project
   */
  static saveProjectRequirements(projectId: string, requirements: any[]): void {
    try {
      localStorage.setItem(`acnabin_project_requirements_${projectId}`, JSON.stringify(requirements));
    } catch (e) {
      console.warn(`Failed to save requirements for project ${projectId}:`, e);
    }
  }

  /**
   * Get extracted requirements per project
   */
  static getProjectRequirements(projectId: string): any[] {
    try {
      const raw = localStorage.getItem(`acnabin_project_requirements_${projectId}`);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn(`Failed to read requirements for project ${projectId}:`, e);
    }
    return [];
  }

  /**
   * Save TOR Knowledge Model per project
   */
  static saveProjectTorModel(projectId: string, torModel: any): void {
    try {
      localStorage.setItem(`acnabin_project_tor_model_${projectId}`, JSON.stringify(torModel));
    } catch (e) {
      console.warn(`Failed to save TOR model for project ${projectId}:`, e);
    }
  }

  /**
   * Get TOR Knowledge Model per project
   */
  static getProjectTorModel(projectId: string): any | null {
    try {
      const raw = localStorage.getItem(`acnabin_project_tor_model_${projectId}`);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn(`Failed to read TOR model for project ${projectId}:`, e);
    }
    return null;
  }

  /**
   * Save Canonical TOR Source (MarkItDown markdown, quality, metadata) per project
   */
  static saveProjectTorSource(
    projectId: string,
    torSource: {
      fileName: string;
      originalSize?: number;
      markdownContent: string;
      rawMarkdown?: string;
      quality?: any;
      extractedAt: string;
      version?: string;
    }
  ): void {
    try {
      localStorage.setItem(`acnabin_project_tor_source_${projectId}`, JSON.stringify(torSource));
    } catch (e) {
      console.warn(`Failed to save TOR source for project ${projectId}:`, e);
    }
  }

  /**
   * Get Canonical TOR Source per project
   */
  static getProjectTorSource(projectId: string): any | null {
    try {
      const raw = localStorage.getItem(`acnabin_project_tor_source_${projectId}`);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn(`Failed to read TOR source for project ${projectId}:`, e);
    }
    return null;
  }

  /**
   * Save latest standalone Quick TOR Analysis
   */
  static saveQuickTorAnalysis(analysis: any): void {
    try {
      localStorage.setItem('acnabin_quick_tor_analysis_latest', JSON.stringify(analysis));
    } catch (e) {
      console.warn('Failed to save quick TOR analysis:', e);
    }
  }

  /**
   * Get latest standalone Quick TOR Analysis
   */
  static getLatestQuickTorAnalysis(): any | null {
    try {
      const raw = localStorage.getItem('acnabin_quick_tor_analysis_latest');
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to get latest quick TOR analysis:', e);
    }
    return null;
  }

  /**
   * Save project documents
   */
  static saveProjectDocuments(projectId: string, documents: any[]): void {
    try {
      localStorage.setItem(`acnabin_project_documents_${projectId}`, JSON.stringify(documents));
    } catch (e) {
      console.warn(`Failed to save documents for project ${projectId}:`, e);
    }
  }

  /**
   * Get project documents
   */
  static getProjectDocuments(projectId: string): any[] {
    try {
      const raw = localStorage.getItem(`acnabin_project_documents_${projectId}`);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn(`Failed to read documents for project ${projectId}:`, e);
    }
    return [];
  }
}

