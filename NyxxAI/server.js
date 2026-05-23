const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8001; 
const GROQ_KEY = process.env.GROQ_API_KEY;

app.use(cors());
app.use(express.json());

// Dinamik ve temiz statik dosya köprüsü
app.use(express.static(path.join(__dirname, '../NyxxZone')));

// --- KARAKTER TANIMINI DOSYADAN ÇEKME ---
let systemPrompt = "";
try {
    const characterPath = path.join(__dirname, 'character.txt');
    systemPrompt = fs.readFileSync(characterPath, 'utf8');
    console.log("  ℹ️  Karakter tanımı (character.txt) başarıyla belleğe yüklendi.");
} catch (err) {
    console.error("  ⚠️  character.txt okunamadı, yedek prompt devreye giriyor.");
    systemPrompt = "Sen CORTEX adında siberpunk bir yapay zekasın.";
}

// --- SOHBET BELLEĞİ VE BAĞLAM KATMANI ---
let chatHistory = [
    { role: 'system', content: systemPrompt }
];

// --- GİTHUB COMMIT GRİD ENDPOINT'İ (TOKENSIZ SCRAPER) ---
app.get('/api/github-commits/:username', async (req, res) => {
    const { username } = req.params;
    try {
        // GitHub'ın profilindeki contribution takvimini html olarak çekiyoruz
        const response = await fetch(`https://github.com/users/${username}/contributions`);
        if (!response.ok) throw new Error("GitHub'a erişilemedi amk");
        
        const html = await response.text();
        
        // HTML içindeki data-level değerlerini (0-4 arası yoğunluk) avlıyoruz
        const regex = /data-level="([0-4])"/g;
        let matches;
        const levels = [];
        
        while ((matches = regex.exec(html)) !== null) {
            levels.push(parseInt(matches[1]));
        }
        
        // Arayüze tam oturması için son 96 günün gerçek verisini dilimliyoruz
        const last96Days = levels.slice(-96);
        res.json({ success: true, data: last96Days });
        
    } catch (error) {
        console.error("GitHub Scraper Hatası:", error);
        res.status(500).json({ success: false, error: "Veri çekilemedi" });
    }
});

// --- GROQ HTTP API MOTORU ---
async function fetchGroqWithCharacter(userMessage) {
    if (!GROQ_KEY) return "[Cortex Error]: .env içinde API anahtarı eksik aq.";

    const systemStateContext = `
[CURRENT SYSTEM STATE - REALTIME]:
- HYPE FEED: BAĞLANTI HATASI (Fandom API şu an yanıt vermiyor veya Proxy engeline takıldı!). İçerik çekilemedi.
- FANDOM UPDATES: LoRa_SYSTEM_ACTIVE (Sinyal stabil, veri bekleniyor).
- SOUNDSCAPE ENGINE: Aktif. Spotify Listesi: VOXXY (Çalıyor).
- COMMIT TRACKER: AKTİF (Nyxx'in GERÇEK GitHub profil verileri çekildi, sahte değil!).
Nyxx sana Hype Feed veya Fandom hakkında soru sorursa, şu an API'de BAĞLANTI HATASI olduğunu bilerek konuş, kafandan yalan haber uydurma amk!`;

    try {
        chatHistory.push({ role: 'user', content: userMessage });

        const finalMessages = [
            chatHistory[0], 
            { role: 'system', content: systemStateContext }, 
            ...chatHistory.slice(1) 
        ];

        if (finalMessages.length > 18) {
            chatHistory = [chatHistory[0], ...chatHistory.slice(-15)];
        }

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: finalMessages,
                temperature: 0.4,
                max_tokens: 250
            })
        });

        if (!response.ok) {
            const errLog = await response.json().catch(() => ({}));
            console.error("Groq Yanıt Hatası:", errLog);
            return `[Cortex Error]: Matris sinyali kesildi. Durum: ${response.status}`;
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        chatHistory.push({ role: 'assistant', content: aiResponse });
        return aiResponse;

    } catch (error) {
        console.error("Groq ağ bağlantı hatası detaylı çıktı:", error);
        return "[Cortex Error]: Karakter çekirdeği ile iletişim hat hattı koptu.";
    }
}

// API Endpoint
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Boş geçme aq" });

    if (message.toLowerCase().trim() === 'clear') {
        chatHistory = [{ role: 'system', content: systemPrompt }];
        return res.json({ reply: "[Cortex]: Kısa süreli bellek sıfırlandı, Nyxx. Karakter protokolü baştan başlatılıyor." });
    }

    const aiReply = await fetchGroqWithCharacter(message);
    res.json({ reply: aiReply });
});

app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`  🚀 CORTEX SYSTEM ENGINE v1.3 - GITHUB SCRAPER LINKED`);
    console.log(`  🤖 MODEL: Llama 3.1 8B via Pure JS Fetch`);
    console.log(`  🔗 LINK: http://localhost:${PORT}`);
    console.log(`==================================================\n`);
});