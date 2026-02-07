const fs = require('fs');
const path = require('path');

const filesToUpdate = [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'dashboard.html')
];

const timestamp = Date.now();

// Write version.json so the app can detect when code has been updated (show "Website updated" without auto-refresh)
const versionPath = path.join(__dirname, 'version.json');
fs.writeFileSync(versionPath, JSON.stringify({ version: String(timestamp) }, null, 2));
console.log(`Updated version.json to v=${timestamp}`);

filesToUpdate.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');

        // 1) Replace existing ?v=... on .js and .css
        content = content.replace(/(\.(js|css))\?v=[^"']+/g, `$1?v=${timestamp}`);

        // 2) Add ?v= to local assets that don't have it (so every Vercel deploy serves fresh files)
        content = content.replace(
            /(src|href)="(assets\/[^"?']+\.(js|css))"/g,
            (_, attr, url) => `${attr}="${url}?v=${timestamp}"`
        );

        fs.writeFileSync(file, content);
        console.log(`Updated cache buster in ${path.basename(file)} to v=${timestamp}`);
    } else {
        console.log(`File not found: ${file}`);
    }
});
