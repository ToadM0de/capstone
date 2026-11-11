import {
  workers,
  leaves,
  spendLeaves,
  addFood,
  spendWorkers,
  updateResources,
} from "./queen.js";

let unlockedPlots = 1;
let plotUpgradeCost = 10;
let plots = {
  1: null,
  2: null,
  3: null,
  4: null,
};

const crops = {
  grass: {
    name: "Grass",
    cost: 5,
    growTime: 0,
    food: 10,
    plotRequired: 1,
  },

  moss: {
    name: "Moss",
    cost: 10,
    growTime: 20,
    food: 20,
    plotRequired: 1,
  },

  clover: {
    name: "Clover",
    cost: 15,
    growTime: 30,
    food: 35,
    plotRequired: 2,
  },

  flower: {
    name: "Flower",
    cost: 20,
    growTime: 40,
    food: 50,
    plotRequired: 2,
  },

  mushroom: {
    name: "Mushroom",
    cost: 30,
    growTime: 60,
    food: 80,
    plotRequired: 3,
  },

  sappling: {
    name: "Sappling",
    cost: 40,
    growTime: 90,
    food: 120,
    plotRequired: 4,
  },
};

const plotAreas = document.querySelectorAll(".plotArea");
const plot2 = document.getElementById("plot2");
const plot3 = document.getElementById("plot3");
const plot4 = document.getElementById("plot4");
const crop1 = document.getElementById("crop1");
const crop2 = document.getElementById("crop2");
const crop3 = document.getElementById("crop3");
const crop4 = document.getElementById("crop4");
const unlockPlotArea = document.querySelector(".unlockPlotArea");
const unlockPlotPopup = unlockPlotArea.querySelector(".popup");
const unlockPlotBtn = document.getElementById("unlockPlotBtn");
const plotWorkerCost = document.getElementById("plotWorkerCost");
const plotUpgradeTitle = document.getElementById("plotUpgradeTitle");
const plotMessage = document.getElementById("plotMessage");
const farmTimer = document.getElementById("farmTimer");
const farmTimerText = document.getElementById("farmTimerText");
const cropPopup = document.createElement("div");

cropPopup.classList.add("popup", "farmPopup");

document.body.appendChild(cropPopup);

let popupCloseTimeout = null;

function keepCropPopupOpen() {
  clearTimeout(popupCloseTimeout);
}

function closeCropPopup() {
  clearTimeout(popupCloseTimeout);

  popupCloseTimeout = setTimeout(function () {
    if (!cropPopup.matches(":hover")) {
      cropPopup.style.display = "none";
    }
  }, 300);
}

// Checks what crops can be planted based off of plot upgrades
function getAvailableCrops() {
  return Object.entries(crops).filter(function ([key, crop]) {
    return crop.plotRequired <= unlockedPlots;
  });
}

function showPlantPopup(plotNumber, target) {
  if (plots[plotNumber] !== null) {
    return;
  }

  cropPopup.innerHTML = `
    <h3>Plant a Crop</h3>
    <div class="cropOptions"></div>
  `;

  const cropOptions = cropPopup.querySelector(".cropOptions");
  const availableCrops = getAvailableCrops();

  //Creates an html element of every crop
  availableCrops.forEach(function ([cropId, crop]) {
    const option = document.createElement("div");

    option.classList.add("cropOption");

    option.innerHTML = `
      <p>${crop.name}</p>
      <p>Leaf cost: ${crop.cost}</p>
      <p>Grow time: ${crop.growTime} seconds</p>
      <button type="button">Plant</button>
    `;

    const button = option.querySelector("button");

    button.disabled = leaves < crop.cost;

    button.addEventListener("click", function () {
      plantCrop(plotNumber, cropId);
    });

    cropOptions.appendChild(option);
  });

  positionPopup(cropPopup, target);

  cropPopup.style.display = "block";
}

