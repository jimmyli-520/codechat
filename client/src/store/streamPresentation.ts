export const streamFrameDelayMs = 20;

export function takeNextStreamFrame(buffer: string) {
  let frameSize = Math.min(96, Math.max(8, Math.ceil(buffer.length / 20)));
  const lastCodeUnit = buffer.charCodeAt(frameSize - 1);

  if (lastCodeUnit >= 0xd800 && lastCodeUnit <= 0xdbff) {
    frameSize += 1;
  }

  return {
    content: buffer.slice(0, frameSize),
    remaining: buffer.slice(frameSize)
  };
}

export function isNearScrollBottom({
  clientHeight,
  scrollHeight,
  scrollTop
}: {
  clientHeight: number;
  scrollHeight: number;
  scrollTop: number;
}) {
  return scrollHeight - scrollTop - clientHeight <= 80;
}
