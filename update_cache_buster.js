const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const filesToUpdate = [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'dashboard.html')
];

const timestamp = Date.now();

// Version from git (so every deploy shows real commit info) or fallback to timestamp
let version = String(timestamp);
// Always use current time in UTC (ISO with Z) so the displayed time is correct in all timezones
let updated_at = new Date().toISOString();
try {
    const rev = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const dateStr = execSync('git log -1 --format=%cI HEAD', { encoding: 'utf8' }).trim();
    if (rev) version = rev;
    // Use commit date only if it parses to a valid date; otherwise keep current time
    if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) updated_at = d.toISOString();
    }
} catch (_) { /* not in git or git not available */ }

// Write version.json for landing + login version note; updated on every build/deploy
const versionPath = path.join(__dirname, 'version.json');
fs.writeFileSync(versionPath, JSON.stringify({ version, updated_at }, null, 2));
console.log(`Updated version.json to v=${version} at ${updated_at}`);

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
