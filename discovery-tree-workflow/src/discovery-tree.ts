/**
 * Discovery Tree TypeScript API
 *
 * Unified entry point for database operations, Shortcut integration, and jj bookmark helpers.
 * This file contains the complete API surface - types, documentation, and function signatures.
 * Agents can read this ONE file and have ALL information needed to use the API.
 */

// Import implementations
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
  addDependencyImpl,
  appendNotesImpl,
} from "./beads-impl.js";

import { setShortcutClientImpl, getShortcutStoryImpl } from "./shortcut-impl.js";
import * as jj from '../../using-jj/src/jj.js';

/**
 * ============================================================================
 * DATABASE API - Type Definitions
 * ============================================================================
 */

export type TaskType = "bug" | "feature" | "task" | "epic" | "chore";
export type TaskStatus = "open" | "in_progress" | "blocked" | "closed";
export type DependencyType = "parent-child" | "blocks" | "related" | "discovered-from";

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

export interface AddDependencyInput {
  taskId: string;
  dependsOnId: string;
  type: DependencyType;
}

export interface AppendNotesInput {
  taskId: string;
  notes: string;
}

/**
 * ============================================================================
 * DATABASE API - Functions
 * ============================================================================
 */

/**
 * Set the workspace context for database operations
 *
 * Validates the workspace and checks for database.
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
 * Marks a task as closed (completed) in the database.
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

/**
 * Add a dependency between tasks
 *
 * Creates a dependency link between two tasks with specified type
 * (parent-child, blocks, related, discovered-from).
 *
 * @param input - Task IDs and dependency type
 * @returns void
 */
export const addDependency = async (input: AddDependencyInput): Promise<void> => {
  return addDependencyImpl(input);
};

/**
 * Append notes to a task
 *
 * Adds notes to task without reading current value first.
 * Useful to avoid race conditions.
 *
 * @param input - Task ID and notes to append
 * @returns void
 */
export const appendNotes = async (input: AppendNotesInput): Promise<void> => {
  return appendNotesImpl(input);
};

/**
 * ============================================================================
 * SHORTCUT INTEGRATION - Type Definitions
 * ============================================================================
 */

export interface ShortcutStory {
  id: number;
  name: string;
  description: string;
  app_url: string;
  branch_name: string;
  state?: string;
  story_type?: string;
  [key: string]: any; // Allow other fields
}

export interface ShortcutClient {
  callTool(toolName: string, params: any): Promise<any>;
}

/**
 * ============================================================================
 * SHORTCUT INTEGRATION - Functions
 * ============================================================================
 */

/**
 * Set the Shortcut MCP client (for dependency injection)
 *
 * @param mcpClient - MCP client instance to use for Shortcut operations
 */
export const setShortcutClient = (mcpClient: ShortcutClient): void => {
  return setShortcutClientImpl(mcpClient);
};

/**
 * Get Shortcut story details with branch name
 *
 * Fetches story data from Shortcut and includes the git branch name.
 * Returns structured data that can be used for creating tasks, bookmarks, or reports.
 *
 * @param storyId - Shortcut story public ID
 * @returns Story details including branch name
 * @throws Error if client not configured or MCP returns invalid data
 *
 * @example
 * ```typescript
 * const story = await getShortcutStory(93114);
 * console.log(story.name); // "Add feature X"
 * console.log(story.branch_name); // "add-feature-x/sc-93114"
 * ```
 */
export const getShortcutStory = async (storyId: number): Promise<ShortcutStory> => {
  return getShortcutStoryImpl(storyId);
};

/**
 * ============================================================================
 * JJ BOOKMARK HELPER - Type Definitions
 * ============================================================================
 */

export interface CreateJjBookmarkInput {
  branchName: string;
  repositoryPath: string;
  description?: string;
}

/**
 * ============================================================================
 * JJ BOOKMARK HELPER - Functions
 * ============================================================================
 */

/**
 * Create a jj bookmark with a branch name
 *
 * Sets the jj repository, creates a bookmark at the current revision,
 * and optionally describes the current change.
 *
 * @param input - Configuration with branch name, repository path, and optional description
 * @returns void
 * @throws Error if jj operation fails
 *
 * @example
 * ```typescript
 * await createJjBookmark({
 *   branchName: 'feature/sc-12345',
 *   repositoryPath: '/path/to/repo',
 *   description: 'Working on feature X'
 * });
 * ```
 */
export const createJjBookmark = async (
  input: CreateJjBookmarkInput
): Promise<void> => {
  // Set repository
  await jj.setRepository({ repositoryPath: input.repositoryPath });

  // Create bookmark
  await jj.createBookmark({ name: input.branchName });

  // Optionally describe the change
  if (input.description) {
    await jj.describe({ description: input.description });
  }
};
