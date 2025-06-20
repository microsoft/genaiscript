import { test, describe, expect } from "vitest";
import { run } from "../src/api.js";

describe("api", async () => {
  await test("poem", async () => {
    const res = await run("poem");
    console.log(res);
    expect(res).toBeDefined();
  });
});
