import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const repoRoot = process.cwd();

function markSvg({ size = 512, rounded = true, padding = 0 } = {}) {
	const corner = rounded ? Math.round(size * 0.18) : 0;
	const pad = Math.round(size * padding);
	const inner = size - pad * 2;

	const leftX = pad + Math.round(inner * 0.30);
	const rightX = pad + Math.round(inner * 0.57);
	const barY = pad + Math.round(inner * 0.46);
	const topY = pad + Math.round(inner * 0.25);
	const bottomY = pad + Math.round(inner * 0.78);
	const stroke = Math.max(24, Math.round(inner * 0.09));
	const barH = stroke;

	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2563eb"/>
      <stop offset="1" stop-color="#4f46e5"/>
    </linearGradient>
    <radialGradient id="glow" cx="35%" cy="25%" r="75%">
      <stop offset="0" stop-color="#93c5fd" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#93c5fd" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect x="0" y="0" width="${size}" height="${size}" rx="${corner}" fill="url(#bg)"/>
  <rect x="0" y="0" width="${size}" height="${size}" rx="${corner}" fill="url(#glow)"/>

  <g fill="#ffffff">
    <rect x="${leftX}" y="${topY}" width="${stroke}" height="${bottomY - topY}" rx="${Math.round(stroke * 0.35)}"/>
    <rect x="${rightX}" y="${topY}" width="${stroke}" height="${bottomY - topY}" rx="${Math.round(stroke * 0.35)}"/>
    <rect x="${leftX}" y="${barY}" width="${rightX - leftX + stroke}" height="${barH}" rx="${Math.round(barH * 0.35)}"/>
  </g>
</svg>`;
}

function ogSvg({ width = 1200, height = 630 } = {}) {
	const title = 'Hostel Management System';
	const subtitle = 'Operations • Billing • Attendance • Requests';
	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0b1020"/>
      <stop offset="1" stop-color="#111827"/>
    </linearGradient>
    <linearGradient id="chip" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2563eb"/>
      <stop offset="1" stop-color="#4f46e5"/>
    </linearGradient>
    <radialGradient id="glow" cx="30%" cy="20%" r="80%">
      <stop offset="0" stop-color="#60a5fa" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#60a5fa" stop-opacity="0"/>
    </radialGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="18" />
    </filter>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect width="${width}" height="${height}" fill="url(#glow)"/>

  <circle cx="${Math.round(width * 0.12)}" cy="${Math.round(height * 0.22)}" r="220" fill="#2563eb" opacity="0.18" filter="url(#soft)"/>
  <circle cx="${Math.round(width * 0.92)}" cy="${Math.round(height * 0.84)}" r="280" fill="#4f46e5" opacity="0.18" filter="url(#soft)"/>

  <g transform="translate(92 140)">
    <rect x="0" y="0" width="132" height="132" rx="30" fill="url(#chip)"/>
    <g transform="translate(0 0)">
      <svg x="0" y="0" width="132" height="132" viewBox="0 0 512 512">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#2563eb"/>
            <stop offset="1" stop-color="#4f46e5"/>
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="92" fill="none"/>
        <g fill="#ffffff">
          <rect x="178" y="132" width="54" height="268" rx="18"/>
          <rect x="280" y="132" width="54" height="268" rx="18"/>
          <rect x="178" y="238" width="156" height="54" rx="18"/>
        </g>
      </svg>
    </g>
  </g>

  <g fill="#e5e7eb" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" letter-spacing="-0.02em">
    <text x="260" y="214" font-size="62" font-weight="800">${title}</text>
    <text x="260" y="270" font-size="28" opacity="0.9">${subtitle}</text>
  </g>
</svg>`;
}

async function writePngFromSvg(svg, outPath, { width, height } = {}) {
	const img = sharp(Buffer.from(svg));
	const pipeline = width || height ? img.resize(width, height) : img;
	await pipeline.png({ compressionLevel: 9 }).toFile(outPath);
}

