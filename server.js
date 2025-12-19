import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DB_FILE = path.join(__dirname, 'db.json');
const API_KEY = "AIzaSyB9w-j37PIwo01DlAZB123To9-QogGv07o";

app.use(cors());
app.use(express.json());

// Initialize DB
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ players: [], puzzles: [], dailyPuzzles: {} }));
} else {
    // Ensure structure
    const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    if (!db.puzzles) db.puzzles = [];
    if (!db.dailyPuzzles) db.dailyPuzzles = {};
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

const getDB = () => JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
const saveDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

// AI Logic on Backend
async function fetchGeminiPuzzle(level = 1, seed = Date.now()) {
    const prompt = `Create a new 'Word Union' (Connections-style) game puzzle in raw JSON format. 
      This is for Level ${level}. Seed: ${seed}.
      It must have exactly 4 groups with different difficulty levels.
      Difficulty levels: 'easy', 'medium', 'hard', 'tricky'.
      Return ONLY a JSON object with a 'groups' array.
      Each group must have:
      - 'category': The connection between the words.
      - 'difficulty': 'easy' | 'medium' | 'hard' | 'tricky'
      - 'words': Array of 4 unique, distinct strings.
      Avoid common knowledge or obscure trivia. Make connections clever.
      Do not use Markdown. Return ONLY the JSON.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        let text = data.candidates[0].content.parts[0].text;
        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanText).groups;
    } catch (e) {
        console.error("AI Fetch Error:", e);
        return null;
    }
}

async function refillPuzzlePool() {
    const db = getDB();
    if (db.puzzles.length >= 100) return;

    console.log(`Refilling puzzles... current pool: ${db.puzzles.length}`);
    // Only generate 5 at a time to stay under quota, but repeat periodically
    for (let i = 0; i < 5; i++) {
        const puzzle = await fetchGeminiPuzzle(Math.floor(Math.random() * 10) + 1);
        if (puzzle) {
            db.puzzles.push({ id: Date.now() + i, groups: puzzle });
        }
        // Small delay to prevent hitting local rate limit too fast
        await new Promise(r => setTimeout(r, 1000));
    }
    saveDB(db);
    console.log(`Pool refilled. New size: ${db.puzzles.length}`);
}

// Check every 10 minutes if we need more puzzles
setInterval(refillPuzzlePool, 10 * 60 * 1000);
// Initial check
setTimeout(refillPuzzlePool, 2000);

// Helper to get IP
const getIP = (req) => {
    return req.headers['x-forwarded-for'] || req.socket.remoteAddress;
};

// API: Get Leaderboard
app.get('/api/leaderboard', (req, res) => {
    const db = getDB();
    const sortedPlayers = db.players
        .map(p => ({
            ...p,
            winRate: p.totalGames > 0 ? ((p.wins / p.totalGames) * 100).toFixed(1) : 0
        }))
        .sort((a, b) => {
            if (b.level !== a.level) return b.level - a.level;
            return b.winRate - a.winRate;
        })
        .slice(0, 10); // Top 10

    res.json(sortedPlayers);
});

// API: Register/Update Player
app.post('/api/player', (req, res) => {
    const { name, level, wins, totalGames } = req.body;
    const ip = getIP(req);

    const db = getDB();
    let player = db.players.find(p => p.name === name || p.ip === ip);

    if (!player) {
        player = { name, ip, level: 1, wins: 0, totalGames: 0 };
        db.players.push(player);
    }

    // Update stats if provided
    if (name) player.name = name;
    if (level !== undefined) player.level = Math.max(player.level, level);
    if (wins !== undefined) player.wins = wins;
    if (totalGames !== undefined) player.totalGames = totalGames;

    saveDB(db);
    res.json(player);
});

// API: Get Puzzle from Pool
app.get('/api/puzzle', async (req, res) => {
    const { mode, date } = req.query;
    const db = getDB();

    if (mode === 'daily') {
        const id = date || new Date().toISOString().split('T')[0];
        if (!db.dailyPuzzles[id]) {
            console.log(`Generating daily for ${id}`);
            const puzzle = await fetchGeminiPuzzle("DAILY", id);
            if (puzzle) {
                db.dailyPuzzles[id] = puzzle;
                saveDB(db);
            } else {
                return res.status(503).json({ error: "Daily not ready" });
            }
        }
        return res.json({ groups: db.dailyPuzzles[id] });
    }

    // Infinite Mode: Get random from pool
    if (db.puzzles.length === 0) {
        return res.status(404).json({ error: "Pool empty" });
    }

    const randomIndex = Math.floor(Math.random() * db.puzzles.length);
    const puzzle = db.puzzles[randomIndex];

    // Check if we need to refill
    if (db.puzzles.length < 20) {
        refillPuzzlePool();
    }

    res.json({ groups: puzzle.groups });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
