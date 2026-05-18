const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// সার্ভার ঠিকমতো চলছে কি না, তা চেক করার জন্য একটি সাধারণ রাউট
app.get('/', (req, res) => {
    res.send('✅ Academic Recap - Live Tutor Node.js Server is running!');
});

// রিয়েল-টাইম অডিও আদান-প্রদানের জন্য WebSocket কানেকশন
wss.on('connection', (ws) => {
    console.log('🟢 নতুন একজন শিক্ষার্থী যুক্ত হয়েছে!');

    // শিক্ষার্থী যখন কথা বলবে (অডিও বা মেসেজ পাঠাবে)
    ws.on('message', (message) => {
        console.log('অডিও/ডেটা রিসিভ হয়েছে...');
        
        // *এখানে পরবর্তীতে Gemini Live API-এর অডিও প্রসেসিং কোড বসবে*
        
        // আপাতত কানেকশন টেস্ট করার জন্য একটি ডেমো মেসেজ পাঠানো হচ্ছে
        ws.send(JSON.stringify({ 
            status: "success", 
            message: "সার্ভারের সাথে সফলভাবে কানেক্ট হয়েছে!" 
        }));
    });

    ws.on('close', () => {
        console.log('🔴 শিক্ষার্থী লিভ নিয়েছে।');
    });
});

// Render স্বয়ংক্রিয়ভাবে একটি PORT দিয়ে দেয়, সেটি ধরার জন্য
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 সার্ভার চালু হয়েছে: ${PORT} পোর্টে`);
});