import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { RefreshCw, RotateCcw, HelpCircle, Trophy, Users, Award, Share2, Calendar, Lightbulb } from 'lucide-react';

const API_KEY = "AIzaSyB9w-j37PIwo01DlAZB123To9-QogGv07o";
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.')
  ? "http://192.168.1.81:3001/api"
  : "https://your-backend-url.onrender.com/api"; // UPDATE THIS AFTER DEPLOYING BACKEND

const COLORS = {
  easy: '#f9df6d',   // yellow
  medium: '#a0c35a', // green
  hard: '#72a4ee',   // blue
  tricky: '#ba81c5'  // purple
};

const getTextColor = (difficulty) => {
  return (difficulty === 'easy' || difficulty === 'medium') ? '#000000' : '#ffffff';
};

const MOCK_PUZZLES = [
  [
    { category: "BOARD GAMES", difficulty: "easy", words: ["CHESS", "RISK", "CLUE", "SORRY"] },
    { category: "THINGS THAT ARE SHARP", difficulty: "medium", words: ["KNIFE", "TACK", "WIT", "CHEDDAR"] },
    { category: "WORDS STARTING WITH MUSICAL INSTRUMENTS", difficulty: "hard", words: ["PIANIST", "DRUMSTICK", "ORCHESTRA", "HARPOON"] },
    { category: "___ CHIP", difficulty: "tricky", words: ["POTATO", "COMPUTER", "POKER", "BLUE"] }
  ],
  [
    { category: "NBA TEAMS", difficulty: "easy", words: ["JAZZ", "MAGIC", "KINGS", "HEAT"] },
    { category: "PALINDROMES", difficulty: "medium", words: ["KAYAK", "LEVEL", "RADAR", "CIVIC"] },
    { category: "TYPES OF CLOUDS", difficulty: "hard", words: ["CIRRUS", "STRATUS", "CUMULUS", "NIMBUS"] },
    { category: "WORDS SPELLED WITH PERIODIC TABLE SYMBOLS", difficulty: "tricky", words: ["BANANA", "CUBIC", "FEAR", "RUSH"] }
  ],
  [
    { category: "SOLAR SYSTEM BODIES", difficulty: "easy", words: ["MARS", "VENUS", "EARTH", "SATURN"] },
    { category: "THINGS WITH TEETH", difficulty: "medium", words: ["SAW", "COMB", "GEAR", "ZIPPER"] },
    { category: "HOMOPHONES FOR NUMBERS", difficulty: "hard", words: ["TO", "FOR", "ATE", "WON"] },
    { category: "STATES OF MATTER", difficulty: "tricky", words: ["SOLID", "LIQUID", "GAS", "PLASMA"] }
  ],
  [
    { category: "SHADES OF RED", difficulty: "easy", words: ["CRIMSON", "SCARLET", "RUBY", "BRICK"] },
    { category: "THINGS YOU CAN CRACK", difficulty: "medium", words: ["EGG", "SMILE", "CODE", "KNUCKLES"] },
    { category: "WORDS ENDING IN 'MAN'", difficulty: "hard", words: ["HUMAN", "WOMAN", "POSTMAN", "TRUMAN"] },
    { category: "___ TAPE", difficulty: "tricky", words: ["DUCT", "SCOTCH", "MASKING", "RED"] }
  ],
  [
    { category: "TROPICAL FRUITS", difficulty: "easy", words: ["MANGO", "PAPAYA", "GUAVA", "LYCHEE"] },
    { category: "PARTS OF A CAR", difficulty: "medium", words: ["ENGINE", "BRAKE", "WHEEL", "CLUTCH"] },
    { category: "COMPUTER TERMS", difficulty: "hard", words: ["RAM", "CHIP", "MOUSE", "CACHE"] },
    { category: "___ BALL", difficulty: "tricky", words: ["FOOT", "EYE", "CUE", "FIRE"] }
  ],
  [
    { category: "COLORS", difficulty: "easy", words: ["TEAL", "MAUVE", "BEIGE", "CORAL"] },
    { category: "KITCHEN APPLIANCES", difficulty: "medium", words: ["TOASTER", "STOVE", "FRIDGE", "MIXER"] },
    { category: "GREEK GODS", difficulty: "hard", words: ["ZEUS", "HERA", "ARES", "HADES"] },
    { category: "FLIGHTLESS BIRDS", difficulty: "tricky", words: ["EMU", "KIWI", "PENGUIN", "OSTRICH"] }
  ],
  [
    { category: "VEGETABLES", difficulty: "easy", words: ["CARROT", "POTATO", "ONION", "PEA"] },
    { category: "MEASUREMENT UNITS", difficulty: "medium", words: ["INCH", "MILE", "GRAM", "LITER"] },
    { category: "SHAKESPEARE PLAYS", difficulty: "hard", words: ["HAMLET", "OTHELLO", "MACBETH", "LEAR"] },
    { category: "ZODIAC SIGNS", difficulty: "tricky", words: ["ARIES", "LEO", "LIBRA", "VIRGO"] }
  ],
  [
    { category: "MUSICAL GENRES", difficulty: "easy", words: ["JAZZ", "ROCK", "POP", "PUNK"] },
    { category: "FURNITURE", difficulty: "medium", words: ["CHAIR", "TABLE", "BED", "DESK"] },
    { category: "ASTRONOMERS", difficulty: "hard", words: ["GALILEO", "KEPLER", "HUBBLE", "SAGAN"] },
    { category: "SILENT LETTERS", difficulty: "tricky", words: ["KNEE", "WRIST", "DEBT", "GNOME"] }
  ],
  [
    { category: "GEMS", difficulty: "easy", words: ["PEARL", "JADE", "OPAL", "ONYX"] },
    { category: "DETERGENTS", difficulty: "medium", words: ["TIDE", "GAIN", "CHEER", "ERA"] },
    { category: "CHESS PIECES", difficulty: "hard", words: ["ROOK", "KNIGHT", "BISHOP", "PAWN"] },
    { category: "MONOPOLY SPACES", difficulty: "tricky", words: ["GO", "JAIL", "BOARDWALK", "PARK"] }
  ],
  [
    { category: "FLOWERS", difficulty: "easy", words: ["ROSE", "LILY", "TULIP", "DAISY"] },
    { category: "SODA BRANDS", difficulty: "medium", words: ["COKE", "PEPSI", "SPRITE", "FANTA"] },
    { category: "SCIENTIFIC TOOLS", difficulty: "hard", words: ["LASER", "RADAR", "SONAR", "QUASAR"] },
    { category: "DOG BREEDS", difficulty: "tricky", words: ["PUG", "BOXER", "BEAGLE", "HUSKY"] }
  ]
];

