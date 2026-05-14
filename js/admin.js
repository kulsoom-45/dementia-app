/* ============================================
   PlainTalk — Admin/Carer Dashboard Logic
   ============================================ */

// Song library
const SONG_LIBRARY = [
    { name: 'Calm Piano', url: '', description: 'Gentle piano melody for relaxation' },
    { name: 'Nature Sounds', url: '', description: 'Birdsong and flowing water' },
    { name: 'Classic Jazz', url: '', description: 'Smooth, relaxing jazz tune' }
];

// ============ DATA HELPERS ============
function getAdminData() {
    const raw = localStorage.getItem('plaintalk_admin');
    if (!raw) return getDefaultData();
    try { return JSON.parse(raw); } catch { return getDefaultData(); }
}

function saveAdminData(data) {
    localStorage.setItem('plaintalk_admin', JSON.stringify(data));
}

function getDefaultData() {
    return {
        patientName: 'Eileen',
        emergencyContact: '',
        music: { selectedSong: null },
        album: { photos: [] },
        activity: { title: '', steps: [] },
        reading: { newspapers: [], books: [] },
        reminders: [],
        patientInfo: { name: '', age: '', diagnosis: '', notes: '' },
        usage: { music: 0, album: 0, activity: 0, reading: 0 }
    };
}

function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

function showConfirm(id, msg) {
    const el = document.getElementById(id);
    el.textContent = msg;
    setTimeout(() => { el.textContent = ''; }, 3000);
}

// ============ INIT ============
document.addEventListener('DOMContentLoaded', () => {
    loadReminders();
    loadMusic();
    loadNewsList();
    loadBooksList();
    loadPhotos();
    loadActivity();
    loadPatientInfo();
    loadSettings();
    loadUsageStats();
    loadApiKey();
});

// ============ NAVIGATION ============
function showSection(name) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('section-' + name).classList.add('active');
    document.querySelector('.nav-item[data-section="' + name + '"]').classList.add('active');
    document.getElementById('sidebar').classList.remove('open');
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// ============ REMINDERS ============
function addReminder() {
    const time = document.getElementById('reminderTime').value;
    const text = document.getElementById('reminderText').value.trim();
    if (!time || !text) { alert('Please set both a time and a reminder message.'); return; }

    const data = getAdminData();
    data.reminders.push({ time: time, text: text, completed: false });
    data.reminders.sort((a, b) => a.time.localeCompare(b.time));
    saveAdminData(data);

    document.getElementById('reminderTime').value = '';
    document.getElementById('reminderText').value = '';
    loadReminders();
}

function deleteReminder(i) {
    const data = getAdminData();
    data.reminders.splice(i, 1);
    saveAdminData(data);
    loadReminders();
}

function loadReminders() {
    const data = getAdminData();
    const list = document.getElementById('remindersList');
    const r = data.reminders || [];
    if (r.length === 0) { list.innerHTML = '<p class="empty-state">No reminders set yet.</p>'; return; }

    list.innerHTML = r.map((rem, i) => {
        const done = rem.completed;
        const h = parseInt(rem.time.split(':')[0]);
        const m = rem.time.split(':')[1];
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return '<div class="reminder-item ' + (done ? 'completed' : '') + '">' +
            '<span class="reminder-time">' + h12 + ':' + m + ' ' + ampm + '</span>' +
            '<span class="reminder-text-label">' + escapeHtml(rem.text) + '</span>' +
            '<span class="reminder-status ' + (done ? 'status-done' : 'status-pending') + '">' + (done ? '✓ Done' : 'Pending') + '</span>' +
            '<button class="reminder-delete" onclick="deleteReminder(' + i + ')" title="Delete">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>';
    }).join('');
}

// ============ MUSIC ============
function loadMusic() {
    const data = getAdminData();
    if (data.music && data.music.selectedSong) {
        const idx = SONG_LIBRARY.findIndex(s => s.name === data.music.selectedSong.name);
        if (idx >= 0) {
            const radio = document.querySelector('input[name="song"][value="' + idx + '"]');
            if (radio) radio.checked = true;
        }
    }
}

function saveMusic() {
    const sel = document.querySelector('input[name="song"]:checked');
    if (!sel) { alert('Please select a song first.'); return; }
    const idx = parseInt(sel.value);
    const data = getAdminData();
    data.music.selectedSong = SONG_LIBRARY[idx];
    saveAdminData(data);
    showConfirm('musicSaveConfirm', '✓ "' + SONG_LIBRARY[idx].name + '" saved for patient.');
}

// ============ API KEY ============
function loadApiKey() {
    const key = localStorage.getItem('plaintalk_apikey') || '';
    if (key) document.getElementById('apiKeyInput').value = key;
}

