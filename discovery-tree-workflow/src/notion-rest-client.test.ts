/**
 * Integration tests for Notion REST client
 *
 * Using incremental-tdd: ONE failing test → implement → pass → NEXT test
 *
 * These tests hit the real Notion API and require:
 * - NOTION_TOKEN environment variable
 * - NOTION_TEST_PAGE_ID environment variable
 */

import { describe, test, expect } from "bun:test";
import { createNotionClient } from "./notion-rest-client.js";

describe("createNotionClient", () => {
  describe("when token is provided", () => {
    test("creates client instance", () => {
      const client = createNotionClient({ token: "test-token" });

      expect(client).toBeDefined();
      expect(client.pages).toBeDefined();
      expect(client.blocks).toBeDefined();
    });
  });

  describe("when retrieving a real Notion page", () => {
    test("returns page with title property", async () => {
      const token = process.env.NOTION_TOKEN;
      const pageId = process.env.NOTION_TEST_PAGE_ID;

      if (!token || !pageId) {
        console.log("⏭️  Skipping: NOTION_TOKEN and NOTION_TEST_PAGE_ID required");
        return;
      }

      const client = createNotionClient({ token });
      const page = await client.pages.retrieve({ page_id: pageId });

      expect(page).toBeDefined();
      expect(page.id).toBe(pageId);
      expect(page.properties).toBeDefined();
    });

    test("returns page blocks with content", async () => {
      const token = process.env.NOTION_TOKEN;
      const pageId = process.env.NOTION_TEST_PAGE_ID;

      if (!token || !pageId) {
        console.log("⏭️  Skipping: NOTION_TOKEN and NOTION_TEST_PAGE_ID required");
        return;
      }

      const client = createNotionClient({ token });
      const blocks = await client.blocks.children.list({ block_id: pageId });

      expect(blocks).toBeDefined();
      expect(blocks.results).toBeDefined();
      expect(Array.isArray(blocks.results)).toBe(true);
    });
  });
});
