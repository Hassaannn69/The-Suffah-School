// Teacher Messaging Module
const supabase = window.supabase;
const toast = window.toast || { success: (m) => alert(m), error: (m) => alert(m) };

let currentTeacher = null;
let assignedClasses = [];
let messages = [];
let selectedRecipient = null; // { type: 'class|individual', id: '', name: '' }

export async function render(container) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: teacher } = await supabase.from('teachers').select('*').eq('auth_id', user.id).maybeSingle();
    currentTeacher = teacher;

    const { data: classAssists } = await supabase.from('teacher_assignments').select('*, classes(*)').eq('teacher_id', currentTeacher.id);
    assignedClasses = classAssists || [];

    await loadMessages();

    container.innerHTML = `
        <div class="h-[calc(100vh-12rem)] flex gap-6 animate-in fade-in duration-500">
            <!-- Sidebar: Contacts/Classes -->
            <div class="w-80 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden shadow-sm">
                <div class="p-6 border-b border-gray-100 dark:border-gray-800">
                    <h3 class="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Messages</h3>
                    <div class="mt-4 relative">
                        <input type="text" placeholder="Search contacts..." class="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white">
                        <svg class="w-4 h-4 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </div>
                </div>
                <div class="flex-1 overflow-y-auto p-4 space-y-2">
                    <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-2">My Classes</p>
                    ${assignedClasses.map(ta => `
                        <button onclick="window.selectMessageRecipient('class', '${ta.class_id}', '${ta.classes.class_name} - ${ta.section || 'All'}')" class="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group">
                            <div class="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black">C</div>
                            <div class="text-left">
                                <p class="text-sm font-bold text-gray-900 dark:text-white">${ta.classes.class_name} - ${ta.section || 'All'}</p>
                                <p class="text-[10px] text-gray-500 uppercase tracking-widest">${ta.subject || 'Class Teacher'}</p>
                            </div>
                        </button>
                    `).join('')}
                    
                    <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mt-6 mb-2">Recent Chats</p>
                    <div class="text-center py-8 opacity-40">
                        <p class="text-xs text-gray-500">No individual chats yet</p>
                    </div>
                </div>
            </div>

            <!-- Chat Area -->
            <div class="flex-1 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden shadow-sm">
                <div id="chatHeader" class="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <div id="recipientAvatar" class="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-black text-gray-500">?</div>
                        <div>
                            <h3 id="recipientName" class="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Select a Chat</h3>
                            <p id="recipientStatus" class="text-xs text-emerald-500 font-bold uppercase tracking-widest hidden">Active Now</p>
                        </div>
                    </div>
                </div>

                <div id="chatMessages" class="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/30 dark:bg-gray-800/10">
                    <div class="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                        <svg class="w-20 h-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                        <p class="font-bold">Select a class or student to start messaging</p>
                    </div>
                </div>

                <div class="p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                    <form id="messageForm" class="flex gap-4">
                        <input type="text" id="messageInput" placeholder="Type your message here..." class="flex-1 px-6 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white shadow-inner" disabled>
                        <button type="submit" id="sendBtn" class="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl shadow-xl shadow-primary-500/20 transition-all transform active:scale-95 disabled:opacity-50" disabled>
                            SEND
                        </button>
                    </form>
                </div>
            </div>
        </div>
    `;

    document.getElementById('messageForm').addEventListener('submit', sendMessage);
}

async function loadMessages() {
    // Real-time listener for messages
    // In actual implementation, we might use Supabase Realtime
}

window.selectMessageRecipient = async (type, id, name) => {
    selectedRecipient = { type, id, name };

    // Update Header
    document.getElementById('recipientName').textContent = name;
    document.getElementById('recipientAvatar').textContent = name.charAt(0);
    document.getElementById('recipientAvatar').className = `w-12 h-12 rounded-2xl ${type === 'class' ? 'bg-indigo-100 dark:bg-indigo-900' : 'bg-emerald-100'} flex items-center justify-center font-black ${type === 'class' ? 'text-indigo-600' : 'text-emerald-600'}`;
    document.getElementById('recipientStatus').classList.remove('hidden');

    // Enable Form
    document.getElementById('messageInput').disabled = false;
    document.getElementById('sendBtn').disabled = false;

    await fetchChatHistory();
};

async function fetchChatHistory() {
    const chatBox = document.getElementById('chatMessages');
    chatBox.innerHTML = `<div class="p-8 text-center animate-pulse">Loading history...</div>`;

    let query = supabase.from('messages').select('*').order('created_at', { ascending: true });

    if (selectedRecipient.type === 'class') {
        query = query.eq('class_id', selectedRecipient.id);
    } else {
        // Individual logic...
    }

    const { data } = await query;
    messages = data || [];

    renderMessages();
}

function renderMessages() {
    const chatBox = document.getElementById('chatMessages');
    if (messages.length === 0) {
        chatBox.innerHTML = `<div class="h-full flex items-center justify-center text-gray-400 italic">No messages yet. Start the conversation!</div>`;
        return;
    }

    chatBox.innerHTML = messages.map(m => {
        const isMe = m.sender_auth_id === currentTeacher.auth_id;
        return `
            <div class="flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2">
                <div class="max-w-[70%]">
                    <div class="p-4 rounded-3xl ${isMe ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-none border border-gray-100 dark:border-gray-700'} shadow-sm">
                        <p class="text-sm leading-relaxed">${m.content}</p>
                    </div>
                    <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1 ${isMe ? 'text-right' : 'text-left'}">
                        ${new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
            </div>
        `;
    }).join('');

    // Scroll to bottom
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage(e) {
    e.preventDefault();
    const input = document.getElementById('messageInput');
    const content = input.value.trim();
    if (!content || !selectedRecipient) return;

    input.value = '';

    const messageData = {
        sender_auth_id: currentTeacher.auth_id,
        content: content,
        receiver_role: selectedRecipient.type === 'class' ? 'student' : 'individual'
    };

    if (selectedRecipient.type === 'class') {
        messageData.class_id = selectedRecipient.id;
    } else {
        messageData.receiver_auth_id = selectedRecipient.id;
    }

    const { error } = await supabase.from('messages').insert([messageData]);

    if (error) {
        toast.error('Failed to send message');
    } else {
        await fetchChatHistory();
    }
}