function plantCrop(plotNumber, cropId) {
  const crop = crops[cropId];

  //   Checks if theres enough leaves to spend
  if (!spendLeaves(crop.cost)) {
    return;
  }

  //   Saves crop info
  plots[plotNumber] = {
    cropId: cropId,
    plantedAt: Date.now(),
    readyAt: Date.now() + crop.growTime * 1000,
    grown: false,
  };

  const cropImg = document.getElementById("crop" + plotNumber);
  cropImg.classList.add("hidden");

  cropPopup.style.display = "none";

  const currentCrop = plots[plotNumber];

  //   Waits on crop to finish growing before running
  setTimeout(function () {
    if (plots[plotNumber] !== currentCrop) {
      return;
    }

    currentCrop.grown = true;

    showGrownCrop(plotNumber);
    hideFarmTimer(plotNumber);

    clearTimeout(popupCloseTimeout);
    cropPopup.style.display = "none";
  }, crop.growTime * 1000);
}

//Shows crop img depending on what plot area the crop is growing in
function showGrownCrop(plotNumber) {
  const cropImg = document.getElementById(`crop${plotNumber}`);

  if (cropImg) {
    cropImg.classList.remove("hidden");
  }
}

// Handles harvest popup after crop is done growing
function showHarvestPopup(plotNumber, target) {
  const currentCrop = plots[plotNumber];

  if (!currentCrop || !currentCrop.grown) {
    return;
  }

  const crop = crops[currentCrop.cropId];

  cropPopup.innerHTML = `
    <h3>${crop.name}</h3>

    <p>Food gained: ${crop.food}</p>

    <button type="button" id="harvestCropBtn">
      Harvest
    </button>
  `;

  const harvestBtn = cropPopup.querySelector("#harvestCropBtn");

  harvestBtn.addEventListener("click", function () {
    harvestCrop(plotNumber);
  });

  positionPopup(cropPopup, target);

  cropPopup.style.display = "block";
}

// What happens when clicking the harvest button
function harvestCrop(plotNumber) {
  const currentCrop = plots[plotNumber];

  if (!currentCrop || !currentCrop.grown) {
    return;
  }

  const crop = crops[currentCrop.cropId];

  addFood(crop.food);

  const cropElement = document.getElementById("crop" + plotNumber);

  cropElement.classList.add("hidden");

  plots[plotNumber] = null;

  cropPopup.style.display = "none";
}

// Positions the popup and makes sure it doesnt leave the browser
function positionPopup(popup, target) {
  const position = target.getBoundingClientRect();

  popup.style.display = "block";
  popup.style.visibility = "visible";
  popup.style.opacity = "1";
  popup.style.pointerEvents = "auto";

  let popupLeft = position.left + position.width / 2;
  let popupTop = position.top;

  popupLeft = Math.max(
    popup.offsetWidth / 2 + 5,
    Math.min(popupLeft, window.innerWidth - popup.offsetWidth / 2 - 5),
  );

  if (popupTop - popup.offsetHeight < 5) {
    popupTop = position.bottom + 5;
    popup.style.transform = "translate(-50%, 0)";
  } else {
    popup.style.transform = "translate(-50%, -100%)";
  }

  popup.style.left = popupLeft + "px";
  popup.style.top = popupTop + "px";
}

// Doesnt close crop popup until mouse leaves the popup
cropPopup.addEventListener("mouseenter", function () {
  keepCropPopupOpen();
});

cropPopup.addEventListener("mouseleave", function () {
  closeCropPopup();
});

// Controls what happens when a mouse hovers over a plot depending on what state its in
plotAreas.forEach(function (area) {
  const plotId = area.getAttribute("plot");

  const plotNumber = Number(plotId.replace("plot", ""));

  area.addEventListener("mouseenter", function () {
    if (plotNumber > unlockedPlots) {
      return;
    }

    keepCropPopupOpen();

    // If empty, show crop popup
    if (plots[plotNumber] === null) {
      showPlantPopup(plotNumber, area);
    }
    // If crop is grown, show harvest popup
    else if (plots[plotNumber].grown) {
      showHarvestPopup(plotNumber, area);
    }
    // If crop is growing, show timer
    else {
      showFarmTimer(plotNumber, area);
    }
  });

  //   Prevents popups from going away when the mouse is hovering over them
  area.addEventListener("mouseleave", function () {
    hideFarmTimer(plotNumber);

    closeCropPopup();
  });
});

