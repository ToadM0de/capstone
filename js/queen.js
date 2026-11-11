// Resources
export let food = 200;
export let workers = 200;
export let leaves = 200;

// Egg related variables
let eggCost = 5;
let hatchTime = 5;
let eggHatchTimes = {
  egg1: 0,
  egg2: 0,
  egg3: 0,
};

let hoveredEgg = null;
let nest2Unlocked = false;
let nest3Unlocked = false;

let eggSlots = {
  egg1: false,
  egg2: false,
  egg3: false,
};

// HTML elements
const foodCount = document.getElementById("foodCount");
const workerCount = document.getElementById("workerCount");
const leafCount = document.getElementById("leafCount");
const eggCostDisplay = document.getElementById("eggCost");
const eggMessage = document.getElementById("eggMessage");
const produceEggBtn = document.getElementById("produceEgg");
const nest2 = document.getElementById("nest2");
const nest3 = document.getElementById("nest3");
const eggTimer = document.getElementById("eggTimer");
const eggTimerText = document.getElementById("eggTimerText");
const hatchMessage = document.getElementById("hatchMessage");
const egg1 = document.getElementById("egg1");
const egg2 = document.getElementById("egg2");
const egg3 = document.getElementById("egg3");
const upgradeNest2Btn = document.getElementById("upgradeNest2");
const upgradeNest3Btn = document.getElementById("upgradeNest3");
const nest2Hover = document.querySelector(".nest2Hover");
const nest3Hover = document.querySelector(".nest3Hover");

// Allows other JS files to spend leaves
export function spendLeaves(amount) {
  if (leaves < amount) {
    return false;
  }

  leaves -= amount;
  updateResources();

  return true;
}

// Allows other JS files to add food
export function addFood(amount) {
  food += amount;
  updateResources();
}

// Allows other JS files to spend workers
export function spendWorkers(amount) {
  if (workers < amount) {
    return false;
  }

  workers -= amount;
  updateResources();

  return true;
}

// Updates resources
export function updateResources() {
  foodCount.textContent = food;
  workerCount.textContent = workers;
  leafCount.textContent = leaves;

  eggCostDisplay.textContent = eggCost;

  updateBtns();
}

// Makes btns disabled if theres not enough food to upgrade nests
function updateBtns() {
  produceEggBtn.disabled = false;

  upgradeNest2Btn.disabled = food < 10;
  upgradeNest3Btn.disabled = food < 20;
}

// Looks to see if nests are empty in order
function getAvailableEgg() {
  if (!eggSlots.egg1) {
    return "egg1";
  }

  if (nest2Unlocked && !eggSlots.egg2) {
    return "egg2";
  }

  if (nest2Unlocked && nest3Unlocked && !eggSlots.egg3) {
    return "egg3";
  }

  return null;
}

let hoveredEggTarget = null;
let eggTimerInterval = null;

// Shows popup when hovering over an egg, updates timer every second
function showEggTimer(eggId, target) {
  if (!eggSlots[eggId]) {
    return;
  }

  hoveredEgg = eggId;
  hoveredEggTarget = target;

  eggTimer.style.display = "block";

  updateEggTimer();

  clearInterval(eggTimerInterval);

  eggTimerInterval = setInterval(function () {
    updateEggTimer();
  }, 1000);
}

// Hides popup when not hovering over an egg, stops updating timer
function hideEggTimer(eggId) {
  if (hoveredEgg === eggId) {
    hoveredEgg = null;
    hoveredEggTarget = null;
    eggTimer.style.display = "none";

    clearInterval(eggTimerInterval);
  }
}

