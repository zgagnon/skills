/**
 * beads TypeScript API
 *
 * Simple TypeScript wrapper around bd CLI commands.
 */

import {
  setWorkspaceImpl,
  createTaskImpl,
  getDependencyTreeImpl,
  drawTreeImpl,
  closeTaskImpl,
  getEpicStatusImpl,
  findReadyTasksImpl,
  updateTaskImpl,
  showTaskImpl,
} from "./beads-impl.js";

/**
 * Type definitions
 */

export type TaskType = "bug" | "feature" | "task" | "epic" | "chore";
export type TaskStatus = "open" | "in_progress" | "blocked" | "closed";

export interface SetWorkspaceInput {
  workspacePath: string;
}

export interface WorkspaceStatus {
  workspacePath: string;
}

export interface CreateTaskInput {
  title: string;
  type?: TaskType;
  priority?: number;
  description?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: number;
  taskType: TaskType;
  createdAt: string;
  updatedAt: string;
}

export interface GetDependencyTreeInput {
  taskId: string;
}

export interface DrawTreeInput {
  taskId: string;
}

export interface CloseTaskInput {
  taskId: string;
  reason?: string;
}

export interface EpicStatusInput {
  epicId: string;
}

export interface EpicStatus {
  epicId: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  openTasks: number;
  completionPercentage: number;
}

export interface FindReadyTasksInput {
  limit?: number;
}

export interface UpdateTaskInput {
  taskId: string;
  status?: TaskStatus;
  notes?: string;
  description?: string;
  title?: string;
}

export interface ShowTaskInput {
  taskId: string;
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
 * Create a new task
 *
 * Creates a new task (task, bug, feature, epic, or chore) with the specified details.
 *
 * @param input - Task configuration with title, type, priority, description
 * @returns Created task with ID and details
 */
export const createTask = async (input: CreateTaskInput): Promise<Task> => {
  return createTaskImpl(input);
};

/**
 * Get dependency tree for a task
 *
 * Returns bottom-up view: task → parent → grandparent → root
 *
 * @param input - Task ID to get tree for
 * @returns Array of tasks from current to root
 */
export const getDependencyTree = async (input: GetDependencyTreeInput): Promise<Task[]> => {
  return getDependencyTreeImpl(input);
};

/**
 * Draw a visual tree representation
 *
 * Returns top-down view: epic → children → grandchildren, formatted with tree characters (⎿)
 * and indenting for hierarchy levels.
 *
 * IMPORTANT: Display the returned string to the user so they can see the tree visualization.
 *
 * @param input - Task ID to draw tree for
 * @returns Formatted string with tree visualization - display this output to the user
 *
 * @example
 * const tree = await drawTree({ taskId: 'epic-123' });
 * console.log(tree);
 * // Output:
 * // Epic Title
 * // ⎿ Child Task 1
 * // ⎿ Child Task 2
 * //   ⎿ Grandchild Task
 */
export const drawTree = async (input: DrawTreeInput): Promise<string> => {
  return drawTreeImpl(input);
};

/**
 * Close a task
 *
 * Marks a task as closed (completed) in the beads database.
 *
 * @param input - Task ID and optional reason for closing
 * @returns void
 */
export const closeTask = async (input: CloseTaskInput): Promise<void> => {
  return closeTaskImpl(input);
};

/**
 * Get epic status and completion progress
 *
 * Recursively counts all descendant tasks and calculates completion statistics.
 *
 * @param input - Epic ID to get status for
 * @returns Epic status with task counts and completion percentage
 */
export const getEpicStatus = async (input: EpicStatusInput): Promise<EpicStatus> => {
  return getEpicStatusImpl(input);
};

/**
 * Find ready tasks with no blockers
 *
 * Returns tasks that have no blocking dependencies and are ready to work on.
 *
 * @param input - Optional filter options (limit)
 * @returns Array of ready tasks
 */
export const findReadyTasks = async (input: FindReadyTasksInput): Promise<Task[]> => {
  return findReadyTasksImpl(input);
};

/**
 * Update a task's properties
 *
 * Updates task status, notes, description, or title.
 *
 * @param input - Task ID and fields to update
 * @returns void
 */
export const updateTask = async (input: UpdateTaskInput): Promise<void> => {
  return updateTaskImpl(input);
};

/**
 * Show full task details
 *
 * Returns complete information about a task including dependencies and dependents.
 *
 * @param input - Task ID to show
 * @returns Task with full details
 */
export const showTask = async (input: ShowTaskInput): Promise<Task> => {
  return showTaskImpl(input);
};