function buildIco(pngImages) {
	// PNG-compressed ICO: https://en.wikipedia.org/wiki/ICO_(file_format)
	const count = pngImages.length;
	const headerSize = 6;
	const entrySize = 16;
	const entriesSize = entrySize * count;
	const dataOffsetBase = headerSize + entriesSize;
	const totalSize = dataOffsetBase + pngImages.reduce((sum, i) => sum + i.data.length, 0);
	const out = Buffer.alloc(totalSize);

	out.writeUInt16LE(0, 0); // reserved
	out.writeUInt16LE(1, 2); // type (1 = icon)
	out.writeUInt16LE(count, 4); // image count

	let offset = dataOffsetBase;
	for (let i = 0; i < count; i++) {
		const { size, data } = pngImages[i];
		const entryPos = headerSize + entrySize * i;
		out.writeUInt8(size === 256 ? 0 : size, entryPos + 0); // width
		out.writeUInt8(size === 256 ? 0 : size, entryPos + 1); // height
		out.writeUInt8(0, entryPos + 2); // palette
		out.writeUInt8(0, entryPos + 3); // reserved
		out.writeUInt16LE(1, entryPos + 4); // color planes
		out.writeUInt16LE(32, entryPos + 6); // bit count
		out.writeUInt32LE(data.length, entryPos + 8); // bytes in resource
		out.writeUInt32LE(offset, entryPos + 12); // data offset
		data.copy(out, offset);
		offset += data.length;
	}

	return out;
}

async function main() {
	const outPublicIcons = path.join(repoRoot, 'public', 'icons');
	const outPublicBrand = path.join(repoRoot, 'public', 'brand');
	const outApp = path.join(repoRoot, 'src', 'app');

	await fs.mkdir(outPublicIcons, { recursive: true });
	await fs.mkdir(outPublicBrand, { recursive: true });

	const svgRounded512 = markSvg({ size: 512, rounded: true });
	const svgMaskable512 = markSvg({ size: 512, rounded: false, padding: 0.12 });

	// Public brand (SVG)
	await fs.writeFile(path.join(outPublicBrand, 'mark.svg'), svgRounded512, 'utf8');

	const wordmarkSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="980" height="220" viewBox="0 0 980 220">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2563eb"/>
      <stop offset="1" stop-color="#4f46e5"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="180" height="180" rx="42" fill="url(#bg)"/>
  <g transform="translate(0 0)">
    <svg x="0" y="0" width="180" height="180" viewBox="0 0 512 512">
      <g fill="#ffffff">
        <rect x="178" y="132" width="54" height="268" rx="18"/>
        <rect x="280" y="132" width="54" height="268" rx="18"/>
        <rect x="178" y="238" width="156" height="54" rx="18"/>
      </g>
    </svg>
  </g>
  <g font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" fill="#0b1020">
    <text x="220" y="104" font-size="54" font-weight="800" letter-spacing="-0.02em">Hostel Management</text>
    <text x="220" y="158" font-size="40" font-weight="700" opacity="0.85" letter-spacing="-0.02em">System</text>
  </g>
</svg>`;
	await fs.writeFile(path.join(outPublicBrand, 'wordmark.svg'), wordmarkSvg, 'utf8');

	// Next app special files
	await writePngFromSvg(svgRounded512, path.join(outApp, 'icon.png'), { width: 512, height: 512 });
	await writePngFromSvg(svgRounded512, path.join(outApp, 'apple-icon.png'), { width: 180, height: 180 });
	await writePngFromSvg(ogSvg(), path.join(outApp, 'opengraph-image.png'), { width: 1200, height: 630 });
	await writePngFromSvg(ogSvg(), path.join(outApp, 'twitter-image.png'), { width: 1200, height: 630 });

	// Public PWA icons
	await writePngFromSvg(svgRounded512, path.join(outPublicIcons, 'icon-192.png'), { width: 192, height: 192 });
	await writePngFromSvg(svgRounded512, path.join(outPublicIcons, 'icon-512.png'), { width: 512, height: 512 });
	await writePngFromSvg(svgMaskable512, path.join(outPublicIcons, 'maskable-512.png'), { width: 512, height: 512 });

	// favicon.ico (multiple PNG sizes inside ICO container)
	const sizes = [16, 32, 48, 256];
	const faviconPngs = await Promise.all(
		sizes.map(async (size) => {
			const data = await sharp(Buffer.from(svgRounded512))
				.resize(size, size)
				.png({ compressionLevel: 9 })
				.toBuffer();
			return { size, data };
		}),
	);

	const ico = buildIco(faviconPngs);
	await fs.writeFile(path.join(outApp, 'favicon.ico'), ico);

	// Also provide root favicon for any non-Next consumers / tools.
	await fs.writeFile(path.join(repoRoot, 'public', 'favicon.ico'), ico);
}

main().catch((err) => {
	console.error(err);
	process.exitCode = 1;
});

