import sharp from 'sharp';
import { resolve } from 'node:path';
const sources = ['title-forest', 'board-forest', 'halloween-atlas-v2'];
for (const name of sources) {
  const source = resolve('art/source', `${name}.png`);
  const target = resolve('public/assets', `${name}.webp`);
  // Format conversion only: preserve dimensions and the generated alpha channel.
  await sharp(source)
    .webp({ quality: name.includes('atlas') ? 90 : 88 })
    .toFile(target);
  console.log(`${name}.webp`);
}
