const fs = require('fs');
const path = require('path');

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const publicDir = path.join(__dirname, 'public');
fs.mkdirSync(publicDir, { recursive: true });

// Copy static folders
['css', 'js', 'assets'].forEach(dir => {
  copyDirSync(path.join(__dirname, dir), path.join(publicDir, dir));
});

// Copy HTML files
['index.html', 'admin.html'].forEach(file => {
  const srcPath = path.join(__dirname, file);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, path.join(publicDir, file));
  }
});

console.log('✅ Static assets successfully synced to public/ directory for Vercel CDN deployment.');
