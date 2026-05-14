/* ============================================
   PlainTalk — Patient View Logic
   ============================================ */

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
    loadPatientData();
    updateTimeGreeting();
    loadModePreference();
    startReminderChecker();
    setInterval(updateTimeGreeting, 60000);
    setInterval(checkReminders, 15000); // Check reminders every 15 seconds
});

// ============ DATA LOADING ============
function getAdminData() {
    const data = localStorage.getItem('plaintalk_admin');
    if (!data) return getDefaultData();
    try {
        return JSON.parse(data);
    } catch {
        return getDefaultData();
    }
}

function getDefaultData() {
    return {
        patientName: 'Eileen',
        emergencyContact: 'tel:+441234567890',
        music: { selectedSong: null },
        album: { photos: [] },
        activity: { title: '', steps: [] },
        reading: {
            newspapers: [],
            books: []
        },
        reminders: []
    };
}

function loadPatientData() {
    const data = getAdminData();

    // Set patient name
    document.getElementById('greeting').textContent = `Hello, ${data.patientName}`;

    // Emergency call button
    document.getElementById('callBtn').onclick = () => {
        if (data.emergencyContact) {
            window.location.href = data.emergencyContact;
        } else {
            alert('No emergency contact has been set. Ask your carer to add one.');
        }
    };
}

// ============ TIME GREETING ============
function updateTimeGreeting() {
    const hour = new Date().getHours();
    const el = document.getElementById('timeGreeting');
    if (hour < 12) el.textContent = 'Good morning ☀️';
    else if (hour < 17) el.textContent = 'Good afternoon 🌤️';
    else el.textContent = 'Good evening 🌙';
}

// ============ MODE TOGGLE ============
function loadModePreference() {
    const saved = localStorage.getItem('plaintalk_mode');
    if (saved === 'dark') {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
    }
}

document.getElementById('modeToggle').addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark-mode');
    if (isDark) {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        localStorage.setItem('plaintalk_mode', 'light');
    } else {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
        localStorage.setItem('plaintalk_mode', 'dark');
    }
});