// Calculates how many seconds until egg hatches, positions popup, updates text
function updateEggTimer() {
  if (hoveredEgg === null || hoveredEggTarget === null) {
    return;
  }

  if (!eggSlots[hoveredEgg]) {
    hideEggTimer(hoveredEgg);
    return;
  }

  // Calculates time remaining
  let timeLeft = eggHatchTimes[hoveredEgg] - Date.now();
  // Converts milliseconds to seconds, rounds up, ensures it doesn't go below 0
  let secondsLeft = Math.max(0, Math.ceil(timeLeft / 1000));

  eggTimerText.textContent = "Hatches in: " + secondsLeft + " seconds";

  let position = hoveredEggTarget.getBoundingClientRect();
  //   Calculates where the popup should be
  let popupLeft = position.left + position.width / 2;
  let popupTop = position.top - 10;

  //   Keeps popup from going outside of the browser
  popupLeft = Math.max(
    eggTimer.offsetWidth / 2 + 5,
    Math.min(popupLeft, window.innerWidth - eggTimer.offsetWidth / 2 - 5),
  );

  if (popupTop - eggTimer.offsetHeight < 5) {
    popupTop = position.bottom + eggTimer.offsetHeight + 10;
  }

  eggTimer.style.left = popupLeft + "px";
  eggTimer.style.top = popupTop + "px";

  eggTimer.style.transform = "translate(-50%, -100%)";
}

// Makes it where popup appears when hovering over an egg and disapears when not hovering
document.querySelectorAll(".eggArea").forEach(function (area) {
  let eggId = area.getAttribute("egg");

  area.addEventListener("mouseenter", function () {
    showEggTimer(eggId, area);
  });

  area.addEventListener("mouseleave", function () {
    hideEggTimer(eggId);
  });
});

window.addEventListener("resize", updateEggTimer);
window.addEventListener("scroll", updateEggTimer);

let hatchMessageTimeout;

// Shows hatch message for 2 seconds
function showHatchMessage() {
  hatchMessage.style.display = "block";

  clearTimeout(hatchMessageTimeout);

  hatchMessageTimeout = setTimeout(function () {
    hatchMessage.style.display = "none";
  }, 2000);
}

// Prevent egg from being produced if all nests are full or if there isnt enough food, produces egg and starts timer if else
produceEggBtn.addEventListener("click", function () {
  produceEggBtn.blur();
  let availableEgg = getAvailableEgg();

  if (availableEgg === null) {
    eggMessage.textContent = "All nests are full. Try again later.";
    return;
  }

  if (food < eggCost) {
    eggMessage.textContent = "Not enough food to produce an egg";
    return;
  }

  eggMessage.textContent = "";
  food -= eggCost;

  eggSlots[availableEgg] = true;

  let eggImg = document.getElementById(availableEgg);
  eggImg.classList.remove("hidden");

  let currentHatchTime = hatchTime;
  // How long an egg takes to hatch
  eggHatchTimes[availableEgg] = Date.now() + currentHatchTime * 1000;

  eggCost += 2;
  hatchTime += 5;

  updateResources();

  eggMessage.textContent = "Egg produced";

  //When egg hatches, remove egg, reset timer, add worker, update resources, show notification, hide timer if egg was being hovered over
  setTimeout(function () {
    eggImg.classList.add("hidden");

    eggHatchTimes[availableEgg] = 0;

    eggSlots[availableEgg] = false;

    workers++;

    updateResources();

    if (eggMessage.textContent.includes("All nests are full")) {
      eggMessage.textContent = "";
    }

    showHatchMessage();

    if (hoveredEgg === availableEgg) {
      hideEggTimer(availableEgg);
    }
  }, currentHatchTime * 1000);
});

// If there is 10 food, unlock and show nest 2, hide nest 2 hover, show nest 3 hover, update removed resources
upgradeNest2Btn.addEventListener("click", function () {
  if (food < 10) {
    return;
  }

  food -= 10;

  nest2Unlocked = true;

  nest2.classList.remove("hidden");

  nest2Hover.classList.add("hidden");

  nest3Hover.classList.remove("hidden");

  updateResources();
});

// Same as nest 2 upgrade but for nest 3, requires 20 food to unlock
upgradeNest3Btn.addEventListener("click", function () {
  if (food < 20) {
    return;
  }

  food -= 20;

  nest3Unlocked = true;

  nest3.classList.remove("hidden");

  nest3Hover.classList.add("hidden");

  updateResources();
});

nest3Hover.classList.add("hidden");

updateResources();
