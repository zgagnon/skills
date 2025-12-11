/**
 * Tests for Shortcut REST API client
 */

import { describe, test, expect } from "bun:test";
import { createShortcutRestClient } from "./shortcut-rest-client.js";

describe("createShortcutRestClient", () => {
  describe("when calling with API token", () => {
    test("returns client with callTool method", async () => {
      // WHEN: Create client with token from config
      const client = await createShortcutRestClient();

      // THEN: Should have callTool method
      expect(client).toBeDefined();
      expect(typeof client.callTool).toBe("function");
    });
  });
});
