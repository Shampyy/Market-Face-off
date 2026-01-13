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
        lower: document.getElementById("btn-lower"),
        share: document.getElementById("btn_share")
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
        setupImageErrorHandling();
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
    if (guess === "higher" && priceLeft <= priceRight) isCorrect = true;
    else if (guess === "lower" && priceLeft >= priceRight) isCorrect = true;

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

    preloadImage(getLogoUrl(nextItem.image));

    // B) Vykreslíme ji do skryté "Next" karty
    DOM.next.name.textContent = nextItem.name;
    DOM.next.image.src = getLogoUrl(nextItem.image);
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

async function shareScore() {
    // 1. Příprava textu
    let emojiString = "✅".repeat(state.score) + "❌";
    if (state.score > 10) emojiString = `✅ x ${state.score} ❌`;

    const textToShare = `Nahrál jsem skóre ${state.score} v MarketCap Game! 🚀\n${emojiString}\nDokážeš mě porazit?`;
    const urlToShare = window.location.href;
    const fullText = `${textToShare}\n${urlToShare}`;

    const shareData = {
        title: 'Market Cap Game',
        text: textToShare,
        url: urlToShare
    };

    // 2. Pokus o nativní sdílení (Mobil / Safari na Macu)
    if (navigator.share) {
        try {
            await navigator.share(shareData);
            return; // Pokud se povedlo, končíme
        } catch (err) {
            console.log("Sdílení zrušeno nebo nepodporováno, zkouším schránku...");
        }
    }

    // 3. Pokus o automatické kopírování (Chrome / PC)
    try {
        await navigator.clipboard.writeText(fullText);

        // Vizuální potvrzení na tlačítku
        const btn = DOM.buttons.share;
        const originalText = btn.textContent;
        const originalColor = btn.style.backgroundColor;

        btn.textContent = "Zkopírováno! 📋";
        btn.style.backgroundColor = "#28a745"; // Zelená

        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.backgroundColor = originalColor;
        }, 2000);

    } catch (err) {
        // 4. POSLEDNÍ ZÁCHRANA: Pokud vše selže (např. spuštěno z disku)
        // Otevře staré dobré vyskakovací okno, kde si to uživatel zkopíruje sám
        prompt("Kopírování selhalo. Zkopíruj si text ručně (Cmd+C):", fullText);
    }
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
    DOM.left.image.src = getLogoUrl(itemLeft.image);
    DOM.left.price.textContent = formatCurrency(itemLeft.price);

    // Pravá karta (cenu schováme)
    DOM.right.name.textContent = itemRight.name;
    DOM.right.image.src = getLogoUrl(itemRight.image);
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

// funkce na získáni loga
function getLogoUrl(domain) {
    // Brandfetch CDN (Content Delivery Network)
    return `https://cdn.brandfetch.io/${domain}/w/200/h/200?c=1idFjQ2`;
}
// pokud selže načtení loga
function setupImageErrorHandling() {
    const defaultImage = "https://cdn-icons-png.flaticon.com/512/550/550595.png";

    // Seznam img elementů
    const images = [DOM.left.image, DOM.right.image, DOM.next.image];

    images.forEach(img => {
        img.onerror = function() {
            const currentSrc = this.src;

            // 1. POKUS: Pokud to byl Brandfetch a selhal, zkusíme Google (Fallback 1)
            if (currentSrc.includes("brandfetch.io")) {
                // Vytáhneme doménu z URL (jednoduchý trik - vezmeme část mezi lomítky)
                // URL je např: https://cdn.brandfetch.io/apple.com/w/200...
                const domain = currentSrc.split('/')[3];

                // Přepneme na Google API
                this.src = `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=256`;
            }
            // 2. POKUS: Pokud selhal i Google (nebo jiný zdroj), dáme defaultní ikonu (Fallback 2)
            else {
                this.src = defaultImage;
            }
        };
    });
}

// Funkce pro načtení obrázku na pozadí
function preloadImage(url) {
    const img = new Image();
    img.src = url;
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

DOM.buttons.share.addEventListener('click', shareScore);

// Spustíme aplikaci
init();