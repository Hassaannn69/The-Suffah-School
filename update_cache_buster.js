const fs = require('fs');
const path = require('path');

const filesToUpdate = [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'dashboard.html')
];

const timestamp = Date.now();

filesToUpdate.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');

        // Regex to replace ?v=... or add it if missing to specific assets
        // We target .js and .css files inside src attributes or href attributes
        // This regex looks for .js?v=... or .css?v=... and replaces the version
        // It also handles cases where there is no query param yet by looking for .js" or .css"

        // Replace existing version tags
        content = content.replace(/(\.(js|css))\?v=[^"']+/g, `$1?v=${timestamp}`);

        // Add version tags to those that don't have it (simple approach)
        // Note: This might be risky if not careful, but let's try to be specific
        // We'll stick to replacing existing ones first as I saw ?v=2 in the files.
        // If we need to add new ones, we can do a second pass.

        fs.writeFileSync(file, content);
        console.log(`Updated cache buster in ${path.basename(file)} to v=${timestamp}`);
    } else {
        console.log(`File not found: ${file}`);
    }
});
