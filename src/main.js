/* =========================================
   1. GLOBAL STATE (Stav hry)
   ========================================= */
const state = {
    gameData: [],
    currentLeftItem: null,
    currentRightItem: null,
    score: 0,
    waiting: false,
    highScore: localStorage.getItem('marketHighScore') || 0
};

/* =========================================
   2. DOM ELEMENTS (Všechny prvky z HTML)
   ========================================= */
const DOM = {
    // Obrazovky
    screens: {
        start: document.getElementById("start-screen"),
        game: document.getElementById("game-board"),
        end: document.getElementById("end-screen"),
        main: document.querySelector("#game-board main")
    },
    // Tlačítka
    buttons: {
        start: document.getElementById("btn-start"),
        restart: document.getElementById("btn-restart"),
        higher: document.getElementById("btn-higher"),
        lower: document.getElementById("btn-lower")
    },
    // Texty a UI
    score: document.getElementById("count"),
    finalScore: document.getElementById("final-score"),
    highScoreLabels: document.getElementsByClassName("high-score"),
    vsCircle: document.querySelector(".vs"),

    // Karty
    left: {
        name: document.getElementById('left-name'),
        image: document.getElementById('left-image'),
        price: document.getElementById('left-marketCap')
    },
    right: {
        name: document.getElementById('right-name'),
        image: document.getElementById('right-image'),
        price: document.getElementById('right-marketCap')
    },
    next: { // Třetí karta (skrytá)
        name: document.getElementById('next-name'),
        image: document.getElementById('next-image'),
        price: document.getElementById('next-marketCap')
    }
};

console.log("Hra se načítá...");

/* =========================================
   3. INITIALIZATION (Start)
   ========================================= */
async function init() {
    try {
        const response = await fetch('./assets/data/data.json');
        state.gameData = await response.json();

        // Nastavení počátečních hodnot
        state.score = 0;
        updateScoreDisplay();
        updateHighScoreDisplay();

        // Připravíme data pro hru na pozadí
        beginNewGame();
    } catch (error) {
        console.error("Chyba při načítání dat:", error);
    }
}

// Funkce volaná tlačítkem START
function startGame() {
    DOM.screens.start.classList.add('hidden');
    DOM.screens.game.classList.remove("hidden");
}

function beginNewGame() {
    state.currentLeftItem = getRandomItem();
    do {
        state.currentRightItem = getRandomItem();
    } while (state.currentLeftItem.id === state.currentRightItem.id);

    state.waiting = false;
    renderGame(state.currentLeftItem, state.currentRightItem);

    toggleButtons(true);
}

/* =========================================
   4. GAME LOGIC (Herní logika)
   ========================================= */
function checkAnswer(guess) {
    if (state.waiting) return;
    state.waiting = true;

    const priceLeft = state.currentLeftItem.price;
    const priceRight = state.currentRightItem.price;

    console.log(`Hádáš: ${guess}. Vlevo: ${priceLeft}, Vpravo: ${priceRight}`);

    // 1. Vyhodnocení správnosti
    let isCorrect = false;
    if (guess === "higher" && priceLeft < priceRight) isCorrect = true;
    else if (guess === "lower" && priceLeft > priceRight) isCorrect = true;

    // 2. Animace čísla
    animateValue(DOM.right.price, 0, priceRight, 1500);

    // 3. Zobrazení ✔ nebo ✘ (po 1.5s)
    setTimeout(() => {
        if (isCorrect) {
            DOM.vsCircle.classList.add('correct');
            DOM.vsCircle.textContent = "✔";
        } else {
            DOM.vsCircle.classList.add('wrong');
            DOM.vsCircle.textContent = "✘";
        }
    }, 1500);

    // 4. Rozhodnutí co dál (po 2.5s)
    setTimeout(() => {
        if (isCorrect) {
            handleWin();
        } else {
            handleLoss();
        }
    }, 2500);
}

