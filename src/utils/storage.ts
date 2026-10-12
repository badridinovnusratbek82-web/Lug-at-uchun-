import { AppSettings, Book, Folder, ParseResult, QuizSessionSummary, Word } from '../types';
import { DEFAULT_BOOKS, DEFAULT_FOLDERS, DEFAULT_WORDS } from '../data/defaultVocabulary';

const STORAGE_KEYS = {
  BOOKS: 'lugatmaster_books_v1',
  FOLDERS: 'lugatmaster_folders_v1',
  WORDS: 'lugatmaster_words_v1',
  SETTINGS: 'lugatmaster_settings_v1',
  SESSIONS: 'lugatmaster_sessions_v1',
  STREAK: 'lugatmaster_streak_v1',
};

export const DEFAULT_SETTINGS: AppSettings = {
  autoAdvance: true,
  autoAdvanceDelayMs: 450,
  soundEffects: true,
  speechRate: 0.9,
  theme: 'light',
  shuffleQuestions: true,
};

export function loadBooks(): Book[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKS);
    if (!raw) {
      saveBooks(DEFAULT_BOOKS);
      return DEFAULT_BOOKS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_BOOKS;
  }
}

export function saveBooks(books: Book[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
  } catch (e) {
    console.error('Failed to save books', e);
  }
}

export function loadFolders(): Folder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FOLDERS);
    if (!raw) {
      saveFolders(DEFAULT_FOLDERS);
      return DEFAULT_FOLDERS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_FOLDERS;
  }
}

export function saveFolders(folders: Folder[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
  } catch (e) {
    console.error('Failed to save folders', e);
  }
}

export function loadWords(): Word[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WORDS);
    if (!raw) {
      saveWords(DEFAULT_WORDS);
      return DEFAULT_WORDS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_WORDS;
  }
}

export function saveWords(words: Word[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WORDS, JSON.stringify(words));
  } catch (e) {
    console.error('Failed to save words', e);
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

export function loadSessions(): QuizSessionSummary[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSession(session: QuizSessionSummary): void {
  try {
    const list = loadSessions();
    list.unshift(session);
    // Keep last 100 sessions
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(list.slice(0, 100)));
  } catch (e) {
    console.error('Failed to save session', e);
  }
}

export function getDailyStreak(): { streak: number; lastDate: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STREAK);
    if (!raw) return { streak: 1, lastDate: new Date().toISOString().slice(0, 10) };
    return JSON.parse(raw);
  } catch {
    return { streak: 1, lastDate: new Date().toISOString().slice(0, 10) };
  }
}

export function recordStreakActivity(): number {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const data = getDailyStreak();
    if (data.lastDate === today) {
      return data.streak;
    }
    
    const lastDate = new Date(data.lastDate);
    const currDate = new Date(today);
    const diffDays = Math.round((currDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
    
    let newStreak = data.streak;
    if (diffDays === 1) {
      newStreak += 1;
    } else if (diffDays > 1) {
      newStreak = 1;
    }
    
    localStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify({ streak: newStreak, lastDate: today }));
    return newStreak;
  } catch {
    return 1;
  }
}

