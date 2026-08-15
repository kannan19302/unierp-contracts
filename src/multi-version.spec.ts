import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MultiVersionRouter } from "./multi-version.ts";
import type { SharedImplementation } from "./multi-version.ts";

describe("MultiVersionRouter", () => {
  it("Two API versions serve correctly from one implementation", async () => {
    // 1. Define the shared implementation
    const sharedImplementation: SharedImplementation<{ amount: number }, { status: string; processedAmount: number }> = {
      execute: async (input) => {
        return { status: "success", processedAmount: input.amount };
      },
    };

    const router = new MultiVersionRouter(sharedImplementation);

    // 2. Register v1 (amount is passed as string)
    router.register<{ amountStr: string }, { result: string; amountStr: string }>({
      version: "v1",
      mapInput: (ext) => ({ amount: parseFloat(ext.amountStr) }),
      mapOutput: (shared) => ({ result: shared.status, amountStr: shared.processedAmount.toString() }),
    });

    // 3. Register v2 (amount is passed as number)
    router.register<{ val: number }, { success: boolean; val: number }>({
      version: "v2",
      mapInput: (ext) => ({ amount: ext.val }),
      mapOutput: (shared) => ({ success: shared.status === "success", val: shared.processedAmount }),
    });

    // 4. Test v1
    const v1Result = await router.serve("v1", { amountStr: "123.45" });
    assert.deepEqual(v1Result, { result: "success", amountStr: "123.45" });

    // 5. Test v2
    const v2Result = await router.serve("v2", { val: 123.45 });
    assert.deepEqual(v2Result, { success: true, val: 123.45 });
  });

  it("throws when version is not supported", async () => {
    const sharedImplementation: SharedImplementation<any, any> = {
      execute: async () => ({}),
    };
    const router = new MultiVersionRouter(sharedImplementation);
    await assert.rejects(
      async () => await router.serve("v3", {}),
      /Unsupported API version: v3/
    );
  });
});
