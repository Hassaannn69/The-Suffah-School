// fee_discounts.js - Discounts & Concessions Module
// Matches the provided design and functional flow strictness

const supabase = window.supabase || (() => { throw new Error('Supabase not init'); })();
const toast = window.toast;

// State Management
let currentStudent = null;
let currentFees = null;
let selectedFeeId = null;

export async function render(container) {
    container.innerHTML = `
    <style>
        .module-container {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            color: #E2E8F0;
            max-width: 1400px;
            margin: 0 auto;
        }

        .search-container {
            background: #111827;
            border-radius: 12px;
            padding: 0.75rem 1.25rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            transition: all 0.2s;
            position: relative;
            z-index: 101;
        }
        .search-container:focus-within {
            border-color: #6366f1;
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
        }
        .search-icon { color: #64748B; margin-right: 1rem; width: 18px; height: 18px; }
        .search-input {
            background: transparent;
            border: none;
            color: white;
            font-size: 0.95rem;
            width: 100%;
            outline: none;
        }
        .search-input::placeholder { color: #475569; }

        .search-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: #111827;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            margin-top: 0.5rem;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
            z-index: 100;
            max-height: 300px;
            overflow-y: auto;
        }
        .search-result-item {
            padding: 0.875rem 1.25rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            cursor: pointer;
            transition: background 0.2s;
        }
        .search-result-item:hover { background: #1f2937; }
        .search-result-item:last-child { border-bottom: none; }

        /* Grid Layout */
        .main-grid {
            display: grid;
            grid-template-columns: 350px 1fr;
            gap: 2rem;
            margin-bottom: 2rem;
        }
        @media (max-width: 1024px) { .main-grid { grid-template-columns: 1fr; } }

        /* Card Styles */
        .card-panel {
            background: #111827; /* Darker bg for contrast */
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.05); /* Subtle border */
            padding: 1.5rem;
            position: relative;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .card-panel::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; height: 2px;
            background: linear-gradient(90deg, #6366f1, #8b5cf6);
            opacity: 0.5;
        }

        /* Profile Section */
        .profile-avatar-container {
            display: flex;
            justify-content: center;
            margin-bottom: 1rem;
            position: relative;
        }
        .profile-avatar {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            border: 3px solid #1f2937;
            background-color: #374151;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.5rem;
            font-weight: bold;
            color: #9ca3af;
        }
        .verified-badge {
            position: absolute;
            bottom: 5px;
            right: 35%;
            background: #10B981;
            color: white;
            border-radius: 50%;
            padding: 4px;
            border: 2px solid #111827;
        }
        .profile-name { text-align: center; font-size: 1.25rem; font-weight: 700; color: white; margin-bottom: 0.25rem; }
        .profile-id { text-align: center; color: #94A3B8; font-size: 0.875rem; margin-bottom: 1.5rem; }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin-bottom: 1rem;
        }
        .info-box {
            background: #1F293B;
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
        }
        .info-label { font-size: 0.65rem; text-transform: uppercase; color: #94A3B8; letter-spacing: 0.05em; font-weight: 600; }
        .info-value { font-size: 1rem; font-weight: 700; color: white; margin-top: 0.25rem; }

        .guardian-box {
            background: #1F293B;
            padding: 1rem;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }
        
        .status-pill {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
            background: rgba(16, 185, 129, 0.1);
            color: #10B981;
            width: 100%;
            justify-content: center;
        }

        /* Fee Table Section */
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }
        .section-title { font-size: 1rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; }
        .count-badge { background: #334155; padding: 0.1rem 0.5rem; border-radius: 4px; font-size: 0.75rem; }

        .fee-table-container {
            border: 1px solid rgba(255,255,255,0.05);
            border-radius: 8px;
            overflow: hidden;
        }
        .fee-table th {
            background: rgba(15, 23, 42, 0.7);
            color: #64748B;
            font-size: 0.65rem;
            text-transform: uppercase;
            font-weight: 800;
            padding: 1rem 0.75rem;
            text-align: left;
            letter-spacing: 0.08em;
            border-bottom: 2px solid rgba(255,255,255,0.05);
        }
        .fee-table th.text-right { text-align: right; }
        .fee-table th.text-center { text-align: center; }
        
        .fee-table td {
            padding: 1.25rem 0.75rem;
            border-top: 1px solid rgba(255,255,255,0.03);
            font-size: 0.9rem;
            color: #CBD5E1;
            vertical-align: middle;
        }
        .fee-row { transition: all 0.2s; }
        .fee-row:hover { background: rgba(255,255,255,0.02); }
        .fee-row.selected { 
            background: rgba(139, 92, 246, 0.1) !important; 
            box-shadow: inset 4px 0 0 #8b5cf6;
        }
        
        /* Custom Radio */
        .custom-radio {
            width: 18px; height: 18px;
            border: 2px solid #475569;
            border-radius: 50%;
            display: inline-block;
            position: relative;
            cursor: pointer;
        }
        .fee-row.selected .custom-radio {
            border-color: #8b5cf6;
        }
        .fee-row.selected .custom-radio::after {
            content: '';
            position: absolute;
            top: 3px; left: 3px; width: 8px; height: 8px;
            background: #8b5cf6;
            border-radius: 50%;
        }

        .status-badge-unpaid {
            background: rgba(220, 38, 38, 0.1);
            color: #ef4444;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 0.65rem;
            text-transform: uppercase;
            font-weight: 800;
            border: 1px solid rgba(220, 38, 38, 0.2);
        }
        .status-badge-partial {
            background: rgba(245, 158, 11, 0.1);
            color: #f59e0b;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 0.65rem;
            text-transform: uppercase;
            font-weight: 800;
            border: 1px solid rgba(245, 158, 11, 0.2);
        }

        /* Config Panel */
        .config-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 2rem;
            align-items: start;
        }
        @media (max-width: 1024px) { .config-grid { grid-template-columns: 1fr; } }

        .input-group label { display: block; font-size: 0.75rem; color: #94A3B8; margin-bottom: 0.5rem; }
        .input-field {
            width: 100%;
            background: #0f172a;
            border: 1px solid #334155;
            color: white;
            padding: 0.75rem;
            border-radius: 8px;
            font-size: 0.875rem;
            transition: border-color 0.2s;
        }
        .input-field:focus { border-color: #8b5cf6; outline: none; }
        
        .type-toggle {
            display: flex;
            background: #0f172a;
            padding: 4px;
            border-radius: 8px;
            border: 1px solid #334155;
            margin-bottom: 1rem;
        }
        .type-btn {
            flex: 1;
            padding: 8px;
            text-align: center;
            border-radius: 6px;
            font-size: 0.875rem;
            color: #94A3B8;
            cursor: pointer;
            transition: all 0.2s;
        }
        .type-btn.active {
            background: #7c3aed;
            color: white;
            font-weight: 600;
        }

        /* Calculation Box */
        .calc-box {
            background: #0f172a;
            border: 1px dashed #334155;
            border-radius: 12px;
            padding: 1.5rem;
        }
        .calc-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.75rem;
            font-size: 0.875rem;
            color: #cbd5e1;
        }
        .calc-row.final {
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid rgba(255,255,255,0.1);
            font-size: 1.25rem;
            font-weight: 700;
            color: white;
        }
        .discount-text { color: #10B981; }

        .btn-primary {
            width: 100%;
            background: linear-gradient(135deg, #7c3aed, #6d28d9);
            color: white;
            padding: 1rem;
            border-radius: 8px;
            font-weight: 600;
            border: none;
            cursor: pointer;
            transition: opacity 0.2s;
            margin-top: 1rem;
            font-size: 0.95rem;
        }
        .btn-primary:hover { opacity: 0.9; }
        .btn-secondary {
            width: 100%;
            background: transparent;
            border: 1px solid #334155;
            color: #94A3B8;
            padding: 1rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }
        .btn-secondary:hover { border-color: #94A3B8; color: white; }

        /* Utilities */
        .hidden { display: none; }
        .text-red { color: #ef4444; }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
    </style>

    <div class="module-container">
        <h1 class="text-2xl font-bold mb-2">Discount & Concession</h1>
        <p class="text-slate-400 mb-6 text-sm">Search for a student to manage their fee waivers and discounts.</p>

        <!-- 1. Search Bar -->
        <div class="relative mb-8">
            <div class="search-container">
                <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <input type="text" id="disc_studentSearch" class="search-input" placeholder="Start typing student name, ID or roll number..." autocomplete="off">
                <button id="disc_clearSearch" class="hidden text-slate-500 hover:text-white"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>
            <div id="disc_searchDropdown" class="search-dropdown hidden"></div>
        </div>

        <div id="disc_workspace" class="hidden">
            <div class="main-grid">
                <!-- 2. Student Profile -->
                <div class="card-panel">
                    <div class="profile-avatar-container">
                        <div class="profile-avatar" id="d_avatar">?</div>
                        <div class="verified-badge"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg></div>
                    </div>
                    <h2 class="profile-name" id="d_name">Loading...</h2>
                    <p class="profile-id" id="d_roll">ID: ...</p>

                    <div class="info-grid">
                        <div class="info-box">
                            <p class="info-label">CLASS</p>
                            <p class="info-value" id="d_class">-</p>
                        </div>
                        <div class="info-box">
                            <p class="info-label">SECTION</p>
                            <p class="info-value" id="d_section">-</p>
                        </div>
                    </div>

                    <div class="guardian-box">
                        <div>
                            <p class="info-label">GUARDIAN</p>
                            <p class="text-sm font-bold text-white mt-1" id="d_father">-</p>
                        </div>
                        <svg class="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    </div>

                    <div class="status-pill">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span id="d_statusText">Active Student</span>
                    </div>
                </div>

                <!-- 3. Fee Selection Table -->
                <div class="card-panel">
                    <div class="section-header">
                        <div class="section-title">
                            <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                            Select Eligible Fee
                        </div>
                        <div class="count-badge" id="d_unpaidCount">0 Unpaid Items</div>
                    </div>

                    <div class="fee-table-container">
                        <table class="fee-table">
                            <thead>
                                <tr>
                                    <th style="width: 70px;" class="text-center">SELECT</th>
                                    <th style="width: 250px;">FEE HEAD</th>
                                    <th style="width: 140px;" class="text-right">ORIGINAL AMT</th>
                                    <th style="width: 140px;" class="text-right">APPLIED DISC</th>
                                    <th style="width: 140px;" class="text-right">FINAL DUE AMT</th>
                                    <th style="width: 120px;" class="text-center">STATUS</th>
                                </tr>
                            </thead>
                            <tbody id="d_feeTableBody">
                                <!-- Rows loaded dynamically -->
                            </tbody>
                        </table>
                        <div id="d_noFeesMsg" class="hidden p-8 text-center text-slate-500 text-sm">
                            No unpaid fees available for discount.
                        </div>
                    </div>
                </div>
            </div>

            <!-- 4. Discount Configuration -->
            <div class="card-panel">
                <div class="config-grid">
                    <div class="space-y-6">
                        <div class="flex items-center gap-2 mb-2">
                            <div class="bg-indigo-600 p-1.5 rounded-lg"><svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg></div>
                            <h3 class="text-lg font-bold">Discount Configuration</h3>
                        </div>

                        <div class="grid grid-cols-2 gap-6">
                            <div>
                                <label class="info-label mb-2 block">DISCOUNT TYPE</label>
                                <div class="type-toggle">
                                    <div class="type-btn active" data-type="fixed" onclick="window.setDiscountType('fixed')">Fixed Amount</div>
                                    <div class="type-btn" data-type="percent" onclick="window.setDiscountType('percent')">Percentage %</div>
                                </div>
                            </div>
                            <div>
                                <label class="info-label mb-2 block">DISCOUNT VALUE</label>
                                <input type="number" id="d_confValue" class="input-field" placeholder="0" disabled>
                            </div>
                        </div>

                        <div>
                            <label class="info-label mb-2 block">REMARKS / JUSTIFICATION *</label>
                            <textarea id="d_confRemarks" class="input-field" rows="3" placeholder="Reason for concession..." disabled></textarea>
                        </div>
                    </div>

                    <!-- Live Calculation -->
                    <div>
                        <div class="info-label mb-4 flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            LIVE CALCULATION
                        </div>
                        <div class="calc-box">
                            <div class="calc-row">
                                <span>Selected Fee Due</span>
                                <span id="c_original">Rs 0.00</span>
                            </div>
                            <div class="calc-row">
                                <span class="discount-text flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Discount</span>
                                <span class="discount-text" id="c_discount">- Rs 0.00</span>
                            </div>
                            <div class="calc-row final">
                                <span>Final Payable</span>
                                <span id="c_final">Rs 0.00</span>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-3 mt-4">
                            <button class="btn-secondary" onclick="window.resetDiscountForm()">Cancel</button>
                            <button class="btn-primary" id="d_btnApply" onclick="window.applyDiscount()">
                                <span class="flex items-center justify-center gap-2">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                                    Apply Discount
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;

    // Global Functions for HTML Events
    window.setDiscountType = (type) => {
        document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`.type-btn[data-type="${type}"]`).classList.add('active');
        calculateLive();
    };

    window.resetDiscountForm = () => {
        document.getElementById('d_confValue').value = '';
        document.getElementById('d_confRemarks').value = '';
        document.getElementById('d_confValue').disabled = true;
        document.getElementById('d_confRemarks').disabled = true;

        // Deselect fee
        selectedFeeId = null;
        document.querySelectorAll('.fee-row').forEach(row => {
            row.classList.remove('selected');
            const discCell = row.querySelector('[id^="disc-val-"]');
            const finalCell = row.querySelector('[id^="final-val-"]');
            if (discCell) discCell.textContent = '-';
            if (finalCell) {
                // Restore original due from data attribute if needed, or just re-render
                // For simplicity, we'll re-load or just clear
            }
        });

        // Re-calculate to clear calculation panel
        calculateLive();

        // Final polish: re-set table if needed
        if (currentFees) renderFeeTable(currentFees);
    };

    window.selectFoundStudent = async (studentId) => {
        document.getElementById('disc_searchDropdown').classList.add('hidden');
        document.getElementById('disc_studentSearch').value = '';

        // Show Loading State in Search Bar
        const searchInput = document.getElementById('disc_studentSearch');
        searchInput.placeholder = "Loading records...";

        try {
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('id', studentId)
                .single();

            if (error || !data) throw new Error('Student not found');

            currentStudent = data;
            loadStudentUI(data);
            await loadUnpaidFees(data.id);

            document.getElementById('disc_workspace').classList.remove('hidden');
            searchInput.placeholder = "Start typing student name, ID or roll number...";
        } catch (err) {
            console.error(err);
            alert('Failed to load student data');
            searchInput.placeholder = "Start typing student name, ID or roll number...";
        }
    };

    window.applyDiscount = handleApplyDiscount;
    window.editDiscount = handleEditDiscount;

    // Listeners
    const searchInput = document.getElementById('disc_studentSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(async (e) => {
            const query = e.target.value.trim();
            const dropdown = document.getElementById('disc_searchDropdown');

            if (query.length < 2) {
                dropdown.classList.add('hidden');
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('students')
                    .select('id, name, roll_no, class')
                    .or(`roll_no.ilike.%${query}%,name.ilike.%${query}%`)
                    .limit(6);

                if (error) throw error;

                if (data && data.length > 0) {
                    dropdown.innerHTML = data.map(s => `
                        <div class="search-result-item" onclick="window.selectFoundStudent('${s.id}')">
                            <div class="flex justify-between items-center">
                                <span class="font-bold text-white">${s.name}</span>
                                <span class="text-xs text-indigo-400 font-mono">${s.roll_no}</span>
                            </div>
                            <div class="text-[0.7rem] text-slate-500 mt-1 uppercase tracking-wider font-semibold">Class: ${s.class}</div>
                        </div>
                    `).join('');
                    dropdown.classList.remove('hidden');
                } else {
                    dropdown.innerHTML = '<div class="p-4 text-slate-500 text-sm text-center">No matching students found</div>';
                    dropdown.classList.remove('hidden');
                }
            } catch (err) {
                console.error('Search error:', err);
            }
        }, 300));
    }

    const valueInput = document.getElementById('d_confValue');
    if (valueInput) valueInput.addEventListener('input', calculateLive);
}

// Logic

async function searchStudent(query) {
    if (!query || query.length < 2) return;

    // Show Loading
    document.getElementById('disc_studentSearch').disabled = true;

    try {
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .or(`roll_no.eq.${query},name.ilike.%${query}%`)
            .limit(1)
            .single();

        if (error || !data) {
            alert('Student not found. Please check the ID or Name.');
            document.getElementById('disc_studentSearch').disabled = false;
            document.getElementById('disc_studentSearch').focus();
            return;
        }

        currentStudent = data;
        loadStudentUI(data);
        await loadUnpaidFees(data.id);

        // Reveal Workspace
        document.getElementById('disc_workspace').classList.remove('hidden');
        document.getElementById('disc_studentSearch').value = ''; // clear for next
        document.getElementById('disc_studentSearch').disabled = false;

    } catch (err) {
        console.error('Search Error:', err);
        alert('An error occurred while searching.');
        document.getElementById('disc_studentSearch').disabled = false;
    }
}

function loadStudentUI(student) {
    document.getElementById('d_name').textContent = student.name;
    document.getElementById('d_roll').textContent = `ID: ${student.roll_no}`;
    document.getElementById('d_class').textContent = student.class;
    document.getElementById('d_section').textContent = student.section;
    document.getElementById('d_father').textContent = student.father_name || 'N/A';
    document.getElementById('d_avatar').textContent = student.name.charAt(0).toUpperCase();
}

async function loadUnpaidFees(studentId) {
    const tbody = document.getElementById('d_feeTableBody');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4">Loading fees...</td></tr>';

    try {
        const { data: fees, error } = await supabase
            .from('fees')
            .select('*')
            .eq('student_id', studentId)
            .neq('status', 'paid')
            .order('due_date', { ascending: false });

        if (error) throw error;

        currentFees = fees.filter(f => calculateDue(f) > 0);

        if (currentFees.length === 0) {
            tbody.innerHTML = '';
            document.getElementById('d_noFeesMsg').classList.remove('hidden');
            document.getElementById('d_unpaidCount').textContent = '0 Unpaid Items';
            return;
        }

        renderFeeTable(currentFees);
        document.getElementById('d_unpaidCount').textContent = `${currentFees.length} Unpaid Items`;
        document.getElementById('d_noFeesMsg').classList.add('hidden');

    } catch (err) {
        console.error('Fee Load Error:', err);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-red-400 p-4">Error loading fees</td></tr>';
    }
}

function renderFeeTable(fees) {
    const tbody = document.getElementById('d_feeTableBody');
    tbody.innerHTML = fees.map(fee => {
        const due = calculateDue(fee);
        const existingDisc = parseFloat(fee.discount) || 0;
        return `
            <tr class="fee-row cursor-pointer transition-colors" onclick="window.selectFee('${fee.id}')" id="row-${fee.id}">
                <td class="text-center">
                    <div class="custom-radio"></div>
                </td>
                <td>
                    <div class="font-bold text-white">${fee.fee_type}</div>
                    <div class="text-[0.7rem] text-slate-500 font-medium uppercase tracking-wider mt-0.5">${fee.month}</div>
                </td>
                <td class="text-right font-mono text-slate-400">Rs ${(fee.amount || 0).toLocaleString()}</td>
                <td class="text-right font-mono text-indigo-400 font-bold" id="disc-val-${fee.id}">
                    ${existingDisc > 0
                        ? `<span class="flex items-center justify-end gap-1.5">
                            Rs ${existingDisc.toLocaleString()}
                            <button onclick="event.stopPropagation(); window.editDiscount('${fee.id}')" 
                                class="inline-flex items-center justify-center w-5 h-5 rounded bg-indigo-600/30 hover:bg-indigo-600/60 text-indigo-300 hover:text-white transition-colors" title="Edit Discount">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                            </button>
                           </span>`
                        : '-'}
                </td>
                <td class="text-right font-mono font-bold text-white" id="final-val-${fee.id}">Rs ${due.toLocaleString()}</td>
                <td class="text-center">
                    <span class="${fee.status === 'partial' ? 'status-badge-partial' : 'status-badge-unpaid'}">
                        ${fee.status === 'partial' ? 'PARTIAL' : 'UNPAID'}
                    </span>
                </td>
            </tr>
        `
    }).join('');
}

// Helper to calculate exact due amount safely
function calculateDue(fee) {
    const amount = parseFloat(fee.amount) || 0;
    const discount = parseFloat(fee.discount) || 0;
    const paid = parseFloat(fee.paid_amount) || 0; // Check if paid_amount exists, else 0
    // If paid_amount is missing from schema, we assume we need to check fee_payments table?
    // User requested "load Assigned Active Fees". previous code assumed fee.paid_amount exists.
    // I will assume it exists or use amount - discount as base.
    // If paid_amount is undefined, treat as 0.
    return Math.max(0, amount - discount - paid);
}

window.selectFee = (feeId) => {
    selectedFeeId = feeId;

    // UI selection state
    document.querySelectorAll('.fee-row').forEach(row => row.classList.remove('selected'));
    document.getElementById(`row-${feeId}`).classList.add('selected');

    // Enable Inputs
    document.getElementById('d_confValue').disabled = false;
    document.getElementById('d_confRemarks').disabled = false;
    document.getElementById('d_confValue').focus();

    calculateLive();
}

function calculateLive() {
    if (!selectedFeeId || !currentFees) {
        setCalcValues(0, 0, 0);
        return;
    }

    const fee = currentFees.find(f => f.id === selectedFeeId);
    if (!fee) return;

    const currentDue = calculateDue(fee);
    const discountInput = parseFloat(document.getElementById('d_confValue').value) || 0;
    const type = document.querySelector('.type-btn.active').dataset.type;

    let discountAmount = 0;
    if (type === 'percent') {
        discountAmount = (currentDue * discountInput) / 100;
    } else {
        discountAmount = discountInput;
    }

    // Safety Cap
    if (discountAmount > currentDue) discountAmount = currentDue;

    const finalPayable = currentDue - discountAmount;
    const totalEffectiveDisc = (parseFloat(fee.discount) || 0) + discountAmount;

    setCalcValues(currentDue, discountAmount, finalPayable);

    // Update table columns in real-time
    const discCell = document.getElementById(`disc-val-${selectedFeeId}`);
    const finalCell = document.getElementById(`final-val-${selectedFeeId}`);
    if (discCell) discCell.textContent = totalEffectiveDisc > 0 ? `Rs ${totalEffectiveDisc.toLocaleString()}` : '-';
    if (finalCell) finalCell.textContent = `Rs ${finalPayable.toLocaleString()}`;
}

function setCalcValues(original, discount, final) {
    document.getElementById('c_original').textContent = `Rs ${original.toLocaleString()}`;
    document.getElementById('c_discount').textContent = `- Rs ${discount.toLocaleString()}`;
    document.getElementById('c_final').textContent = `Rs ${final.toLocaleString()}`;
}

async function handleApplyDiscount() {
    if (!currentStudent) { toast.warning('No student selected'); return; }
    if (!selectedFeeId) { toast.warning('Please select a fee to discount'); return; }

    const valueStr = document.getElementById('d_confValue').value;
    const remarks = document.getElementById('d_confRemarks').value.trim();
    if (!valueStr || parseFloat(valueStr) <= 0) { toast.warning('Enter a valid discount value'); return; }

    const fee = currentFees.find(f => f.id === selectedFeeId);
    if (!fee) return;

    const type = document.querySelector('.type-btn.active').dataset.type;
    const discountInputValue = parseFloat(valueStr);

    // Calculate discount for the selected fee (for preview/validation)
    const currentDue = calculateDue(fee);
    let previewDiscount = 0;
    if (type === 'percent') {
        previewDiscount = (currentDue * discountInputValue) / 100;
    } else {
        previewDiscount = discountInputValue;
    }

    if (previewDiscount > currentDue) { toast.error('Discount cannot exceed the due amount of the selected fee.'); return; }

    // Disable button immediately to prevent double-clicks
    const newBtn = document.getElementById('d_btnApply');
    const originalText = newBtn.innerHTML;
    newBtn.innerHTML = 'Fetching fees...';
    newBtn.disabled = true;

    try {
        // Find ALL fees of the same fee_type for this student (across all months)
        const { data: allFeesOfType, error: fetchErr } = await supabase
            .from('fees')
            .select('*')
            .eq('student_id', currentStudent.id)
            .eq('fee_type', fee.fee_type)
            .neq('status', 'paid');

        if (fetchErr) {
            toast.error('Error fetching fees: ' + fetchErr.message);
            return;
        }

        const eligibleFees = (allFeesOfType || []).filter(f => calculateDue(f) > 0);
        const feeCount = eligibleFees.length;

        if (feeCount === 0) {
            toast.warning('No eligible unpaid fees found for this fee type.');
            return;
        }

        // Restore button text before showing confirm dialog (so user doesn't see "Fetching fees...")
        newBtn.innerHTML = originalText;
        newBtn.disabled = false;

        // Build confirmation message
        const confirmMsg = feeCount === 1
            ? `Apply discount of Rs ${previewDiscount.toLocaleString()} to ${fee.fee_type} (${fee.month})?`
            : `Apply discount to ALL ${feeCount} unpaid "${fee.fee_type}" fees for this student? ` +
              (type === 'percent'
                ? `${discountInputValue}% will be calculated on each fee's due amount.`
                : `Rs ${discountInputValue.toLocaleString()} will be subtracted from each fee.`) +
              ` Months affected: ${eligibleFees.map(f => f.month).join(', ')}`;

        // IMPORTANT: await the confirm dialog - window.confirm is async (custom dialog)
        const confirmed = await window.confirmDialog.show({
            title: 'Confirm Discount',
            message: confirmMsg,
            confirmText: 'Confirm',
            cancelText: 'Cancel',
            type: 'warning'
        });

        if (!confirmed) return; // User cancelled - do NOT apply discount

        // NOW disable button and start processing (only after user confirmed)
        newBtn.innerHTML = 'Processing...';
        newBtn.disabled = true;

        let updatedCount = 0;

        // Update EACH fee of this type
        for (const f of eligibleFees) {
            const feeDue = calculateDue(f);
            let actualDiscount = 0;

            if (type === 'percent') {
                actualDiscount = (feeDue * discountInputValue) / 100;
            } else {
                actualDiscount = discountInputValue;
            }

            // Cap discount at the due amount for this specific fee
            if (actualDiscount > feeDue) actualDiscount = feeDue;
            if (actualDiscount <= 0) continue;

            const newTotalDiscount = (parseFloat(f.discount) || 0) + actualDiscount;
            const remainingAfter = feeDue - actualDiscount;
            let newStatus = f.status;
            if (remainingAfter <= 0) {
                newStatus = 'paid';
            } else if (f.status === 'unpaid') {
                newStatus = 'partial';
            }

            const { error: feeError } = await supabase
                .from('fees')
                .update({
                    discount: newTotalDiscount,
                    status: newStatus
                })
                .eq('id', f.id);

            if (feeError) {
                console.error(`Error updating fee ${f.id}:`, feeError);
                throw feeError;
            }
            updatedCount++;
        }

        // Insert ONE record into student_discounts ledger
        // discount_type must be 'percentage' or 'fixed' (DB check constraint)
        const dbDiscountType = type === 'percent' ? 'percentage' : 'fixed';

        const payload = {
            student_id: currentStudent.id,
            fee_type: fee.fee_type + (remarks ? ` (${remarks})` : ''),
            discount_type: dbDiscountType,
            discount_value: discountInputValue,
            start_month: eligibleFees.reduce((min, f) => f.month < min ? f.month : min, eligibleFees[0].month),
            end_month: eligibleFees.reduce((max, f) => f.month > max ? f.month : max, eligibleFees[0].month),
            is_automatic: false
        };

        const { error: insertError } = await supabase.from('student_discounts').insert(payload);
        if (insertError) throw insertError;

        toast.success(`Discount applied successfully to ${updatedCount} fee(s)!`);
        window.resetDiscountForm();
        await loadUnpaidFees(currentStudent.id); // Refresh table

    } catch (err) {
        console.error('Apply Error:', err);
        toast.error('Failed to apply discount: ' + err.message);
    } finally {
        if (newBtn) {
            newBtn.innerHTML = originalText;
            newBtn.disabled = false;
        }
    }
}

