/**
 * Private implementation details for beads API
 */

import { $ } from "bun";

import type {
  SetWorkspaceInput,
  WorkspaceStatus,
  CreateIssueInput,
  Issue,
} from "./beads.js";

// Module-level state
let currentWorkspacePath: string | null = null;

export const setWorkspaceImpl = async (
  input: SetWorkspaceInput
): Promise<WorkspaceStatus> => {
  currentWorkspacePath = input.workspacePath;
  return { workspacePath: input.workspacePath };
};

export const createIssueImpl = async (input: CreateIssueInput): Promise<Issue> => {
  if (!currentWorkspacePath) {
    throw new Error("No workspace set - call setWorkspace first");
  }

  // Build bd create command
  const title = input.title;
  const type = input.type || "task";
  const priority = input.priority ?? 2;

  try {
    // Run bd create with --json flag and timeout to detect hanging
    const result = await $`cd ${currentWorkspacePath} && timeout 3 bd create ${title} -t ${type} -p ${priority} --json`.text();

    // Parse JSON output from bd
    const issueData = JSON.parse(result);

    return {
      id: issueData.id,
      title: issueData.title,
      description: issueData.description || "",
      status: issueData.status,
      priority: issueData.priority,
      issueType: issueData.issue_type,
      createdAt: issueData.created_at,
      updatedAt: issueData.updated_at,
    };
  } catch (error) {
    // Detect timeout or other errors and provide helpful message
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes("exit code 124") || errorMsg.includes("timed out")) {
      throw new Error("BD operation timed out - workspace may not be a git repository");
    }
    throw error;
  }
};
