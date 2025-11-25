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

const getStatusEmoji = (status: string): string => {
  switch (status) {
    case "closed":
      return "✓";
    case "in_progress":
      return "⚙";
    case "blocked":
      return "⛔";
    case "open":
    default:
      return "○";
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

  // Get status emoji and prepend to title
  const emoji = getStatusEmoji(taskData.status);
  let output = `${emoji} ${taskData.title}`;

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

export const closeTaskImpl = async (input: { taskId: string; reason?: string }): Promise<void> => {
  if (!currentWorkspacePath) {
    throw new Error("No workspace set - call setWorkspace first");
  }

  try {
    // Call bd update with status closed
    if (input.reason) {
      await $`cd ${currentWorkspacePath} && bd update ${input.taskId} --status closed --notes ${input.reason}`.quiet();
    } else {
      await $`cd ${currentWorkspacePath} && bd update ${input.taskId} --status closed`.quiet();
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to close task: ${errorMsg}`);
  }
};

export const findReadyTasksImpl = async (input: { limit?: number }): Promise<any[]> => {
  if (!currentWorkspacePath) {
    throw new Error("No workspace set - call setWorkspace first");
  }

  try {
    // Call bd ready with optional limit
    let result;
    if (input.limit) {
      result = await $`cd ${currentWorkspacePath} && bd ready --limit ${input.limit} --json`.text();
    } else {
      result = await $`cd ${currentWorkspacePath} && bd ready --json`.text();
    }

    // Parse JSON output - bd ready returns array of tasks
    const tasks = JSON.parse(result);

    // Map to Task interface
    return tasks.map((taskData: any) => ({
      id: taskData.id,
      title: taskData.title,
      description: taskData.description || "",
      status: taskData.status,
      priority: taskData.priority,
      taskType: taskData.issue_type,
      createdAt: taskData.created_at,
      updatedAt: taskData.updated_at,
    }));
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to find ready tasks: ${errorMsg}`);
  }
};

export const getEpicStatusImpl = async (input: { epicId: string }): Promise<any> => {
  if (!currentWorkspacePath) {
    throw new Error("No workspace set - call setWorkspace first");
  }

  try {
    // Get epic details
    const result = await $`cd ${currentWorkspacePath} && bd show ${input.epicId} --json`.text();
    const taskArray = JSON.parse(result);
    const epicData = taskArray[0];

    // Initialize counters
    let totalTasks = 0;
    let completedTasks = 0;
    let inProgressTasks = 0;
    let blockedTasks = 0;
    let openTasks = 0;

    // Count children by status
    if (epicData.dependents && epicData.dependents.length > 0) {
      for (const dep of epicData.dependents) {
        // Only count parent-child relationships
        if (dep.dependency_type === "parent-child") {
          totalTasks++;

          switch (dep.status) {
            case "closed":
              completedTasks++;
              break;
            case "in_progress":
              inProgressTasks++;
              break;
            case "blocked":
              blockedTasks++;
              break;
            case "open":
              openTasks++;
              break;
          }
        }
      }
    }

    // Calculate completion percentage
    const completionPercentage = totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

    return {
      epicId: input.epicId,
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      openTasks,
      completionPercentage,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get epic status: ${errorMsg}`);
  }
};
