var App = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined")
      return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __glob = (map) => (path) => {
    var fn = map[path];
    if (fn)
      return fn();
    throw new Error("Module not found in bundle: " + path);
  };
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require2() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
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

  // assets/js/supabase-client.js
  var import_esm, SUPABASE_URL, SUPABASE_ANON_KEY, supabase;
  var init_supabase_client = __esm({
    "assets/js/supabase-client.js"() {
      import_esm = __require("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
      SUPABASE_URL = "https://kgwvbetqffvfcbswexre.supabase.co";
      SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd3ZiZXRxZmZ2ZmNic3dleHJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NDY1MzUsImV4cCI6MjA4MDMyMjUzNX0.nQCwBiO6NpCTBOFkC4emJ2vPB6JaHj5tO06wUKI89uo";
      supabase = (0, import_esm.createClient)(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
      console.log("Supabase client initialized with hardcoded URL:", SUPABASE_URL);
    }
  });

  // assets/js/modules/classes.js
  var classes_exports = {};
  __export(classes_exports, {
    render: () => render
  });
  function render(container) {
    return __async(this, null, function* () {
      container.innerHTML = `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 class="text-xl font-bold text-gray-800">Classes & Sections</h2>
                <button id="addClassBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Class
                </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6" id="classesGrid">
                <div class="col-span-full text-center py-10 text-gray-500">Loading classes...</div>
            </div>
        </div>

        <!-- Modal -->
        <div id="classModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50 backdrop-blur-sm">
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 class="text-lg font-bold text-gray-800">Add New Class</h3>
                    <button id="closeModalBtn" class="text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form id="classForm" class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
                        <input type="text" id="className" required placeholder="e.g. Class 10" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Sections (comma separated)</label>
                        <input type="text" id="sections" required placeholder="e.g. A, B, C" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900">
                    </div>

                    <div class="flex justify-end pt-4">
                        <button type="button" id="cancelBtn" class="mr-3 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                        <button type="submit" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">Save Class</button>
                    </div>
                </form>
            </div>
        </div>
    `;
      document.getElementById("addClassBtn").addEventListener("click", openModal);
      document.getElementById("closeModalBtn").addEventListener("click", closeModal);
      document.getElementById("cancelBtn").addEventListener("click", closeModal);
      document.getElementById("classForm").addEventListener("submit", handleFormSubmit);
      yield fetchClasses();
    });
  }
  function fetchClasses() {
    return __async(this, null, function* () {
      const grid = document.getElementById("classesGrid");
      const { data, error } = yield supabase.from("classes").select("*").order("class_name", { ascending: true });
      if (error) {
        console.error("Error fetching classes:", error);
        grid.innerHTML = `<div class="col-span-full text-center text-red-500">Error: ${error.message}</div>`;
        return;
      }
      if (data.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-10 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            No classes found. Add one to get started.
        </div>`;
        return;
      }
      grid.innerHTML = data.map((cls) => `
        <div class="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow relative group">
            <div class="flex justify-between items-start mb-4">
                <div class="bg-indigo-100 text-indigo-700 font-bold text-xl h-12 w-12 rounded-lg flex items-center justify-center">
                    ${cls.class_name.replace(/[^0-9]/g, "") || cls.class_name.charAt(0)}
                </div>
                <button onclick="window.deleteClass('${cls.id}')" class="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
            <h3 class="text-lg font-bold text-gray-800 mb-2">${cls.class_name}</h3>
            <div class="flex flex-wrap gap-2">
                ${cls.sections.map((sec) => `<span class="bg-white border border-gray-200 text-gray-600 text-xs font-medium px-2.5 py-0.5 rounded">${sec}</span>`).join("")}
            </div>
        </div>
    `).join("");
    });
  }
  function openModal() {
    document.getElementById("classModal").classList.remove("hidden");
    document.getElementById("classModal").classList.add("flex");
  }
  function closeModal() {
    document.getElementById("classModal").classList.add("hidden");
    document.getElementById("classModal").classList.remove("flex");
  }
  function handleFormSubmit(e) {
    return __async(this, null, function* () {
      e.preventDefault();
      const className = document.getElementById("className").value;
      const sectionsStr = document.getElementById("sections").value;
      const sections = sectionsStr.split(",").map((s) => s.trim()).filter((s) => s);
      const { error } = yield supabase.from("classes").insert([{
        class_name: className,
        sections
      }]);
      if (error) {
        alert("Error saving class: " + error.message);
      } else {
        document.getElementById("classForm").reset();
        closeModal();
        fetchClasses();
      }
    });
  }
  var init_classes = __esm({
    "assets/js/modules/classes.js"() {
      init_supabase_client();
      window.deleteClass = (id) => __async(void 0, null, function* () {
        if (!confirm("Are you sure? This will not delete students in this class."))
          return;
        const { error } = yield supabase.from("classes").delete().eq("id", id);
        if (error) {
          alert("Error deleting class: " + error.message);
        } else {
          fetchClasses();
        }
      });
    }
  });

  // assets/js/modules/dashboard.js
  var dashboard_exports = {};
  __export(dashboard_exports, {
    render: () => render2
  });
  function render2(container) {
    return __async(this, null, function* () {
      container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <!-- Stat Cards will be injected here -->
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse h-32"></div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse h-32"></div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse h-32"></div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse h-32"></div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Fee Collection Trends</h3>
                <div style="position: relative; height: 300px;">
                    <canvas id="feesChart"></canvas>
                </div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Student Distribution</h3>
                <div style="position: relative; height: 300px;">
                    <canvas id="studentsChart"></canvas>
                </div>
            </div>
        </div>

        <!-- Students Modal -->
        <div id="dashboardStudentsModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50 backdrop-blur-sm">
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden flex flex-col max-h-[90vh]">
                <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 class="text-lg font-bold text-gray-800">All Students</h3>
                    <div class="flex items-center space-x-4">
                        <select id="dashboardClassFilter" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 bg-white">
                            <option value="all">All Classes</option>
                        </select>
                        <button id="closeDashboardModalBtn" class="text-gray-400 hover:text-gray-600">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="p-0 overflow-auto flex-1">
                    <table class="w-full text-left border-collapse">
                        <thead class="sticky top-0 bg-gray-50 shadow-sm z-10">
                            <tr class="text-gray-600 text-sm uppercase tracking-wider">
                                <th class="p-4 font-semibold">Name</th>
                                <th class="p-4 font-semibold">Roll No</th>
                                <th class="p-4 font-semibold">Class</th>
                                <th class="p-4 font-semibold">Contact</th>
                            </tr>
                        </thead>
                        <tbody id="dashboardStudentsTableBody" class="text-gray-700 text-sm divide-y divide-gray-100">
                            <!-- Rows -->
                        </tbody>
                    </table>
                </div>
                <div class="p-4 border-t border-gray-100 bg-gray-50 text-right text-xs text-gray-500">
                    Total: <span id="dashboardTotalCount">0</span>
                </div>
            </div>
        </div>
    `;
      try {
        const [studentsCount, classesCount, feesStats] = yield Promise.all([
          supabase.from("students").select("*", { count: "exact", head: true }),
          supabase.from("classes").select("*", { count: "exact", head: true }),
          supabase.from("fees").select("amount, status")
        ]);
        const totalStudents = studentsCount.count || 0;
        const totalClasses = classesCount.count || 0;
        let totalFeesIssued = 0;
        let totalFeesCollected = 0;
        let paidCount = 0;
        let unpaidCount = 0;
        if (feesStats.data) {
          feesStats.data.forEach((fee) => {
            totalFeesIssued += fee.amount || 0;
            if (fee.status === "paid") {
              totalFeesCollected += fee.amount || 0;
              paidCount++;
            } else {
              unpaidCount++;
            }
          });
        }
        const statsHtml = `
            <div id="total-students-card" class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow">
                <div>
                    <p class="text-sm font-medium text-gray-500">Total Students</p>
                    <h3 class="text-2xl font-bold text-gray-800 mt-1">${totalStudents}</h3>
                </div>
                <div class="bg-blue-50 p-3 rounded-lg">
                    <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                </div>
            </div>

            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-500">Total Classes</p>
                    <h3 class="text-2xl font-bold text-gray-800 mt-1">${totalClasses}</h3>
                </div>
                <div class="bg-purple-50 p-3 rounded-lg">
                    <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                </div>
            </div>

            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-500">Fees Collected</p>
                    <h3 class="text-2xl font-bold text-green-600 mt-1">$${totalFeesCollected.toLocaleString()}</h3>
                    <p class="text-xs text-gray-400 mt-1">out of $${totalFeesIssued.toLocaleString()}</p>
                </div>
                <div class="bg-green-50 p-3 rounded-lg">
                    <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
            </div>

            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-500">Pending Fees</p>
                    <h3 class="text-2xl font-bold text-red-600 mt-1">${unpaidCount}</h3>
                    <p class="text-xs text-gray-400 mt-1">students</p>
                </div>
                <div class="bg-red-50 p-3 rounded-lg">
                    <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
            </div>
        `;
        container.querySelector(".grid").innerHTML = statsHtml;
        const { data: students } = yield supabase.from("students").select("class");
        renderCharts(paidCount, unpaidCount, students);
        document.getElementById("total-students-card").addEventListener("click", openStudentsModal);
        document.getElementById("closeDashboardModalBtn").addEventListener("click", closeStudentsModal);
        document.getElementById("dashboardClassFilter").addEventListener("change", filterStudents);
      } catch (error) {
        console.error("Error loading dashboard stats:", error);
        container.innerHTML += `<div class="bg-red-50 p-4 rounded text-red-600">Error loading stats: ${error.message}</div>`;
      }
    });
  }
  function openStudentsModal() {
    return __async(this, null, function* () {
      const modal = document.getElementById("dashboardStudentsModal");
      modal.classList.remove("hidden");
      modal.classList.add("flex");
      yield fetchAndRenderStudents();
    });
  }
  function closeStudentsModal() {
    const modal = document.getElementById("dashboardStudentsModal");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
  function fetchAndRenderStudents() {
    return __async(this, null, function* () {
      const tbody = document.getElementById("dashboardStudentsTableBody");
      tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center">Loading...</td></tr>';
      const { data, error } = yield supabase.from("students").select("*").order("name");
      if (error) {
        tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-red-500">Error: ${error.message}</td></tr>`;
        return;
      }
      allStudents = data;
      const classes = [...new Set(data.map((s) => s.class))].sort();
      const filterSelect = document.getElementById("dashboardClassFilter");
      filterSelect.innerHTML = '<option value="all">All Classes</option>';
      classes.forEach((cls) => {
        if (cls) {
          const option = document.createElement("option");
          option.value = cls;
          option.textContent = cls;
          filterSelect.appendChild(option);
        }
      });
      renderStudentsTable(allStudents);
    });
  }
  function renderStudentsTable(students) {
    const tbody = document.getElementById("dashboardStudentsTableBody");
    const countSpan = document.getElementById("dashboardTotalCount");
    countSpan.textContent = students.length;
    if (students.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-gray-400">No students found.</td></tr>';
      return;
    }
    tbody.innerHTML = students.map((student) => `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="p-4">
                <div class="flex items-center">
                    <div class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold mr-3 text-xs">
                        ${student.name.charAt(0)}
                    </div>
                    <div class="font-medium text-gray-900">${student.name}</div>
                </div>
            </td>
            <td class="p-4 text-gray-600">${student.roll_no}</td>
            <td class="p-4 text-gray-600">${student.class} (${student.section})</td>
            <td class="p-4 text-gray-600">${student.phone || "-"}</td>
        </tr>
    `).join("");
  }
  function filterStudents(e) {
    const selectedClass = e.target.value;
    if (selectedClass === "all") {
      renderStudentsTable(allStudents);
    } else {
      const filtered = allStudents.filter((s) => s.class === selectedClass);
      renderStudentsTable(filtered);
    }
  }
  function renderCharts(paid, unpaid, students) {
    const ctxFees = document.getElementById("feesChart").getContext("2d");
    new Chart(ctxFees, {
      type: "doughnut",
      data: {
        labels: ["Paid", "Unpaid"],
        datasets: [{
          data: [paid, unpaid],
          backgroundColor: ["#10B981", "#EF4444"],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom" }
        }
      }
    });
    const classDistribution = {};
    if (students && students.length > 0) {
      students.forEach((student) => {
        const className = student.class || "Unknown";
        classDistribution[className] = (classDistribution[className] || 0) + 1;
      });
    }
    const classLabels = Object.keys(classDistribution).sort();
    const classCounts = classLabels.map((label) => classDistribution[label]);
    const ctxStudents = document.getElementById("studentsChart").getContext("2d");
    if (classLabels.length === 0) {
      const canvas = document.getElementById("studentsChart");
      canvas.parentElement.innerHTML = `
            <div class="flex items-center justify-center h-full text-gray-400">
                <p>No students added yet. Add students to see distribution.</p>
            </div>
        `;
    } else {
      new Chart(ctxStudents, {
        type: "bar",
        data: {
          labels: classLabels,
          datasets: [{
            label: "Students",
            data: classCounts,
            backgroundColor: "#6366F1",
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          }
        }
      });
    }
  }
  var allStudents;
  var init_dashboard = __esm({
    "assets/js/modules/dashboard.js"() {
      init_supabase_client();
      allStudents = [];
    }
  });

  // assets/js/modules/fee_generation.js
  var fee_generation_exports = {};
  __export(fee_generation_exports, {
    render: () => render3
  });
  function render3(container) {
    return __async(this, null, function* () {
      container.innerHTML = `
        <div class="space-y-6">
            <!-- Header -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-2">Generate Monthly Fees</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">Auto-generate fees for students based on their class fee structure</p>
            </div>

            <!-- Generation Form -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <form id="generateFeeForm" class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Month Selection -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Select Month
                            </label>
                            <input type="month" id="feeMonth" required 
                                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                        </div>

                        <!-- Target Selection -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Generate For
                            </label>
                            <select id="generateTarget" 
                                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                                <option value="all">All Students</option>
                                <option value="class">Specific Class</option>
                            </select>
                        </div>
                    </div>

                    <!-- Class Selection (Hidden by default) -->
                    <div id="classSelectContainer" class="hidden">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Select Class
                        </label>
                        <select id="classSelect" 
                            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                            <!-- Populated dynamically -->
                        </select>
                    </div>

                    <!-- Regenerate Option -->
                    <div class="flex items-center">
                        <input type="checkbox" id="regenerateExisting" 
                            class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                        <label for="regenerateExisting" class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Regenerate fees if already generated for this month
                        </label>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex justify-end space-x-3">
                        <button type="button" id="previewBtn" 
                            class="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            Preview
                        </button>
                        <button type="submit" 
                            class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Generate Fees
                        </button>
                    </div>
                </form>
            </div>

            <!-- Preview Section -->
            <div id="previewSection" class="hidden bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div class="p-6 border-b border-gray-100 dark:border-gray-700">
                    <h3 class="text-lg font-bold text-gray-800 dark:text-white">Fee Generation Preview</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1" id="previewSummary"></p>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm uppercase tracking-wider">
                                <th class="p-4 font-semibold">Student</th>
                                <th class="p-4 font-semibold">Class</th>
                                <th class="p-4 font-semibold">Fee Types</th>
                                <th class="p-4 font-semibold">Total Amount</th>
                                <th class="p-4 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody id="previewTableBody" class="text-gray-700 dark:text-gray-300 text-sm divide-y divide-gray-100 dark:divide-gray-700">
                            <!-- Populated dynamically -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
      document.getElementById("generateTarget").addEventListener("change", handleTargetChange);
      document.getElementById("previewBtn").addEventListener("click", handlePreview);
      document.getElementById("generateFeeForm").addEventListener("submit", handleGenerate);
      yield loadClasses();
    });
  }
  function loadClasses() {
    return __async(this, null, function* () {
      const select = document.getElementById("classSelect");
      const { data, error } = yield supabase.from("classes").select("class_name").order("class_name");
      if (data) {
        select.innerHTML = data.map((c) => `<option value="${c.class_name}">${c.class_name}</option>`).join("");
      }
    });
  }
  function handleTargetChange(e) {
    const container = document.getElementById("classSelectContainer");
    container.classList.toggle("hidden", e.target.value !== "class");
  }
  function handlePreview() {
    return __async(this, null, function* () {
      const month = document.getElementById("feeMonth").value;
      const target = document.getElementById("generateTarget").value;
      const className = document.getElementById("classSelect").value;
      if (!month) {
        toast.warning("Please select a month");
        return;
      }
      const previewSection = document.getElementById("previewSection");
      const tbody = document.getElementById("previewTableBody");
      previewSection.classList.remove("hidden");
      tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center">Loading preview...</td></tr>';
      let studentsQuery = supabase.from("students").select("id, name, roll_no, class");
      if (target === "class") {
        studentsQuery = studentsQuery.eq("class", className);
      }
      const { data: students, error: studentsError } = yield studentsQuery;
      if (studentsError || !students || students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-400">No students found</td></tr>';
        return;
      }
      const { data: classes } = yield supabase.from("classes").select(`
            id,
            class_name,
            class_fees (
                amount,
                fee_types (name)
            )
        `);
      const classFeesMap = {};
      classes.forEach((cls) => {
        classFeesMap[cls.class_name] = cls.class_fees || [];
      });
      const { data: existingFees } = yield supabase.from("fees").select("student_id, fee_type").eq("month", month);
      const existingFeeKeys = new Set(
        (existingFees == null ? void 0 : existingFees.map((f) => `${f.student_id}-${f.fee_type}`)) || []
      );
      const previewData = students.map((student) => {
        const classFees = classFeesMap[student.class] || [];
        const totalAmount = classFees.reduce((sum, cf) => sum + Number(cf.amount), 0);
        const hasAnyExisting = classFees.some(
          (cf) => existingFeeKeys.has(`${student.id}-${cf.fee_types.name}`)
        );
        return {
          student,
          classFees,
          totalAmount,
          hasAnyExisting
        };
      });
      tbody.innerHTML = previewData.map((item) => `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <td class="p-4">
                <div class="font-medium text-gray-900 dark:text-white">${item.student.name}</div>
                <div class="text-xs text-gray-500">Roll: ${item.student.roll_no}</div>
            </td>
            <td class="p-4">${item.student.class}</td>
            <td class="p-4">
                <div class="text-xs space-y-1">
                    ${item.classFees.map((cf) => `<div>${cf.fee_types.name}: $${Number(cf.amount).toFixed(2)}</div>`).join("")}
                </div>
            </td>
            <td class="p-4 font-medium">$${item.totalAmount.toFixed(2)}</td>
            <td class="p-4">
                ${item.hasAnyExisting ? '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Some Exist</span>' : '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">New</span>'}
            </td>
        </tr>
    `).join("");
      const newCount = previewData.filter((p) => !p.hasAnyExisting).length;
      const existingCount = previewData.filter((p) => p.hasAnyExisting).length;
      document.getElementById("previewSummary").textContent = `${previewData.length} students found (${newCount} new, ${existingCount} have some existing fees)`;
    });
  }
  function handleGenerate(e) {
    return __async(this, null, function* () {
      e.preventDefault();
      const month = document.getElementById("feeMonth").value;
      const target = document.getElementById("generateTarget").value;
      const className = document.getElementById("classSelect").value;
      const regenerate = document.getElementById("regenerateExisting").checked;
      if (!month) {
        toast.warning("Please select a month");
        return;
      }
      if (!(yield confirmDialog.show({
        title: "Generate Fees",
        message: `Generate fees for ${month}?`,
        confirmText: "Generate",
        cancelText: "Cancel",
        type: "info"
      }))) {
        return;
      }
      const btn = e.target.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>';
      try {
        let studentsQuery = supabase.from("students").select("id, name, class");
        if (target === "class") {
          studentsQuery = studentsQuery.eq("class", className);
        }
        const { data: students, error: studentsError } = yield studentsQuery;
        if (studentsError)
          throw studentsError;
        if (!students || students.length === 0) {
          toast.warning("No students found");
          btn.disabled = false;
          btn.innerHTML = originalText;
          return;
        }
        const { data: classes } = yield supabase.from("classes").select(`
                id,
                class_name,
                class_fees (
                    amount,
                    fee_types (id, name)
                )
            `);
        const classFeesMap = {};
        classes.forEach((cls) => {
          classFeesMap[cls.class_name] = cls.class_fees || [];
        });
        const { data: existingFees } = yield supabase.from("fees").select("student_id, fee_type").eq("month", month);
        const existingFeeKeys = new Set(
          (existingFees == null ? void 0 : existingFees.map((f) => `${f.student_id}-${f.fee_type}`)) || []
        );
        if (regenerate && existingFees && existingFees.length > 0) {
          const { error: deleteError } = yield supabase.from("fees").delete().eq("month", month);
          if (deleteError)
            throw deleteError;
          existingFeeKeys.clear();
        }
        const feesToInsert = [];
        let skippedCount = 0;
        for (const student of students) {
          const classFees = classFeesMap[student.class] || [];
          if (classFees.length === 0) {
            console.warn(`No fees assigned to class: ${student.class}`);
            continue;
          }
          for (const classFee of classFees) {
            const feeKey = `${student.id}-${classFee.fee_types.name}`;
            if (!regenerate && existingFeeKeys.has(feeKey)) {
              skippedCount++;
              continue;
            }
            const totalAmount = Number(classFee.amount);
            feesToInsert.push({
              student_id: student.id,
              fee_type: classFee.fee_types.name,
              month,
              amount: totalAmount,
              final_amount: totalAmount,
              paid_amount: 0,
              status: "unpaid",
              generated_at: (/* @__PURE__ */ new Date()).toISOString()
            });
          }
        }
        if (feesToInsert.length === 0) {
          toast.info("No fees to generate. All students already have fees for this month.");
          btn.disabled = false;
          btn.innerHTML = originalText;
          return;
        }
        const { error: insertError } = yield supabase.from("fees").insert(feesToInsert);
        if (insertError)
          throw insertError;
        const uniqueStudents = new Set(feesToInsert.map((f) => f.student_id)).size;
        toast.success(`Successfully generated ${feesToInsert.length} fee records for ${uniqueStudents} students!`);
        document.getElementById("generateFeeForm").reset();
      } catch (error) {
        console.error("Error generating fees:", error);
        toast.error("Error generating fees: " + error.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });
  }
  var init_fee_generation = __esm({
    "assets/js/modules/fee_generation.js"() {
      init_supabase_client();
    }
  });

  // assets/js/modules/fee_structure.js
  var fee_structure_exports = {};
  __export(fee_structure_exports, {
    render: () => render4
  });
  function render4(container) {
    return __async(this, null, function* () {
      container.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-200">
            <div class="p-6 border-b border-gray-100 dark:border-gray-700">
                <h2 class="text-xl font-bold text-gray-800 dark:text-white">Fee Structure Management</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage fee types and assign fees to classes.</p>
            </div>
            
            <div class="p-6">
                <!-- Tabs -->
                <div class="flex space-x-4 border-b border-gray-200 dark:border-gray-700 mb-6">
                    <button id="tabFeeTypes" class="px-4 py-2 text-sm font-medium text-indigo-600 border-b-2 border-indigo-600 focus:outline-none">Fee Types</button>
                    <button id="tabClassFees" class="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none">Class Fees</button>
                </div>

                <!-- Fee Types Content -->
                <div id="contentFeeTypes">
                    <div class="flex justify-end mb-4">
                        <button id="addFeeTypeBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Add Fee Type
                        </button>
                    </div>
                    
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm uppercase tracking-wider">
                                    <th class="p-4 font-semibold rounded-tl-lg">Name</th>
                                    <th class="p-4 font-semibold">Description</th>
                                    <th class="p-4 font-semibold">Default Amount</th>
                                    <th class="p-4 font-semibold text-right rounded-tr-lg">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="feeTypesTableBody" class="text-gray-700 dark:text-gray-300 text-sm divide-y divide-gray-100 dark:divide-gray-700">
                                <tr><td colspan="3" class="p-4 text-center">Loading...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Class Fees Content -->
                <div id="contentClassFees" class="hidden">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <!-- Class Selection -->
                        <div class="md:col-span-1 border-r border-gray-200 dark:border-gray-700 pr-6">
                            <h3 class="font-semibold text-gray-800 dark:text-white mb-4">Select Class</h3>
                            <div id="classList" class="space-y-2">
                                <p class="text-sm text-gray-500">Loading classes...</p>
                            </div>
                        </div>

                        <!-- Fees for Selected Class -->
                        <div class="md:col-span-2">
                            <div id="classFeesContainer" class="hidden">
                                <div class="flex justify-between items-center mb-4">
                                    <h3 class="font-semibold text-gray-800 dark:text-white" id="selectedClassName">Class Fees</h3>
                                    <button id="assignFeeBtn" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                                        </svg>
                                        Assign Fee
                                    </button>
                                </div>
                                
                                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                    <table class="w-full text-sm">
                                        <thead>
                                            <tr class="text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                                                <th class="text-left pb-2">Fee Type</th>
                                                <th class="text-right pb-2">Amount</th>
                                                <th class="text-right pb-2">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody id="classFeesTableBody" class="text-gray-700 dark:text-gray-300">
                                            <!-- Dynamic Rows -->
                                        </tbody>
                                        <tfoot class="border-t border-gray-200 dark:border-gray-600">
                                            <tr>
                                                <td class="pt-3 font-bold text-gray-800 dark:text-white">Total</td>
                                                <td class="pt-3 text-right font-bold text-gray-800 dark:text-white" id="totalClassFee">0.00</td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                            <div id="noClassSelected" class="flex flex-col items-center justify-center h-64 text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                <p>Select a class to manage its fee structure</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Fee Type Modal -->
        <div id="feeTypeModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50 backdrop-blur-sm">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transform transition-all">
                <div class="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700">
                    <h3 class="text-lg font-bold text-gray-800 dark:text-white" id="feeTypeModalTitle">Add Fee Type</h3>
                    <button id="closeFeeTypeModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form id="feeTypeForm" class="p-6 space-y-4">
                    <input type="hidden" id="feeTypeId">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fee Name</label>
                        <input type="text" id="feeTypeName" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="e.g. Lab Fee">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <textarea id="feeTypeDesc" rows="3" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"></textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Amount</label>
                        <input type="number" id="feeTypeDefaultAmount" min="0" step="0.01" value="0" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="0.00">
                    </div>
                    <div class="flex items-center">
                        <input type="checkbox" id="feeTypeAllowCustom" checked class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                        <label for="feeTypeAllowCustom" class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Allow custom amount for each student
                        </label>
                    </div>
                    <div class="flex justify-end pt-4">
                        <button type="button" id="cancelFeeTypeBtn" class="mr-3 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition-colors">Cancel</button>
                        <button type="submit" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">Save</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Assign Fee Modal -->
        <div id="assignFeeModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50 backdrop-blur-sm">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transform transition-all">
                <div class="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700">
                    <h3 class="text-lg font-bold text-gray-800 dark:text-white">Assign Fee to Class</h3>
                    <button id="closeAssignFeeModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form id="assignFeeForm" class="p-6 space-y-4">
                    <input type="hidden" id="assignClassId">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fee Type</label>
                        <select id="assignFeeTypeSelect" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                            <!-- Options populated dynamically -->
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                        <input type="number" id="assignAmount" required min="0" step="0.01" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    </div>
                    <div class="flex justify-end pt-4">
                        <button type="button" id="cancelAssignFeeBtn" class="mr-3 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition-colors">Cancel</button>
                        <button type="submit" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">Assign</button>
                    </div>
                </form>
            </div>
        </div>
    `;
      const tabFeeTypes = document.getElementById("tabFeeTypes");
      const tabClassFees = document.getElementById("tabClassFees");
      const contentFeeTypes = document.getElementById("contentFeeTypes");
      const contentClassFees = document.getElementById("contentClassFees");
      tabFeeTypes.addEventListener("click", () => {
        tabFeeTypes.classList.add("text-indigo-600", "border-b-2", "border-indigo-600");
        tabFeeTypes.classList.remove("text-gray-500", "dark:text-gray-400");
        tabClassFees.classList.remove("text-indigo-600", "border-b-2", "border-indigo-600");
        tabClassFees.classList.add("text-gray-500", "dark:text-gray-400");
        contentFeeTypes.classList.remove("hidden");
        contentClassFees.classList.add("hidden");
      });
      tabClassFees.addEventListener("click", () => {
        tabClassFees.classList.add("text-indigo-600", "border-b-2", "border-indigo-600");
        tabClassFees.classList.remove("text-gray-500", "dark:text-gray-400");
        tabFeeTypes.classList.remove("text-indigo-600", "border-b-2", "border-indigo-600");
        tabFeeTypes.classList.add("text-gray-500", "dark:text-gray-400");
        contentClassFees.classList.remove("hidden");
        contentFeeTypes.classList.add("hidden");
        fetchClasses2();
      });
      document.getElementById("addFeeTypeBtn").addEventListener("click", () => openFeeTypeModal());
      document.getElementById("closeFeeTypeModal").addEventListener("click", closeFeeTypeModal);
      document.getElementById("cancelFeeTypeBtn").addEventListener("click", closeFeeTypeModal);
      document.getElementById("feeTypeForm").addEventListener("submit", handleFeeTypeSubmit);
      document.getElementById("assignFeeBtn").addEventListener("click", openAssignFeeModal);
      document.getElementById("closeAssignFeeModal").addEventListener("click", closeAssignFeeModal);
      document.getElementById("cancelAssignFeeBtn").addEventListener("click", closeAssignFeeModal);
      document.getElementById("assignFeeForm").addEventListener("submit", handleAssignFeeSubmit);
      yield fetchFeeTypes();
    });
  }
  function fetchFeeTypes() {
    return __async(this, null, function* () {
      const tbody = document.getElementById("feeTypesTableBody");
      tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center">Loading...</td></tr>';
      const { data, error } = yield supabase.from("fee_types").select("*").order("name");
      if (error) {
        console.error("Error fetching fee types:", error);
        tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-red-500">Error: ${error.message}</td></tr>`;
        return;
      }
      if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-gray-400">No fee types defined.</td></tr>';
        return;
      }
      tbody.innerHTML = data.map((type) => `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0">
            <td class="p-4 font-medium text-gray-900 dark:text-white">${type.name}</td>
            <td class="p-4 text-gray-600 dark:text-gray-300">${type.description || "-"}</td>
            <td class="p-4 text-gray-600 dark:text-gray-300">$${Number(type.default_amount || 0).toFixed(2)}</td>
            <td class="p-4 text-right">
                <button onclick="window.editFeeType('${type.id}', '${type.name}', '${type.description || ""}', ${type.default_amount || 0}, ${type.allow_custom !== false})" class="text-indigo-600 hover:text-indigo-900 dark:hover:text-indigo-400 mr-3">Edit</button>
                <button onclick="window.deleteFeeType('${type.id}')" class="text-red-600 hover:text-red-900 dark:hover:text-red-400">Delete</button>
            </td>
        </tr>
    `).join("");
    });
  }
  function openFeeTypeModal(id = "", name = "", description = "", defaultAmount = 0, allowCustom = true) {
    const modal = document.getElementById("feeTypeModal");
    const title = document.getElementById("feeTypeModalTitle");
    document.getElementById("feeTypeId").value = id;
    document.getElementById("feeTypeName").value = name;
    document.getElementById("feeTypeDesc").value = description;
    document.getElementById("feeTypeDefaultAmount").value = defaultAmount;
    document.getElementById("feeTypeAllowCustom").checked = allowCustom;
    title.textContent = id ? "Edit Fee Type" : "Add Fee Type";
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }
  function closeFeeTypeModal() {
    const modal = document.getElementById("feeTypeModal");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
  function handleFeeTypeSubmit(e) {
    return __async(this, null, function* () {
      e.preventDefault();
      const id = document.getElementById("feeTypeId").value;
      const name = document.getElementById("feeTypeName").value;
      const description = document.getElementById("feeTypeDesc").value;
      const defaultAmount = document.getElementById("feeTypeDefaultAmount").value;
      const allowCustom = document.getElementById("feeTypeAllowCustom").checked;
      const feeTypeData = {
        name,
        description,
        default_amount: defaultAmount,
        allow_custom: allowCustom
      };
      let error;
      if (id) {
        const res = yield supabase.from("fee_types").update(feeTypeData).eq("id", id);
        error = res.error;
      } else {
        const res = yield supabase.from("fee_types").insert([feeTypeData]);
        error = res.error;
      }
      if (error) {
        toast.error("Error saving fee type: " + error.message);
      } else {
        closeFeeTypeModal();
        fetchFeeTypes();
      }
    });
  }
  function fetchClasses2() {
    return __async(this, null, function* () {
      const container = document.getElementById("classList");
      container.innerHTML = '<p class="text-sm text-gray-500">Loading...</p>';
      const { data, error } = yield supabase.from("classes").select("*").order("class_name");
      if (error) {
        container.innerHTML = `<p class="text-sm text-red-500">Error: ${error.message}</p>`;
        return;
      }
      if (data.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-400">No classes found.</p>';
        return;
      }
      container.innerHTML = data.map((cls) => `
        <button onclick="window.selectClass('${cls.id}', '${cls.class_name}')" 
            class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${selectedClassId === cls.id ? "bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300" : "text-gray-700 dark:text-gray-300"}">
            ${cls.class_name}
        </button>
    `).join("");
    });
  }
  function fetchClassFees(classId) {
    return __async(this, null, function* () {
      const tbody = document.getElementById("classFeesTableBody");
      const tfoot = document.getElementById("totalClassFee");
      tbody.innerHTML = '<tr><td colspan="3" class="py-4 text-center text-gray-400">Loading fees...</td></tr>';
      const { data, error } = yield supabase.from("class_fees").select(`
            id,
            amount,
            fee_types (id, name)
        `).eq("class_id", classId);
      if (error) {
        tbody.innerHTML = `<tr><td colspan="3" class="py-4 text-center text-red-500">Error: ${error.message}</td></tr>`;
        return;
      }
      if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="py-4 text-center text-gray-400">No fees assigned to this class.</td></tr>';
        tfoot.textContent = "0.00";
        return;
      }
      let total = 0;
      tbody.innerHTML = data.map((item) => {
        var _a;
        total += Number(item.amount);
        return `
            <tr class="border-b border-gray-100 dark:border-gray-700 last:border-0">
                <td class="py-3 text-gray-800 dark:text-gray-200">${((_a = item.fee_types) == null ? void 0 : _a.name) || "Unknown"}</td>
                <td class="py-3 text-right text-gray-800 dark:text-gray-200">${Number(item.amount).toFixed(2)}</td>
                <td class="py-3 text-right">
                    <button onclick="window.deleteClassFee('${item.id}')" class="text-red-500 hover:text-red-700 text-xs">Remove</button>
                </td>
            </tr>
        `;
      }).join("");
      tfoot.textContent = total.toFixed(2);
    });
  }
  function openAssignFeeModal() {
    return __async(this, null, function* () {
      if (!selectedClassId)
        return;
      const modal = document.getElementById("assignFeeModal");
      const select = document.getElementById("assignFeeTypeSelect");
      select.innerHTML = "<option>Loading...</option>";
      const { data } = yield supabase.from("fee_types").select("*").order("name");
      if (data) {
        select.innerHTML = data.map((type) => `<option value="${type.id}">${type.name}</option>`).join("");
      }
      document.getElementById("assignClassId").value = selectedClassId;
      document.getElementById("assignAmount").value = "";
      modal.classList.remove("hidden");
      modal.classList.add("flex");
    });
  }
  function closeAssignFeeModal() {
    const modal = document.getElementById("assignFeeModal");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
  function handleAssignFeeSubmit(e) {
    return __async(this, null, function* () {
      e.preventDefault();
      const classId = document.getElementById("assignClassId").value;
      const feeTypeId = document.getElementById("assignFeeTypeSelect").value;
      const amount = document.getElementById("assignAmount").value;
      const { error } = yield supabase.from("class_fees").insert([{
        class_id: classId,
        fee_type_id: feeTypeId,
        amount
      }]);
      if (error) {
        if (error.code === "23505") {
          toast.warning("This fee type is already assigned to this class.");
        } else {
          toast.error("Error assigning fee: " + error.message);
        }
      } else {
        closeAssignFeeModal();
        fetchClassFees(classId);
      }
    });
  }
  var selectedClassId;
  var init_fee_structure = __esm({
    "assets/js/modules/fee_structure.js"() {
      init_supabase_client();
      window.editFeeType = openFeeTypeModal;
      window.deleteFeeType = (id) => __async(void 0, null, function* () {
        if (!confirm("Are you sure? This will delete the fee type and remove it from all classes."))
          return;
        const { error } = yield supabase.from("fee_types").delete().eq("id", id);
        if (error) {
          toast.error("Error deleting fee type: " + error.message);
        } else {
          fetchFeeTypes();
        }
      });
      selectedClassId = null;
      window.selectClass = (id, name) => __async(void 0, null, function* () {
        selectedClassId = id;
        document.getElementById("selectedClassName").textContent = `${name} Fees`;
        document.getElementById("noClassSelected").classList.add("hidden");
        document.getElementById("classFeesContainer").classList.remove("hidden");
        fetchClasses2();
        fetchClassFees(id);
      });
      window.deleteClassFee = (id) => __async(void 0, null, function* () {
        if (!confirm("Remove this fee from the class?"))
          return;
        const { error } = yield supabase.from("class_fees").delete().eq("id", id);
        if (error) {
          toast.error("Error removing fee: " + error.message);
        } else {
          fetchClassFees(selectedClassId);
        }
      });
    }
  });

  // assets/js/modules/fees.js
  var fees_exports = {};
  __export(fees_exports, {
    render: () => render5
  });
  function render5(container) {
    return __async(this, null, function* () {
      container.innerHTML = `
        <div class="space-y-6">
            <!-- Header with Stats -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-500 dark:text-gray-400">Total Fees</p>
                            <p class="text-2xl font-bold text-gray-800 dark:text-white" id="statTotalFees">$0</p>
                        </div>
                        <div class="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-600 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-500 dark:text-gray-400">Collected</p>
                            <p class="text-2xl font-bold text-green-600 dark:text-green-400" id="statCollected">$0</p>
                        </div>
                        <div class="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-500 dark:text-gray-400">Pending</p>
                            <p class="text-2xl font-bold text-red-600 dark:text-red-400" id="statPending">$0</p>
                        </div>
                        <div class="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-600 dark:text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-500 dark:text-gray-400">Collection Rate</p>
                            <p class="text-2xl font-bold text-indigo-600 dark:text-indigo-400" id="statRate">0%</p>
                        </div>
                        <div class="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-600 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Filters and Search -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search Student</label>
                        <input type="text" id="searchStudent" placeholder="Name or Roll No" 
                            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Class</label>
                        <select id="filterClass" 
                            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                            <option value="">All Classes</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Month</label>
                        <input type="month" id="filterMonth" 
                            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                        <select id="filterStatus" 
                            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                            <option value="">All Status</option>
                            <option value="paid">Paid</option>
                            <option value="unpaid">Unpaid</option>
                            <option value="partial">Partial</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Fee Collection Table -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm uppercase tracking-wider">
                                <th class="p-4 font-semibold">Student</th>
                                <th class="p-4 font-semibold">Fee Type</th>
                                <th class="p-4 font-semibold">Month</th>
                                <th class="p-4 font-semibold">Total Amount</th>
                                <th class="p-4 font-semibold">Paid</th>
                                <th class="p-4 font-semibold">Balance</th>
                                <th class="p-4 font-semibold">Status</th>
                                <th class="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="feesTableBody" class="text-gray-700 dark:text-gray-300 text-sm divide-y divide-gray-100 dark:divide-gray-700">
                            <tr><td colspan="8" class="p-4 text-center">Loading...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Payment Modal -->
        <div id="paymentModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50 backdrop-blur-sm">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
                <div class="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700">
                    <h3 class="text-lg font-bold text-gray-800 dark:text-white">Collect Payment</h3>
                    <button id="closePaymentModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="p-6 overflow-y-auto flex-1">
                    <input type="hidden" id="paymentFeeId">
                    <input type="hidden" id="paymentStudentId">
                    
                    <!-- Fee Details -->
                    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p class="text-gray-500 dark:text-gray-400">Student</p>
                                <p class="font-medium text-gray-800 dark:text-white" id="paymentStudentName">-</p>
                            </div>
                            <div>
                                <p class="text-gray-500 dark:text-gray-400">Fee Type</p>
                                <p class="font-medium text-gray-800 dark:text-white" id="paymentFeeType">-</p>
                            </div>
                            <div>
                                <p class="text-gray-500 dark:text-gray-400">Total Amount</p>
                                <p class="font-medium text-gray-800 dark:text-white" id="paymentTotalAmount">$0</p>
                            </div>
                            <div>
                                <p class="text-gray-500 dark:text-gray-400">Already Paid</p>
                                <p class="font-medium text-green-600 dark:text-green-400" id="paymentAlreadyPaid">$0</p>
                            </div>
                            <div class="col-span-2">
                                <p class="text-gray-500 dark:text-gray-400">Remaining Balance</p>
                                <p class="text-2xl font-bold text-red-600 dark:text-red-400" id="paymentBalance">$0</p>
                            </div>
                        </div>
                    </div>

                    <!-- Payment Form -->
                    <form id="paymentForm" class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount Paying</label>
                                <input type="number" id="paymentAmount" required min="0.01" step="0.01" 
                                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Date</label>
                                <input type="date" id="paymentDate" required 
                                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method</label>
                            <select id="paymentMethod" required 
                                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                                <option value="Cash">Cash</option>
                                <option value="Bank">Bank Transfer</option>
                                <option value="JazzCash">JazzCash</option>
                                <option value="EasyPaisa">EasyPaisa</option>
                                <option value="Cheque">Cheque</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes (Optional)</label>
                            <textarea id="paymentNotes" rows="3" 
                                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"></textarea>
                        </div>
                    </form>

                    <!-- Payment History -->
                    <div class="mt-6">
                        <h4 class="font-semibold text-gray-800 dark:text-white mb-3">Payment History</h4>
                        <div id="paymentHistory" class="space-y-2 max-h-40 overflow-y-auto">
                            <!-- Populated dynamically -->
                        </div>
                    </div>
                </div>
                <div class="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                    <div class="flex justify-end space-x-3">
                        <button type="button" id="cancelPaymentBtn" class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition-colors">
                            Cancel
                        </button>
                        <button type="button" id="submitPaymentBtn" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                            Record Payment
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
      document.getElementById("searchStudent").addEventListener("input", debounce(fetchFees, 300));
      document.getElementById("filterClass").addEventListener("change", fetchFees);
      document.getElementById("filterMonth").addEventListener("change", fetchFees);
      document.getElementById("filterStatus").addEventListener("change", fetchFees);
      document.getElementById("closePaymentModal").addEventListener("click", closePaymentModal);
      document.getElementById("cancelPaymentBtn").addEventListener("click", closePaymentModal);
      document.getElementById("submitPaymentBtn").addEventListener("click", handlePayment);
      document.getElementById("paymentDate").valueAsDate = /* @__PURE__ */ new Date();
      yield loadClasses2();
      yield fetchStats();
      yield fetchFees();
    });
  }
  function loadClasses2() {
    return __async(this, null, function* () {
      const select = document.getElementById("filterClass");
      const { data } = yield supabase.from("classes").select("class_name").order("class_name");
      if (data) {
        const options = data.map((c) => `<option value="${c.class_name}">${c.class_name}</option>`).join("");
        select.innerHTML = '<option value="">All Classes</option>' + options;
      }
    });
  }
  function fetchStats() {
    return __async(this, null, function* () {
      const { data, error } = yield supabase.from("fees").select("final_amount, paid_amount");
      if (error) {
        console.error("Error fetching stats:", error);
        return;
      }
      const totalFees = data.reduce((sum, f) => sum + Number(f.final_amount || 0), 0);
      const collected = data.reduce((sum, f) => sum + Number(f.paid_amount || 0), 0);
      const pending = totalFees - collected;
      const rate = totalFees > 0 ? collected / totalFees * 100 : 0;
      document.getElementById("statTotalFees").textContent = `$${totalFees.toFixed(2)}`;
      document.getElementById("statCollected").textContent = `$${collected.toFixed(2)}`;
      document.getElementById("statPending").textContent = `$${pending.toFixed(2)}`;
      document.getElementById("statRate").textContent = `${rate.toFixed(1)}%`;
    });
  }
  function fetchFees() {
    return __async(this, null, function* () {
      const tbody = document.getElementById("feesTableBody");
      tbody.innerHTML = '<tr><td colspan="8" class="p-4 text-center">Loading...</td></tr>';
      const search = document.getElementById("searchStudent").value.toLowerCase();
      const classFilter = document.getElementById("filterClass").value;
      const monthFilter = document.getElementById("filterMonth").value;
      const statusFilter = document.getElementById("filterStatus").value;
      let query = supabase.from("fees").select(`
            *,
            students (id, name, roll_no, class)
        `).order("issued_at", { ascending: false });
      if (monthFilter) {
        query = query.eq("month", monthFilter);
      }
      if (statusFilter) {
        query = query.eq("status", statusFilter);
      }
      const { data, error } = yield query;
      if (error) {
        console.error("Error fetching fees:", error);
        tbody.innerHTML = `<tr><td colspan="8" class="p-4 text-center text-red-500">Error: ${error.message}</td></tr>`;
        return;
      }
      let filteredData = data;
      if (search) {
        filteredData = filteredData.filter(
          (fee) => {
            var _a, _b;
            return ((_a = fee.students) == null ? void 0 : _a.name.toLowerCase().includes(search)) || ((_b = fee.students) == null ? void 0 : _b.roll_no.toLowerCase().includes(search));
          }
        );
      }
      if (classFilter) {
        filteredData = filteredData.filter((fee) => {
          var _a;
          return ((_a = fee.students) == null ? void 0 : _a.class) === classFilter;
        });
      }
      if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="p-4 text-center text-gray-400">No fee records found.</td></tr>';
        return;
      }
      tbody.innerHTML = filteredData.map((fee) => {
        var _a, _b, _c, _d, _e;
        const finalAmount = Number(fee.final_amount || 0);
        const paidAmount = Number(fee.paid_amount || 0);
        const balance = finalAmount - paidAmount;
        return `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td class="p-4">
                    <div class="font-medium text-gray-900 dark:text-white">${((_a = fee.students) == null ? void 0 : _a.name) || "Unknown"}</div>
                    <div class="text-xs text-gray-500">Roll: ${((_b = fee.students) == null ? void 0 : _b.roll_no) || "-"} | Class: ${((_c = fee.students) == null ? void 0 : _c.class) || "-"}</div>
                </td>
                <td class="p-4 text-gray-600 dark:text-gray-300">${fee.fee_type}</td>
                <td class="p-4 text-gray-600 dark:text-gray-300">${fee.month}</td>
                <td class="p-4 font-medium text-gray-800 dark:text-gray-200">$${finalAmount.toFixed(2)}</td>
                <td class="p-4 font-medium text-green-600 dark:text-green-400">$${paidAmount.toFixed(2)}</td>
                <td class="p-4 font-medium ${balance > 0 ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-300"}">$${balance.toFixed(2)}</td>
                <td class="p-4">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${fee.status === "paid" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : fee.status === "partial" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"}">
                        ${fee.status.toUpperCase()}
                    </span>
                </td>
                <td class="p-4 text-right">
                    ${balance > 0 ? `
                        <button onclick="window.openPayment('${fee.id}', '${(_d = fee.students) == null ? void 0 : _d.id}', '${(_e = fee.students) == null ? void 0 : _e.name}', '${fee.fee_type}', ${finalAmount}, ${paidAmount})" 
                            class="text-indigo-600 hover:text-indigo-900 dark:hover:text-indigo-400 font-medium text-sm">
                            Collect
                        </button>
                    ` : '<span class="text-gray-400 text-sm">Paid</span>'}
                </td>
            </tr>
        `;
      }).join("");
    });
  }
  function loadPaymentHistory(feeId) {
    return __async(this, null, function* () {
      const container = document.getElementById("paymentHistory");
      container.innerHTML = '<p class="text-sm text-gray-500">Loading...</p>';
      const { data, error } = yield supabase.from("fee_payments").select("*").eq("fee_id", feeId).order("payment_date", { ascending: false });
      if (error) {
        container.innerHTML = '<p class="text-sm text-red-500">Error loading history</p>';
        return;
      }
      if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-400">No previous payments</p>';
        return;
      }
      container.innerHTML = data.map((payment) => `
        <div class="flex justify-between items-center text-sm bg-gray-100 dark:bg-gray-600 p-2 rounded">
            <div>
                <span class="font-medium text-gray-800 dark:text-white">$${Number(payment.amount_paid).toFixed(2)}</span>
                <span class="text-gray-500 dark:text-gray-400 ml-2">${payment.payment_method}</span>
            </div>
            <span class="text-gray-500 dark:text-gray-400">${new Date(payment.payment_date).toLocaleDateString()}</span>
        </div>
    `).join("");
    });
  }
  function closePaymentModal() {
    const modal = document.getElementById("paymentModal");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    document.getElementById("paymentForm").reset();
    document.getElementById("paymentDate").valueAsDate = /* @__PURE__ */ new Date();
  }
  function handlePayment() {
    return __async(this, null, function* () {
      const feeId = document.getElementById("paymentFeeId").value;
      const studentId = document.getElementById("paymentStudentId").value;
      const amount = document.getElementById("paymentAmount").value;
      const date = document.getElementById("paymentDate").value;
      const method = document.getElementById("paymentMethod").value;
      const notes = document.getElementById("paymentNotes").value;
      if (!amount || amount <= 0) {
        toast.warning("Please enter a valid amount");
        return;
      }
      const btn = document.getElementById("submitPaymentBtn");
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Processing...";
      try {
        const { error: paymentError } = yield supabase.from("fee_payments").insert([{
          fee_id: feeId,
          student_id: studentId,
          amount_paid: amount,
          payment_date: date,
          payment_method: method,
          notes
        }]);
        if (paymentError)
          throw paymentError;
        toast.success("Payment recorded successfully!");
        closePaymentModal();
        yield fetchStats();
        yield fetchFees();
      } catch (error) {
        console.error("Error recording payment:", error);
        toast.error("Error recording payment: " + error.message);
      } finally {
        btn.disabled = false;
        btn.textContent = originalText;
      }
    });
  }
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  var init_fees = __esm({
    "assets/js/modules/fees.js"() {
      init_supabase_client();
      window.openPayment = (feeId, studentId, studentName, feeType, totalAmount, paidAmount) => __async(void 0, null, function* () {
        const balance = totalAmount - paidAmount;
        document.getElementById("paymentFeeId").value = feeId;
        document.getElementById("paymentStudentId").value = studentId;
        document.getElementById("paymentStudentName").textContent = studentName;
        document.getElementById("paymentFeeType").textContent = feeType;
        document.getElementById("paymentTotalAmount").textContent = `$${totalAmount.toFixed(2)}`;
        document.getElementById("paymentAlreadyPaid").textContent = `$${paidAmount.toFixed(2)}`;
        document.getElementById("paymentBalance").textContent = `$${balance.toFixed(2)}`;
        document.getElementById("paymentAmount").value = balance.toFixed(2);
        document.getElementById("paymentAmount").max = balance;
        yield loadPaymentHistory(feeId);
        const modal = document.getElementById("paymentModal");
        modal.classList.remove("hidden");
        modal.classList.add("flex");
      });
    }
  });

  // assets/js/modules/settings.js
  var settings_exports = {};
  __export(settings_exports, {
    render: () => render6
  });
  function render6(container) {
    return __async(this, null, function* () {
      container.innerHTML = `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden max-w-3xl mx-auto">
            <div class="p-6 border-b border-gray-100">
                <h2 class="text-xl font-bold text-gray-800">School Settings</h2>
                <p class="text-sm text-gray-500 mt-1">Manage your school profile and default configurations.</p>
            </div>
            
            <form id="settingsForm" class="p-6 space-y-6">
                <input type="hidden" id="settingsId">
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                    <input type="text" id="schoolName" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                    <input type="url" id="logoUrl" placeholder="https://example.com/logo.png" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900">
                    <p class="text-xs text-gray-400 mt-1">Direct link to your school logo image.</p>
                </div>

                <div class="border-t border-gray-100 pt-6">
                    <h3 class="text-lg font-medium text-gray-800 mb-4">Default Fee Structure</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Default Tuition Fee</label>
                            <input type="number" id="defaultTuition" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Default Transport Fee</label>
                            <input type="number" id="defaultTransport" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900">
                        </div>
                    </div>
                </div>

                <div class="flex justify-end pt-4">
                    <button type="submit" id="saveBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-200">
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    `;
      document.getElementById("settingsForm").addEventListener("submit", handleSave);
      yield fetchSettings();
    });
  }
  function fetchSettings() {
    return __async(this, null, function* () {
      const { data, error } = yield supabase.from("settings").select("*").limit(1).single();
      if (error && error.code !== "PGRST116") {
        console.error("Error fetching settings:", error);
        return;
      }
      if (data) {
        document.getElementById("settingsId").value = data.id;
        document.getElementById("schoolName").value = data.school_name || "";
        document.getElementById("logoUrl").value = data.logo_url || "";
        if (data.default_fee_structure) {
          document.getElementById("defaultTuition").value = data.default_fee_structure.tuition || 0;
          document.getElementById("defaultTransport").value = data.default_fee_structure.transport || 0;
        }
      }
    });
  }
  function handleSave(e) {
    return __async(this, null, function* () {
      e.preventDefault();
      const btn = document.getElementById("saveBtn");
      btn.disabled = true;
      btn.textContent = "Saving...";
      const id = document.getElementById("settingsId").value;
      const schoolName = document.getElementById("schoolName").value;
      const logoUrl = document.getElementById("logoUrl").value;
      const defaultTuition = document.getElementById("defaultTuition").value;
      const defaultTransport = document.getElementById("defaultTransport").value;
      const payload = {
        school_name: schoolName,
        logo_url: logoUrl,
        default_fee_structure: {
          tuition: defaultTuition,
          transport: defaultTransport
        }
      };
      let error;
      if (id) {
        const res = yield supabase.from("settings").update(payload).eq("id", id);
        error = res.error;
      } else {
        const res = yield supabase.from("settings").insert([payload]);
        error = res.error;
      }
      if (error) {
        alert("Error saving settings: " + error.message);
      } else {
        alert("Settings saved successfully!");
      }
      btn.disabled = false;
      btn.textContent = "Save Changes";
    });
  }
  var init_settings = __esm({
    "assets/js/modules/settings.js"() {
      init_supabase_client();
    }
  });

  // assets/js/modules/students.js
  var students_exports = {};
  __export(students_exports, {
    render: () => render7
  });
  function render7(container) {
    return __async(this, null, function* () {
      container.innerHTML = `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 class="text-xl font-bold text-gray-800">Students Directory</h2>
                <div class="flex space-x-3">
                    <input type="text" id="searchInput" placeholder="Search students..." class="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900">
                    
                    <!-- Dropdown Button -->
                    <div class="relative">
                        <button id="addStudentDropdown" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Add Student
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        
                        <!-- Dropdown Menu -->
                        <div id="studentDropdownMenu" class="hidden absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
                            <button id="addSingleStudent" class="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center transition-colors border-b border-gray-100">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <div>
                                    <div class="font-medium text-gray-900">Add a Student</div>
                                    <div class="text-xs text-gray-500">Single admission</div>
                                </div>
                            </button>
                            <button id="addBulkStudents" class="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <div>
                                    <div class="font-medium text-gray-900">Add Bulk Students</div>
                                    <div class="text-xs text-gray-500">Upload Excel file</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                            <th class="p-4 font-semibold">Name</th>
                            <th class="p-4 font-semibold">Roll No</th>
                            <th class="p-4 font-semibold">Class</th>
                            <th class="p-4 font-semibold">Contact</th>
                            <th class="p-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="studentsTableBody" class="text-gray-700 text-sm divide-y divide-gray-100">
                        <tr><td colspan="5" class="p-4 text-center">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
            
            <!-- Pagination (Simple) -->
            <div class="p-4 border-t border-gray-100 flex justify-end">
                <span class="text-xs text-gray-400">Showing all records</span>
            </div>
        </div>

        <!-- Modal -->
        <div id="studentModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50 backdrop-blur-sm">
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden transform transition-all">
                <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 class="text-lg font-bold text-gray-800" id="modalTitle">Add New Student</h3>
                    <button id="closeModalBtn" class="text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form id="studentForm" class="p-6 space-y-4">
                    <input type="hidden" id="studentId">
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input type="text" id="name" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                            <input type="text" id="roll_no" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900">
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Class</label>
                            <select id="class" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900">
                                <option value="">Select Class</option>
                                <!-- Populated dynamically -->
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Section</label>
                            <select id="section" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900">
                                <option value="">Select Section</option>
                                <!-- Populated dynamically based on class -->
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" id="email" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input type="tel" id="phone" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900">
                        </div>
                    </div>

                     <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                        <select id="gender" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900">
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div class="flex justify-end pt-4">
                        <button type="button" id="cancelBtn" class="mr-3 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                        <button type="submit" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">Save Student</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Bulk Upload Modal -->
        <div id="bulkUploadModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50 backdrop-blur-sm">
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden transform transition-all">
                <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 class="text-lg font-bold text-gray-800">Add Bulk Students</h3>
                    <button id="closeBulkModalBtn" class="text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="p-6">
                    <!-- Instructions -->
                    <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <svg class="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                                </svg>
                            </div>
                            <div class="ml-3">
                                <p class="text-sm text-blue-700">
                                    <strong>Instructions:</strong> Download the Excel template, fill in student details, and upload the file to add multiple students at once.
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Download Template -->
                    <div class="mb-6">
                        <button id="downloadTemplateBtn" class="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download Excel Template
                        </button>
                    </div>

                    <!-- Upload File -->
                    <div class="mb-6">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Upload Filled Excel File</label>
                        <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors">
                            <input type="file" id="excelFileInput" accept=".xlsx,.xls" class="hidden">
                            <label for="excelFileInput" class="cursor-pointer">
                                <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                                <p class="mt-2 text-sm text-gray-600">Click to select Excel file or drag and drop</p>
                                <p class="text-xs text-gray-500">XLSX or XLS files only</p>
                            </label>
                        </div>
                        <p id="selectedFileName" class="mt-2 text-sm text-gray-600"></p>
                    </div>

                    <!-- Preview/Errors -->
                    <div id="uploadResults" class="hidden mb-6">
                        <h4 class="font-semibold text-gray-800 mb-2">Upload Summary</h4>
                        <div id="uploadSummary" class="bg-gray-50 rounded-lg p-4 text-sm"></div>
                    </div>

                    <!-- Actions -->
                    <div class="flex justify-end space-x-3">
                        <button type="button" id="cancelBulkBtn" class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                        <button type="button" id="uploadStudentsBtn" disabled class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Upload Students</button>
                    </div>
                </div>
            </div>
        </div>
    `;
      const dropdown = document.getElementById("addStudentDropdown");
      const dropdownMenu = document.getElementById("studentDropdownMenu");
      dropdown.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle("hidden");
      });
      document.addEventListener("click", () => {
        dropdownMenu.classList.add("hidden");
      });
      document.getElementById("addSingleStudent").addEventListener("click", () => {
        dropdownMenu.classList.add("hidden");
        openModal2();
      });
      document.getElementById("closeModalBtn").addEventListener("click", closeModal2);
      document.getElementById("cancelBtn").addEventListener("click", closeModal2);
      document.getElementById("studentForm").addEventListener("submit", handleFormSubmit2);
      document.getElementById("addBulkStudents").addEventListener("click", () => {
        dropdownMenu.classList.add("hidden");
        openBulkModal();
      });
      document.getElementById("closeBulkModalBtn").addEventListener("click", closeBulkModal);
      document.getElementById("cancelBulkBtn").addEventListener("click", closeBulkModal);
      document.getElementById("downloadTemplateBtn").addEventListener("click", downloadTemplate);
      document.getElementById("excelFileInput").addEventListener("change", handleFileSelect);
      document.getElementById("uploadStudentsBtn").addEventListener("click", handleBulkUpload);
      document.getElementById("searchInput").addEventListener("input", handleSearch);
      document.getElementById("class").addEventListener("change", handleClassChange);
      yield fetchStudents();
    });
  }
  function fetchStudents() {
    return __async(this, null, function* () {
      const tbody = document.getElementById("studentsTableBody");
      tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center">Loading...</td></tr>';
      const { data, error } = yield supabase.from("students").select("*").order("created_at", { ascending: false });
      if (error) {
        console.error("Error fetching students:", error);
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-500">Error: ${error.message}</td></tr>`;
        return;
      }
      currentStudents = data;
      renderTable(currentStudents);
    });
  }
  function renderTable(students) {
    const tbody = document.getElementById("studentsTableBody");
    if (students.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-400">No students found.</td></tr>';
      return;
    }
    tbody.innerHTML = students.map((student) => `
        <tr class="hover:bg-gray-50 transition-colors group">
            <td class="p-4">
                <div class="flex items-center">
                    <div class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold mr-3 text-xs">
                        ${student.name.charAt(0)}
                    </div>
                    <div>
                        <div class="font-medium text-gray-900">${student.name}</div>
                        <div class="text-xs text-gray-500">${student.email || ""}</div>
                    </div>
                </div>
            </td>
            <td class="p-4 text-gray-600">${student.roll_no}</td>
            <td class="p-4 text-gray-600">${student.class} (${student.section})</td>
            <td class="p-4 text-gray-600">${student.phone || "-"}</td>
            <td class="p-4 text-right">
                <button onclick="window.editStudent('${student.id}')" class="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                <button onclick="window.deleteStudent('${student.id}')" class="text-red-600 hover:text-red-900">Delete</button>
            </td>
        </tr>
    `).join("");
  }
  function openModal2(student = null) {
    return __async(this, null, function* () {
      const modal = document.getElementById("studentModal");
      const title = document.getElementById("modalTitle");
      const form = document.getElementById("studentForm");
      const rollNoInput = document.getElementById("roll_no");
      modal.classList.remove("hidden");
      modal.classList.add("flex");
      yield loadClassesIntoDropdown();
      if (student) {
        title.textContent = "Edit Student";
        document.getElementById("studentId").value = student.id;
        document.getElementById("name").value = student.name;
        rollNoInput.value = student.roll_no;
        rollNoInput.readOnly = true;
        rollNoInput.classList.add("bg-gray-100");
        document.getElementById("class").value = student.class;
        handleClassChange();
        document.getElementById("section").value = student.section;
        document.getElementById("email").value = student.email || "";
        document.getElementById("phone").value = student.phone || "";
        document.getElementById("gender").value = student.gender || "Male";
      } else {
        title.textContent = "Add New Student";
        form.reset();
        document.getElementById("studentId").value = "";
        rollNoInput.value = "Loading...";
        rollNoInput.readOnly = true;
        rollNoInput.classList.add("bg-gray-100");
        const nextRoll = yield generateNextRollNo();
        rollNoInput.value = nextRoll;
      }
    });
  }
  function loadClassesIntoDropdown() {
    return __async(this, null, function* () {
      const select = document.getElementById("class");
      const { data, error } = yield supabase.from("classes").select("class_name, sections").order("class_name");
      if (data && data.length > 0) {
        availableClasses = data;
        const currentValue = select.value;
        select.innerHTML = '<option value="">Select Class</option>' + data.map((c) => `<option value="${c.class_name}">${c.class_name}</option>`).join("");
        if (currentValue) {
          select.value = currentValue;
        }
      }
    });
  }
  function handleClassChange() {
    const classSelect = document.getElementById("class");
    const sectionSelect = document.getElementById("section");
    const selectedClassName = classSelect.value;
    sectionSelect.innerHTML = '<option value="">Select Section</option>';
    if (!selectedClassName)
      return;
    const selectedClass = availableClasses.find((c) => c.class_name === selectedClassName);
    if (selectedClass && selectedClass.sections && selectedClass.sections.length > 0) {
      sectionSelect.innerHTML += selectedClass.sections.map((s) => `<option value="${s}">${s}</option>`).join("");
    } else {
    }
  }
  function generateNextRollNo() {
    return __async(this, null, function* () {
      try {
        const { data, error } = yield supabase.from("students").select("roll_no").order("created_at", { ascending: false }).limit(1);
        if (data && data.length > 0) {
          const lastRoll = data[0].roll_no;
          const match = lastRoll.match(/(\d+)$/);
          if (match) {
            const numberPart = match[1];
            const prefix = lastRoll.substring(0, lastRoll.length - numberPart.length);
            const nextNumber = parseInt(numberPart) + 1;
            return `${prefix}${nextNumber.toString().padStart(numberPart.length, "0")}`;
          }
        }
        return "ST-001";
      } catch (err) {
        console.error("Error generating roll no:", err);
        return "ST-001";
      }
    });
  }
  function closeModal2() {
    const modal = document.getElementById("studentModal");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
  function handleFormSubmit2(e) {
    return __async(this, null, function* () {
      e.preventDefault();
      const id = document.getElementById("studentId").value;
      const studentData = {
        name: document.getElementById("name").value,
        roll_no: document.getElementById("roll_no").value,
        class: document.getElementById("class").value,
        section: document.getElementById("section").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        gender: document.getElementById("gender").value
      };
      let error;
      if (id) {
        const res = yield supabase.from("students").update(studentData).eq("id", id);
        error = res.error;
      } else {
        const res = yield supabase.from("students").insert([studentData]);
        error = res.error;
      }
      if (error) {
        alert("Error saving student: " + error.message);
      } else {
        closeModal2();
        fetchStudents();
      }
    });
  }
  function handleSearch(e) {
    const term = e.target.value.toLowerCase();
    const filtered = currentStudents.filter(
      (s) => s.name.toLowerCase().includes(term) || s.roll_no.toLowerCase().includes(term)
    );
    renderTable(filtered);
  }
  function openBulkModal() {
    const modal = document.getElementById("bulkUploadModal");
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    parsedStudents = [];
    document.getElementById("excelFileInput").value = "";
    document.getElementById("selectedFileName").textContent = "";
    document.getElementById("uploadResults").classList.add("hidden");
    document.getElementById("uploadStudentsBtn").disabled = true;
  }
  function closeBulkModal() {
    const modal = document.getElementById("bulkUploadModal");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
  function downloadTemplate() {
    const wb = XLSX.utils.book_new();
    const templateData = [
      ["Name", "Roll No", "Class", "Section", "Gender", "Email", "Phone", "Address"],
      ["John Doe", "ST-001", "Class 10", "A", "Male", "john@example.com", "1234567890", "123 Main St"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    ws["!cols"] = [
      { wch: 20 },
      // Name
      { wch: 12 },
      // Roll No
      { wch: 12 },
      // Class
      { wch: 10 },
      // Section
      { wch: 10 },
      // Gender
      { wch: 25 },
      // Email
      { wch: 15 },
      // Phone
      { wch: 30 }
      // Address
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "Student_Bulk_Upload_Template.xlsx");
  }
  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file)
      return;
    document.getElementById("selectedFileName").textContent = `Selected: ${file.name}`;
    const reader = new FileReader();
    reader.onload = function(event) {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        const { valid, students, errors } = validateExcelData(jsonData);
        if (valid) {
          parsedStudents = students;
          document.getElementById("uploadStudentsBtn").disabled = false;
          showUploadSummary(students, errors);
        } else {
          parsedStudents = [];
          document.getElementById("uploadStudentsBtn").disabled = true;
          showUploadSummary([], errors);
        }
      } catch (error) {
        alert("Error reading Excel file: " + error.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }
  function validateExcelData(jsonData) {
    const students = [];
    const errors = [];
    jsonData.forEach((row, index) => {
      const rowNum = index + 2;
      const rowErrors = [];
      if (!row["Name"] || row["Name"].toString().trim() === "") {
        rowErrors.push(`Row ${rowNum}: Name is required`);
      }
      if (!row["Roll No"] || row["Roll No"].toString().trim() === "") {
        rowErrors.push(`Row ${rowNum}: Roll No is required`);
      }
      if (!row["Class"] || row["Class"].toString().trim() === "") {
        rowErrors.push(`Row ${rowNum}: Class is required`);
      }
      if (!row["Section"] || row["Section"].toString().trim() === "") {
        rowErrors.push(`Row ${rowNum}: Section is required`);
      }
      if (rowErrors.length === 0) {
        students.push({
          name: row["Name"].toString().trim(),
          roll_no: row["Roll No"].toString().trim(),
          class: row["Class"].toString().trim(),
          section: row["Section"].toString().trim(),
          gender: row["Gender"] ? row["Gender"].toString().trim() : "Male",
          email: row["Email"] ? row["Email"].toString().trim() : "",
          phone: row["Phone"] ? row["Phone"].toString().trim() : "",
          address: row["Address"] ? row["Address"].toString().trim() : ""
        });
      } else {
        errors.push(...rowErrors);
      }
    });
    return {
      valid: errors.length === 0 && students.length > 0,
      students,
      errors
    };
  }
  function showUploadSummary(students, errors) {
    const resultsDiv = document.getElementById("uploadResults");
    const summaryDiv = document.getElementById("uploadSummary");
    resultsDiv.classList.remove("hidden");
    let html = "";
    if (students.length > 0) {
      html += `<div class="text-green-600 font-semibold mb-2">\u2713 ${students.length} student(s) ready to upload</div>`;
    }
    if (errors.length > 0) {
      html += `<div class="text-red-600 font-semibold mb-2">\u2717 ${errors.length} error(s) found:</div>`;
      html += '<ul class="list-disc list-inside text-red-600 text-xs space-y-1">';
      errors.forEach((err) => {
        html += `<li>${err}</li>`;
      });
      html += "</ul>";
    }
    summaryDiv.innerHTML = html;
  }
  function handleBulkUpload() {
    return __async(this, null, function* () {
      if (parsedStudents.length === 0)
        return;
      const uploadBtn = document.getElementById("uploadStudentsBtn");
      uploadBtn.disabled = true;
      uploadBtn.textContent = "Uploading...";
      try {
        const rollNumbers = parsedStudents.map((s) => s.roll_no);
        const { data: existing } = yield supabase.from("students").select("roll_no").in("roll_no", rollNumbers);
        const existingRollNos = existing ? existing.map((s) => s.roll_no) : [];
        if (existingRollNos.length > 0) {
          const duplicates = existingRollNos.join(", ");
          alert(`Error: The following roll numbers already exist: ${duplicates}

Please remove duplicates and try again.`);
          uploadBtn.disabled = false;
          uploadBtn.textContent = "Upload Students";
          return;
        }
        const { data, error } = yield supabase.from("students").insert(parsedStudents);
        if (error) {
          throw error;
        }
        alert(`Success! ${parsedStudents.length} student(s) added successfully.`);
        closeBulkModal();
        fetchStudents();
      } catch (error) {
        console.error("Bulk upload error:", error);
        alert("Error uploading students: " + error.message);
      } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = "Upload Students";
      }
    });
  }
  var currentStudents, availableClasses, parsedStudents;
  var init_students = __esm({
    "assets/js/modules/students.js"() {
      init_supabase_client();
      currentStudents = [];
      availableClasses = [];
      parsedStudents = [];
      window.editStudent = (id) => {
        const student = currentStudents.find((s) => s.id === id);
        if (student)
          openModal2(student);
      };
      window.deleteStudent = (id) => __async(void 0, null, function* () {
        if (!confirm("Are you sure you want to delete this student?"))
          return;
        const { error } = yield supabase.from("students").delete().eq("id", id);
        if (error) {
          alert("Error deleting student: " + error.message);
        } else {
          fetchStudents();
        }
      });
    }
  });

  // import("./modules/**/*.js") in assets/js/app.js
  var globImport_modules_js;
  var init_ = __esm({
    'import("./modules/**/*.js") in assets/js/app.js'() {
      globImport_modules_js = __glob({
        "./modules/classes.js": () => Promise.resolve().then(() => (init_classes(), classes_exports)),
        "./modules/dashboard.js": () => Promise.resolve().then(() => (init_dashboard(), dashboard_exports)),
        "./modules/fee_generation.js": () => Promise.resolve().then(() => (init_fee_generation(), fee_generation_exports)),
        "./modules/fee_structure.js": () => Promise.resolve().then(() => (init_fee_structure(), fee_structure_exports)),
        "./modules/fees.js": () => Promise.resolve().then(() => (init_fees(), fees_exports)),
        "./modules/settings.js": () => Promise.resolve().then(() => (init_settings(), settings_exports)),
        "./modules/students.js": () => Promise.resolve().then(() => (init_students(), students_exports))
      });
    }
  });

  // assets/js/app.js
  var require_app = __commonJS({
    "assets/js/app.js"(exports) {
      init_supabase_client();
      init_();
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
          const { data: { session }, error } = yield supabase.auth.getSession();
          if (error || !session) {
            window.location.href = "index.html";
            return;
          }
          currentUser = session.user;
          currentRole = ((_a = currentUser.user_metadata) == null ? void 0 : _a.role) || "student";
          userNameEl.textContent = currentUser.email.split("@")[0];
          userRoleEl.textContent = currentRole.charAt(0).toUpperCase() + currentRole.slice(1);
          userAvatarEl.textContent = currentUser.email.charAt(0).toUpperCase();
          renderSidebar();
          loadModule("dashboard");
        });
      }
      var menuItems = [
        { id: "dashboard", label: "Dashboard", icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z", roles: ["admin", "teacher", "accountant", "student"] },
        { id: "students", label: "Students", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z", roles: ["admin", "teacher", "accountant"] },
        { id: "classes", label: "Classes", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10", roles: ["admin", "teacher"] },
        { id: "fees", label: "Fee Collection", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", roles: ["admin", "accountant"] },
        { id: "fee_generation", label: "Generate Fees", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01", roles: ["admin", "accountant"] },
        { id: "fee_structure", label: "Fee Structure", icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z", roles: ["admin", "accountant"] },
        { id: "settings", label: "Settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z", roles: ["admin"] }
      ];
      function renderSidebar() {
        navLinksContainer.innerHTML = "";
        menuItems.forEach((item) => {
          if (item.roles.includes(currentRole)) {
            const link = document.createElement("a");
            link.href = "#";
            link.className = "flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors group";
            link.dataset.module = item.id;
            link.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 group-hover:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${item.icon}" />
                </svg>
                <span class="font-medium">${item.label}</span>
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
        });
      }
      function loadModule(moduleId) {
        return __async(this, null, function* () {
          document.querySelectorAll("#navLinks a").forEach((el) => {
            if (el.dataset.module === moduleId) {
              el.classList.add("bg-indigo-50", "text-indigo-600");
              el.querySelector("svg").classList.add("text-indigo-600");
            } else {
              el.classList.remove("bg-indigo-50", "text-indigo-600");
              el.querySelector("svg").classList.remove("text-indigo-600");
            }
          });
          const titleMap = {
            "dashboard": "Dashboard",
            "students": "Students",
            "classes": "Classes",
            "fees": "Fee Collection",
            "fee_generation": "Generate Fees",
            "fee_structure": "Fee Structure",
            "settings": "Settings"
          };
          pageTitle.textContent = titleMap[moduleId] || moduleId.charAt(0).toUpperCase() + moduleId.slice(1);
          const pageTransition = new PageTransition(mainContent);
          yield pageTransition.transition(() => __async(this, null, function* () {
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
              const module2 = yield globImport_modules_js(`./modules/${moduleId}.js`);
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
      logoutBtn.addEventListener("click", () => __async(exports, null, function* () {
        yield supabase.auth.signOut();
        window.location.href = "index.html";
      }));
      openSidebarBtn.addEventListener("click", () => sidebar.classList.remove("-translate-x-full"));
      closeSidebarBtn.addEventListener("click", () => sidebar.classList.add("-translate-x-full"));
      var themeToggleBtn = document.getElementById("themeToggle");
      var themeToggleDarkIcon = document.getElementById("themeToggleDarkIcon");
      var themeToggleLightIcon = document.getElementById("themeToggleLightIcon");
      if (localStorage.getItem("color-theme") === "dark" || !("color-theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
        themeToggleLightIcon.classList.remove("hidden");
      } else {
        document.documentElement.classList.remove("dark");
        themeToggleDarkIcon.classList.remove("hidden");
      }
      themeToggleBtn.addEventListener("click", function() {
        themeToggleDarkIcon.classList.toggle("hidden");
        themeToggleLightIcon.classList.toggle("hidden");
        if (localStorage.getItem("color-theme")) {
          if (localStorage.getItem("color-theme") === "light") {
            document.documentElement.classList.add("dark");
            localStorage.setItem("color-theme", "dark");
          } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("color-theme", "light");
          }
        } else {
          if (document.documentElement.classList.contains("dark")) {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("color-theme", "light");
          } else {
            document.documentElement.classList.add("dark");
            localStorage.setItem("color-theme", "dark");
          }
        }
      });
      initApp();
    }
  });
  return require_app();
})();
