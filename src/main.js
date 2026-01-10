 // src/main.js

console.log("Hra se načítá...");

 let gameData = [];
 let currentLeftItem;
 let currentRightItem;
 let score = 0;


// Výběr prvků z HTML (DOM Selector)
const countElement = document.getElementById("count");

const leftNameElement = document.getElementById('left_name');
const leftImageElement = document.getElementById('left_image');
const leftMarketCapElement = document.getElementById('left_marketCap');

const rightNameElement = document.getElementById('right_name');
const rightImageElement = document.getElementById('right_image');

const buttonHigherElement = document.getElementById('btn_higher');
const buttonLowerElement = document.getElementById('btn_lower');


 // HLAVNÍ FUNKCE INIT (Start hry)
 async function init() {

     const response = await fetch('./assets/data/data.json');
     gameData = await response.json();

     score= 0;
     updateScoreDisplay();
     startNewGame();
 }

 // Zahájení nové hry
 function startNewGame() {
     currentLeftItem = getRandomItem();
     do {
         currentRightItem = getRandomItem();
     } while (currentLeftItem.id === currentRightItem.id);

     renderGame(currentLeftItem, currentRightItem);
 }

 // Aktualizace score
 function updateScoreDisplay() {
     countElement.textContent = "Skóre: " + score;
 }

 // FUNKCE PRO VYKRESLENÍ (Grafika)
 function renderGame(itemLeft, itemRight) {

     leftNameElement.textContent = itemLeft.name;
     leftImageElement.src = itemLeft.image;
     leftMarketCapElement.textContent = itemLeft.price.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

     rightNameElement.textContent = itemRight.name;
     rightImageElement.src = itemRight.image;
 }

 // Funkce pro vygenerování random čísla pro výběr firem
 function getRandomItem() {
     const randomIndex = Math.floor(Math.random() * gameData.length)
     return gameData[randomIndex];
 }

 // FUNKCE PRO KONTROLU
function checkAnswer(guess) {
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

    // Pokud je odpověď správná, provedeme posun a nové kolo
    if (jeToSpravne) {
        score++;
        updateScoreDisplay();
        currentLeftItem = currentRightItem;

        do {
            currentRightItem = getRandomItem();
        } while (currentLeftItem.id === currentRightItem.id);

        renderGame(currentLeftItem, currentRightItem);
    }else{
        alert(`Konec hry! Tvé konečné score je: ${score}`)
        score = 0;
        updateScoreDisplay();

        startNewGame();
    }

}

 buttonHigherElement.addEventListener('click', () => {
     checkAnswer('higher');
     console.log("Kliknuto na VÍCE");
 });

 buttonLowerElement.addEventListener('click', () => {
     checkAnswer('lower');
 });

 init();
