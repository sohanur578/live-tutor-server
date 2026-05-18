const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// এখানে আপনার আসল API Key টি বসান
const API_KEY = "AIzaSyA85vr_24bqaIU-FW-XxdH-C1xHgPG6khU"; 

app.get('/', (req, res) => {
    res.send('✅ Academic Recap - Live Tutor Server with AI is running!');
});

wss.on('connection', (ws) => {
    console.log('🟢 নতুন একজন শিক্ষার্থী যুক্ত হয়েছে!');

    ws.on('message', async (message) => {
        try {
            // ফ্রন্টএন্ড থেকে আসা ডেটা রিসিভ করা
            const data = JSON.parse(message);
            const userText = data.data; // আপাতত ফ্রন্টএন্ড থেকে আসা ডামি টেক্সট
            
            console.log("শিক্ষার্থীর প্রশ্ন:", userText);

            // Gemini API-এর কাছে প্রশ্ন পাঠানো
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
            
            // যদি API থেকে সঠিক উত্তর আসে
            if(apiData.candidates && apiData.candidates.length > 0) {
                const aiAnswer = apiData.candidates[0].content.parts[0].text;
                
                // AI-এর উত্তরটি শিক্ষার্থীর কাছে (ফ্রন্টএন্ডে) পাঠিয়ে দেওয়া
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
