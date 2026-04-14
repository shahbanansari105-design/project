const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Gemini SDK with placeholder key
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || 'AIzaSyCVtYQEPomy9XBFlCp_3WFK1xROtecXQDI'
});

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(__dirname));

// API endpoint for prediction
app.post('/api/predict', (req, res) => {
    // Artificial delay to simulate processing time
    setTimeout(() => {
        const { studyHours, attendance, previousScore, sleepHours, extracurricular } = req.body;

        // Validate inputs
        if (studyHours == null || attendance == null || previousScore == null || sleepHours == null) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const study = parseFloat(studyHours);
        const attend = parseInt(attendance);
        const prev = parseInt(previousScore);
        const sleep = parseFloat(sleepHours);

        // Mock Algorithm matching what we had in frontend
        let score = prev * 0.4;

        // Study Impact (max 30)
        score += Math.min(study * 1.5, 30);

        // Attendance Impact (max 15)
        score += (attend / 100) * 15;

        // Sleep Impact (optimal 7-9 gets 10)
        if (sleep >= 7 && sleep <= 9) score += 10;
        else if (sleep >= 6 && sleep <= 10) score += 5;
        else score += 2;

        // Extra
        if (extracurricular === 'Yes') score += 5;

        // Add minor randomness
        score += (Math.random() * 4) - 2;

        // Clamp 0 - 100
        score = Math.max(0, Math.min(100, score));

        // Send result back to client
        res.json({ score, data: { study, attend, sleep } });
    }, 800); // 800ms delay to simulate loading
});

// Gemini AI Chatbot endpoint
app.post('/api/chat', async (req, res) => {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Valid messages array is required' });
    }

    try {
        // Grab the latest user message
        const lastMsg = messages[messages.length - 1].content;

        // Use Gemini 2.5 Flash for fast, highly capable responses
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: lastMsg,
            config: {
                systemInstruction: "You are an elite, highly professional AI academic advisor integrated into a 100 Billion Dollar academic forecasting engine. You provide extremely high-quality, concise, and insightful guidance to students looking to improve their academic performance, study habits, active recall techniques, and general productivity. Be encouraging, concise, and brilliant."
            }
        });

        res.json({ result: response.text });
    } catch (error) {
        console.error('Gemini Error:', error);
        res.status(500).json({ error: 'Failed to communicate with AI core. Please check if YOUR_GEMINI_API_KEY_HERE has been replaced with a valid key.' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
