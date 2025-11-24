/**
 * Private implementation details for beads API
 */

import { $ } from "bun";

import type {
  SetWorkspaceInput,
  WorkspaceStatus,
  CreateTaskInput,
  Task,
  GetDependencyTreeInput,
} from "./beads.js";

// Module-level state
let currentWorkspacePath: string | null = null;

export const setWorkspaceImpl = async (
  input: SetWorkspaceInput
): Promise<WorkspaceStatus> => {
  currentWorkspacePath = input.workspacePath;
  return { workspacePath: input.workspacePath };
};

export const createTaskImpl = async (input: CreateTaskInput): Promise<Task> => {
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
    const taskData = JSON.parse(result);

    return {
      id: taskData.id,
      title: taskData.title,
      description: taskData.description || "",
      status: taskData.status,
      priority: taskData.priority,
      taskType: taskData.issue_type,
      createdAt: taskData.created_at,
      updatedAt: taskData.updated_at,
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

export const getDependencyTreeImpl = async (input: GetDependencyTreeInput): Promise<Task[]> => {
  if (!currentWorkspacePath) {
    throw new Error("No workspace set - call setWorkspace first");
  }

  try {
    // Get task details using bd show (returns array with dependencies)
    const result = await $`cd ${currentWorkspacePath} && bd show ${input.taskId} --json`.text();
    const taskArray = JSON.parse(result);
    const taskData = taskArray[0]; // bd show returns array

    // Build tree: start with current task
    const tree: Task[] = [{
      id: taskData.id,
      title: taskData.title,
      description: taskData.description || "",
      status: taskData.status,
      priority: taskData.priority,
      taskType: taskData.issue_type,
      createdAt: taskData.created_at,
      updatedAt: taskData.updated_at,
    }];

    // Follow parent-child dependencies up the tree
    if (taskData.dependencies && taskData.dependencies.length > 0) {
      for (const dep of taskData.dependencies) {
        // Only follow parent-child relationships for bottom-up view
        if (dep.dependency_type === "parent-child") {
          tree.push({
            id: dep.id,
            title: dep.title,
            description: dep.description || "",
            status: dep.status,
            priority: dep.priority,
            taskType: dep.issue_type,
            createdAt: dep.created_at,
            updatedAt: dep.updated_at,
          });
        }
      }
    }

    return tree;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get dependency tree: ${errorMsg}`);
  }
};

const drawTreeRecursive = async (
  taskId: string,
  indent: string = ""
): Promise<string> => {
  // Get task details using bd show
  const result = await $`cd ${currentWorkspacePath} && bd show ${taskId} --json`.text();
  const taskArray = JSON.parse(result);
  const taskData = taskArray[0];

  // Start with current task title
  let output = taskData.title;

  // Check for children (dependents with parent-child relationship)
  if (taskData.dependents && taskData.dependents.length > 0) {
    const children = taskData.dependents.filter(
      (dep: any) => dep.dependency_type === "parent-child"
    );

    for (const child of children) {
      // Recursively draw each child with increased indentation
      const childTree = await drawTreeRecursive(child.id, indent + "  ");
      output += `\n${indent}⎿ ${childTree}`;
    }
  }

  return output;
};

export const drawTreeImpl = async (input: { taskId: string }): Promise<string> => {
  if (!currentWorkspacePath) {
    throw new Error("No workspace set - call setWorkspace first");
  }

  try {
    const tree = await drawTreeRecursive(input.taskId);
    return `[AGENT: Display this complete tree to the user in your response]\n\n${tree}`;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to draw tree: ${errorMsg}`);
  }
};
