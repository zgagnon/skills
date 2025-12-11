/**
 * MCP client for connecting to Shortcut server
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { ShortcutClient } from "./shortcut.js";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

export const createShortcutClient = async (): Promise<ShortcutClient> => {
  // Read MCP configuration to get Shortcut API token
  const configPath = path.join(os.homedir(), ".claude.json");
  const configContent = await fs.promises.readFile(configPath, "utf-8");
  const config = JSON.parse(configContent);

  const shortcutConfig = config.mcpServers?.shortcut;
  if (!shortcutConfig) {
    throw new Error("Shortcut MCP not configured in ~/.claude.json");
  }

  // Create MCP client
  const client = new Client(
    { name: "discovery-tree-shortcut-client", version: "1.0.0" },
    { capabilities: {} }
  );

  // Connect to Shortcut MCP server via stdio (using bunx, not npx)
  const transport = new StdioClientTransport({
    command: "bunx",
    args: ["--bun", "@shortcut/mcp@latest"],
    env: {
      ...process.env,
      ...shortcutConfig.env, // Include SHORTCUT_API_TOKEN from config
    },
  });

  await client.connect(transport);

  // Return ShortcutClient interface
  return {
    callTool: async (toolName: string, params: any) => {
      return await client.callTool({ name: toolName, arguments: params });
    },
  };
};
