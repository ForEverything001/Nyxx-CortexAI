const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8001; 
const GROQ_KEY = process.env.GROQ_API_KEY;

app.use(cors());
app.use(express.json());
app.use(express.static('C:/Users/Balikci/Desktop/NyxxZone'));

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

// --- GROQ HTTP API MOTORU ---
async function fetchGroqWithCharacter(userMessage) {
    if (!GROQ_KEY) return "[Cortex Error]: .env içinde API anahtarı eksik aq.";

    // Canlı Panel Durumu (Mallaşmayı ve yalan söylemesini engelleyen kısım)
    const systemStateContext = `
[CURRENT SYSTEM STATE - REALTIME]:
- HYPE FEED: BAĞLANTI HATASI (Fandom API şu an yanıt vermiyor veya Proxy engeline takıldı!). İçerik çekilemedi.
- FANDOM UPDATES: LoRa_SYSTEM_ACTIVE (Sinyal stabil, veri bekleniyor).
- SOUNDSCAPE ENGINE: Aktif. Spotify Listesi: VOXXY (Çalıyor).
- COMMIT TRACKER: AKTİF (96 günlük Avionics Trainee kodlama matrisi yeşil grid şeklinde canlı işleniyor).
Nyxx sana Hype Feed veya Fandom hakkında soru sorursa, şu an API'de BAĞLANTI HATASI olduğunu bilerek konuş, kafandan yalan haber uydurma amk!`;

    try {
        chatHistory.push({ role: 'user', content: userMessage });

        // Llama'ya karakter tanımı + anlık panel hatasını besliyoruz
        const finalMessages = [
            chatHistory[0], 
            { role: 'system', content: systemStateContext }, 
            ...chatHistory.slice(1) 
        ];

        if (finalMessages.length > 18) {
            chatHistory = [chatHistory[0], ...chatHistory.slice(-15)];
        }

        // TAMAMEN DOĞRU TEMİZ URL: Asla api.api... değil!
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: finalMessages,
                temperature: 0.4, // Delüzyon yapmasın diye stabiliteye çektik
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
        return "[Cortex Error]: Karakter çekirdeği ile iletişim hat hattı koptu. Terminal loguna bak.";
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
    console.log(`  🚀 CORTEX SYSTEM ENGINE v1.2 - FINAL FIX`);
    console.log(`  🤖 MODEL: Llama 3.1 8B via Pure JS Fetch`);
    console.log(`  🔗 LINK: http://localhost:${PORT}`);
    console.log(`==================================================\n`);
});