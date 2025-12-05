// Use global Supabase client for production compatibility
// Wait for Supabase to be initialized (it's loaded via supabase-init.js before this script)
let supabase;
function getSupabase() {
    if (!supabase && window.supabase) {
        supabase = window.supabase;
    }
    if (!supabase) {
        throw new Error('Supabase client not initialized. Please ensure supabase-init.js loads before app.js');
    }
    return supabase;
}

// DOM Elements
const navLinksContainer = document.getElementById('navLinks');
const mainContent = document.getElementById('mainContent');
const pageTitle = document.getElementById('pageTitle');
const userNameEl = document.getElementById('userName');
const userRoleEl = document.getElementById('userRole');
const userAvatarEl = document.getElementById('userAvatar');
const logoutBtn = document.getElementById('logoutBtn');
const sidebar = document.getElementById('sidebar');
const openSidebarBtn = document.getElementById('openSidebar');
const closeSidebarBtn = document.getElementById('closeSidebar');

// State
let currentUser = null;
let currentRole = 'student'; // Default fallback

// Auth Guard
async function initApp() {
    // Ensure Supabase is available
    try {
        getSupabase(); // Check if available
    } catch (e) {
        console.error('Supabase client not initialized');
        mainContent.innerHTML = `
            <div class="text-center py-10">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 mb-4">
                    <svg class="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <p class="text-gray-700 dark:text-gray-300 font-medium">Initialization Error</p>
                <p class="text-gray-500 dark:text-gray-400 text-sm mt-2">Supabase client not initialized. Please refresh the page.</p>
            </div>
        `;
        return;
    }

    try {
        const supabaseClient = getSupabase();
        const { data: { session }, error } = await supabaseClient.auth.getSession();

        if (error || !session) {
            // DEBUG: Stop redirect loop and show info
            console.error('Session check failed:', error, session);
            document.body.innerHTML = `
                <div style="padding: 40px; text-align: center; font-family: sans-serif;">
                    <h1 style="color: #dc2626; font-size: 24px; margin-bottom: 20px;">⚠️ Login Loop Detected</h1>
                    <p style="margin-bottom: 20px;">The dashboard could not find your session.</p>
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: left; font-family: monospace; overflow: auto; max-width: 600px; margin: 0 auto;">
                        <p><strong>Error:</strong> ${error ? error.message : 'None'}</p>
                        <p><strong>Session:</strong> ${session ? 'Found' : 'Null'}</p>
                        <p><strong>Storage Key:</strong> school_auth_token</p>
                        <p><strong>SessionStorage Keys:</strong> ${Object.keys(sessionStorage).join(', ') || 'EMPTY'}</p>
                        <p><strong>LocalStorage Keys:</strong> ${Object.keys(localStorage).join(', ') || 'EMPTY'}</p>
                        <p><strong>Supabase URL:</strong> ${window.SUPABASE_URL}</p>
                    </div>
                    <div style="margin-top: 30px;">
                        <button onclick="window.location.href='index.html'" style="padding: 10px 20px; background: #4f46e5; color: white; border: none; border-radius: 6px; cursor: pointer;">
                            Back to Login
                        </button>
                        <button onclick="location.reload()" style="padding: 10px 20px; background: #9ca3af; color: white; border: none; border-radius: 6px; cursor: pointer; margin-left: 10px;">
                            Retry
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        currentUser = session.user;
        // Extract role from metadata or assume default
        currentRole = currentUser.user_metadata?.role || 'student';

        // Update Sidebar User Info
        userNameEl.textContent = currentUser.email.split('@')[0]; // Simple name extraction
        userRoleEl.textContent = currentRole.charAt(0).toUpperCase() + currentRole.slice(1);
        userAvatarEl.textContent = currentUser.email.charAt(0).toUpperCase();

        renderSidebar();
        loadModule('dashboard'); // Load default module
    } catch (err) {
        console.error('Error initializing app:', err);
        mainContent.innerHTML = `
            <div class="text-center py-10">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 mb-4">
                    <svg class="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <p class="text-gray-700 dark:text-gray-300 font-medium">Initialization Error</p>
                <p class="text-gray-500 dark:text-gray-400 text-sm mt-2">${err.message}</p>
            </div>
        `;
    }
}

// Sidebar Navigation Config
const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', roles: ['admin', 'teacher', 'accountant', 'student'] },
    { id: 'students', label: 'Students', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', roles: ['admin', 'teacher', 'accountant'] },
    { id: 'classes', label: 'Classes', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', roles: ['admin', 'teacher'] },
    { id: 'fees', label: 'Fee Collection', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', roles: ['admin', 'accountant'] },
    { id: 'fee_generation', label: 'Generate Fees', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', roles: ['admin', 'accountant'] },
    { id: 'fee_structure', label: 'Fee Structure', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z', roles: ['admin', 'accountant'] },
    { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', roles: ['admin'] }
];

function renderSidebar() {
    navLinksContainer.innerHTML = '';
    menuItems.forEach(item => {
        if (item.roles.includes(currentRole)) {
            const link = document.createElement('a');
            link.href = '#';
            link.className = 'flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors group';
            link.dataset.module = item.id;
            link.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 group-hover:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${item.icon}" />
                </svg>
                <span class="font-medium">${item.label}</span>
            `;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                loadModule(item.id);
                // Close sidebar on mobile
                if (window.innerWidth < 768) {
                    sidebar.classList.add('-translate-x-full');
                }
            });
            navLinksContainer.appendChild(link);
        }
    });
}