// ============ PANELS ============
function openPanel(id) {
    document.getElementById(id).classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closePanel(id) {
    document.getElementById(id).classList.remove('active');
    document.body.style.overflow = '';
    // Stop music if closing music panel
    if (id === 'musicPanel') {
        const audio = document.getElementById('audioPlayer');
        if (audio) audio.pause();
        updatePlayIcon(false);
    }
}

// ============ MUSIC ============
let isPlaying = false;

function openMusic() {
    const data = getAdminData();
    const song = data.music?.selectedSong;

    if (song) {
        document.getElementById('musicNowPlaying').textContent = `🎶 Now Playing: ${song.name}`;
        document.getElementById('musicControls').style.display = 'block';
        document.getElementById('audioPlayer').src = song.url || '';
    } else {
        document.getElementById('musicNowPlaying').textContent = 'No song chosen yet. Ask your carer to pick one.';
        document.getElementById('musicControls').style.display = 'none';
    }

    openPanel('musicPanel');
}

function togglePlay() {
    const audio = document.getElementById('audioPlayer');
    if (!audio.src) return;

    if (isPlaying) {
        audio.pause();
    } else {
        audio.play().catch(() => {
            document.getElementById('musicNowPlaying').textContent = 'Cannot play this song right now.';
        });
    }
    isPlaying = !isPlaying;
    updatePlayIcon(isPlaying);
}

function updatePlayIcon(playing) {
    document.getElementById('playIcon').style.display = playing ? 'none' : 'block';
    document.getElementById('pauseIcon').style.display = playing ? 'block' : 'none';
    isPlaying = playing;
}

// ============ ALBUM ============
function openAlbum() {
    const data = getAdminData();
    const grid = document.getElementById('albumGrid');
    const photos = data.album?.photos || [];

    if (photos.length === 0) {
        grid.innerHTML = '<p>No photos added yet. Ask your carer to add some.</p>';
    } else {
        grid.innerHTML = photos.map(p =>
            `<img src="${p}" alt="Photo" loading="lazy">`
        ).join('');
    }

    openPanel('albumPanel');
}

// ============ ACTIVITY ============
function openActivity() {
    const data = getAdminData();
    const container = document.getElementById('activitySteps');
    const activity = data.activity;

    if (!activity || !activity.steps || activity.steps.length === 0) {
        container.innerHTML = '<p>No activity set yet. Ask your carer to add one.</p>';
    } else {
        container.innerHTML = `
            <h3 style="font-family:'Quicksand',sans-serif;font-size:1.4rem;font-weight:700;color:var(--text-primary);margin-bottom:8px;">
                ${activity.title || 'Activity'}
            </h3>
            ${activity.steps.map((step, i) => `
                <div class="activity-step">
                    <div class="step-number">${i + 1}</div>
                    <div class="step-text">${step}</div>
                </div>
            `).join('')}
        `;
    }

    openPanel('activityPanel');
}

// ============ READING ============
function openReading() {
    const data = getAdminData();
    const container = document.getElementById('readingContent');
    const isDark = document.body.classList.contains('dark-mode');

    if (isDark) {
        // Night mode — show children's books
        const books = data.reading?.books || [];
        if (books.length === 0) {
            container.innerHTML = '<p>No stories added yet. Ask your carer to add some.</p>';
        } else {
            container.innerHTML = books.map(b => `
                <div class="reading-article">
                    <h3>📖 ${b.title}</h3>
                    <p>${b.content}</p>
                </div>
            `).join('');
        }
    } else {
        // Day mode — show simplified newspapers
        const articles = data.reading?.newspapers || [];
        if (articles.length === 0) {
            container.innerHTML = '<p>No news added yet. Ask your carer to add some.</p>';
        } else {
            container.innerHTML = articles.map(a => `
                <div class="reading-article">
                    <h3>📰 ${a.title}</h3>
                    <p>${a.content}</p>
                </div>
            `).join('');
        }
    }

    openPanel('readingPanel');
}

// ============ REMINDERS ============
let activeReminderQueue = [];
let dismissedReminders = new Set();

function startReminderChecker() {
    // Load dismissed reminders from session
    const dismissed = sessionStorage.getItem('plaintalk_dismissed');
    if (dismissed) {
        try {
            dismissedReminders = new Set(JSON.parse(dismissed));
        } catch {}
    }
    checkReminders();
}

function checkReminders() {
    const data = getAdminData();
    const reminders = data.reminders || [];
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (const reminder of reminders) {
        const [h, m] = reminder.time.split(':').map(Number);
        const reminderMinutes = h * 60 + m;
        const key = `${reminder.time}-${reminder.text}`;

        // Show if within 2 minutes of reminder time and not dismissed
        if (Math.abs(currentMinutes - reminderMinutes) <= 2 && !dismissedReminders.has(key)) {
            showReminder(reminder, key);
            return;
        }
    }
}

function showReminder(reminder, key) {
    const overlay = document.getElementById('reminderOverlay');
    const iconEl = document.getElementById('reminderIcon');
    const titleEl = document.getElementById('reminderTitle');
    const descEl = document.getElementById('reminderDesc');

    // Choose icon based on text
    const text = reminder.text.toLowerCase();
    if (text.includes('medicine') || text.includes('pill') || text.includes('tablet')) {
        iconEl.textContent = '💊';
    } else if (text.includes('water') || text.includes('drink')) {
        iconEl.textContent = '💧';
    } else if (text.includes('eat') || text.includes('food') || text.includes('meal') || text.includes('lunch') || text.includes('dinner') || text.includes('breakfast')) {
        iconEl.textContent = '🍽️';
    } else if (text.includes('walk') || text.includes('exercise')) {
        iconEl.textContent = '🚶';
    } else if (text.includes('sleep') || text.includes('bed') || text.includes('rest') || text.includes('nap')) {
        iconEl.textContent = '🛏️';
    } else {
        iconEl.textContent = '⏰';
    }

    titleEl.textContent = reminder.text;
    descEl.textContent = `It's time. Please do this now.`;
    overlay.classList.add('active');

    document.getElementById('reminderDoneBtn').onclick = () => {
        overlay.classList.remove('active');
        dismissedReminders.add(key);
        sessionStorage.setItem('plaintalk_dismissed', JSON.stringify([...dismissedReminders]));

        // Mark as completed in admin data
        const data = getAdminData();
        const rIdx = data.reminders.findIndex(r => r.time === reminder.time && r.text === reminder.text);
        if (rIdx >= 0) {
            data.reminders[rIdx].completed = true;
            localStorage.setItem('plaintalk_admin', JSON.stringify(data));
        }
    };
}
