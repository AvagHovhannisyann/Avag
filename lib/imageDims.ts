// Minimal PNG/JPEG dimension reader so exports can embed images at the right
// aspect ratio without pulling in an image-processing dependency.

export interface Dims {
  width: number;
  height: number;
}

export function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; mime: string } {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.*)$/);
  if (!match) throw new Error("Invalid image data URL");
  return { buffer: Buffer.from(match[2], "base64"), mime: match[1] };
}

export function readImageDimensions(buffer: Buffer): Dims | null {
  // PNG: fixed IHDR chunk at bytes 16-24.
  if (
    buffer.length > 24 &&
    buffer.readUInt32BE(0) === 0x89504e47 &&
    buffer.readUInt32BE(4) === 0x0d0a1a0a
  ) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }

  // JPEG: scan markers for a Start-Of-Frame segment.
  if (buffer.length > 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset < buffer.length - 8) {
      if (buffer[offset] !== 0xff) {
        offset++;
        continue;
      }
      const marker = buffer[offset + 1];
      const isSOF =
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc;
      const segmentLength = buffer.readUInt16BE(offset + 2);
      if (isSOF) {
        const height = buffer.readUInt16BE(offset + 5);
        const width = buffer.readUInt16BE(offset + 7);
        return { width, height };
      }
      offset += 2 + segmentLength;
    }
  }

  return null;
}

// Returns a display size (in px) capped to maxWidth, preserving aspect ratio.
export function fitWithin(dims: Dims | null, maxWidth: number, maxHeight: number): Dims {
  if (!dims || !dims.width || !dims.height) return { width: maxWidth, height: Math.round(maxWidth * 0.75) };
  const scale = Math.min(maxWidth / dims.width, maxHeight / dims.height, 1);
  return { width: Math.round(dims.width * scale), height: Math.round(dims.height * scale) };
}
