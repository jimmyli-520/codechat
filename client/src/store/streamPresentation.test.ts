import assert from "node:assert/strict";
import test from "node:test";
import {
  isNearScrollBottom,
  takeNextStreamFrame
} from "./streamPresentation.js";

test("breaks bursty stream content into bounded visual frames without losing text", () => {
  const original = "CodeChat ".repeat(300);
  const frames: string[] = [];
  let remaining = original;

  while (remaining) {
    const nextFrame = takeNextStreamFrame(remaining);
    frames.push(nextFrame.content);
    remaining = nextFrame.remaining;
  }

  assert.equal(frames.join(""), original);
  assert.ok(frames.length > 1);
  assert.ok(frames.every((frame) => frame.length <= 96));
});

test("uses small visual frames for normal token-sized content", () => {
  const frame = takeNextStreamFrame("A concise streamed response.");

  assert.equal(frame.content.length, 8);
  assert.equal(frame.content + frame.remaining, "A concise streamed response.");
});

test("never splits a Unicode character across visual frames", () => {
  const frame = takeNextStreamFrame("1234567🤖 continues");

  assert.equal(frame.content, "1234567🤖");
  assert.equal(frame.content + frame.remaining, "1234567🤖 continues");
});

test("follows streaming only while the viewport is near the bottom", () => {
  assert.equal(
    isNearScrollBottom({ clientHeight: 400, scrollHeight: 1000, scrollTop: 530 }),
    true
  );
  assert.equal(
    isNearScrollBottom({ clientHeight: 400, scrollHeight: 1000, scrollTop: 300 }),
    false
  );
  assert.equal(
    isNearScrollBottom({ clientHeight: 400, scrollHeight: 1000, scrollTop: 600 }),
    true
  );
});
