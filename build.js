const esbuild = require('esbuild');

// Build app.js bundle with Supabase as external global
esbuild.build({
    entryPoints: ['assets/js/app.js'],
    bundle: true,
    format: 'iife',
    globalName: 'App',
    outfile: 'assets/js/app.bundle.js',
    platform: 'browser',
    target: 'es2015',
    // Mark Supabase imports as external - they'll be loaded from CDN
    external: ['./supabase-client.js', '../supabase-client.js'],
    // Replace module imports with global window.supabase
    define: {
        'import.meta.url': '"https://example.com"'
    },
    banner: {
        js: '// Supabase client should be loaded from CDN before this script\n'
    }
}).then(() => {
    console.log('✅ app.bundle.js created successfully');
    console.log('⚠️  Make sure Supabase CDN is loaded before this bundle!');
}).catch((error) => {
    console.error('❌ Build failed:', error);
    process.exit(1);
});
