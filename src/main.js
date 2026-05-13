/* =========================================
   1. GLOBAL STATE
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
   2. DOM ELEMENTS
   ========================================= */
const DOM = {
    screens: {
        start: document.getElementById("start-screen"),
        game: document.getElementById("game-board"),
        end: document.getElementById("end-screen"),
        main: document.querySelector("#game-board main")
    },
    buttons: {
        start: document.getElementById("btn-start"),
        restart: document.getElementById("btn-restart"),
        higher: document.getElementById("btn-higher"),
        lower: document.getElementById("btn-lower"),
        share: document.getElementById("btn_share")
    },
    score: document.getElementById("count"),
    scoreMobile: document.getElementById("count-mobile"),
    finalScore: document.getElementById("final-score"),
    highScoreLabels: document.getElementsByClassName("high-score"),
    vsCircle: document.querySelector(".vs"),
};

/*
   CIRKULÁRNÍ SYSTÉM KARET
   ========================
   Místo pevných ID (#card-left, #card-right, #card-next) sledujeme,
   který fyzický div (card-a, card-b, card-c) momentálně hraje jakou roli.

   Po každé správné odpovědi rotujeme ROLE (třídy), ne obsah:
     - stará levá karta odjede offscreen → dostane roli "next"
     - stará pravá karta → dostane roli "left"
     - stará next karta → dostane roli "right"

   Nikdy se neresetují pozice viditelných karet → žádný flash.
*/
const roles = {
    left: document.getElementById('card-a'),
    right: document.getElementById('card-b'),
    next: document.getElementById('card-c')
};

/* =========================================
   3. CARD HELPERS
   ========================================= */

// Vrátí reference na elementy uvnitř karty (h1[0]=název, img, h1[1]=cena)
function getCardElements(cardDiv) {
    const h1s = cardDiv.querySelectorAll('h1');
    return {
        name:  h1s[0],
        price: h1s[1],
        image: cardDiv.querySelector('img')
    };
}

// Vykreslí item do konkrétního divu karty
function renderCard(cardDiv, item, showPrice) {
    const els = getCardElements(cardDiv);
    els.name.textContent  = item.name;
    els.image.src         = getLogoUrl(item.image);
    els.price.textContent = showPrice ? formatCurrency(item.price) : '';
}

// Resetuje role zpět na výchozí stav (pro novou hru / restart)
function resetRoles() {
    const cards = [
        document.getElementById('card-a'),
        document.getElementById('card-b'),
        document.getElementById('card-c')
    ];

    cards.forEach(c => {
        c.classList.remove('role-left', 'role-right', 'role-next');
        c.style.transition = '';
    });

    cards[0].classList.add('role-left');
    cards[1].classList.add('role-right');
    cards[2].classList.add('role-next');

    roles.left  = cards[0];
    roles.right = cards[1];
    roles.next  = cards[2];
}

/* =========================================
   4. INITIALIZATION
   ========================================= */
async function init() {
    try {
        const response = await fetch('./assets/data/data.json');
        state.gameData = await response.json();

        state.score = 0;
        updateScoreDisplay();
        updateHighScoreDisplay();

        beginNewGame();
        setupImageErrorHandling();
    } catch (error) {
        console.error("Chyba při načítání dat:", error);
    }
}

function startGame() {
    DOM.screens.start.classList.add('hidden');
    DOM.screens.game.classList.remove("hidden");
}

function beginNewGame() {
    resetRoles();

    state.currentLeftItem = getRandomItem();
    do {
        state.currentRightItem = getRandomItem();
    } while (state.currentLeftItem.id === state.currentRightItem.id);

    state.waiting = false;

    renderCard(roles.left,  state.currentLeftItem,  true);
    renderCard(roles.right, state.currentRightItem, false);
    // roles.next dostane obsah na začátku prvního handleWin()

    toggleButtons(true);
}

/* =========================================
   5. GAME LOGIC
   ========================================= */
function checkAnswer(guess) {
    if (state.waiting) return;
    state.waiting = true;

    const priceLeft  = state.currentLeftItem.price;
    const priceRight = state.currentRightItem.price;

    // Zachytíme referenci na element TEĎ, před rotací karet
    const rightPriceEl = getCardElements(roles.right).price;

    let isCorrect = false;
    if (guess === "higher" && priceLeft <= priceRight) isCorrect = true;
    else if (guess === "lower" && priceLeft >= priceRight) isCorrect = true;

    // Animace čísla
    animateValue(rightPriceEl, 0, priceRight, 1500);

    // Zobrazení ✔ nebo ✘
    setTimeout(() => {
        DOM.vsCircle.classList.add(isCorrect ? 'correct' : 'wrong');
        DOM.vsCircle.textContent = isCorrect ? "✔" : "✘";
    }, 1500);

    // Rozhodnutí
    setTimeout(() => {
        if (isCorrect) handleWin();
        else handleLoss();
    }, 2500);
}