async function handleEditDiscount(feeId) {
    if (!currentStudent) { toast.warning('No student selected'); return; }

    const fee = currentFees.find(f => f.id === feeId);
    if (!fee) { toast.error('Fee not found'); return; }

    const existingDisc = parseFloat(fee.discount) || 0;
    if (existingDisc <= 0) { toast.warning('This fee has no discount to edit.'); return; }

    // Show an edit dialog using the custom confirmDialog with an input
    // We'll build a custom modal for this
    const editModalId = 'editDiscountModal';
    let existingModal = document.getElementById(editModalId);
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = editModalId;
    modal.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);';
    modal.innerHTML = `
        <div style="background:#1e293b;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:2rem;max-width:480px;width:90%;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
            <div style="text-align:center;margin-bottom:1.5rem;">
                <div style="width:48px;height:48px;margin:0 auto 1rem;background:rgba(99,102,241,0.15);border-radius:12px;display:flex;align-items:center;justify-content:center;">
                    <svg style="width:24px;height:24px;color:#818cf8;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                </div>
                <h3 style="font-size:1.25rem;font-weight:700;color:white;margin-bottom:0.25rem;">Edit Discount</h3>
                <p style="font-size:0.85rem;color:#94a3b8;">${fee.fee_type} &mdash; Original: Rs ${(fee.amount || 0).toLocaleString()}</p>
            </div>

            <div style="margin-bottom:1rem;">
                <label style="display:block;font-size:0.75rem;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;margin-bottom:0.5rem;">Discount Type</label>
                <div style="display:flex;background:#0f172a;padding:4px;border-radius:8px;border:1px solid #334155;">
                    <div id="ed_type_fixed" class="ed-type-btn" data-type="fixed" style="flex:1;padding:8px;text-align:center;border-radius:6px;font-size:0.875rem;color:white;cursor:pointer;background:#7c3aed;font-weight:600;">Fixed Amount</div>
                    <div id="ed_type_percent" class="ed-type-btn" data-type="percent" style="flex:1;padding:8px;text-align:center;border-radius:6px;font-size:0.875rem;color:#94a3b8;cursor:pointer;">Percentage %</div>
                </div>
            </div>

            <div style="margin-bottom:1rem;">
                <label style="display:block;font-size:0.75rem;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;margin-bottom:0.5rem;">New Discount Value</label>
                <input type="number" id="ed_newValue" value="${existingDisc}" min="0" step="0.01" 
                    style="width:100%;background:#0f172a;border:1px solid #334155;color:white;padding:0.75rem;border-radius:8px;font-size:0.875rem;">
                <p style="font-size:0.7rem;color:#64748b;margin-top:0.375rem;">Current discount on this fee: Rs ${existingDisc.toLocaleString()}. Enter the NEW total discount value (replaces the existing discount).</p>
            </div>

            <div style="margin-bottom:1.5rem;">
                <label style="display:block;font-size:0.75rem;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;margin-bottom:0.5rem;">Apply to all "${fee.fee_type}" fees?</label>
                <div style="display:flex;gap:0.75rem;">
                    <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;color:#cbd5e1;font-size:0.85rem;">
                        <input type="radio" name="ed_scope" value="all" checked style="accent-color:#7c3aed;"> Yes, update ALL unpaid "${fee.fee_type}" fees
                    </label>
                    <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;color:#cbd5e1;font-size:0.85rem;">
                        <input type="radio" name="ed_scope" value="single"> Only this fee (${fee.month})
                    </label>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
                <button id="ed_cancel" style="padding:0.75rem;border-radius:8px;border:1px solid #334155;background:transparent;color:#94a3b8;font-weight:600;cursor:pointer;font-size:0.9rem;">Cancel</button>
                <button id="ed_save" style="padding:0.75rem;border-radius:8px;border:none;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:white;font-weight:600;cursor:pointer;font-size:0.9rem;">Save Changes</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Toggle type buttons
    const fixedBtn = document.getElementById('ed_type_fixed');
    const percentBtn = document.getElementById('ed_type_percent');
    fixedBtn.addEventListener('click', () => {
        fixedBtn.style.background = '#7c3aed'; fixedBtn.style.color = 'white'; fixedBtn.style.fontWeight = '600';
        percentBtn.style.background = 'transparent'; percentBtn.style.color = '#94a3b8'; percentBtn.style.fontWeight = 'normal';
    });
    percentBtn.addEventListener('click', () => {
        percentBtn.style.background = '#7c3aed'; percentBtn.style.color = 'white'; percentBtn.style.fontWeight = '600';
        fixedBtn.style.background = 'transparent'; fixedBtn.style.color = '#94a3b8'; fixedBtn.style.fontWeight = 'normal';
    });

    // Wait for user action
    const result = await new Promise(resolve => {
        document.getElementById('ed_cancel').addEventListener('click', () => resolve(null));
        modal.addEventListener('click', (e) => { if (e.target === modal) resolve(null); });
        document.getElementById('ed_save').addEventListener('click', () => {
            const newValue = parseFloat(document.getElementById('ed_newValue').value);
            const scope = document.querySelector('input[name="ed_scope"]:checked').value;
            const editType = fixedBtn.style.background.includes('7c3aed') ? 'fixed' : 'percent';
            resolve({ newValue, scope, editType });
        });
    });

    modal.remove();

    if (!result) return; // User cancelled

    const { newValue, scope, editType } = result;
    if (isNaN(newValue) || newValue < 0) { toast.warning('Please enter a valid discount value.'); return; }

    // Confirm changes
    let feesToUpdate = [];
    if (scope === 'all') {
        // Fetch all unpaid fees of same type
        const { data: allFeesOfType, error: fetchErr } = await supabase
            .from('fees')
            .select('*')
            .eq('student_id', currentStudent.id)
            .eq('fee_type', fee.fee_type)
            .neq('status', 'paid');

        if (fetchErr) { toast.error('Error fetching fees: ' + fetchErr.message); return; }
        feesToUpdate = allFeesOfType || [];
    } else {
        feesToUpdate = [fee];
    }

    if (feesToUpdate.length === 0) { toast.warning('No eligible fees found.'); return; }

    // Confirm with the user
    const scopeText = scope === 'all' ? `ALL ${feesToUpdate.length} unpaid "${fee.fee_type}" fees` : `only this fee (${fee.month})`;
    const confirmed = await window.confirmDialog.show({
        title: 'Confirm Edit Discount',
        message: `Update discount to ${editType === 'percent' ? newValue + '%' : 'Rs ' + newValue.toLocaleString()} on ${scopeText}?`,
        confirmText: 'Update',
        cancelText: 'Cancel',
        type: 'warning'
    });

    if (!confirmed) return;

    try {
        let updatedCount = 0;

        for (const f of feesToUpdate) {
            const feeAmount = parseFloat(f.amount) || 0;
            const feePaid = parseFloat(f.paid_amount) || 0;
            let newDiscount = 0;

            if (editType === 'percent') {
                newDiscount = (feeAmount * newValue) / 100;
            } else {
                newDiscount = newValue;
            }

            // Cap discount so fee doesn't go negative
            const maxDiscount = Math.max(0, feeAmount - feePaid);
            if (newDiscount > maxDiscount) newDiscount = maxDiscount;

            // Determine new status
            const remainingAfterEdit = feeAmount - newDiscount - feePaid;
            let newStatus = 'unpaid';
            if (remainingAfterEdit <= 0) {
                newStatus = 'paid';
            } else if (feePaid > 0 || newDiscount > 0) {
                newStatus = 'partial';
            }

            const { error: updateErr } = await supabase
                .from('fees')
                .update({ discount: newDiscount, status: newStatus })
                .eq('id', f.id);

            if (updateErr) {
                console.error(`Error updating fee ${f.id}:`, updateErr);
                throw updateErr;
            }
            updatedCount++;
        }

        toast.success(`Discount updated on ${updatedCount} fee(s)!`);
        await loadUnpaidFees(currentStudent.id); // Refresh table
        window.resetDiscountForm();

    } catch (err) {
        console.error('Edit Discount Error:', err);
        toast.error('Failed to update discount: ' + err.message);
    }
}

function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
