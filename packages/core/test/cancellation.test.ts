// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert, beforeEach } from "vitest";
import {
  CancellationToken,
  AbortSignalCancellationToken,
  toSignal,
  AbortSignalCancellationController,
  checkCancelled,
} from "../src/cancellation.js";
import { CancelError } from "../src/error.js";

describe("CancellationToken", () => {
  test("should implement isCancellationRequested", () => {
    const token: CancellationToken = { isCancellationRequested: true };
    assert.strictEqual(token.isCancellationRequested, true);

    token.isCancellationRequested = false;
    assert.strictEqual(token.isCancellationRequested, false);
  });
});

describe("AbortSignalCancellationToken", () => {
  let controller: AbortController;
  let token: AbortSignalCancellationToken;

  beforeEach(() => {
    controller = new AbortController();
    token = new AbortSignalCancellationToken(controller.signal);
  });

  test("should initialize with an AbortSignal", () => {
    assert.ok(token);
  });

  test("should return false when signal is not aborted", () => {
    assert.strictEqual(token.isCancellationRequested, false);
  });

  test("should return true when signal is aborted", () => {
    controller.abort();
    assert.strictEqual(token.isCancellationRequested, true);
  });
});

describe("toSignal", () => {
  test("should return the signal if token is compatible", () => {
    const controller = new AbortController();
    const token = new AbortSignalCancellationToken(controller.signal);
    assert.strictEqual(toSignal(token), controller.signal);
  });

  test("should return undefined if token is not compatible", () => {
    const token: CancellationToken = { isCancellationRequested: false };
    assert.strictEqual(toSignal(token), undefined);
  });
});

describe("AbortSignalCancellationController", () => {
  let controller: AbortSignalCancellationController;

  beforeEach(() => {
    controller = new AbortSignalCancellationController();
  });

  test("should initialize with an AbortController and token", () => {
    assert.ok(controller.controller);
    assert.ok(controller.token);
    assert.strictEqual(controller.token.isCancellationRequested, false);
  });

  test("should abort the signal and set token isCancellationRequested to true", () => {
    controller.abort();
    assert.strictEqual(controller.token.isCancellationRequested, true);
  });

  test("should abort the signal with a reason", () => {
    const reason = "Operation cancelled";
    controller.abort(reason);
    assert.strictEqual(controller.token.isCancellationRequested, true);
  });
});

describe("checkCancelled", () => {
  test("should throw CancelError if cancellation is requested", () => {
    const token: CancellationToken = { isCancellationRequested: true };
    assert.throws(() => checkCancelled(token), CancelError);
  });

  test("should not throw if cancellation is not requested", () => {
    const token: CancellationToken = { isCancellationRequested: false };
    assert.doesNotThrow(() => checkCancelled(token));
  });
});
