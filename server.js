const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// API Key সরাসরি কোডে না লিখে Environment Variable থেকে নেওয়া হচ্ছে
const API_KEY = process.env.GEMINI_API_KEY; 

app.get('/', (req, res) => {
    res.send('✅ Academic Recap - Live Tutor Server with AI is running!');
});

wss.on('connection', (ws) => {
    console.log('🟢 নতুন একজন শিক্ষার্থী যুক্ত হয়েছে!');

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            const userText = data.data; 
            
            console.log("শিক্ষার্থীর প্রশ্ন:", userText);

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: {
                        parts: [{ text: "তুমি Academic Recap-এর একজন অত্যন্ত দক্ষ ও বন্ধুত্বপূর্ণ এক্সপার্ট টিউটর। তুমি একদম সহজ ভাষায়, পয়েন্ট করে, একজন আসল শিক্ষকের মতো বাংলায় উত্তর দেবে।" }]
                    },
                    contents: [{
                        parts: [{ text: userText }]
                    }]
                })
            });

            const apiData = await response.json();
            
            if(apiData.candidates && apiData.candidates.length > 0) {
                const aiAnswer = apiData.candidates[0].content.parts[0].text;
                
                ws.send(JSON.stringify({ 
                    status: "success", 
                    message: aiAnswer 
                }));
            } else {
                ws.send(JSON.stringify({ status: "error", message: "দুঃখিত, আমি উত্তরটি বুঝতে পারিনি।" }));
            }

        } catch (error) {
            console.error("API Error:", error);
            ws.send(JSON.stringify({ status: "error", message: "সার্ভারে একটু সমস্যা হয়েছে, আবার চেষ্টা করো!" }));
        }
    });

    ws.on('close', () => {
        console.log('🔴 শিক্ষার্থী লিভ নিয়েছে।');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 সার্ভার চালু হয়েছে: ${PORT} পোর্টে`);
});
