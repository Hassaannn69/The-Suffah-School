// UI Components - Custom Alerts, Notifications, and Loading States

// Toast Notification System
class Toast {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        // Create toast container if it doesn't exist
        if (!document.getElementById('toast-container')) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none';
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('toast-container');
        }
    }

    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `pointer-events-auto transform transition-all duration-300 ease-out translate-x-full opacity-0`;

        const icons = {
            success: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>`,
            error: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>`,
            warning: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>`,
            info: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>`
        };

        const colors = {
            success: 'bg-green-500 dark:bg-green-600',
            error: 'bg-red-500 dark:bg-red-600',
            warning: 'bg-yellow-500 dark:bg-yellow-600',
            info: 'bg-indigo-500 dark:bg-indigo-600'
        };

        toast.innerHTML = `
            <div class="flex items-center gap-3 ${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg min-w-[300px] max-w-md">
                <div class="flex-shrink-0">
                    ${icons[type]}
                </div>
                <p class="flex-1 text-sm font-medium">${message}</p>
                <button class="flex-shrink-0 hover:bg-white/20 rounded p-1 transition-colors" onclick="this.parentElement.parentElement.remove()">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `;

        this.container.appendChild(toast);

        // Trigger animation
        setTimeout(() => {
            toast.classList.remove('translate-x-full', 'opacity-0');
        }, 10);

        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                this.remove(toast);
            }, duration);
        }

        return toast;
    }

    remove(toast) {
        toast.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }

    success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 4000) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = 3500) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }
}

// Confirmation Dialog
class ConfirmDialog {
    show(options = {}) {
        return new Promise((resolve) => {
            const {
                title = 'Confirm Action',
                message = 'Are you sure you want to proceed?',
                confirmText = 'Confirm',
                cancelText = 'Cancel',
                type = 'warning'
            } = options;

            const icons = {
                warning: `<svg class="w-12 h-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>`,
                danger: `<svg class="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>`,
                info: `<svg class="w-12 h-12 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>`
            };

            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] flex items-center justify-center p-4 animate-fadeIn';

            overlay.innerHTML = `
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full transform transition-all animate-scaleIn">
                    <div class="p-6">
                        <div class="flex items-center justify-center mb-4">
                            ${icons[type] || icons.warning}
                        </div>
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">${title}</h3>
                        <p class="text-gray-600 dark:text-gray-300 text-center mb-6">${message}</p>
                        <div class="flex gap-3">
                            <button id="cancelBtn" class="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium">
                                ${cancelText}
                            </button>
                            <button id="confirmBtn" class="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium">
                                ${confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            const confirmBtn = overlay.querySelector('#confirmBtn');
            const cancelBtn = overlay.querySelector('#cancelBtn');

            const cleanup = (result) => {
                overlay.classList.add('animate-fadeOut');
                setTimeout(() => {
                    overlay.remove();
                    resolve(result);
                }, 200);
            };

            confirmBtn.addEventListener('click', () => cleanup(true));
            cancelBtn.addEventListener('click', () => cleanup(false));
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) cleanup(false);
            });
        });
    }
}

// Loading Overlay
class LoadingOverlay {
    constructor() {
        this.overlay = null;
    }

    show(message = 'Loading...') {
        if (this.overlay) return;

        this.overlay = document.createElement('div');
        this.overlay.className = 'fixed inset-0 bg-black/30 backdrop-blur-sm z-[9997] flex items-center justify-center animate-fadeIn';

        this.overlay.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 flex flex-col items-center gap-4 animate-scaleIn">
                <div class="relative">
                    <div class="w-16 h-16 border-4 border-indigo-200 dark:border-indigo-900 rounded-full"></div>
                    <div class="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
                </div>
                <p class="text-gray-700 dark:text-gray-300 font-medium">${message}</p>
            </div>
        `;

        document.body.appendChild(this.overlay);
    }

    hide() {
        if (!this.overlay) return;

        this.overlay.classList.add('animate-fadeOut');
        setTimeout(() => {
            this.overlay?.remove();
            this.overlay = null;
        }, 200);
    }

    update(message) {
        if (this.overlay) {
            const text = this.overlay.querySelector('p');
            if (text) text.textContent = message;
        }
    }
}

// Page Transition Manager
class PageTransition {
    constructor(container) {
        this.container = container;
    }

    async transition(callback) {
        // Fade out
        this.container.style.opacity = '0';
        this.container.style.transform = 'translateY(10px)';

        await new Promise(resolve => setTimeout(resolve, 200));

        // Execute callback (load new content)
        if (callback) await callback();

        // Fade in
        this.container.style.opacity = '1';
        this.container.style.transform = 'translateY(0)';
    }
}

// Initialize global instances
const toast = new Toast();
const confirmDialog = new ConfirmDialog();
const loadingOverlay = new LoadingOverlay();

// Export for use in other modules
window.toast = toast;
window.confirmDialog = confirmDialog;
window.loadingOverlay = loadingOverlay;
window.PageTransition = PageTransition;

// Override default alert and confirm
window.alert = (message) => {
    toast.info(message, 4000);
};

window.confirm = async (message) => {
    return await confirmDialog.show({
        title: 'Confirm',
        message: message,
        type: 'warning'
    });
};

// Add custom CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    
    @keyframes scaleIn {
        from { 
            opacity: 0;
            transform: scale(0.9);
        }
        to { 
            opacity: 1;
            transform: scale(1);
        }
    }
    
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .animate-fadeIn {
        animation: fadeIn 0.2s ease-out;
    }
    
    .animate-fadeOut {
        animation: fadeOut 0.2s ease-out;
    }
    
    .animate-scaleIn {
        animation: scaleIn 0.2s ease-out;
    }
    
    .animate-slideInRight {
        animation: slideInRight 0.3s ease-out;
    }
    
    #mainContent {
        transition: opacity 0.2s ease-out, transform 0.2s ease-out;
    }
`;
document.head.appendChild(style);

console.log('✨ UI Components loaded successfully');