function saveApiKey() {
    const key = document.getElementById('apiKeyInput').value.trim();
    if (!key) { alert('Please enter an API key.'); return; }
    localStorage.setItem('plaintalk_apikey', key);
    showConfirm('apiKeySaveConfirm', '✓ API key saved.');
}

function getApiKey() {
    return localStorage.getItem('plaintalk_apikey') || '';
}

// ============ READING — NEWSPAPERS (AI) ============
async function simplifyAndAddNews() {
    const title = document.getElementById('newsTitle').value.trim();
    const text = document.getElementById('newsText').value.trim();
    if (!title || !text) { alert('Please enter both a title and article text.'); return; }

    const apiKey = getApiKey();
    if (!apiKey) { alert('Please save your OpenAI API key first (scroll up).'); return; }

    const spinner = document.getElementById('newsSpinner');
    spinner.style.display = 'flex';

    try {
        const simplified = await simplifyText(text, apiKey, 'newspaper');

        const data = getAdminData();
        if (!data.reading) data.reading = { newspapers: [], books: [] };
        if (!data.reading.newspapers) data.reading.newspapers = [];
        data.reading.newspapers.push({ title: title, content: simplified, original: text });
        saveAdminData(data);

        document.getElementById('newsTitle').value = '';
        document.getElementById('newsText').value = '';
        loadNewsList();
    } catch (err) {
        alert('Error simplifying text: ' + err.message);
    } finally {
        spinner.style.display = 'none';
    }
}

async function simplifyText(text, apiKey, type) {
    const systemPrompt = type === 'newspaper'
        ? 'You are PlainTalk, a text simplifier for elderly dementia patients. Rewrite the following newspaper article in very simple, plain English. Use short sentences (max 10 words each). Avoid jargon, acronyms, and complex words. Use everyday language a child could understand. Keep the key facts but make it calming and clear. Add line breaks between paragraphs for readability.'
        : 'You are PlainTalk. Simplify this text for a dementia patient to read at bedtime. Use very simple words, short sentences, and a warm soothing tone like a children\'s book for ages 3-6.';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: text }
            ],
            max_tokens: 1000,
            temperature: 0.5
        })
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || 'API request failed (' + response.status + ')');
    }

    const result = await response.json();
    return result.choices[0].message.content.trim();
}

function deleteNews(i) {
    const data = getAdminData();
    data.reading.newspapers.splice(i, 1);
    saveAdminData(data);
    loadNewsList();
}

function loadNewsList() {
    const data = getAdminData();
    const list = document.getElementById('newsList');
    const items = (data.reading && data.reading.newspapers) || [];
    if (items.length === 0) { list.innerHTML = ''; return; }

    list.innerHTML = items.map((item, i) =>
        '<div class="item-entry">' +
        '<div class="item-entry-content"><strong>📰 ' + escapeHtml(item.title) + '</strong>' +
        '<p>' + escapeHtml(item.content).substring(0, 150) + '...</p></div>' +
        '<button class="item-delete" onclick="deleteNews(' + i + ')" title="Remove">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>'
    ).join('');
}

// ============ READING — BOOKS ============
function addBook() {
    const title = document.getElementById('bookTitle').value.trim();
    const text = document.getElementById('bookText').value.trim();
    if (!title || !text) { alert('Please enter both a title and story text.'); return; }

    const data = getAdminData();
    if (!data.reading) data.reading = { newspapers: [], books: [] };
    if (!data.reading.books) data.reading.books = [];
    data.reading.books.push({ title: title, content: text });
    saveAdminData(data);

    document.getElementById('bookTitle').value = '';
    document.getElementById('bookText').value = '';
    loadBooksList();
}

function deleteBook(i) {
    const data = getAdminData();
    data.reading.books.splice(i, 1);
    saveAdminData(data);
    loadBooksList();
}

function loadBooksList() {
    const data = getAdminData();
    const list = document.getElementById('booksList');
    const items = (data.reading && data.reading.books) || [];
    if (items.length === 0) { list.innerHTML = ''; return; }

    list.innerHTML = items.map((item, i) =>
        '<div class="item-entry">' +
        '<div class="item-entry-content"><strong>📖 ' + escapeHtml(item.title) + '</strong>' +
        '<p>' + escapeHtml(item.content).substring(0, 150) + '...</p></div>' +
        '<button class="item-delete" onclick="deleteBook(' + i + ')" title="Remove">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>'
    ).join('');
}

// ============ ALBUM ============
function addPhoto() {
    const url = document.getElementById('photoUrl').value.trim();
    if (!url) { alert('Please enter a photo URL.'); return; }

    const data = getAdminData();
    if (!data.album) data.album = { photos: [] };
    data.album.photos.push(url);
    saveAdminData(data);

    document.getElementById('photoUrl').value = '';
    loadPhotos();
}

