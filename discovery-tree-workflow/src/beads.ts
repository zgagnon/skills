/**
 * beads TypeScript API
 *
 * Simple TypeScript wrapper around bd CLI commands.
 */

import {
  setWorkspaceImpl,
  createIssueImpl,
} from "./beads-impl.js";

/**
 * Type definitions
 */

export type IssueType = "bug" | "feature" | "task" | "epic" | "chore";
export type IssueStatus = "open" | "in_progress" | "blocked" | "closed";

export interface SetWorkspaceInput {
  workspacePath: string;
}

export interface WorkspaceStatus {
  workspacePath: string;
}

export interface CreateIssueInput {
  title: string;
  type?: IssueType;
  priority?: number;
  description?: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: number;
  issueType: IssueType;
  createdAt: string;
  updatedAt: string;
}

/**
 * Set the workspace context for beads operations
 *
 * Validates the workspace and checks for beads database.
 *
 * @param input - Workspace configuration
 * @returns Workspace status with paths
 */
export const setWorkspace = async (
  input: SetWorkspaceInput
): Promise<WorkspaceStatus> => {
  return setWorkspaceImpl(input);
};

/**
 * Create a new issue
 *
 * Creates a new issue (task, bug, feature, epic, or chore) with the specified details.
 *
 * @param input - Issue configuration with title, type, priority, description
 * @returns Created issue with ID and details
 */
export const createIssue = async (input: CreateIssueInput): Promise<Issue> => {
  return createIssueImpl(input);
};