let hoveredGrowingPlot = null;
let farmTimerInterval = null;

// Handles timer
function showFarmTimer(plotNumber, target) {
  // Grabs the crop thats growing
  const currentCrop = plots[plotNumber];

  //   Checks if crop is growing
  if (!currentCrop || currentCrop.grown) {
    return;
  }

  hoveredGrowingPlot = plotNumber;

  farmTimer.style.display = "block";

  updateFarmTimer(target);

  clearInterval(farmTimerInterval);

  farmTimerInterval = setInterval(function () {
    updateFarmTimer(target);
  }, 1000);
}

// Hides timer once finished
function hideFarmTimer(plotNumber) {
  if (hoveredGrowingPlot === plotNumber) {
    hoveredGrowingPlot = null;

    farmTimer.style.display = "none";

    clearInterval(farmTimerInterval);
  }
}

// Updates timer
function updateFarmTimer(target) {
  if (hoveredGrowingPlot === null) {
    return;
  }

  const currentCrop = plots[hoveredGrowingPlot];

  //   Checks if crop exists and is finished growing
  if (!currentCrop || currentCrop.grown) {
    hideFarmTimer(hoveredGrowingPlot);
    return;
  }

  const timeLeft = currentCrop.readyAt - Date.now();
  const secondsLeft = Math.max(0, Math.ceil(timeLeft / 1000));

  farmTimerText.textContent = "Growing: " + secondsLeft + " seconds";

  positionPopup(farmTimer, target);
}

// Handles plot upgrades, makes sure popup doesnt show up after all upgrades are bought
function updatePlotUpgrade() {
  plotUpgradeTitle.textContent = "Unlock Plot " + (unlockedPlots + 1);

  plotWorkerCost.textContent = plotUpgradeCost;

  unlockPlotBtn.disabled = workers < plotUpgradeCost;

  if (unlockedPlots >= 4) {
    unlockPlotArea.classList.add("hidden");
  }
}

// Handles unlocking plots
unlockPlotBtn.addEventListener("click", function () {
  unlockPlotBtn.blur();

  //   Are all the plots unlocked?
  if (unlockedPlots >= 4) {
    return;
  }
  // Are there enough workers?
  if (!spendWorkers(plotUpgradeCost)) {
    plotMessage.textContent = "Not enough workers";
    return;
  }
  unlockedPlots++;

  //   Unhides the new plot depending on what is already unlocked
  if (unlockedPlots === 2) {
    plot2.classList.remove("hidden");
  } else if (unlockedPlots === 3) {
    plot3.classList.remove("hidden");
  } else if (unlockedPlots === 4) {
    plot4.classList.remove("hidden");
  }

  const newPlot = document.querySelector(
    `.plotArea[plot="plot${unlockedPlots}"]`,
  );

  //   Removes locked class from unlocked plot
  if (newPlot) {
    newPlot.classList.remove("locked");
  }
  plotUpgradeCost += 10;

  plotMessage.textContent = "";
  unlockPlotPopup.classList.add("upgrade-hidden");

  updatePlotUpgrade();
});

unlockPlotArea.addEventListener("mouseleave", function () {
  unlockPlotPopup.classList.remove("upgrade-hidden");
});

// Checks what plots are locked and unlocked
plotAreas.forEach(function (area) {
  const plotId = area.getAttribute("plot");
  const plotNumber = Number(plotId.replace("plot", ""));

  if (plotNumber > unlockedPlots) {
    area.classList.add("locked");
  }
});

updatePlotUpgrade();
updateResources();