// Bulk word parsing for 1000 - 2000+ words
export function parseBulkText(rawText: string, existingWords: Word[] = []): ParseResult {
  const lines = rawText.split(/\r?\n/);
  const validWords: ParseResult['validWords'] = [];
  const errors: string[] = [];
  const existingSet = new Set(existingWords.map(w => w.english.trim().toLowerCase()));
  const inImportSet = new Set<string>();
  let duplicateCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine || rawLine.startsWith('#') || rawLine.startsWith('//')) {
      continue;
    }

    let english = '';
    let uzbek = '';
    let transcription = '';
    let example = '';

    // Check CSV or TSV with tabs or commas
    if (rawLine.includes('\t')) {
      const parts = rawLine.split('\t').map(p => p.trim());
      english = parts[0] || '';
      uzbek = parts[1] || '';
      transcription = parts[2] || '';
      example = parts[3] || '';
    } else if (rawLine.includes(';') && (rawLine.match(/;/g) || []).length >= 1) {
      const parts = rawLine.split(';').map(p => p.trim());
      english = parts[0] || '';
      uzbek = parts[1] || '';
      transcription = parts[2] || '';
      example = parts[3] || '';
    } else {
      // Find delimiter: " - ", " : ", " = ", " — ", "-", ":", "="
      const match = rawLine.match(/^(.+?)\s*(?:[-—:=]|->)\s*(.+)$/);
      if (match) {
        english = match[1].trim();
        uzbek = match[2].trim();
      } else if (rawLine.includes(',')) {
        // Fallback to comma
        const commaParts = rawLine.split(',').map(s => s.trim());
        if (commaParts.length >= 2) {
          english = commaParts[0];
          uzbek = commaParts.slice(1).join(', ').trim();
        }
      }
    }

    // Clean brackets from transcription if found in english or uzbek
    const transcriptionMatch = english.match(/\[(.*?)\]/) || uzbek.match(/\[(.*?)\]/);
    if (transcriptionMatch && !transcription) {
      transcription = `[${transcriptionMatch[1]}]`;
      english = english.replace(/\[.*?\]/, '').trim();
      uzbek = uzbek.replace(/\[.*?\]/, '').trim();
    }

    // Clean clean strings
    english = english.replace(/^["']|["']$/g, '').trim();
    uzbek = uzbek.replace(/^["']|["']$/g, '').trim();

    if (!english || !uzbek) {
      errors.push(`Qator ${i + 1}: format mos kelmadi ("${rawLine.slice(0, 40)}...")`);
      continue;
    }

    const key = english.toLowerCase();
    if (inImportSet.has(key) || existingSet.has(key)) {
      duplicateCount++;
    }
    inImportSet.add(key);

    validWords.push({
      english,
      uzbek,
      transcription: transcription || undefined,
      example: example || undefined,
    });
  }

  return {
    validWords,
    errors,
    totalParsed: validWords.length,
    duplicateCount,
  };
}

// Download Standalone Self-Contained HTML File for Mobile HTML Viewer / Chrome Double-click
export function generateStandaloneHtml(books: Book[], folders: Folder[], words: Word[]): string {
  const dataPayload = JSON.stringify({ books, folders, words });
  
  return `<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Lug'atMaster - Offline Lug'at va Quiz</title>
  <style>
    :root {
      --bg: #0f172a;
      --card: #1e293b;
      --card-hover: #334155;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #4f46e5;
      --primary-hover: #4338ca;
      --success: #10b981;
      --danger: #ef4444;
      --border: #334155;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; padding: 16px; line-height: 1.5; }
    .container { max-width: 640px; margin: 0 auto; }
    header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-bottom: 1px solid var(--border); margin-bottom: 16px; }
    h1 { font-size: 1.25rem; font-weight: 700; color: #fff; }
    .badge { font-size: 0.75rem; color: var(--text-muted); }
    .tab-nav { display: flex; gap: 8px; margin-bottom: 16px; }
    .tab-btn { flex: 1; padding: 10px; background: var(--card); border: 1px solid var(--border); color: var(--text); border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9rem; }
    .tab-btn.active { background: var(--primary); border-color: var(--primary); }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 12px; }
    .quiz-question { text-align: center; font-size: 1.75rem; font-weight: 700; margin: 24px 0 16px; }
    .quiz-phonetic { font-size: 1rem; color: #818cf8; text-align: center; margin-bottom: 20px; font-style: italic; }
    .quiz-options { display: grid; gap: 10px; margin-bottom: 16px; }
    .opt-btn { padding: 14px 16px; background: #0f172a; border: 2px solid var(--border); border-radius: 10px; color: #fff; font-size: 1rem; font-weight: 500; cursor: pointer; text-align: left; transition: all 0.15s; }
    .opt-btn:active { transform: scale(0.98); }
    .opt-btn.correct { background: #064e3b; border-color: var(--success); color: #34d399; }
    .opt-btn.wrong { background: #7f1d1d; border-color: var(--danger); color: #f87171; }
    .stats-bar { display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px; }
    .progress-bar-bg { height: 8px; background: var(--border); border-radius: 999px; overflow: hidden; margin-bottom: 20px; }
    .progress-bar-fill { height: 100%; background: var(--primary); transition: width 0.3s; }
    .audio-btn { background: none; border: none; color: #818cf8; font-size: 1.5rem; cursor: pointer; vertical-align: middle; margin-left: 8px; }
    .search-input { width: 100%; padding: 12px; background: var(--card); border: 1px solid var(--border); border-radius: 8px; color: #fff; font-size: 1rem; margin-bottom: 12px; }
    .word-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid var(--border); }
    .word-en { font-weight: 600; font-size: 1.05rem; }
    .word-uz { color: var(--text-muted); font-size: 0.95rem; }
    .action-btn { width: 100%; padding: 12px; background: var(--primary); color: #fff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; margin-top: 8px; }
    .explanation { background: #1e1b4b; border: 1px solid #4338ca; border-radius: 8px; padding: 12px; margin-top: 12px; font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>Lug'atMaster (Offline)</h1>
        <div class="badge" id="stats-badge">Yuklanmoqda...</div>
      </div>
      <button class="audio-btn" onclick="testAudio()" title="Ovozni tekshirish">🔊</button>
    </header>

    <div class="tab-nav">
      <button class="tab-btn active" id="tab-quiz" onclick="switchTab('quiz')">🎯 Tezkor Quiz</button>
      <button class="tab-btn" id="tab-words" onclick="switchTab('words')">📖 So'zlar Ro'yxati</button>
    </div>

    <!-- QUIZ VIEW -->
    <div id="view-quiz">
      <div class="stats-bar">
        <span id="quiz-progress-text">Savol: 1 / 10</span>
        <span id="quiz-score-text">To'g'ri: 0 | Xato: 0</span>
      </div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" id="quiz-progress-fill" style="width: 0%"></div>
      </div>

      <div class="card">
        <div class="quiz-question">
          <span id="q-word">Word</span>
          <button class="audio-btn" id="btn-speak-q" onclick="speakCurrentWord()">🔊</button>
        </div>
        <div class="quiz-phonetic" id="q-phonetic"></div>

        <div class="quiz-options" id="options-container"></div>
        <div id="explanation-box" style="display:none;" class="explanation"></div>
      </div>
      
      <button class="action-btn" id="btn-next" onclick="nextQuestion()" style="display:none;">Keyingi Savol &rarr;</button>
    </div>

    <!-- WORDS VIEW -->
    <div id="view-words" style="display:none;">
      <input type="text" class="search-input" id="word-search" placeholder="Qidirish (inglizcha yoki o'zbekcha)..." oninput="renderWordList()">
      <div id="words-container" class="card" style="padding: 0;"></div>
    </div>
  </div>

  <script>
    const DATA = ${dataPayload};
    let words = DATA.words || [];
    let currentQuizIndex = 0;
    let quizWords = [];
    let correctCount = 0;
    let wrongCount = 0;
    let hasAnsweredCurrent = false;

    function init() {
      document.getElementById('stats-badge').innerText = words.length + " ta so'z yuklangan · 100% Offline";
      startQuiz();
      renderWordList();
    }

    function switchTab(tab) {
      document.getElementById('view-quiz').style.display = tab === 'quiz' ? 'block' : 'none';
      document.getElementById('view-words').style.display = tab === 'words' ? 'block' : 'none';
      document.getElementById('tab-quiz').classList.toggle('active', tab === 'quiz');
      document.getElementById('tab-words').classList.toggle('active', tab === 'words');
    }

    function startQuiz() {
      if (words.length < 4) {
        alert("Kamida 4 ta so'z bo'lishi kerak!");
        return;
      }
      quizWords = [...words].sort(() => 0.5 - Math.random()).slice(0, 30);
      currentQuizIndex = 0;
      correctCount = 0;
      wrongCount = 0;
      loadQuestion();
    }

    function loadQuestion() {
      hasAnsweredCurrent = false;
      document.getElementById('btn-next').style.display = 'none';
      document.getElementById('explanation-box').style.display = 'none';

      if (currentQuizIndex >= quizWords.length) {
        alert("Tabriklaymiz! Test yakunlandi.\\nTo'g'ri: " + correctCount + "\\nXato: " + wrongCount);
        startQuiz();
        return;
      }

      const qWord = quizWords[currentQuizIndex];
      document.getElementById('q-word').innerText = qWord.english;
      document.getElementById('q-phonetic').innerText = qWord.transcription || '';
      document.getElementById('quiz-progress-text').innerText = "Savol: " + (currentQuizIndex + 1) + " / " + quizWords.length;
      document.getElementById('quiz-score-text').innerText = "To'g'ri: " + correctCount + " | Xato: " + wrongCount;
      document.getElementById('quiz-progress-fill').style.width = ((currentQuizIndex / quizWords.length) * 100) + "%";

      // Options
      const distractors = words.filter(w => w.id !== qWord.id).sort(() => 0.5 - Math.random()).slice(0, 3);
      const options = [qWord, ...distractors].sort(() => 0.5 - Math.random());

      const container = document.getElementById('options-container');
      container.innerHTML = '';

      options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'opt-btn';
        btn.innerText = opt.uzbek;
        btn.onclick = () => handleAnswer(opt.id === qWord.id, btn, qWord);
        container.appendChild(btn);
      });

      // Auto speak word
      speak(qWord.english);
    }

    function handleAnswer(isCorrect, selectedBtn, qWord) {
      if (hasAnsweredCurrent) return;
      hasAnsweredCurrent = true;

      const buttons = document.querySelectorAll('.opt-btn');
      buttons.forEach(b => {
        if (b.innerText === qWord.uzbek) {
          b.classList.add('correct');
        }
      });

      if (isCorrect) {
        selectedBtn.classList.add('correct');
        correctCount++;
        playTone(659, 987); // positive sound
        // Auto advance after 450ms
        setTimeout(() => {
          currentQuizIndex++;
          loadQuestion();
        }, 450);
      } else {
        selectedBtn.classList.add('wrong');
        wrongCount++;
        playTone(250, 180); // negative sound
        const expBox = document.getElementById('explanation-box');
        expBox.innerHTML = '<strong>To\'g\'ri javob:</strong> ' + qWord.english + ' = ' + qWord.uzbek + (qWord.example ? '<br><small>Misol: ' + qWord.example + '</small>' : '');
        expBox.style.display = 'block';
        document.getElementById('btn-next').style.display = 'block';
        
        // Put mistake back to the queue to review again!
        quizWords.push(qWord);
      }
      document.getElementById('quiz-score-text').innerText = "To'g'ri: " + correctCount + " | Xato: " + wrongCount;
    }

    function nextQuestion() {
      currentQuizIndex++;
      loadQuestion();
    }

    function speakCurrentWord() {
      if (quizWords[currentQuizIndex]) {
        speak(quizWords[currentQuizIndex].english);
      }
    }

    function speak(text) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US';
        u.rate = 0.9;
        window.speechSynthesis.speak(u);
      }
    }

    function playTone(freq1, freq2) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(freq1, now);
        if (freq2) osc.frequency.exponentialRampToValueAtTime(freq2, now + 0.15);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      } catch(e) {}
    }

    function renderWordList() {
      const query = (document.getElementById('word-search').value || '').toLowerCase();
      const container = document.getElementById('words-container');
      const filtered = words.filter(w => w.english.toLowerCase().includes(query) || w.uzbek.toLowerCase().includes(query));

      container.innerHTML = filtered.map(w => \`
        <div class="word-item">
          <div>
            <div class="word-en">\${w.english} <span style="font-size:0.8rem; color:#818cf8; font-weight:normal;">\${w.transcription || ''}</span></div>
            <div class="word-uz">\${w.uzbek}</div>
          </div>
          <button class="audio-btn" onclick="speak('\${w.english.replace(/'/g, "\\\\'")}')">🔊</button>
        </div>
      \`).join('');
    }

    function testAudio() {
      speak("Welcome to Lug'at Master offline mode");
    }

    window.onload = init;
  </script>
</body>
</html>`;
}

// Download file trigger helper
export function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
