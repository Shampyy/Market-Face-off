// src/main.js

console.log("Hra se načítá...");

// 1. Výběr prvků z HTML (DOM Selector)
const countElement = document.getElementById("count");

const leftNameElement = document.getElementById('left_name');
const leftImageElement = document.getElementById('left_image');
const leftMarketCapElement = document.getElementById('left_marketCap');

const rightNameElement = document.getElementById('right_name');
const rightImageElement = document.getElementById('right_image');
const buttonHigherElement = document.getElementById('button_higher');
const buttonLowerElement = document.getElementById('button_lower');


function renderGame(itemLeft, itemRight) {
    leftNameElement.textContent = itemLeft.name;
    leftImageElement.src = itemLeft.image;
    leftMarketCapElement.textContent = itemLeft.price

    rightNameElement.textContent = itemRight.name;
    rightImageElement.src = itemRight.image;
}

// Testovací volání (jen abychom viděli, že to funguje)
renderGame(
    { name: "Test Apple", price: 3000, image: "https://financialmodelingprep.com/image-stock/AAPL.png" },
    { name: "Test Tesla", price: 800, image: "https://financialmodelingprep.com/image-stock/TSLA.png" }
);
