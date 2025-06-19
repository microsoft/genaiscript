import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { resolveBufferLike, BufferToBlob } from "./bufferlike";
import fs from "fs/promises";
import { ReadableStream } from "node:stream/web";

describe("resolveBufferLike", () => {
  test("should resolve a string URL to a Buffer", async () => {
    const url = "data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==";
    const buffer = await resolveBufferLike(url);
    assert.strictEqual(buffer.toString(), "Hello, World!");
  });

  test("should resolve a Blob to a Buffer", async () => {
    const blob = new Blob(["Hello, World!"], { type: "text/plain" });
    const buffer = await resolveBufferLike(blob);
    assert.strictEqual(buffer.toString(), "Hello, World!");
  });

  test("should resolve a ReadableStream to a Buffer", async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("Hello, World!"));
        controller.close();
      },
    });
    const buffer = await resolveBufferLike(stream);
    assert.strictEqual(buffer.toString(), "Hello, World!");
  });

  test("should resolve an ArrayBuffer to a Buffer", async () => {
    const arrayBuffer = new TextEncoder().encode("Hello, World!").buffer;
    const buffer = await resolveBufferLike(arrayBuffer);
    assert.strictEqual(buffer.toString(), "Hello, World!");
  });

  test("should resolve a Uint8Array to a Buffer", async () => {
    const uint8Array = new TextEncoder().encode("Hello, World!");
    const buffer = await resolveBufferLike(uint8Array);
    assert.strictEqual(buffer.toString(), "Hello, World!");
  });
});

describe("BufferToBlob", () => {
  test("should create a Blob from a Buffer with default mime type", async () => {
    const buffer = Buffer.from("Hello, World!");
    const blob = await BufferToBlob(buffer);
    assert.strictEqual(blob.type, "application/octet-stream");
    const text = await blob.text();
    assert.strictEqual(text, "Hello, World!");
  });

  test("should create a Blob from a Buffer with provided mime type", async () => {
    const buffer = Buffer.from("Hello, World!");
    const mime = "text/plain";
    const blob = await BufferToBlob(buffer, mime);
    assert.strictEqual(blob.type, mime);
    const text = await blob.text();
    assert.strictEqual(text, "Hello, World!");
  });

  test("should create a Blob from a Uint8Array with default mime type", async () => {
    const uint8Array = new TextEncoder().encode("Hello, World!");
    const blob = await BufferToBlob(uint8Array);
    assert.strictEqual(blob.type, "application/octet-stream");
    const text = await blob.text();
    assert.strictEqual(text, "Hello, World!");
  });

  test("should create a Blob from a Uint8Array with provided mime type", async () => {
    const uint8Array = new TextEncoder().encode("Hello, World!");
    const mime = "text/plain";
    const blob = await BufferToBlob(uint8Array, mime);
    assert.strictEqual(blob.type, mime);
    const text = await blob.text();
    assert.strictEqual(text, "Hello, World!");
  });
});
