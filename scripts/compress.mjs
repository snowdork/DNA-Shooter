import { readdir, readFile, writeFile, stat, utimes } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

// Precompress at build time so the VPS can serve assets without per-request work.
async function compress(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await compress(path);
    else if (/\.(js|css|html|svg)$/.test(entry.name)) {
      const source = await readFile(path);
      const compressed = gzipSync(source, { level: 9 });
      if (compressed.length < source.length) {
        await writeFile(`${path}.gz`, compressed);
        const { atime, mtime } = await stat(path);
        await utimes(`${path}.gz`, atime, mtime);
      }
    }
  }
}
await compress('dist');