function handleWin() {
    state.score++;
    updateScoreDisplay();
    checkHighScore();

    // A) Připravíme novou kartu do paměti
    let nextItem;
    do {
        nextItem = getRandomItem();
    } while (nextItem.id === state.currentRightItem.id || nextItem.id === state.currentLeftItem.id);

    // B) Vykreslíme ji do skryté "Next" karty
    DOM.next.name.textContent = nextItem.name;
    DOM.next.image.src = nextItem.image;
    DOM.next.price.textContent = "";

    // C) Spustíme animaci (posun karet)
    DOM.screens.main.classList.add('animating');

    // D) Počkáme na dojetí animace (0.8s)
    setTimeout(() => {
        // Posun dat: Right -> Left, Next -> Right
        state.currentLeftItem = state.currentRightItem;
        state.currentRightItem = nextItem;

        renderGame(state.currentLeftItem, state.currentRightItem);

        // Reset stavu
        state.waiting = false;
        toggleButtons(true);
        DOM.screens.main.classList.remove('animating');

        // Reset VS kolečka
        resetVsCircle();

    }, 800);
}

function handleLoss() {
    DOM.screens.end.classList.remove('hidden');
    DOM.finalScore.textContent = `Tvé konečné score je: ${state.score}`;
    DOM.score.classList.add('invisible');

    checkHighScore();
    resetVsCircle();
}

function checkHighScore() {
    if (state.score > state.highScore) {
        state.highScore = state.score;
        localStorage.setItem('marketHighScore', state.highScore);
        updateHighScoreDisplay();
    }
}

function getRandomItem() {
    const randomIndex = Math.floor(Math.random() * state.gameData.length);
    return state.gameData[randomIndex];
}

/* =========================================
   5. UI FUNCTIONS (Vykreslování)
   ========================================= */
function renderGame(itemLeft, itemRight) {
    // Levá karta
    DOM.left.name.textContent = itemLeft.name;
    DOM.left.image.src = itemLeft.image;
    DOM.left.price.textContent = formatCurrency(itemLeft.price);

    // Pravá karta (cenu schováme)
    DOM.right.name.textContent = itemRight.name;
    DOM.right.image.src = itemRight.image;
    DOM.right.price.textContent = "";
}

function updateScoreDisplay() {
    DOM.score.textContent = "Skóre: " + state.score;
}

function updateHighScoreDisplay() {
    for (let element of DOM.highScoreLabels) {
        element.textContent = `High Score: ${state.highScore}`;
    }
}

function resetVsCircle() {
    DOM.vsCircle.classList.remove('correct');
    DOM.vsCircle.classList.remove('wrong');
    DOM.vsCircle.textContent = "VS";
}

function toggleButtons(show) {
    if (show) {
        DOM.buttons.higher.classList.remove('hidden');
        DOM.buttons.lower.classList.remove('hidden');
    } else {
        DOM.buttons.higher.classList.add('hidden');
        DOM.buttons.lower.classList.add('hidden');
    }
}

// Pomocná funkce pro formátování měny
function formatCurrency(number) {
    return number.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
    });
}

// Animace počítadla
function animateValue(element, start, end, duration) {
    const frameDuration = 20;
    const totalFrames = duration / frameDuration;
    const increment = (end - start) / totalFrames;
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = formatCurrency(current);
    }, frameDuration);
}

/* =========================================
   6. EVENT LISTENERS (Ovládání)
   ========================================= */
DOM.buttons.higher.addEventListener('click', () => {
    toggleButtons(false);
    checkAnswer('higher');
});

DOM.buttons.lower.addEventListener('click', () => {
    toggleButtons(false);
    checkAnswer('lower');
});

DOM.buttons.start.addEventListener('click', startGame);

DOM.buttons.restart.addEventListener('click', () => {
    DOM.screens.end.classList.add('hidden');
    state.score = 0;
    updateScoreDisplay();
    resetVsCircle();
    DOM.right.price.textContent = "";
    DOM.score.classList.remove('invisible');

    beginNewGame();
});

// Spustíme aplikaci
init();