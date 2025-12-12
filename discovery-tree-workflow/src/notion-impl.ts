/**
 * Notion integration implementation
 *
 * Private implementation details for Notion API operations.
 * Public API is in discovery-tree.ts
 */

import type { NotionClient, GetNotionPageInput, NotionPage } from "./discovery-tree.js";

// Module-level state for dependency injection
let currentNotionClient: NotionClient | null = null;

/**
 * Set the Notion client (implementation)
 */
export const setNotionClientImpl = (client: NotionClient | null): void => {
  currentNotionClient = client;
};

/**
 * Get Notion page content (implementation)
 */
export const getNotionPageImpl = async (
  input: GetNotionPageInput
): Promise<NotionPage> => {
  if (!currentNotionClient) {
    throw new Error("Notion client not configured. Call setNotionClient() first.");
  }

  // Fetch page metadata (includes title)
  const pageData = await currentNotionClient.pages.retrieve({
    page_id: input.pageId,
  });

  // Extract title from properties
  const titleProperty = pageData.properties?.title;
  const title = titleProperty?.title?.[0]?.plain_text || "";

  // Fetch page content (blocks)
  const blocksData = await currentNotionClient.blocks.children.list({
    block_id: input.pageId,
  });

  // Extract plain text from all blocks
  const contentParts: string[] = [];
  for (const block of blocksData.results) {
    if (block.type === "paragraph") {
      const paragraphText =
        block.paragraph?.rich_text?.[0]?.plain_text || "";
      if (paragraphText) {
        contentParts.push(paragraphText);
      }
    }
  }

  const content = contentParts.join("\n");

  return {
    id: input.pageId,
    title,
    content,
  };
};
