// Supabase client should be loaded from CDN before this script

var App = (() => {
  var __glob = (map) => (path) => {
    var fn = map[path];
    if (fn)
      return fn();
    throw new Error("Module not found in bundle: " + path);
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
  var globImport_modules_js_v = __glob({});

  // assets/js/app.js
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
  var sidebarBackdrop = document.getElementById("sidebarBackdrop");
  function isMobileView() {
    return window.matchMedia("(max-width: 767px)").matches;
  }
  function closeMobileSidebar() {
    sidebar.classList.add("-translate-x-full");
    if (sidebarBackdrop)
      sidebarBackdrop.classList.add("hidden");
  }
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
        startHeaderClock();
        if (currentRole === "admin") {
          showAdminNotificationsContainer();
          fetchAndUpdateAdminNotificationCount();
        }
        window.backfillFamilyCodes();
        window.backfillFamilyCodesV2();
        const lastModule = localStorage.getItem("suffah_last_module");
        const allowedModules = ["dashboard", "student-dashboard", "students", "add_student", "admissions", "student_promotions", "teachers", "assign_class", "timetable", "teacher_attendance", "payroll", "classes", "fees", "fee_generation", "fee_structure", "fee_reports", "fee_discounts", "expenses", "staff", "landing_page_editor", "settings"];
        const initialModule = lastModule && allowedModules.includes(lastModule) ? lastModule : "dashboard";
        loadModule(initialModule);
        autoExpandDropdown(initialModule);
        startUpdateCheck();
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
    {
      id: "students-menu",
      label: "Students",
      icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
      roles: ["admin", "teacher", "accountant"],
      isDropdown: true,
      submenu: [
        { id: "add_student", label: "Add a Student", icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z", roles: ["admin"] },
        { id: "students", label: "Student List", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z", roles: ["admin", "teacher", "accountant"] },
        { id: "admissions", label: "Online Admission", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", roles: ["admin"] },
        { id: "student_promotions", label: "Student Promotions", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6", roles: ["admin"] }
      ]
    },
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
    { id: "landing_page_editor", label: "Landing Page", icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0h.5a2.5 2.5 0 001.5-4.065M3.055 11H3a2 2 0 00-2 2v2a2 2 0 002 2h2.945M21 12v.5a2.5 2.5 0 01-2.5 2.5h-.5a2 2 0 01-2-2v-1.055M21 12V10a2 2 0 00-2-2h-2.945", roles: ["admin"] },
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
                if (isMobileView())
                  closeMobileSidebar();
              });
              submenuContainer.appendChild(sublink);
            }
          });
          dropdownBtn.addEventListener("click", () => {
            submenuContainer.classList.toggle("hidden");
            dropdownBtn.querySelector(".dropdown-arrow").classList.toggle("rotate-180");
            if (typeof refreshAdminNotificationBadges === "function")
              refreshAdminNotificationBadges();
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
            if (isMobileView())
              closeMobileSidebar();
          });
          navLinksContainer.appendChild(link);
        }
      }
    });
  }
  function startHeaderClock() {
    const timeEl = document.getElementById("currentTime");
    const dateEl = document.getElementById("currentDate");
    if (!timeEl || !dateEl)
      return;
    function update() {
      const now = /* @__PURE__ */ new Date();
      timeEl.textContent = now.toLocaleTimeString("en-US", { hour12: true, hour: "2-digit", minute: "2-digit", second: "2-digit" });
      dateEl.textContent = now.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
    }
    update();
    setInterval(update, 1e3);
  }
  var adminNotificationsLastSeenTotal = 0;
  var adminNotificationsCurrentTotal = 0;
  var adminAdmissionUnseenCount = 0;
  function showAdminNotificationsContainer() {
    const container = document.getElementById("adminNotificationsContainer");
    if (container)
      container.classList.remove("hidden");
    const btn = document.getElementById("adminNotificationsBtn");
    const dropdown = document.getElementById("adminNotificationsDropdown");
    if (btn && dropdown) {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpening = dropdown.classList.contains("hidden");
        dropdown.classList.toggle("hidden");
        if (isOpening) {
          adminNotificationsLastSeenTotal = adminNotificationsCurrentTotal;
          refreshAdminNotificationBadges();
        }
      });
      document.addEventListener("click", () => dropdown.classList.add("hidden"));
      dropdown.addEventListener("click", (e) => e.stopPropagation());
    }
    const viewAll = document.getElementById("adminNotificationsViewAll");
    if (viewAll) {
      viewAll.addEventListener("click", (e) => {
        var _a;
        e.preventDefault();
        adminNotificationsLastSeenTotal = adminNotificationsCurrentTotal;
        refreshAdminNotificationBadges();
        loadModule("admissions");
        (_a = document.getElementById("adminNotificationsDropdown")) == null ? void 0 : _a.classList.add("hidden");
        if (isMobileView())
          closeMobileSidebar();
      });
    }
  }
  window.markAdminNotificationsSeen = function () {
    adminNotificationsLastSeenTotal = adminNotificationsCurrentTotal;
    refreshAdminNotificationBadges();
  };
  function refreshAdminNotificationBadges() {
    const headerUnseen = Math.max(0, adminNotificationsCurrentTotal - adminNotificationsLastSeenTotal);
    const badgeEl = document.getElementById("adminNotificationsBadge");
    if (badgeEl) {
      badgeEl.textContent = headerUnseen > 99 ? "99+" : headerUnseen;
      badgeEl.classList.toggle("hidden", headerUnseen === 0);
    }
    const admissionUnseen = adminAdmissionUnseenCount;
    const admissionsLink = document.querySelector('#navLinks a[data-module="admissions"]');
    if (!admissionsLink)
      return;
    const submenuContainer = admissionsLink.parentElement;
    const studentsBtn = submenuContainer == null ? void 0 : submenuContainer.previousElementSibling;
    const isStudentsDropdownOpen = submenuContainer && !submenuContainer.classList.contains("hidden");
    let sidebarBadge = admissionsLink.querySelector(".admissions-nav-badge");
    if (admissionUnseen > 0) {
      if (!sidebarBadge) {
        sidebarBadge = document.createElement("span");
        sidebarBadge.className = "admissions-nav-badge ml-auto min-w-[20px] h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold px-1.5";
        admissionsLink.appendChild(sidebarBadge);
      }
      sidebarBadge.textContent = admissionUnseen > 99 ? "99+" : admissionUnseen;
      sidebarBadge.classList.toggle("hidden", !isStudentsDropdownOpen);
    } else if (sidebarBadge) {
      sidebarBadge.classList.add("hidden");
    }
    if (studentsBtn) {
      let studentsBadge = studentsBtn.querySelector(".admissions-nav-badge");
      if (admissionUnseen > 0) {
        if (!studentsBadge) {
          studentsBadge = document.createElement("span");
          studentsBadge.className = "admissions-nav-badge ml-auto min-w-[20px] h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold px-1.5";
          studentsBtn.appendChild(studentsBadge);
        }
        studentsBadge.textContent = admissionUnseen > 99 ? "99+" : admissionUnseen;
        studentsBadge.classList.toggle("hidden", isStudentsDropdownOpen);
      } else if (studentsBadge) {
        studentsBadge.classList.add("hidden");
      }
    }
  }
  function fetchAndUpdateAdminNotificationCount() {
    return __async(this, null, function* () {
      var _a, _b;
      const supabaseClient = getSupabase();
      let admissionUnseen = 0;
      let pendingTeacher = 0;
      try {
        const [studentRes, teacherRes] = yield Promise.all([
          supabaseClient.from("online_applications").select("*", { count: "exact", head: true }).eq("is_seen", false),
          supabaseClient.from("teacher_applications").select("*", { count: "exact", head: true }).eq("status", "pending")
        ]);
        admissionUnseen = (_a = studentRes == null ? void 0 : studentRes.count) != null ? _a : 0;
        pendingTeacher = (_b = teacherRes == null ? void 0 : teacherRes.count) != null ? _b : 0;
      } catch (e) {
        console.warn("Could not fetch applications count:", e);
      }
      updateAdminNotificationUI(admissionUnseen, pendingTeacher);
    });
  }
  window.fetchAndUpdateAdminNotificationCount = fetchAndUpdateAdminNotificationCount;
  function updateAdminNotificationUI(admissionUnseen, pendingTeacher) {
    adminAdmissionUnseenCount = admissionUnseen;
    const total = admissionUnseen + pendingTeacher;
    adminNotificationsCurrentTotal = total;
    const listEl = document.getElementById("adminNotificationsList");
    if (listEl) {
      if (total === 0) {
        listEl.innerHTML = '<p class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">No new applications</p>';
      } else {
        const items = [];
        if (admissionUnseen > 0)
          items.push(`<div class="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-3"><span class="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-sm font-bold">${admissionUnseen}</span><span class="text-sm text-gray-700 dark:text-gray-300">New student application${admissionUnseen !== 1 ? "s" : ""}</span></div>`);
        if (pendingTeacher > 0)
          items.push(`<div class="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-3"><span class="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 text-sm font-bold">${pendingTeacher}</span><span class="text-sm text-gray-700 dark:text-gray-300">New teacher application${pendingTeacher !== 1 ? "s" : ""}</span></div>`);
        listEl.innerHTML = items.join("");
      }
    }
    refreshAdminNotificationBadges();
  }
  function autoExpandDropdown(moduleId) {
    var _a;
    const activeLink = document.querySelector(`#navLinks a[data-module="${moduleId}"]`);
    if (activeLink) {
      const submenuContainer = activeLink.closest(".hidden");
      if (submenuContainer) {
        submenuContainer.classList.remove("hidden");
        const arrow = (_a = submenuContainer.previousElementSibling) == null ? void 0 : _a.querySelector(".dropdown-arrow");
        if (arrow)
          arrow.classList.add("rotate-180");
      }
    }
  }
  function disableAutocompleteSuggestions(container) {
    if (!container)
      return;
    container.querySelectorAll("form").forEach((form) => form.setAttribute("autocomplete", "off"));
    container.querySelectorAll('input:not([type="password"]):not([type="hidden"])').forEach((input) => input.setAttribute("autocomplete", "off"));
    container.querySelectorAll("textarea").forEach((el) => el.setAttribute("autocomplete", "off"));
  }
  function loadModule(moduleId) {
    return __async(this, null, function* () {
      try {
        localStorage.setItem("suffah_last_module", moduleId);
      } catch (e) {
      }
      document.querySelectorAll("#navLinks a").forEach((el) => {
        var _a, _b, _c, _d;
        if (el.dataset.module === moduleId) {
          el.classList.add("bg-gray-800", "text-white", "border-primary-500");
          (_a = el.querySelector("svg")) == null ? void 0 : _a.classList.remove("text-gray-500");
          (_b = el.querySelector("svg")) == null ? void 0 : _b.classList.add("text-primary-400");
        } else {
          el.classList.remove("bg-gray-800", "text-white", "border-primary-500");
          (_c = el.querySelector("svg")) == null ? void 0 : _c.classList.add("text-gray-500");
          (_d = el.querySelector("svg")) == null ? void 0 : _d.classList.remove("text-primary-400");
        }
      });
      autoExpandDropdown(moduleId);
      const titleMap = {
        "dashboard": "Dashboard",
        "student-dashboard": "My Dashboard",
        "students": "Student List",
        "add_student": "Add a Student",
        "admissions": "Admissions Review",
        "student_promotions": "Student Promotions",
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
        "landing_page_editor": "Landing Page Editor",
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
          const APP_VERSION = "1.0.4";
          const module = yield globImport_modules_js_v(`./modules/${actualModuleId}.js?v=${APP_VERSION}`);
          if (module && module.render) {
            yield module.render(mainContent);
            disableAutocompleteSuggestions(mainContent);
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
  window.openDashboardReport = function (reportId) {
    window.dashboardReportTarget = reportId;
    loadModule("fee_reports");
  };
  window.sortClassesNatural = function (arr, key) {
    const rank = (name) => {
      if (!name)
        return 9999;
      const n = name.toLowerCase().trim();
      if (n === "play group" || n === "pg")
        return 0;
      if (n === "nursery")
        return 1;
      if (n === "prep")
        return 2;
      const m = n.match(/(\d+)/);
      return m ? parseInt(m[1]) + 2 : 9998;
    };
    return arr.sort((a, b) => {
      const nameA = key ? a[key] : a;
      const nameB = key ? b[key] : b;
      return rank(nameA) - rank(nameB);
    });
  };
  window.backfillFamilyCodes = function () {
    return __async(this, null, function* () {
      const MIGRATION_KEY = "suffah_family_code_backfill_v1";
      if (localStorage.getItem(MIGRATION_KEY))
        return;
      try {
        const sb = getSupabase();
        const { data: maxData } = yield sb.from("students").select("family_code").not("family_code", "is", null).ilike("family_code", "FAM-%").order("family_code", { ascending: false }).limit(1);
        let nextNum = 1;
        if (maxData && maxData.length > 0) {
          const m = maxData[0].family_code.match(/^FAM-(\d+)$/i);
          if (m)
            nextNum = parseInt(m[1]) + 1;
        }
        const { data: students, error: fetchErr } = yield sb.from("students").select("id, father_cnic, father_name, family_code").or("family_code.is.null,family_code.eq.");
        if (fetchErr)
          throw fetchErr;
        if (!students || students.length === 0) {
          localStorage.setItem(MIGRATION_KEY, Date.now().toString());
          return;
        }
        const toast = document.createElement("div");
        toast.className = "fixed bottom-6 right-6 bg-blue-600 text-white px-6 py-3 rounded-xl shadow-2xl text-sm font-medium z-[9999] transform transition-all duration-300 translate-y-4 opacity-0";
        toast.textContent = "Assigning family codes to existing students...";
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.remove("translate-y-4", "opacity-0"));
        const groups = {};
        for (const s of students) {
          const cnic = (s.father_cnic || "").trim().toLowerCase();
          const name = (s.father_name || "").trim().toLowerCase();
          const key = cnic ? `${cnic}||${name}` : `__solo__${s.id}`;
          if (!groups[key])
            groups[key] = [];
          groups[key].push(s.id);
        }
        for (const key of Object.keys(groups)) {
          const code = `FAM-${nextNum.toString().padStart(3, "0")}`;
          const ids = groups[key];
          const { error: updateErr } = yield sb.from("students").update({ family_code: code }).in("id", ids);
          if (updateErr)
            console.error(`Backfill error for ${code}:`, updateErr);
          nextNum++;
        }
        localStorage.setItem(MIGRATION_KEY, Date.now().toString());
        toast.textContent = `Family codes assigned to ${students.length} student(s).`;
        toast.classList.remove("bg-blue-600");
        toast.classList.add("bg-green-600");
        setTimeout(() => {
          toast.classList.add("translate-y-4", "opacity-0");
          setTimeout(() => toast.remove(), 300);
        }, 3e3);
      } catch (err) {
        console.error("Family code backfill failed:", err);
      }
    });
  };
  window.backfillFamilyCodesV2 = function () {
    return __async(this, null, function* () {
      const MIGRATION_KEY = "suffah_family_code_backfill_v2";
      if (localStorage.getItem(MIGRATION_KEY))
        return;
      try {
        const sb = getSupabase();
        const { data: maxData } = yield sb.from("students").select("family_code").not("family_code", "is", null).ilike("family_code", "FAM-%").order("family_code", { ascending: false }).limit(1);
        let nextNum = 1;
        if (maxData && maxData.length > 0) {
          const m = maxData[0].family_code.match(/^FAM-(\d+)$/i);
          if (m)
            nextNum = parseInt(m[1]) + 1;
        }
        const { data: allStudents, error: fetchErr } = yield sb.from("students").select("id, family_code");
        if (fetchErr)
          throw fetchErr;
        const legacyStudents = (allStudents || []).filter((s) => {
          const fc = (s.family_code || "").trim();
          return fc.length > 0 && !/^FAM-\d+$/i.test(fc);
        });
        if (legacyStudents.length === 0) {
          localStorage.setItem(MIGRATION_KEY, Date.now().toString());
          return;
        }
        const toast = document.createElement("div");
        toast.className = "fixed bottom-6 right-6 bg-blue-600 text-white px-6 py-3 rounded-xl shadow-2xl text-sm font-medium z-[9999] transform transition-all duration-300 translate-y-4 opacity-0";
        toast.textContent = "Normalizing legacy family codes...";
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.remove("translate-y-4", "opacity-0"));
        const groups = {};
        for (const s of legacyStudents) {
          const key = s.family_code.trim().toLowerCase();
          if (!groups[key])
            groups[key] = [];
          groups[key].push(s.id);
        }
        for (const key of Object.keys(groups)) {
          const code = `FAM-${nextNum.toString().padStart(3, "0")}`;
          const ids = groups[key];
          const { error: updateErr } = yield sb.from("students").update({ family_code: code }).in("id", ids);
          if (updateErr)
            console.error(`V2 backfill error for ${code}:`, updateErr);
          nextNum++;
        }
        localStorage.setItem(MIGRATION_KEY, Date.now().toString());
        toast.textContent = `Normalized ${legacyStudents.length} student(s) to FAM-XXX format.`;
        toast.classList.remove("bg-blue-600");
        toast.classList.add("bg-green-600");
        setTimeout(() => {
          toast.classList.add("translate-y-4", "opacity-0");
          setTimeout(() => toast.remove(), 300);
        }, 3e3);
      } catch (err) {
        console.error("Family code v2 backfill failed:", err);
      }
    });
  };
  let sessionAppVersion = null;
  function showUpdateBanner(newVersion) {
    if (document.getElementById("suffah-update-banner"))
      return;
    const banner = document.createElement("div");
    banner.id = "suffah-update-banner";
    banner.setAttribute("role", "status");
    banner.className = "fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-[100] flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-lg border bg-gray-900 dark:bg-gray-800 border-primary-500/50 text-white";
    banner.innerHTML = `
        <span class="text-sm font-medium">Website updated. Refresh to get the latest.</span>
        <div class="flex items-center gap-2 shrink-0">
            <button type="button" id="suffah-update-dismiss" class="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors">Dismiss</button>
            <button type="button" id="suffah-update-refresh" class="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary-600 hover:bg-primary-500 transition-colors">Refresh</button>
        </div>
    `;
    document.body.appendChild(banner);
    document.getElementById("suffah-update-dismiss").addEventListener("click", () => {
      try { sessionStorage.setItem('suffah_update_dismissed_version', newVersion); } catch (e) { }
      banner.remove();
    });
    document.getElementById("suffah-update-refresh").addEventListener("click", () => {
      try { localStorage.setItem('suffah_client_version', newVersion); } catch (e) { }
      window.location.reload();
    });
  }
  function startUpdateCheck() {
    let checkInterval;
    function check() {
      if (document.hidden) return;
      fetch(`version.json?t=${Date.now()}`, { cache: "no-store" }).then((r) => r.ok ? r.json() : null).then((data) => {
        if (!data) return;
        const serverVersion = String(data.updated_at || data.version);
        if (!serverVersion || serverVersion === 'undefined') return;

        if (!sessionAppVersion) {
          sessionAppVersion = serverVersion;
          localStorage.setItem('suffah_client_version', sessionAppVersion);
          return;
        }

        if (serverVersion !== sessionAppVersion) {
          const dismissedVersion = sessionStorage.getItem('suffah_update_dismissed_version');
          if (dismissedVersion === serverVersion) return;
          const acknowledgedVersion = localStorage.getItem('suffah_client_version');
          if (acknowledgedVersion === serverVersion) return;
          showUpdateBanner(serverVersion);
          if (checkInterval) clearInterval(checkInterval);
        }
      }).catch(() => { });
    }
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") check();
    });
    checkInterval = setInterval(check, 3e4);
    setTimeout(check, 1e3);
    window.__showUpdateBanner = (v) => showUpdateBanner(v || '9.9.9');
    if (new URLSearchParams(window.location.search).get("testUpdate") === "1") {
      setTimeout(() => showUpdateBanner('9.9.9'), 1e3);
    }
  }
  logoutBtn.addEventListener("click", () => __async(void 0, null, function* () {
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
  openSidebarBtn.addEventListener("click", () => {
    sidebar.classList.remove("-translate-x-full");
    if (isMobileView() && sidebarBackdrop)
      sidebarBackdrop.classList.remove("hidden");
  });
  closeSidebarBtn.addEventListener("click", closeMobileSidebar);
  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener("click", closeMobileSidebar);
  }
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
    themeToggleBtn.addEventListener("click", function () {
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
})();
