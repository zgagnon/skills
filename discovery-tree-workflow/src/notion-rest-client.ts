/**
 * Notion REST Client
 *
 * Real Notion API client implementation using official Notion SDK
 */

import { Client } from "@notionhq/client";
import type { NotionClient } from "./discovery-tree.js";

export const createNotionClient = (config: { token: string }): NotionClient => {
  const notion = new Client({ auth: config.token });

  return {
    pages: {
      retrieve: async (params: { page_id: string }) => {
        return await notion.pages.retrieve({ page_id: params.page_id });
      },
    },
    blocks: {
      children: {
        list: async (params: { block_id: string }) => {
          return await notion.blocks.children.list({ block_id: params.block_id });
        },
      },
    },
  };
};
