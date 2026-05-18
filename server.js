const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const API_KEY = process.env.GEMINI_API_KEY; 
const HOST = 'generativelanguage.googleapis.com';
// ✅ ভুলটি ঠিক করা হয়েছে: BidiWrite এর জায়গায় BidiGenerateContent দেওয়া হয়েছে
const PATH = '/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';

app.get('/', (req, res) => {
    res.send('✅ Academic Recap - Gemini Native Audio Dialog Server is running!');
});

wss.on('connection', (clientWs) => {
    console.log('🟢 ফ্রন্টএন্ড থেকে শিক্ষার্থী যুক্ত হয়েছে!');

    if (!API_KEY) {
        console.log('❌ API Key পাওয়া যায়নি! Render-এ Environment Variable চেক করুন।');
        return;
    }

    // গুগলের Live API-এর সাথে কানেক্ট করা
    const geminiUrl = `wss://${HOST}${PATH}?key=${API_KEY}`;
    const geminiWs = new WebSocket(geminiUrl);

    geminiWs.on('open', () => {
        console.log('✅ Google Gemini Live API-তে কানেক্ট হয়েছে!');
        
        // শুরুতেই Gemini-কে নিয়ম এবং সেটআপ বুঝিয়ে দেওয়া
        const setupMessage = {
            setup: {
                model: "models/gemini-2.5-flash",
                generationConfig: {
                    responseModalities: ["AUDIO"],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: "Aoede" // গুগলের Female ভয়েস
                            }
                        }
                    }
                },
                systemInstruction: {
                    parts: [{ text: "তুমি Academic Recap-এর একজন অত্যন্ত দক্ষ ও বন্ধুত্বপূর্ণ এক্সপার্ট টিউটর। তুমি সব প্রশ্নের উত্তর বাংলায়, খুব সংক্ষেপে এবং সুন্দর করে গুছিয়ে দেবে।" }]
                }
            }
        };
        geminiWs.send(JSON.stringify(setupMessage));
    });

    // Gemini থেকে আসা অডিও সরাসরি ফ্রন্টএন্ডে পাঠানো
    geminiWs.on('message', (data) => {
        if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(data);
        }
    });

    // শিক্ষার্থী থেকে আসা অডিও/টেক্সট সরাসরি Gemini-কে পাঠানো
    clientWs.on('message', (data) => {
        if (geminiWs.readyState === WebSocket.OPEN) {
            geminiWs.send(data);
        }
    });

    // Error Handling (যাতে সার্ভার ক্র্যাশ না করে)
    geminiWs.on('error', (error) => {
        console.error('❌ Gemini WebSocket Error:', error.message);
    });

    clientWs.on('error', (error) => {
        console.error('❌ Client WebSocket Error:', error.message);
    });

    clientWs.on('close', () => {
        console.log('🔴 শিক্ষার্থী লিভ নিয়েছে');
        if (geminiWs.readyState === WebSocket.OPEN) {
            geminiWs.close();
        }
    });

    geminiWs.on('close', () => {
        console.log('🔴 Gemini Live API ডিসকানেক্ট হয়েছে');
        if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.close();
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 সার্ভার চালু হয়েছে: ${PORT} পোর্টে`);
});
