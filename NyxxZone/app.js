// ==================================================
//          1. MOTOR: CANLI SİSTEM MONİTÖRÜ (OS)
// ==================================================
async function updateSystemMonitor() {
    try {
        const response = await fetch('http://localhost:8001/api/system-status');
        if (!response.ok) throw new Error("Backend OS bağlantısı koptu");
        
        const result = await response.json();
        if (!result.success) return;

        // CPU Grafik ve Metin Güncelleme
        document.getElementById('cpu-model').innerText = result.cpu.model;
        document.getElementById('cpu-text').innerText = `${result.cpu.usage}%`;
        document.getElementById('cpu-bar').style.width = `${result.cpu.usage}%`;

        // RAM Grafik ve Metin Güncelleme
        document.getElementById('ram-text').innerText = `${result.ram.used} / ${result.ram.total} GB (${result.ram.percent}%)`;
        document.getElementById('ram-bar').style.width = `${result.ram.percent}%`;

        // Uptime Güncelleme
        document.getElementById('uptime-text').innerText = result.uptime;

    } catch (error) {
        console.error("Monitör siber hata:", error);
    }
}


// ==================================================
//        2. MOTOR: CANLI GİTHUB COMMIT GRİD
// ==================================================
async function fetchRealGitHubCommits() {
    const gridContainer = document.getElementById('commit-grid');
    if (!gridContainer) return;

    // Senin harbi siber-hesabın amk!
    const githubUsername = "FOREVERYTHİNG001"; 

    try {
        const response = await fetch(`http://localhost:8001/api/github-commits/${githubUsername}`);
        if (!response.ok) throw new Error("Backend'den commit verisi alınamadı");

        const result = await response.json();
        if (!result.success || !result.data.length) throw new Error("Boş veri döndü");

        // Önce gridin içini tamamen temizle amk
        gridContainer.innerHTML = '';

        // GitHub'dan gelen gerçek 96 günlük yoğunluk matrisini çiziyoruz
        result.data.forEach((level, index) => {
            const cell = document.createElement('div');
            cell.className = 'commit-cell';

            if (level > 0) {
                cell.classList.add(`commit-level-${level}`);
            }

            cell.setAttribute('title', `Matrix Day ${index + 1}: Level ${level} GitHub Activity`);
            gridContainer.appendChild(cell);
        });

    } catch (error) {
        console.error("Grid yüklenirken siber hata:", error);
        gridContainer.innerHTML = '<small style="color: #ff0055; grid-column: span 24;">GitHub veri hattı kesildi amk.</small>';
    }
}


// ==================================================
//               3. MOTOR: CORTEX CHAT KÖPRÜSÜ
// ==================================================
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatScreen = document.getElementById('chat-screen');

function appendMessage(sender, text, type) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `msg msg-${type}`;
    
    msgDiv.innerHTML = `
        <span class="msg-author">${sender.toUpperCase()}:</span>
        <p style="white-space: pre-wrap;">${text}</p>
    `;
    
    chatScreen.appendChild(msgDiv);
    chatScreen.scrollTop = chatScreen.scrollHeight;
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const messageText = userInput.value.trim();
    if (!messageText) return;

    appendMessage('Nyxx', messageText, 'user');
    userInput.value = '';

    appendMessage('Cortex', 'Düşünülüyor...', 'ai');
    const loadingMsg = chatScreen.lastChild;

    try {
        const response = await fetch('http://localhost:8001/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: messageText })
        });

        if (!response.ok) throw new Error("Backend bağlantısı koptu.");
        
        const data = await response.json();
        loadingMsg.remove();
        appendMessage('Cortex', data.reply || data.response, 'ai');

    } catch (error) {
        console.error("Cortex hatası:", error);
        loadingMsg.remove();
        appendMessage('Cortex', 'HATA: Lokal yapay zeka motoruyla bağlantı kurulamadı. Endpoint veya portu kontrol et amk.', 'ai');
    }
});


// ==================================================
//         DOM YÜKLENİNCE TÜM SİSTEMLERİ TETİKLE
// ==================================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Donanım monitörünü başlat ve her 3 saniyede bir güncelle amk
    updateSystemMonitor();
    setInterval(updateSystemMonitor, 3000); 

    // 2. Gerçek GitHub takvimini anlık olarak karelere diz amk
    fetchRealGitHubCommits();
});