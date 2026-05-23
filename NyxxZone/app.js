const hypeStream = document.getElementById('hype-stream');

// Fandom API'sinden Hazbin Hotel verilerini çeken fonksiyon
async function fetchFandomUpdates() {
    // Hazbin Hotel Wiki'nin son aktivitelerini çeken API endpoint'i
    const wikiUrl = "https://hazbinhotel.fandom.com/api.v1/Activity/LatestActivity?limit=5&namespaces=0";
    
    // CORS engelini aşmak için ücretsiz bir proxy kullanıyoruz
    const proxyUrl = "https://cors-anywhere.herokuapp.com/"; 

    try {
        // Not: Eğer cors-anywhere demo kullanıyorsan, tarayıcıda bir kez 
        // https://cors-anywhere.herokuapp.com/https://hazbinhotel.fandom.com/api.v1/Activity/LatestActivity
        // linkine gidip "Request temporary access" butonuna basman gerekebilir.
        
        const response = await fetch(proxyUrl + wikiUrl);
        if (!response.ok) throw new Error("API hatası amk");
        
        const data = await response.json();
        
        // Önce eski statik veya simüle içerikleri temizleyelim
        hypeStream.innerHTML = '';

        // Gelen verileri ekrana basma
        data.items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'feed-item';
            
            // Eğer başlık çok uzunsa arayüzü bozmasın diye kırpıyoruz
            const shortTitle = item.pageTitle.length > 35 ? item.pageTitle.substring(0, 35) + '...' : item.pageTitle;
            
            // Kullanıcı adı yoksa anonim yazsın
            const author = item.userVO ? item.userVO.name : "Anonymous";

            div.innerHTML = `
                <span class="feed-icon">󰚝</span>
                <div class="feed-content">
                    <h4>${shortTitle}</h4>
                    <small>Updated by ${author} • Wiki Live</small>
                </div>
            `;
            hypeStream.appendChild(div);
        });

    } catch (error) {
        console.error("Veri çekilemedi:", error);
        // Eğer API patlarsa veya proxy takılırsa arayüz boş kalmasın diye fallback (yedek) gösteriyoruz
        hypeStream.innerHTML = `
            <div class="feed-item">
                <span class="feed-icon">⚠️</span>
                <div class="feed-content">
                    <h4>Fandom API Bağlantı Hatası</h4>
                    <small>Proxy iznini kontrol et veya sayfayı yenile.</small>
                </div>
            </div>
        `;
    }
}

// Sayfa ilk açıldığında veriyi çek
fetchFandomUpdates();

// Her 60 saniyede bir arkada veriyi tazele
setInterval(fetchFandomUpdates, 60000);


// ==================================================
//               CORTEX CHAT KÖPRÜSÜ
// ==================================================
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatScreen = document.getElementById('chat-screen');

// Ekrana Yeni Mesaj Basma Fonksiyonu
function appendMessage(sender, text, type) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `msg msg-${type}`;
    
    msgDiv.innerHTML = `
        <span class="msg-author">${sender.toUpperCase()}:</span>
        <p>${text}</p>
    `;
    
    chatScreen.appendChild(msgDiv);
    // Yeni mesaj gelince otomatik aşağı kaydır
    chatScreen.scrollTop = chatScreen.scrollHeight;
}

// Form Gönderildiğinde Tetiklenen Olay
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const messageText = userInput.value.trim();
    if (!messageText) return;

    // 1. Kullanıcının yazdığı mesajı ekrana bas
    appendMessage('Nyxx', messageText, 'user');
    userInput.value = ''; // Input'u temizle

    // 2. Yapay zekaya "Düşünüyor..." efekti ver
    appendMessage('Cortex', 'Düşünülüyor...', 'ai');
    const loadingMsg = chatScreen.lastChild;

    try {
        // GÜNCELLENEN ADRES: NyxxAI arka plan motorumuzun portu (8001) bağlandı
        const response = await fetch('http://localhost:8001/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: messageText })
        });

        if (!response.ok) throw new Error("Backend bağlantısı koptu.");
        
        const data = await response.json();
        
        // "Düşünüyor..." yazısını sil ve yerel JS motorunun yanıtını bas
        loadingMsg.remove();
        appendMessage('Cortex', data.reply || data.response, 'ai');

    } catch (error) {
        console.error("Cortex hatası:", error);
        loadingMsg.remove();
        appendMessage('Cortex', 'HATA: Lokal yapay zeka motoruyla bağlantı kurulamadı. Endpoint veya portu kontrol et amk.', 'ai');
    }
});


// ==================================================
//             COMMIT TRACKER GRID MOTORU
// ==================================================
function generateCommitTracker() {
    const gridContainer = document.getElementById('commit-grid');
    if (!gridContainer) return;

    // Arayüze tam oturması için 96 adet kare fırlatıyoruz (Yaklaşık 3 aylık takip)
    const totalCells = 96; 

    for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement('div');
        cell.className = 'commit-cell';

        // Rastgele kodlama yoğunluğu simüle edelim (0: boş, 1-4: yeşil tonları)
        // Gerçekçilik katmak için boş günlerin ihtimalini yüksek tutuyoruz amk
        const rand = Math.random();
        let level = 0;
        
        if (rand > 0.85) level = 4;      // Çılgın yükleme günü
        else if (rand > 0.70) level = 3; // Yoğun gün
        else if (rand > 0.55) level = 2; // Orta tempo
        else if (rand > 0.40) level = 1; // Az kodlama

        if (level > 0) {
            cell.classList.add(`commit-level-${level}`);
        }

        // İleride üzerine gelince kaç commit olduğunu görmek istersen diye tooltip altyapısı
        cell.setAttribute('title', `Matrix Day ${i + 1}: ${level * 3} Avionics Commits`);

        gridContainer.appendChild(cell);
    }
}

// Dom yüklendiğinde grid canavarı tetiklensin
document.addEventListener('DOMContentLoaded', generateCommitTracker);
// Eğer sayfa çoktan yüklendiyse doğrudan da çalıştırabiliriz
generateCommitTracker();