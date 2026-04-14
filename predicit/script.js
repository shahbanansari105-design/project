document.addEventListener('DOMContentLoaded', () => {
    // Landing Page Elements
    const landingPage = document.getElementById('landing-page');
    const enterBtn = document.getElementById('enterBtn');
    const appContainer = document.getElementById('app-container');

    // DOM Elements
    const form = document.getElementById('prediction-form');
    const resultContainer = document.getElementById('result-container');
    const predictBtn = document.getElementById('predictBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    // Inputs
    const studyInput = document.getElementById('studyHours');
    const attendanceInput = document.getElementById('attendance');
    const prevScoreInput = document.getElementById('previousScore');
    const sleepInput = document.getElementById('sleepHours');
    
    // Displays
    const studyDisplay = document.getElementById('studyHoursValue');
    const attendanceDisplay = document.getElementById('attendanceValue');
    const prevScoreDisplay = document.getElementById('previousScoreValue');
    const sleepDisplay = document.getElementById('sleepHoursValue');
    
    // Result Elements
    const finalScoreEl = document.getElementById('final-score');
    const scoreRingEl = document.getElementById('score-ring');
    const gradeDisplayEl = document.querySelector('#grade-display span');
    const insightsList = document.getElementById('insights-list');

    // Update displays on range hover/change
    const updateDisplays = () => {
        studyDisplay.textContent = parseFloat(studyInput.value).toFixed(1);
        attendanceDisplay.textContent = attendanceInput.value + '%';
        prevScoreDisplay.textContent = prevScoreInput.value;
        sleepDisplay.textContent = parseFloat(sleepInput.value).toFixed(1);
    };

    [studyInput, attendanceInput, prevScoreInput, sleepInput].forEach(input => {
        input.addEventListener('input', updateDisplays);
    });

    // Landing Page Transition
    enterBtn.addEventListener('click', () => {
        landingPage.classList.add('fade-out');
        // Wait briefly for the fade, then reveal the container
        setTimeout(() => {
            landingPage.style.display = 'none';
            appContainer.classList.remove('hidden-initially');
            appContainer.style.position = 'relative';
        }, 800);
    });

    // Form Submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Load state
        predictBtn.classList.add('loading');
        
        // Values
        const payload = {
            studyHours: parseFloat(studyInput.value),
            attendance: parseInt(attendanceInput.value),
            previousScore: parseInt(prevScoreInput.value),
            sleepHours: parseFloat(sleepInput.value),
            extracurricular: document.querySelector('input[name="extracurricular"]:checked').value
        };

        try {
            const response = await fetch('/api/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('Prediction failed');
            }

            const result = await response.json();
            predictBtn.classList.remove('loading');
            displayResults(result.score, result.data);
            
        } catch (error) {
            console.error('Error fetching prediction:', error);
            predictBtn.classList.remove('loading');
            alert('Failed to connect to the server calculation engine.');
        }
    });

    // Reset
    resetBtn.addEventListener('click', () => {
        resultContainer.classList.add('hidden');
        form.classList.remove('hidden');
        // Reset ring
        scoreRingEl.style.strokeDashoffset = 276.46;
    });

    function displayResults(score, data) {
        // Hide form, show results
        form.classList.add('hidden');
        resultContainer.classList.remove('hidden');

        // Animate counter
        const duration = 1500;
        const start = 0;
        const end = parseFloat(score.toFixed(1));
        let startTime = null;

        function animateNumber(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = (timestamp - startTime) / duration;
            
            if (progress < 1) {
                const current = start + (end - start) * easeOutExpo(progress);
                finalScoreEl.textContent = current.toFixed(1);
                requestAnimationFrame(animateNumber);
            } else {
                finalScoreEl.textContent = end.toFixed(1);
            }
        }
        
        requestAnimationFrame(animateNumber);

        // Animate Ring & Color logic
        const circumference = 2 * Math.PI * 44; // 276.46
        const offset = circumference - (score / 100) * circumference;
        
        setTimeout(() => {
            scoreRingEl.style.strokeDashoffset = offset;
        }, 100);

        // Grade mapping and styling
        let colorStr = '';
        let gradeStr = '';

        if (score >= 90) { colorStr = 'var(--grade-a)'; gradeStr = 'A (Excellent)'; }
        else if (score >= 80) { colorStr = 'var(--grade-b)'; gradeStr = 'B (Good)'; }
        else if (score >= 70) { colorStr = 'var(--grade-c)'; gradeStr = 'C (Average)'; }
        else if (score >= 60) { colorStr = 'var(--grade-d)'; gradeStr = 'D (Below Average)'; }
        else { colorStr = 'var(--grade-f)'; gradeStr = 'F (Needs Work)'; }

        scoreRingEl.style.stroke = colorStr;
        gradeDisplayEl.textContent = gradeStr;
        gradeDisplayEl.style.color = colorStr;
        gradeDisplayEl.style.backgroundColor = `${colorStr}22`; // 22 is hex alpha

        // Generate Insights
        insightsList.innerHTML = '';
        const insights = [];
        
        if (data.study < 10) insights.push({ icon: '⚠️', text: 'Increasing study hours beyond 10/wk significantly boosts outcomes.' });
        else insights.push({ icon: '✅', text: 'Great study habits! You are maximizing your academic potential.' });

        if (data.attend < 80) insights.push({ icon: '📉', text: 'Poor attendance is a major risk factor. Aim for >80%.' });
        
        if (data.sleep < 7) insights.push({ icon: '🛌', text: 'Less than 7 hours of sleep impairs memory consolidation.' });
        else if (data.sleep > 9) insights.push({ icon: '🕰️', text: 'Oversleeping might lead to lethargy.' });

        insights.push({ icon: '📊', text: `Base foundation from previous score contributes ~40% to your current trajectory.`});

        insights.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<i>${item.icon}</i> <span>${item.text}</span>`;
            insightsList.appendChild(li);
        });
    }

    // Easing function for smooth number counting animation
    function easeOutExpo(x) {
        return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
    }

    // Chatbot Logic
    const chatToggleBtn = document.getElementById('chatToggleBtn');
    const chatCloseBtn = document.getElementById('chatCloseBtn');
    const chatWindow = document.getElementById('chat-window');
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');

    let chatHistory = [];

    // Toggle Chat
    chatToggleBtn.addEventListener('click', () => {
        chatWindow.classList.remove('hidden-chat');
        chatToggleBtn.style.transform = 'scale(0)';
        chatWindow.style.pointerEvents = 'all';
    });

    chatCloseBtn.addEventListener('click', () => {
        chatWindow.classList.add('hidden-chat');
        chatToggleBtn.style.transform = 'scale(1)';
        chatWindow.style.pointerEvents = 'none';
    });

    // Handle Chat Submit
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if(!text) return;

        // Add user msg
        appendMessage('user', text);
        chatInput.value = '';

        // Add history
        chatHistory.push({ role: 'user', content: text });

        // Show typing indicator
        const typingId = showTypingIndicator();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: chatHistory })
            });

            removeTypingIndicator(typingId);

            if(!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            const aiText = data.result;

            chatHistory.push({ role: 'assistant', content: aiText });
            appendMessage('assistant', aiText);

        } catch (error) {
            console.error('Chat Error:', error);
            removeTypingIndicator(typingId);
            appendMessage('assistant', 'Sorry, my neural link to the core is currently disrupted.');
        }
    });

    function appendMessage(role, text) {
        const div = document.createElement('div');
        div.className = `chat-bubble ${role === 'user' ? 'user-bubble' : 'ai-bubble'}`;
        div.textContent = text;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showTypingIndicator() {
        const id = 'typing-' + Date.now();
        const div = document.createElement('div');
        div.id = id;
        div.className = 'chat-bubble ai-bubble chat-typing';
        div.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return id;
    }

    function removeTypingIndicator(id) {
        const el = document.getElementById(id);
        if(el) el.remove();
    }

    // Flashcard Logic
    const flashcard = document.getElementById('flashcard');
    const nextQuestionBtn = document.getElementById('nextQuestionBtn');
    const fcQuestion = document.getElementById('fc-question');
    const fcAnswer = document.getElementById('fc-answer');

    const flashcardsData = [
        { q: "What is active recall?", a: "Testing yourself on concepts rather than passively reading to build stronger neural pathways." },
        { q: "What is spaced repetition?", a: "Reviewing material at increasingly spaced intervals to dramatically improve long-term memory." },
        { q: "What is the Pomodoro Technique?", a: "A time management method using a timer to break work into intervals, typically 25 minutes long, separated by short breaks." },
        { q: "How does sleep affect learning?", a: "Sleep, especially REM sleep, is crucial for memory consolidation and problem-solving skills." },
        { q: "What is the Feynman Technique?", a: "Learning by teaching: simplify a concept as if teaching it to a beginner to identify gaps in your understanding." },
        { q: "What is interleaving?", a: "Mixing different topics or forms of practice in a study session to improve problem-solving and pattern recognition." }
    ];

    let currentCardIndex = 0;

    if (flashcard) {
        flashcard.addEventListener('click', () => {
            flashcard.classList.toggle('flipped');
        });
    }

    if (nextQuestionBtn) {
        nextQuestionBtn.addEventListener('click', () => {
            // Flip back to front if flipped
            if (flashcard.classList.contains('flipped')) {
                flashcard.classList.remove('flipped');
                // Wait for animation to finish before changing text
                setTimeout(() => setNextCard(), 300);
            } else {
                setNextCard();
            }
        });
    }

    function setNextCard() {
        currentCardIndex = (currentCardIndex + 1) % flashcardsData.length;
        const currentData = flashcardsData[currentCardIndex];
        fcQuestion.textContent = currentData.q;
        fcAnswer.textContent = currentData.a;
    }

    // To-Do List Logic
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');

    let tasks = JSON.parse(localStorage.getItem('student_tasks')) || [];

    const saveTasks = () => {
        localStorage.setItem('student_tasks', JSON.stringify(tasks));
    };

    const renderTasks = () => {
        if (!todoList) return;
        todoList.innerHTML = '';
        tasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.className = `todo-item ${task.completed ? 'completed' : ''}`;
            
            li.innerHTML = `
                <div class="todo-content" data-index="${index}">
                    <div class="todo-checkbox">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <span class="todo-text">${escapeHTML(task.text)}</span>
                </div>
                <button class="todo-delete-btn" data-index="${index}">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            `;
            todoList.appendChild(li);
        });
    };

    // Helper to prevent XSS
    function escapeHTML(str) {
        let div = document.createElement('div');
        div.innerText = str;
        return div.innerHTML;
    }

    if (todoForm) {
        todoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = todoInput.value.trim();
            if (text) {
                tasks.push({ text, completed: false });
                saveTasks();
                renderTasks();
                todoInput.value = '';
            }
        });
    }

    if (todoList) {
        todoList.addEventListener('click', (e) => {
            // Toggle complete
            const content = e.target.closest('.todo-content');
            if (content) {
                const index = content.getAttribute('data-index');
                tasks[index].completed = !tasks[index].completed;
                saveTasks();
                renderTasks();
            }

            // Delete task
            const deleteBtn = e.target.closest('.todo-delete-btn');
            if (deleteBtn) {
                const index = deleteBtn.getAttribute('data-index');
                // Optional: add exit animation before remove
                const li = deleteBtn.closest('.todo-item');
                li.style.transform = 'scale(0.9) translateX(20px)';
                li.style.opacity = '0';
                setTimeout(() => {
                    tasks.splice(index, 1);
                    saveTasks();
                    renderTasks();
                }, 300);
            }
        });
        
        // Initial render
        renderTasks();
    }
});