const App = () => {
  const [puzzle, setPuzzle] = useState(null);
  const [gridWords, setGridWords] = useState([]);
  const [selectedWords, setSelectedWords] = useState([]);
  const [solvedGroups, setSolvedGroups] = useState([]);
  const [mistakes, setMistakes] = useState(4);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [currentMockIndex, setCurrentMockIndex] = useState(-1);

  // Player Stats
  const [playerName, setPlayerName] = useState(localStorage.getItem('connections-name') || "");
  const [level, setLevel] = useState(() => parseInt(localStorage.getItem('connections-level') || "1", 10));
  const [wins, setWins] = useState(() => parseInt(localStorage.getItem('connections-wins') || "0", 10));
  const [totalGames, setTotalGames] = useState(() => parseInt(localStorage.getItem('connections-totalGames') || "0", 10));
  const [isLevelUp, setIsLevelUp] = useState(false);

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [tempName, setTempName] = useState("");

  // New Features
  const [guessHistory, setGuessHistory] = useState([]);
  const [gameMode, setGameMode] = useState('infinite'); // 'infinite' | 'daily'

  const getDailyId = () => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  };

  const [dailyCompleted, setDailyCompleted] = useState(() => !!localStorage.getItem(`daily-${getDailyId()}`));
  const [hintUsed, setHintUsed] = useState(false);

  // Ref to avoid stale closures in setTimeout/async
  const stateRef = useRef({ level, wins, totalGames, playerName });
  useEffect(() => {
    stateRef.current = { level, wins, totalGames, playerName };
  }, [level, wins, totalGames, playerName]);

  const updateBackend = useCallback(async () => {
    if (!playerName) return;
    try {
      const res = await fetch(`${API_BASE}/player`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName, level, wins, totalGames })
      });
      const data = await res.json();

      // Sync from backend if backend has more progress
      if (data.level > level) setLevel(data.level);
      if (data.wins > wins) setWins(data.wins);
      if (data.totalGames > totalGames) setTotalGames(data.totalGames);

      fetchLeaderboard();
    } catch (e) {
      console.error("Failed to update stats", e);
    }
  }, [playerName, level, wins, totalGames]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/leaderboard`);
      const data = await res.json();
      setLeaderboard(data);
    } catch (e) {
      console.error("Failed to fetch leaderboard", e);
    }
  }, []);

  const loadMockPuzzle = (seed = null) => {
    let randomIndex;
    if (seed) {
      const strSeed = String(seed);
      let hash = 0;
      for (let i = 0; i < strSeed.length; i++) {
        hash = ((hash << 5) - hash) + strSeed.charCodeAt(i);
        hash |= 0;
      }
      randomIndex = Math.abs(hash) % MOCK_PUZZLES.length;
    } else {
      // Pick a different one if possible
      let nextIndex = Math.floor(Math.random() * MOCK_PUZZLES.length);
      if (nextIndex === currentMockIndex && MOCK_PUZZLES.length > 1) {
        nextIndex = (nextIndex + 1) % MOCK_PUZZLES.length;
      }
      randomIndex = nextIndex;
    }

    setCurrentMockIndex(randomIndex);
    const mockGroups = MOCK_PUZZLES[randomIndex];
    setPuzzle(mockGroups);
    const allWords = mockGroups.flatMap(g => g.words.map(w => ({ word: w, category: g.category, difficulty: g.difficulty })));

    const shuffled = [...allWords];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    setGridWords(shuffled);
    setSolvedGroups([]);
    setSelectedWords([]);
    setMistakes(4);
    setGameOver(false);
    setMessage("");
    setHintUsed(false);
  };

  const fetchPuzzle = async (customSeed = null, mode = 'infinite') => {
    setLoading(true);
    setGameMode(mode);
    setMessage(mode === 'daily' ? "Loading Daily Challenge..." : "Generating a new puzzle...");

    // Reset basic state immediately
    setSolvedGroups([]);
    setSelectedWords([]);
    setMistakes(4);
    setGameOver(false);
    setGuessHistory([]);
    setHintUsed(false);

    try {
      const url = new URL(`${API_BASE}/puzzle`);
      url.searchParams.append('mode', mode);
      if (customSeed) url.searchParams.append('date', customSeed);

      const response = await fetch(url);
      if (!response.ok) throw new Error("API_ERROR");

      const data = await response.json();
      const groups = data.groups;
      setPuzzle(groups);

      const allWords = groups.flatMap(g => g.words.map(w => ({ word: w, category: g.category, difficulty: g.difficulty })));
      const shuffled = [...allWords];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      setGridWords(shuffled);
      setMessage("");
      setTotalGames(prev => prev + 1);
    } catch (error) {
      console.error(error);
      setMessage("Falling back to built-in puzzle library...");
      loadMockPuzzle(customSeed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('connections-level', level);
    localStorage.setItem('connections-wins', wins);
    localStorage.setItem('connections-totalGames', totalGames);
    if (playerName) {
      localStorage.setItem('connections-name', playerName);
      updateBackend();
    }
  }, [level, wins, totalGames, playerName, updateBackend]);

  useEffect(() => {
    fetchPuzzle();
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const handleWordClick = (wordObj) => {
    if (gameOver || loading || !playerName || solvedGroups.some(g => g.words.includes(wordObj.word))) return;
    if (selectedWords.some(w => w.word === wordObj.word)) {
      setSelectedWords(selectedWords.filter(w => w.word !== wordObj.word));
    } else if (selectedWords.length < 4) {
      setSelectedWords([...selectedWords, wordObj]);
    }
  };

  const checkSubmission = () => {
    if (selectedWords.length !== 4) return;

    // Record history
    const colorMap = { easy: '🟨', medium: '🟩', hard: '🟦', tricky: '🟪' };
    const currentGuessColors = selectedWords.map(w => colorMap[w.difficulty] || '⬜').sort().join('');
    setGuessHistory(prev => [...prev, currentGuessColors]);

    const firstWord = selectedWords[0];
    const isCorrect = selectedWords.every(w => w.category === firstWord.category);

    if (isCorrect) {
      const g = puzzle.find(pg => pg.category === firstWord.category);
      const newSolved = [...solvedGroups, g];
      setSolvedGroups(newSolved);

      const solvedWordsSet = new Set(newSolved.flatMap(sg => sg.words));
      setGridWords(prev => prev.filter(w => !solvedWordsSet.has(w.word)));
      setSelectedWords([]);

      if (newSolved.length === 4) {
        setGameOver(true);
        setWins(prev => prev + 1);

        if (gameMode === 'daily') {
          setDailyCompleted(true);
          localStorage.setItem(`daily-${getDailyId()}`, 'true');
          setMessage("Daily Challenge Completed!");
        } else {
          const nextLevel = level + 1;
          setLevel(nextLevel);
          setIsLevelUp(true);
          setMessage(`Level ${level} Complete!`);
          setTimeout(() => setIsLevelUp(false), 2000);
        }

        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: Object.values(COLORS) });
      }
    } else {
      const newMistakes = mistakes - 1;
      setMistakes(newMistakes);

      const categoryCounts = {};
      selectedWords.forEach(w => { categoryCounts[w.category] = (categoryCounts[w.category] || 0) + 1; });
      if (Object.values(categoryCounts).some(count => count === 3)) {
        setMessage("One away...");
        setTimeout(() => setMessage(""), 2000);
      }

      if (newMistakes === 0) {
        if (gameMode === 'daily') {
          setGameOver(true);
          setDailyCompleted(true);
          localStorage.setItem(`daily-${getDailyId()}`, 'played');
          setMessage("Daily Challenge Failed.");
          setSolvedGroups(puzzle);
          setGridWords([]);
        } else {
          setMessage(`Out of guesses! Restarting Level ${level}...`);
          setTimeout(() => fetchPuzzle(), 2000);
        }
      }
    }
  };

  const handleShare = () => {
    const title = gameMode === 'daily' ? `Word Union Daily ${getDailyId()}` : `Word Union Level ${level}`;
    const text = `${title}\n${guessHistory.join('\n')}`;
    navigator.clipboard.writeText(text).then(() => {
      const original = message;
      setMessage("Copied to clipboard!");
      setTimeout(() => setMessage(original), 2000);
    });
  };

  const startDaily = () => fetchPuzzle(getDailyId(), 'daily');
  const submitName = (e) => { e.preventDefault(); if (tempName.trim()) setPlayerName(tempName.trim()); };

  const getHint = () => {
    if (hintUsed || mistakes <= 1 || gameOver || loading) return;

    // Find unsolved groups
    const solvedCategories = solvedGroups.map(g => g.category);
    const unsolvedGroups = puzzle.filter(g => !solvedCategories.includes(g.category));

    if (unsolvedGroups.length > 0) {
      const randomGroup = unsolvedGroups[Math.floor(Math.random() * unsolvedGroups.length)];
      const wordsToHint = randomGroup.words.slice(0, 2);

      setHintUsed(true);
      setMistakes(prev => prev - 1);
      setMessage(`Hint: "${wordsToHint[0]}" and "${wordsToHint[1]}" belong together.`);

      // Briefly highlight them
      setSelectedWords([]);
      const mysteryWords = gridWords.filter(w => wordsToHint.includes(w.word));
      setSelectedWords(mysteryWords);

      setTimeout(() => {
        setMessage("");
      }, 5000);
    }
  };

  return (
    <div className="container">
      {!playerName && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={submitName}>
            <h2>Welcome!</h2>
            <p style={{ marginBottom: '1.5rem', opacity: 0.7 }}>Enter your name to start competing.</p>
            <input type="text" placeholder="Your Name" value={tempName} onChange={(e) => setTempName(e.target.value)} autoFocus />
            <button className="primary" style={{ width: '100%' }} type="submit">Start Playing</button>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', position: 'absolute', top: '1rem', right: '1rem', zIndex: 100 }}>
        {gameMode === 'daily' ? (
          <button className="leaderboard-toggle" onClick={() => fetchPuzzle(null, 'infinite')}>
            <RotateCcw size={16} style={{ marginRight: 6 }} /> Main Game
          </button>
        ) : (
          <button className="leaderboard-toggle" onClick={startDaily} disabled={dailyCompleted}>
            <Calendar size={16} style={{ marginRight: 6 }} /> Daily
          </button>
        )}
        <button className="leaderboard-toggle" onClick={() => setShowLeaderboard(!showLeaderboard)}>
          <Users size={16} style={{ marginRight: 6 }} /> {showLeaderboard ? "Close" : "Board"}
        </button>
      </div>

      <h1>Word Union</h1>

      <div className="game-info">
        <div className={`level-badge ${isLevelUp ? 'level-up-anim' : ''}`}>
          <Trophy size={16} />
          <span>{gameMode === 'daily' ? 'Daily' : `Level ${level}`}</span>
        </div>
        <div className="mistakes">
          <span>Mistakes:</span>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`mistake-dot ${i < mistakes ? 'active' : ''}`} />
          ))}
        </div>
      </div>

      {!showLeaderboard ? (
        <>
          <div className="grid">
            {solvedGroups.map((g, i) => (
              <div key={i} className="solved-row" style={{ backgroundColor: COLORS[g.difficulty], color: getTextColor(g.difficulty) }}>
                <h3>{g.category}</h3>
                <p>{g.words.join(', ')}</p>
              </div>
            ))}
            {gridWords.map((w, i) => (
              <div key={i} className={`word-card ${selectedWords.some(sw => sw.word === w.word) ? 'selected' : ''}`} onClick={() => handleWordClick(w)}>
                {w.word}
              </div>
            ))}
          </div>
          <div className="message">{message}</div>
          <div className="controls">
            {gameOver ? (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="primary" onClick={handleShare}><Share2 size={18} style={{ marginRight: 8 }} /> Share</button>
                {gameMode !== 'daily' && <button className="primary" onClick={() => fetchPuzzle()}>Next Level</button>}
              </div>
            ) : (
              <>
                <button onClick={() => { const s = [...gridWords]; s.sort(() => Math.random() - 0.5); setGridWords(s); }} disabled={loading}><RefreshCw size={18} style={{ marginRight: 8 }} />Shuffle</button>
                <button onClick={getHint} disabled={loading || hintUsed || mistakes <= 1} title="Cost: 1 Mistake"><Lightbulb size={18} style={{ marginRight: 8 }} />Hint</button>
                <button onClick={() => setSelectedWords([])} disabled={loading || selectedWords.length === 0}>Deselect</button>
                <button className="primary" onClick={checkSubmission} disabled={loading || selectedWords.length !== 4}>Submit</button>
              </>
            )}
          </div>
        </>
      ) : (
        <div className="leaderboard-container">
          <h2><Award size={20} /> Top Performers</h2>
          <table className="leaderboard-table">
            <thead><tr><th>Rank</th><th>Player</th><th>Level</th><th style={{ textAlign: 'right' }}>Win Rate</th></tr></thead>
            <tbody>
              {leaderboard.map((p, i) => (
                <tr key={i} style={{ opacity: p.name === playerName ? 1 : 0.8, backgroundColor: p.name === playerName ? 'rgba(255,255,255,0.05)' : 'transparent' }}>
                  <td className="rank-text">#{i + 1}</td>
                  <td className="name-text">{p.name} {p.name === playerName && "(You)"}</td>
                  <td className="level-text">Lvl {p.level}</td>
                  <td className="win-rate-text">{p.winRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Finding a clever puzzle...</p>
        </div>
      )}
    </div>
  );
};

export default App;
