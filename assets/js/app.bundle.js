// Supabase client should be loaded from CDN before this script

var App = (() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __glob = (map) => (path) => {
    var fn = map[path];
    if (fn)
      return fn();
    throw new Error("Module not found in bundle: " + path);
  };
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // import("./modules/**/*.js?v=*") in assets/js/app.js
  var globImport_modules_js_v;
  var init_ = __esm({
    'import("./modules/**/*.js?v=*") in assets/js/app.js'() {
      globImport_modules_js_v = __glob({});
    }
  });

  // assets/js/app.js
  var require_app = __commonJS({
    "assets/js/app.js"(exports) {
      init_();
      var supabase;
      function getSupabase() {
        if (!supabase && window.supabase) {
          supabase = window.supabase;
        }
        if (!supabase) {
          throw new Error("Supabase client not initialized. Please ensure supabase-init.js loads before app.js");
        }
        return supabase;
      }
      var navLinksContainer = document.getElementById("navLinks");
      var mainContent = document.getElementById("mainContent");
      var pageTitle = document.getElementById("pageTitle");
      var userNameEl = document.getElementById("userName");
      var userRoleEl = document.getElementById("userRole");
      var userAvatarEl = document.getElementById("userAvatar");
      var logoutBtn = document.getElementById("logoutBtn");
      var sidebar = document.getElementById("sidebar");
      var openSidebarBtn = document.getElementById("openSidebar");
      var closeSidebarBtn = document.getElementById("closeSidebar");
      var currentUser = null;
      var currentRole = "student";
      function initApp() {
        return __async(this, null, function* () {
          var _a;
          try {
            getSupabase();
          } catch (e) {
            console.error("Supabase client not initialized");
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
            const { data: { session }, error } = yield supabaseClient.auth.getSession();
            if (error || !session) {
              console.error("Session check failed:", error, session);
              document.body.innerHTML = `
                <div style="padding: 40px; text-align: center; font-family: sans-serif;">
                    <h1 style="color: #dc2626; font-size: 24px; margin-bottom: 20px;">\u26A0\uFE0F Login Loop Detected</h1>
                    <p style="margin-bottom: 20px;">The dashboard could not find your session.</p>
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: left; font-family: monospace; overflow: auto; max-width: 600px; margin: 0 auto;">
                        <p><strong>Error:</strong> ${error ? error.message : "None"}</p>
                        <p><strong>Session:</strong> ${session ? "Found" : "Null"}</p>
                        <p><strong>Storage Key:</strong> Default (sb-...-auth-token)</p>
                        <p><strong>SessionStorage Keys:</strong> ${Object.keys(sessionStorage).join(", ") || "EMPTY"}</p>
                        <p><strong>LocalStorage Keys:</strong> ${Object.keys(localStorage).join(", ") || "EMPTY"}</p>
                        <p><strong>Supabase URL:</strong> ${window.SUPABASE_URL}</p>
                    </div>
                    <div style="margin-top: 30px;">
                        <button onclick="window.location.href='login.html?action=logout'" style="padding: 10px 20px; background: #4f46e5; color: white; border: none; border-radius: 6px; cursor: pointer;">
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
            currentRole = ((_a = currentUser.user_metadata) == null ? void 0 : _a.role) || "student";
            userNameEl.textContent = currentUser.email.split("@")[0];
            userRoleEl.textContent = currentRole.charAt(0).toUpperCase() + currentRole.slice(1);
            userAvatarEl.textContent = currentUser.email.charAt(0).toUpperCase();
            renderSidebar();
            loadModule("dashboard");
          } catch (err) {
            console.error("Error initializing app:", err);
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
        });
      }
      var menuItems = [
        { id: "dashboard", label: "Dashboard", icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z", roles: ["admin", "teacher", "accountant", "student"] },
        { id: "students", label: "Students", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z", roles: ["admin", "teacher", "accountant"] },
        {
          id: "teachers-menu",
          label: "Teachers",
          icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
          roles: ["admin", "teacher"],
          isDropdown: true,
          submenu: [
            { id: "teachers", label: "Manage Teachers", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", roles: ["admin"] },
            { id: "assign_class", label: "Assign Class", icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z", roles: ["admin"] },
            { id: "timetable", label: "Timetable", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", roles: ["admin", "teacher"] },
            { id: "teacher_attendance", label: "Attendance", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4", roles: ["admin"] },
            { id: "payroll", label: "Payroll", icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z", roles: ["admin", "accountant"] }
          ]
        },
        { id: "classes", label: "Classes", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10", roles: ["admin", "teacher"] },
        {
          id: "fees-menu",
          label: "Fees",
          icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
          roles: ["admin", "accountant"],
          isDropdown: true,
          submenu: [
            { id: "fees", label: "Fee Collection", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", roles: ["admin", "accountant"] },
            { id: "fee_generation", label: "Generate Fees", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01", roles: ["admin", "accountant"] },
            { id: "fee_structure", label: "Fee Structure", icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z", roles: ["admin", "accountant"] },
            { id: "fee_reports", label: "Fee Reports", icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", roles: ["admin", "accountant"] },
            { id: "fee_discounts", label: "Discounts / Concessions", icon: "M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v9a2 2 0 002 2h10a2 2 0 002-2v-9", roles: ["admin", "accountant"] }
          ]
        },
        { id: "expenses", label: "Expenses", icon: "M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z", roles: ["admin", "accountant"] },
        { id: "staff", label: "Staff & Users", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z", roles: ["admin"] },
        { id: "settings", label: "Settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z", roles: ["admin"] }
      ];
      function renderSidebar() {
        navLinksContainer.innerHTML = "";
        menuItems.forEach((item) => {
          if (item.roles.includes(currentRole)) {
            if (item.isDropdown) {
              const dropdownContainer = document.createElement("div");
              dropdownContainer.className = "relative";
              const dropdownBtn = document.createElement("button");
              dropdownBtn.className = "w-full flex items-center justify-between px-4 py-3 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-all group border-l-4 border-transparent";
              dropdownBtn.innerHTML = `
                    <div class="flex items-center space-x-3">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 group-hover:text-primary-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${item.icon}" />
                        </svg>
                        <span class="font-medium tracking-wide">${item.label}</span>
                    </div>
                    <svg class="h-4 w-4 transition-transform dropdown-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                `;
              const submenuContainer = document.createElement("div");
              submenuContainer.className = "hidden pl-4 mt-1 space-y-1";
              item.submenu.forEach((subitem) => {
                if (subitem.roles.includes(currentRole)) {
                  const sublink = document.createElement("a");
                  sublink.href = "#";
                  sublink.className = "flex items-center space-x-3 px-4 py-2 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-all text-sm border-l-4 border-transparent";
                  sublink.dataset.module = subitem.id;
                  sublink.innerHTML = `
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500 group-hover:text-primary-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${subitem.icon}" />
                            </svg>
                            <span class="font-medium tracking-wide">${subitem.label}</span>
                        `;
                  sublink.addEventListener("click", (e) => {
                    e.preventDefault();
                    loadModule(subitem.id);
                    if (window.innerWidth < 768) {
                      sidebar.classList.add("-translate-x-full");
                    }
                  });
                  submenuContainer.appendChild(sublink);
                }
              });
              dropdownBtn.addEventListener("click", () => {
                submenuContainer.classList.toggle("hidden");
                dropdownBtn.querySelector(".dropdown-arrow").classList.toggle("rotate-180");
              });
              dropdownContainer.appendChild(dropdownBtn);
              dropdownContainer.appendChild(submenuContainer);
              navLinksContainer.appendChild(dropdownContainer);
            } else {
              const link = document.createElement("a");
              link.href = "#";
              link.className = "flex items-center space-x-3 px-4 py-3 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-all group border-l-4 border-transparent";
              link.dataset.module = item.id;
              link.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 group-hover:text-primary-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${item.icon}" />
                    </svg>
                    <span class="font-medium tracking-wide">${item.label}</span>
                `;
              link.addEventListener("click", (e) => {
                e.preventDefault();
                loadModule(item.id);
                if (window.innerWidth < 768) {
                  sidebar.classList.add("-translate-x-full");
                }
              });
              navLinksContainer.appendChild(link);
            }
          }
        });
      }
      function loadModule(moduleId) {
        return __async(this, null, function* () {
          document.querySelectorAll("#navLinks a").forEach((el) => {
            if (el.dataset.module === moduleId) {
              el.classList.add("bg-gray-800", "text-white", "border-primary-500");
              el.querySelector("svg").classList.remove("text-gray-500");
              el.querySelector("svg").classList.add("text-primary-400");
            } else {
              el.classList.remove("bg-gray-800", "text-white", "border-primary-500");
              el.querySelector("svg").classList.add("text-gray-500");
              el.querySelector("svg").classList.remove("text-primary-400");
            }
          });
          const titleMap = {
            "dashboard": "Dashboard",
            "student-dashboard": "My Dashboard",
            "students": "Students",
            "teachers": "Teachers",
            "assign_class": "Assign Class",
            "timetable": "Timetable",
            "teacher_attendance": "Teacher Attendance",
            "payroll": "Payroll",
            "classes": "Classes",
            "fees": "Fee Collection",
            "fee_generation": "Generate Fees",
            "fee_structure": "Fee Structure",
            "fee_reports": "Fee Reports",
            "fee_discounts": "Discounts / Concessions",
            "expenses": "Expenses",
            "staff": "Staff Management",
            "settings": "Settings"
          };
          pageTitle.textContent = titleMap[moduleId] || moduleId.charAt(0).toUpperCase() + moduleId.slice(1);
          const pageTransition = new PageTransition(mainContent);
          yield pageTransition.transition(() => __async(this, null, function* () {
            mainContent.innerHTML = `
            <div class="flex items-center justify-center h-64">
                <div class="flex flex-col items-center gap-4">
                    <div class="relative">
                        <div class="w-16 h-16 border-4 border-gray-800 rounded-full"></div>
                        <div class="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin absolute top-0"></div>
                    </div>
                    <p class="text-gray-400 font-medium animate-pulse">Loading...</p>
                </div>
            </div>
        `;
            try {
              if (!window.supabase) {
                throw new Error("Supabase client not initialized. Please refresh the page.");
              }
              let actualModuleId = moduleId;
              if (moduleId === "dashboard" && currentRole === "student") {
                actualModuleId = "student-dashboard";
              }
              const APP_VERSION = "1.0.3";
              const module2 = yield globImport_modules_js_v(`./modules/${actualModuleId}.js?v=${APP_VERSION}`);
              if (module2 && module2.render) {
                yield module2.render(mainContent);
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
          }));
        });
      }
      window.loadModule = loadModule;
      logoutBtn.addEventListener("click", () => __async(exports, null, function* () {
        try {
          const supabaseClient = getSupabase();
          yield supabaseClient.auth.signOut({ scope: "local" });
          localStorage.clear();
          sessionStorage.clear();
          document.cookie.split(";").forEach((c) => {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + (/* @__PURE__ */ new Date()).toUTCString() + ";path=/");
          });
          window.location.href = "login.html?action=logout";
        } catch (err) {
          console.error("Logout error:", err);
          window.location.href = "login.html?action=logout";
        }
      }));
      openSidebarBtn.addEventListener("click", () => sidebar.classList.remove("-translate-x-full"));
      closeSidebarBtn.addEventListener("click", () => sidebar.classList.add("-translate-x-full"));
      function initTheme() {
        const themeToggleBtn = document.getElementById("themeToggle");
        const themeToggleDarkIcon = document.getElementById("themeToggleDarkIcon");
        const themeToggleLightIcon = document.getElementById("themeToggleLightIcon");
        if (!themeToggleBtn || !themeToggleDarkIcon || !themeToggleLightIcon) {
          console.warn("Theme toggle elements not found");
          return;
        }
        if (localStorage.getItem("color-theme") === "dark" || !("color-theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches) {
          document.documentElement.classList.add("dark");
          themeToggleLightIcon.classList.remove("hidden");
          themeToggleDarkIcon.classList.add("hidden");
        } else {
          document.documentElement.classList.remove("dark");
          themeToggleDarkIcon.classList.remove("hidden");
          themeToggleLightIcon.classList.add("hidden");
        }
        themeToggleBtn.addEventListener("click", function() {
          themeToggleDarkIcon.classList.toggle("hidden");
          themeToggleLightIcon.classList.toggle("hidden");
          if (document.documentElement.classList.contains("dark")) {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("color-theme", "light");
          } else {
            document.documentElement.classList.add("dark");
            localStorage.setItem("color-theme", "dark");
          }
        });
      }
      initTheme();
      initApp();
    }
  });
  return require_app();
})();
