const esbuild = require('esbuild');
const fs = require('fs');

// Build app.js bundle
esbuild.build({
    entryPoints: ['assets/js/app.js'],
    bundle: true,
    format: 'iife',
    globalName: 'App',
    outfile: 'assets/js/app.bundle.js',
    platform: 'browser',
    target: 'es2015',
    external: ['https://*'],
}).then(() => {
    console.log('✅ app.bundle.js created successfully');
}).catch((error) => {
    console.error('❌ Build failed:', error);
    process.exit(1);
});
