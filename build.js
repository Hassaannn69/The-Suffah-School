const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔨 Building project...\n');

// Source and output files
const inputFile = './assets/css/styles.source.css';
const outputFile = './assets/css/styles.css';

// Check if source file exists
if (!fs.existsSync(inputFile)) {
    console.error('❌ Source file not found:', inputFile);
    console.error('Please ensure assets/css/styles.source.css exists');
    process.exit(1);
}

// Build Tailwind CSS using PostCSS
try {
    console.log('📦 Compiling Tailwind CSS...');
    const postcssPath = path.join(__dirname, 'node_modules', '.bin', 'postcss');
    const command = process.platform === 'win32' 
        ? `"${postcssPath}.cmd" ${inputFile} -o ${outputFile} --minify`
        : `${postcssPath} ${inputFile} -o ${outputFile} --minify`;
    
    execSync(command, {
        stdio: 'inherit',
        cwd: __dirname,
        shell: true
    });
    
    console.log('✅ Tailwind CSS compiled successfully\n');
} catch (error) {
    console.error('❌ Tailwind CSS build failed:', error.message);
    process.exit(1);
}

console.log('✅ Build completed successfully!');
