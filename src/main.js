 // src/main.js

console.log("Hra se načítá...");

 let gameData = [];
 let currentLeftItem;
 let currentRightItem;
 let score = 0;
 let waiting = false;
 let highScore = localStorage.getItem('marketHighScore') || 0;


// Výběr prvků z HTML (DOM Selector)
 const buttonStartElement = document.getElementById("btn_start");
 const startScreenElement = document.getElementById("start-screen");
 const gameBoardElement = document.getElementById("game-board");
 const endScreenElement = document.getElementById("end-screen");

const countElement = document.getElementById("count");
const vsElement = document.querySelector(".vs");
const highScoreElement = document.getElementsByClassName("high-score");

const leftNameElement = document.getElementById('left_name');
const leftImageElement = document.getElementById('left_image');
const leftMarketCapElement = document.getElementById('left_marketCap');

const rightNameElement = document.getElementById('right_name');
const rightImageElement = document.getElementById('right_image');
const rightMarketCapElement = document.getElementById('right_marketCap');

const buttonHigherElement = document.getElementById('btn_higher');
const buttonLowerElement = document.getElementById('btn_lower');

const buttonRestartElement = document.getElementById('btn_restart');
const finalScoreElement = document.getElementById('final-score');

 // HLAVNÍ FUNKCE INIT (Start hry)
 async function init() {

     const response = await fetch('./assets/data/data.json');
     gameData = await response.json();
     score= 0;
     updateScoreDisplay();
     updateHighScoreDisplay()
     beginNewGame();
 }

// tato funkce spustí hru po kliknutí na tlačítko start
 function startGame() {
     startScreenElement.classList.add('hidden')
     gameBoardElement.classList.remove("hidden");
 }

 // Zahájení nové hry
 function beginNewGame() {
     currentLeftItem = getRandomItem();
     do {
         currentRightItem = getRandomItem();
     } while (currentLeftItem.id === currentRightItem.id);

     waiting = false;
     renderGame(currentLeftItem, currentRightItem);
     buttonHigherElement.classList.remove('hidden');
     buttonLowerElement.classList.remove('hidden');
 }

 // Aktualizace score
 function updateScoreDisplay() {
     countElement.textContent = "Skóre: " + score;
 }

 function updateHighScoreDisplay() {
     for (let element of highScoreElement) {
         element.textContent = `High Score: ${highScore}`;
     }
 }

 // FUNKCE PRO VYKRESLENÍ (Grafika)
 function renderGame(itemLeft, itemRight) {

     leftNameElement.textContent = itemLeft.name;
     leftImageElement.src = itemLeft.image;
     leftMarketCapElement.textContent = itemLeft.price.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

     rightNameElement.textContent = itemRight.name;
     rightImageElement.src = itemRight.image;
     rightMarketCapElement.textContent = "";
 }

 // Funkce pro vygenerování random čísla pro výběr firem
 function getRandomItem() {
     const randomIndex = Math.floor(Math.random() * gameData.length)
     return gameData[randomIndex];
 }

 // FUNKCE PRO KONTROLU
function checkAnswer(guess) {

     if (waiting === true) {
         return;
     }

     waiting = true;

    const priceLeft = currentLeftItem.price;
    const priceRight = currentRightItem.price;

    console.log(`Hádáš: ${guess}. Vlevo: ${priceLeft}, Vpravo: ${priceRight}`);

    let jeToSpravne = false;

    if (guess === "higher") {
        if (priceLeft < priceRight) {
            jeToSpravne = true;
        }

    } else if (guess === "lower") {
        if (priceLeft > priceRight) {
            jeToSpravne = true;
        }
    }

    animateValue(rightMarketCapElement, 0, priceRight, 1500);

    // kolečko se zbarví podle toho, jestli je to správně nebo špatně
    setTimeout(() => {
        if (jeToSpravne) {
            vsElement.classList.add('correct');
            vsElement.textContent = "✔"
        } else {
            vsElement.classList.add('wrong');
            vsElement.textContent = "✘"
        }
    },1500);

    // Pokud je odpověď správná, provedeme posun a nové kolo po uplinutí timeru
    setTimeout(() => {
        if (jeToSpravne) {
            score++;
            updateScoreDisplay();

            currentLeftItem = currentRightItem;

            do {
                currentRightItem = getRandomItem();
            } while (currentLeftItem.id === currentRightItem.id);

            renderGame(currentLeftItem, currentRightItem);
            waiting = false;

            buttonHigherElement.classList.remove('hidden');
            buttonLowerElement.classList.remove('hidden');

        }else{
            endScreenElement.classList.remove('hidden');
            finalScoreElement.textContent = `Tvé konečné score je: ${score}`
            countElement.classList.add('invisible');

            if (score > highScore) {
                highScore = score;
                localStorage.setItem('marketHighScore', highScore);
                updateHighScoreDisplay()
            }

        }

        vsElement.classList.remove('correct');
        vsElement.classList.remove('wrong');
        vsElement.textContent = "VS";


    }, 2500);

}

// přidání animace čísel
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

         element.textContent = current.toLocaleString("en-US", {
             style: "currency",
             currency: "USD",
             maximumFractionDigits: 0
         });
     }, frameDuration);
}

 buttonHigherElement.addEventListener('click', () => {
     checkAnswer('higher');
     buttonHigherElement.classList.add('hidden');
     buttonLowerElement.classList.add('hidden');
 });

 buttonLowerElement.addEventListener('click', () => {
     checkAnswer('lower');
     buttonHigherElement.classList.add('hidden');
     buttonLowerElement.classList.add('hidden');
 });

 buttonStartElement.addEventListener('click', () => {
     startGame()
 })

 // při kliknutí na tlačítko se restartuje celá hra
 buttonRestartElement.addEventListener('click', () => {
     endScreenElement.classList.add('hidden');
     score = 0;
     updateScoreDisplay();

     vsElement.classList.remove('correct');
     vsElement.classList.remove('wrong');
     vsElement.textContent = "VS";
     rightMarketCapElement.textContent = "";
     countElement.classList.remove('invisible');

     beginNewGame();
 })

 init();