function handleWin() {
    state.score++;
    updateScoreDisplay();
    checkHighScore();

    // A) Připravíme nový item
    let nextItem;
    do {
        nextItem = getRandomItem();
    } while (nextItem.id === state.currentRightItem.id || nextItem.id === state.currentLeftItem.id);

    preloadImage(getLogoUrl(nextItem.image));

    // B) Vykreslíme ho do schované "next" karty (ještě před animací)
    renderCard(roles.next, nextItem, false);

    // C) Spustíme animaci
    DOM.screens.main.classList.add('animating');

    // D) Po dojetí animace — CIRKULÁRNÍ ROTACE
    setTimeout(() => {
        const main = DOM.screens.main;

        // 1. Zabijeme všechny transitions (synchronní — žádný paint ještě nenastal)
        [roles.left, roles.right, roles.next].forEach(el => {
            el.style.transition = 'none';
        });

        // 2. Odstraníme animating třídu (synchronní)
        main.classList.remove('animating');

        // 3. Rotujeme ROLE — ne obsah karet (synchronní)
        //    left → next (odjela offscreen, bude příští "next")
        //    right → left (vizuálně je na pozici left, dostane roli left)
        //    next → right (vizuálně je na pozici right, dostane roli right)
        const oldLeft  = roles.left;
        const oldRight = roles.right;
        const oldNext  = roles.next;

        oldLeft.classList.remove('role-left');   oldLeft.classList.add('role-next');
        oldRight.classList.remove('role-right'); oldRight.classList.add('role-left');
        oldNext.classList.remove('role-next');   oldNext.classList.add('role-right');

        roles.left  = oldRight;
        roles.right = oldNext;
        roles.next  = oldLeft;

        // 4. Aktualizujeme stav
        state.currentLeftItem  = state.currentRightItem;
        state.currentRightItem = nextItem;

        // 5. Zobrazíme cenu na nové levé kartě (obsah tam už je ze starého "right")
        getCardElements(roles.left).price.textContent = formatCurrency(state.currentLeftItem.price);

        // 6. Jeden frame počkáme a pak obnovíme transitions
        //    Teprve teď prohlížeč poprvé vykreslí — vše je na správném místě
        requestAnimationFrame(() => {
            [roles.left, roles.right, roles.next].forEach(el => {
                el.style.transition = '';
            });
            state.waiting = false;
            toggleButtons(true);
            resetVsCircle();
        });

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
    let emojiString = "✅".repeat(state.score) + "❌";
    if (state.score > 10) emojiString = `✅ x ${state.score} ❌`;

    const textToShare = `Nahrál jsem skóre ${state.score} v MarketCap Game! 🚀\n${emojiString}\nDokážeš mě porazit?`;
    const urlToShare  = window.location.href;
    const fullText    = `${textToShare}\n${urlToShare}`;

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile && navigator.share) {
        try {
            await navigator.share({ title: 'Market Cap Game', text: textToShare, url: urlToShare });
        } catch (err) {
            if (err.name !== 'AbortError') console.log("Chyba sdílení:", err);
        }
    } else {
        copyToClipboard(fullText);
    }
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        const btn = DOM.buttons.share;
        const originalText = btn.textContent;
        btn.textContent = "Zkopírováno! 📋";
        btn.style.backgroundColor = "#28a745";
        btn.style.transform = "scale(1.05)";
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.backgroundColor = "";
            btn.style.transform = "";
        }, 2000);
    } catch (err) {
        prompt("Zkopíruj si výsledek ručně (Cmd+C / Ctrl+C):", text);
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
    return state.gameData[Math.floor(Math.random() * state.gameData.length)];
}

/* =========================================
   6. UI FUNCTIONS
   ========================================= */
function updateScoreDisplay() {
    const text = "Skóre: " + state.score;
    DOM.score.textContent = text;
    if (DOM.scoreMobile) DOM.scoreMobile.textContent = text;
}

function updateHighScoreDisplay() {
    for (let el of DOM.highScoreLabels) {
        el.textContent = `High Score: ${state.highScore}`;
    }
}

function resetVsCircle() {
    DOM.vsCircle.style.transition = 'none';
    DOM.vsCircle.classList.remove('correct', 'wrong');
    DOM.vsCircle.textContent = "VS";

    requestAnimationFrame(() => {
        DOM.vsCircle.style.transition = '';
    });
}

function toggleButtons(show) {
    DOM.buttons.higher.style.visibility = show ? '' : 'hidden';
    DOM.buttons.lower.style.visibility  = show ? '' : 'hidden';
}

function getLogoUrl(domain) {
    return `https://cdn.brandfetch.io/${domain}/w/200/h/200?c=1idFjQ2`;
}

function setupImageErrorHandling() {
    const defaultImage = "https://cdn-icons-png.flaticon.com/512/550/550595.png";

    // Připojíme handler na všechny obrázky v kartách (bez ohledu na roli)
    document.querySelectorAll('.card img').forEach(img => {
        img.onerror = function () {
            const currentSrc = this.src;
            if (currentSrc.includes("brandfetch.io")) {
                const domain = currentSrc.split('/')[3];
                this.src = `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=256`;
            } else {
                this.src = defaultImage;
            }
        };
    });
}

function preloadImage(url) {
    const img = new Image();
    img.src = url;
}

function formatCurrency(number) {
    return number.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
    });
}

function animateValue(element, start, end, duration) {
    const frameDuration = 20;
    const totalFrames   = duration / frameDuration;
    const increment     = (end - start) / totalFrames;
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
   7. EVENT LISTENERS
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
    DOM.score.classList.remove('invisible');
    beginNewGame();
});

DOM.buttons.share.addEventListener('click', shareScore);

// Start
init();