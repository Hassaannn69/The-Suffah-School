const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔨 Building project...\n');

// Create a temporary input file for Tailwind compilation
const inputFile = './assets/css/styles.input.css';
const outputFile = './assets/css/styles.css';

// Read the current styles.css and create input file
const currentStyles = fs.readFileSync(outputFile, 'utf8');
fs.writeFileSync(inputFile, currentStyles);

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
    
    // Clean up temp file
    if (fs.existsSync(inputFile)) {
        fs.unlinkSync(inputFile);
    }
    
    console.log('✅ Tailwind CSS compiled successfully\n');
} catch (error) {
    console.error('❌ Tailwind CSS build failed:', error.message);
    // Clean up temp file on error
    if (fs.existsSync(inputFile)) {
        fs.unlinkSync(inputFile);
    }
    process.exit(1);
}

console.log('✅ Build completed successfully!');