// Module Loader with Page Transitions
async function loadModule(moduleId) {
    // Update active state in sidebar
    document.querySelectorAll('#navLinks a').forEach(el => {
        if (el.dataset.module === moduleId) {
            el.classList.add('bg-indigo-50', 'text-indigo-600');
            el.querySelector('svg').classList.add('text-indigo-600');
        } else {
            el.classList.remove('bg-indigo-50', 'text-indigo-600');
            el.querySelector('svg').classList.remove('text-indigo-600');
        }
    });

    // Update page title
    const titleMap = {
        'dashboard': 'Dashboard',
        'students': 'Students',
        'classes': 'Classes',
        'fees': 'Fee Collection',
        'fee_generation': 'Generate Fees',
        'fee_structure': 'Fee Structure',
        'settings': 'Settings'
    };
    pageTitle.textContent = titleMap[moduleId] || moduleId.charAt(0).toUpperCase() + moduleId.slice(1);

    // Page transition with loading
    const pageTransition = new PageTransition(mainContent);

    await pageTransition.transition(async () => {
        // Show loading
        mainContent.innerHTML = `
            <div class="flex items-center justify-center h-64">
                <div class="flex flex-col items-center gap-4">
                    <div class="relative">
                        <div class="w-16 h-16 border-4 border-indigo-200 dark:border-indigo-900 rounded-full"></div>
                        <div class="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
                    </div>
                    <p class="text-gray-600 dark:text-gray-400 font-medium">Loading...</p>
                </div>
            </div>
        `;

        try {
            // Dynamic import of module - relative path works with ES modules
            // Ensure Supabase is available before loading modules
            if (!window.supabase) {
                throw new Error('Supabase client not initialized. Please refresh the page.');
            }

            const module = await import(`./modules/${moduleId}.js`);
            if (module && module.render) {
                await module.render(mainContent);
            } else {
                mainContent.innerHTML = `
                    <div class="text-center py-10">
                        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 mb-4">
                            <svg class="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <p class="text-gray-700 dark:text-gray-300 font-medium">Module not found</p>
                        <p class="text-gray-500 dark:text-gray-400 text-sm mt-2">The ${moduleId} module doesn't have a render function.</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error(`Error loading module ${moduleId}:`, error);
            mainContent.innerHTML = `
                <div class="text-center py-10">
                    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900 mb-4">
                        <svg class="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>
                    </div>
                    <p class="text-gray-700 dark:text-gray-300 font-medium">Module under construction</p>
                    <p class="text-gray-500 dark:text-gray-400 text-sm mt-2">${error.message}</p>
                </div>
            `;
        }
    });
}


// Logout Logic
logoutBtn.addEventListener('click', async () => {
    try {
        const supabaseClient = getSupabase();

        // 1. Attempt Supabase SignOut
        await supabaseClient.auth.signOut({ scope: 'local' });

        // 2. Aggressively clear ALL storage
        localStorage.clear(); // Clear everything in local storage
        sessionStorage.clear(); // Clear session storage

        // 3. Clear cookies (helper function)
        document.cookie.split(";").forEach((c) => {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });

        // 4. Redirect with a flag to prevent auto-login loop
        window.location.href = 'index.html?action=logout';

    } catch (err) {
        console.error('Logout error:', err);
        // Force redirect even on error
        window.location.href = 'index.html?action=logout';
    }
});

// Mobile Sidebar Toggle
openSidebarBtn.addEventListener('click', () => sidebar.classList.remove('-translate-x-full'));
closeSidebarBtn.addEventListener('click', () => sidebar.classList.add('-translate-x-full'));

// Theme Toggle Logic
const themeToggleBtn = document.getElementById('themeToggle');
const themeToggleDarkIcon = document.getElementById('themeToggleDarkIcon');
const themeToggleLightIcon = document.getElementById('themeToggleLightIcon');

// Check for saved user preference, if any, on load of the website
if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
    themeToggleLightIcon.classList.remove('hidden');
} else {
    document.documentElement.classList.remove('dark');
    themeToggleDarkIcon.classList.remove('hidden');
}

themeToggleBtn.addEventListener('click', function () {
    // toggle icons inside button
    themeToggleDarkIcon.classList.toggle('hidden');
    themeToggleLightIcon.classList.toggle('hidden');

    // if set via local storage previously
    if (localStorage.getItem('color-theme')) {
        if (localStorage.getItem('color-theme') === 'light') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('color-theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('color-theme', 'light');
        }
    } else {
        // if NOT set via local storage previously
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('color-theme', 'light');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('color-theme', 'dark');
        }
    }
});

// Initialize
initApp();
