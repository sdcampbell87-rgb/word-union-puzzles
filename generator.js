import fs from 'fs';

const API_KEY = process.env.GEMINI_API_KEY;
const DB_FILE = './db.json';
const TARGET_COUNT = 100;

async function fetchNextPuzzle(currentFound) {
    const prompt = `Create a new 'Word Union' (Connections-style) puzzle in JSON. 
    It must be COMPLETELY different from these existing categories: ${currentFound.join(', ')}.
    Difficulty levels: 'easy', 'medium', 'hard', 'tricky'.
    Return ONLY a JSON object with a 'groups' array.
    Each group: 'category', 'difficulty', 'words' (4 strings). 
    Make it clever and modern. No Markdown.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        if (!data.candidates || !data.candidates[0]) {
            console.error("No candidates in response:", JSON.stringify(data));
            return null;
        }
        let text = data.candidates[0].content.parts[0].text;
        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanText).groups;
    } catch (e) {
        console.error("AI Error:", e);
        return null;
    }
}

async function startGeneration() {
    const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    console.log(`Current pool size: ${db.puzzles.length}`);

    while (db.puzzles.length < TARGET_COUNT) {
        const existingCategories = db.puzzles.flatMap(p => p.groups.map(g => g.category));
        console.log(`Generating puzzle #${db.puzzles.length + 1}...`);

        const newPuzzle = await fetchNextPuzzle(existingCategories.slice(-20)); // Give it the last 20 for variety
        if (newPuzzle) {
            db.puzzles.push({ id: Date.now(), groups: newPuzzle });
            fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
            console.log("Success! Saved to db.json.");
        }

        // Wait 2 seconds to avoid rate limits
        await new Promise(r => setTimeout(r, 2000));
    }
    console.log("Finished! You now have 100 puzzles.");
}

startGeneration();