function deletePhoto(i) {
    const data = getAdminData();
    data.album.photos.splice(i, 1);
    saveAdminData(data);
    loadPhotos();
}

function loadPhotos() {
    const data = getAdminData();
    const grid = document.getElementById('photosList');
    const photos = (data.album && data.album.photos) || [];
    if (photos.length === 0) { grid.innerHTML = '<p class="empty-state">No photos added yet.</p>'; return; }

    grid.innerHTML = photos.map((url, i) =>
        '<div class="photo-item">' +
        '<img src="' + escapeHtml(url) + '" alt="Photo" onerror="this.src=\'data:image/svg+xml,<svg xmlns=\\\'http://www.w3.org/2000/svg\\\' width=\\\'100\\\' height=\\\'100\\\'><rect fill=\\\'%23eee\\\' width=\\\'100\\\' height=\\\'100\\\'/><text x=\\\'50%25\\\' y=\\\'50%25\\\' dominant-baseline=\\\'middle\\\' text-anchor=\\\'middle\\\' fill=\\\'%23999\\\' font-size=\\\'12\\\'>No image</text></svg>\'">' +
        '<button class="photo-delete" onclick="deletePhoto(' + i + ')">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>'
    ).join('');
}

// ============ ACTIVITY ============
function loadActivity() {
    const data = getAdminData();
    if (data.activity && data.activity.title) {
        document.getElementById('activityTitle').value = data.activity.title;
    }
    if (data.activity && data.activity.steps && data.activity.steps.length > 0) {
        document.getElementById('activityStepsInput').value = data.activity.steps.join('\n');
    }
}

function saveActivity() {
    const title = document.getElementById('activityTitle').value.trim();
    const stepsRaw = document.getElementById('activityStepsInput').value.trim();
    if (!title || !stepsRaw) { alert('Please enter an activity name and steps.'); return; }

    const steps = stepsRaw.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    const data = getAdminData();
    data.activity = { title: title, steps: steps };
    saveAdminData(data);

    showConfirm('activitySaveConfirm', '✓ Activity saved! (' + steps.length + ' steps)');
}

// ============ PATIENT INFO ============
function loadPatientInfo() {
    const data = getAdminData();
    const pi = data.patientInfo || {};
    if (pi.name) document.getElementById('piName').value = pi.name;
    if (pi.age) document.getElementById('piAge').value = pi.age;
    if (pi.diagnosis) document.getElementById('piDiagnosis').value = pi.diagnosis;
    if (pi.notes) document.getElementById('piNotes').value = pi.notes;
}

function savePatientInfo() {
    const data = getAdminData();
    data.patientInfo = {
        name: document.getElementById('piName').value.trim(),
        age: document.getElementById('piAge').value.trim(),
        diagnosis: document.getElementById('piDiagnosis').value.trim(),
        notes: document.getElementById('piNotes').value.trim()
    };
    saveAdminData(data);
    showConfirm('piSaveConfirm', '✓ Patient info saved.');
}

function loadUsageStats() {
    const data = getAdminData();
    const u = data.usage || { music: 0, album: 0, activity: 0, reading: 0 };
    const max = Math.max(u.music, u.album, u.activity, u.reading, 1);

    document.getElementById('statMusic').style.width = ((u.music / max) * 100) + '%';
    document.getElementById('statMusicVal').textContent = u.music;
    document.getElementById('statAlbum').style.width = ((u.album / max) * 100) + '%';
    document.getElementById('statAlbumVal').textContent = u.album;
    document.getElementById('statActivity').style.width = ((u.activity / max) * 100) + '%';
    document.getElementById('statActivityVal').textContent = u.activity;
    document.getElementById('statReading').style.width = ((u.reading / max) * 100) + '%';
    document.getElementById('statReadingVal').textContent = u.reading;
}

// ============ SETTINGS ============
function loadSettings() {
    const data = getAdminData();
    if (data.patientName) document.getElementById('settingName').value = data.patientName;
    if (data.emergencyContact) {
        document.getElementById('settingPhone').value = data.emergencyContact.replace('tel:', '');
    }
}

function saveSettings() {
    const name = document.getElementById('settingName').value.trim();
    const phone = document.getElementById('settingPhone').value.trim();

    const data = getAdminData();
    if (name) data.patientName = name;
    if (phone) data.emergencyContact = 'tel:' + phone.replace(/\s/g, '');
    saveAdminData(data);

    showConfirm('settingsSaveConfirm', '✓ Settings saved.');
}

function resetAllData() {
    if (confirm('Are you sure? This will delete ALL data including reminders, reading material, photos, and settings.')) {
        localStorage.removeItem('plaintalk_admin');
        localStorage.removeItem('plaintalk_apikey');
        localStorage.removeItem('plaintalk_mode');
        sessionStorage.removeItem('plaintalk_dismissed');
        location.reload();
    }
}
