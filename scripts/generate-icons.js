const fs = require('fs');
const path = require('path');

// Fallback pure Node PNG generator or sharp if available
async function generate() {
  const publicDir = path.join(__dirname, '..', 'public', 'icons');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  try {
    const sharp = require('sharp');
    const svgPath = path.join(publicDir, 'logo.svg');
    await sharp(svgPath).resize(192, 192).png().toFile(path.join(publicDir, 'icon-192.png'));
    await sharp(svgPath).resize(512, 512).png().toFile(path.join(publicDir, 'icon-512.png'));
    console.log('Generated PNGs using sharp!');
    return;
  } catch (e) {
    console.log('Sharp not used, generating minimalist valid PNG buffer...', e.message);
  }

  // Minimal 1x1 green PNG expanded or base64 placeholder if sharp unavailable
  // PNG signature and IHDR/IDAT/IEND chunks
  const p192 = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  fs.writeFileSync(path.join(publicDir, 'icon-192.png'), p192);
  fs.writeFileSync(path.join(publicDir, 'icon-512.png'), p192);
  console.log('Fallback icons written.');
}

generate().catch(console.error);
