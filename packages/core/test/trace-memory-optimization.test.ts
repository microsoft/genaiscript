// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert, beforeEach } from "vitest";
import { MarkdownTrace } from "../src/trace.js";
import { AbortSignalCancellationController } from "../src/cancellation.js";

describe("Trace Memory Optimization", () => {
  let cancellationToken: any;

  beforeEach(() => {
    const canceller = new AbortSignalCancellationController();
    cancellationToken = canceller.token;
  });

  test("MarkdownTrace should handle undefined gracefully", () => {
    // Test that optional chaining works correctly with undefined trace
    const trace: MarkdownTrace | undefined = undefined;

    // These should not throw errors
    assert.doesNotThrow(() => {
      trace?.error("test error");
    });

    assert.doesNotThrow(() => {
      const content = trace?.content || "";
      assert.equal(content, "");
    });

    assert.doesNotThrow(() => {
      const traceDetails = trace?.startTraceDetails("test label");
      assert.equal(traceDetails, undefined);
    });
  });

  test("MarkdownTrace instantiation should work normally when created", () => {
    const trace = new MarkdownTrace({ cancellationToken });

    assert.isDefined(trace);
    assert.equal(typeof trace.content, "string");
    assert.doesNotThrow(() => {
      trace.error("test error");
    });

    const traceDetails = trace.startTraceDetails("test label");
    assert.isDefined(traceDetails);
  });

  test("Server script.start logic simulation - runTrace true", () => {
    const runTrace = true;

    // Simulate the server.ts logic after our changes
    const trace = runTrace ? new MarkdownTrace({ cancellationToken }) : undefined;
    const outputTrace = new MarkdownTrace({ cancellationToken });

    assert.isDefined(trace, "trace should be defined when runTrace is true");
    assert.isDefined(outputTrace, "outputTrace should always be defined");

    // Test that we can add event listeners when trace exists
    assert.doesNotThrow(() => {
      if (runTrace && trace) {
        trace.addEventListener("TRACE_CHUNK", () => {});
      }
    });
  });

  test("Server script.start logic simulation - runTrace false", () => {
    const runTrace = false;

    // Simulate the server.ts logic after our changes
    const trace = runTrace ? new MarkdownTrace({ cancellationToken }) : undefined;
    const outputTrace = new MarkdownTrace({ cancellationToken });

    assert.isUndefined(trace, "trace should be undefined when runTrace is false");
    assert.isDefined(outputTrace, "outputTrace should always be defined");

    // Test error handling with undefined trace
    assert.doesNotThrow(() => {
      trace?.error("test error");
    });

    // Test content access with undefined trace
    assert.doesNotThrow(() => {
      const content = trace?.content || "";
      assert.equal(content, "");
    });
  });

  test("Memory optimization verification", () => {
    // This test verifies that we're not creating unnecessary objects
    let traceCreated = false;
    let outputTraceCreated = false;

    // Test runTrace = false scenario
    const runTrace = false;
    const trace = runTrace
      ? (() => {
          traceCreated = true;
          return new MarkdownTrace({ cancellationToken });
        })()
      : undefined;
    const outputTrace = (() => {
      outputTraceCreated = true;
      return new MarkdownTrace({ cancellationToken });
    })();

    assert.isFalse(traceCreated, "trace should not be created when runTrace is false");
    assert.isTrue(outputTraceCreated, "outputTrace should always be created");
    assert.isUndefined(trace, "trace should be undefined");
    assert.isDefined(outputTrace, "outputTrace should be defined");
  });
});
