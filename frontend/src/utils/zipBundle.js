const textEncoder = new TextEncoder();

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let value = i;
    for (let j = 0; j < 8; j += 1) {
      value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
    }
    table[i] = value >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dateToDosParts(date = new Date()) {
  const year = Math.max(date.getFullYear(), 1980);
  const dosTime = ((date.getHours() & 0x1f) << 11)
    | ((date.getMinutes() & 0x3f) << 5)
    | ((Math.floor(date.getSeconds() / 2)) & 0x1f);
  const dosDate = (((year - 1980) & 0x7f) << 9)
    | (((date.getMonth() + 1) & 0x0f) << 5)
    | (date.getDate() & 0x1f);
  return { dosTime, dosDate };
}

function normalizeFilename(filename) {
  return filename.replace(/\\/g, '/');
}

async function readFileContent(file) {
  if (file.data instanceof Uint8Array) return file.data;
  if (typeof file.data === 'string') return textEncoder.encode(file.data);
  if (file.data instanceof ArrayBuffer) return new Uint8Array(file.data);
  if (file.data instanceof Blob) return new Uint8Array(await file.data.arrayBuffer());
  throw new Error(`Unsupported ZIP file content for ${file.name}`);
}

function writeUint16(view, offset, value) {
  view.setUint16(offset, value, true);
}

function writeUint32(view, offset, value) {
  view.setUint32(offset, value, true);
}

export async function createZipBlob(files) {
  const preparedFiles = await Promise.all(files.map(async (file) => {
    const content = await readFileContent(file);
    const name = normalizeFilename(file.name);
    const nameBytes = textEncoder.encode(name);
    const { dosTime, dosDate } = dateToDosParts(file.date || new Date());

    return {
      name,
      nameBytes,
      content,
      crc: crc32(content),
      dosTime,
      dosDate,
    };
  }));

  let localSize = 0;
  let centralSize = 0;
  preparedFiles.forEach((file) => {
    localSize += 30 + file.nameBytes.length + file.content.length;
    centralSize += 46 + file.nameBytes.length;
  });

  const endSize = 22;
  const output = new Uint8Array(localSize + centralSize + endSize);
  const view = new DataView(output.buffer);

  let offset = 0;
  const centralEntries = [];

  preparedFiles.forEach((file) => {
    const localHeaderOffset = offset;

    writeUint32(view, offset, 0x04034b50); offset += 4;
    writeUint16(view, offset, 20); offset += 2;
    writeUint16(view, offset, 0); offset += 2;
    writeUint16(view, offset, 0); offset += 2;
    writeUint16(view, offset, file.dosTime); offset += 2;
    writeUint16(view, offset, file.dosDate); offset += 2;
    writeUint32(view, offset, file.crc); offset += 4;
    writeUint32(view, offset, file.content.length); offset += 4;
    writeUint32(view, offset, file.content.length); offset += 4;
    writeUint16(view, offset, file.nameBytes.length); offset += 2;
    writeUint16(view, offset, 0); offset += 2;
    output.set(file.nameBytes, offset); offset += file.nameBytes.length;
    output.set(file.content, offset); offset += file.content.length;

    centralEntries.push({ ...file, localHeaderOffset });
  });

  const centralDirectoryOffset = offset;

  centralEntries.forEach((file) => {
    writeUint32(view, offset, 0x02014b50); offset += 4;
    writeUint16(view, offset, 20); offset += 2;
    writeUint16(view, offset, 20); offset += 2;
    writeUint16(view, offset, 0); offset += 2;
    writeUint16(view, offset, 0); offset += 2;
    writeUint16(view, offset, file.dosTime); offset += 2;
    writeUint16(view, offset, file.dosDate); offset += 2;
    writeUint32(view, offset, file.crc); offset += 4;
    writeUint32(view, offset, file.content.length); offset += 4;
    writeUint32(view, offset, file.content.length); offset += 4;
    writeUint16(view, offset, file.nameBytes.length); offset += 2;
    writeUint16(view, offset, 0); offset += 2;
    writeUint16(view, offset, 0); offset += 2;
    writeUint16(view, offset, 0); offset += 2;
    writeUint16(view, offset, 0); offset += 2;
    writeUint32(view, offset, 0); offset += 4;
    writeUint32(view, offset, file.localHeaderOffset); offset += 4;
    output.set(file.nameBytes, offset); offset += file.nameBytes.length;
  });

  const centralDirectorySize = offset - centralDirectoryOffset;

  writeUint32(view, offset, 0x06054b50); offset += 4;
  writeUint16(view, offset, 0); offset += 2;
  writeUint16(view, offset, 0); offset += 2;
  writeUint16(view, offset, centralEntries.length); offset += 2;
  writeUint16(view, offset, centralEntries.length); offset += 2;
  writeUint32(view, offset, centralDirectorySize); offset += 4;
  writeUint32(view, offset, centralDirectoryOffset); offset += 4;
  writeUint16(view, offset, 0); offset += 2;

  return new Blob([output], { type: 'application/zip' });
}
