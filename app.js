const DEFICIT_PER_KG = 7700;
const todayIso = new Date().toISOString().slice(0, 10);

if (new URLSearchParams(window.location.search).has("reset")) {
  localStorage.removeItem("deficitGlowState");
  window.history.replaceState({}, "", window.location.pathname);
}

const mockFoods = [
  {
    id: "food-chobani",
    name: "Greek Yogurt, Vanilla",
    brand: "Chobani",
    servingSize: "1 cup",
    calories: 140,
    protein: 12,
    carbs: 18,
    fat: 2,
    fiber: 0,
    sugar: 14,
    sodium: 65,
    barcode: "818290012345",
    source: "Open Food Facts"
  },
  {
    id: "food-starbucks",
    name: "Caffe Latte, Tall",
    brand: "Starbucks",
    servingSize: "12 fl oz",
    calories: 150,
    protein: 10,
    carbs: 15,
    fat: 6,
    fiber: 0,
    sugar: 14,
    sodium: 115,
    barcode: "762111000000",
    source: "USDA"
  },
  {
    id: "food-gnocchi",
    name: "Cauliflower Gnocchi",
    brand: "Trader Joe's",
    servingSize: "1 cup",
    calories: 140,
    protein: 2,
    carbs: 22,
    fat: 3,
    fiber: 6,
    sugar: 0,
    sodium: 460,
    barcode: "005432100001",
    source: "Open Food Facts"
  },
  {
    id: "food-quest",
    name: "Protein Bar, Chocolate Chip Cookie Dough",
    brand: "Quest",
    servingSize: "1 bar",
    calories: 190,
    protein: 21,
    carbs: 21,
    fat: 8,
    fiber: 13,
    sugar: 1,
    sodium: 210,
    barcode: "888849000001",
    source: "Open Food Facts"
  },
  {
    id: "food-eggs",
    name: "Eggs",
    brand: "Generic",
    servingSize: "2 large",
    calories: 140,
    protein: 12,
    carbs: 1,
    fat: 10,
    fiber: 0,
    sugar: 1,
    sodium: 140,
    barcode: "000000000140",
    source: "USDA"
  }
];

const nutrientOptions = [
  { key: "protein", label: "Protein", unit: "g", target: 110 },
  { key: "carbs", label: "Carbs", unit: "g", target: 180 },
  { key: "fat", label: "Fat", unit: "g", target: 55 },
  { key: "fiber", label: "Fiber", unit: "g", target: 28 },
  { key: "sugar", label: "Sugar", unit: "g", target: 45 },
  { key: "sodium", label: "Sodium", unit: "mg", target: 2300 }
];

const seedState = {
  route: "onboarding",
  selectedMeal: "Breakfast",
  user: {
    id: "user-demo",
    name: "Maya",
    unitSystem: "metric",
    age: 29,
    gender: "Female",
    height: 168,
    currentWeightKg: 68,
    goalWeightKg: 63,
    activityLevel: "Lightly active",
    dailyCalorieTarget: 1600,
    goalEventName: "Greece vacation",
    goalEventDate: "2026-06-29",
    goalImageUrl: "deficit-glow-vision.png",
    inspirationImageUrl: "deficit-glow-vision.png",
    createdAt: new Date().toISOString()
  },
  foods: [...mockFoods],
  foodLogs: [
    {
      id: "log-1",
      userId: "user-demo",
      foodItemId: "food-chobani",
      date: todayIso,
      mealType: "Breakfast",
      quantity: 1,
      calories: 140,
      createdAt: new Date().toISOString()
    },
    {
      id: "log-2",
      userId: "user-demo",
      foodItemId: "food-starbucks",
      date: todayIso,
      mealType: "Snacks",
      quantity: 1,
      calories: 150,
      createdAt: new Date().toISOString()
    }
  ],
  selectedNutrients: ["protein", "sodium", "fiber"],
  exerciseLogs: [
    {
      id: "ex-1",
      userId: "user-demo",
      date: todayIso,
      exerciseType: "Incline walk",
      durationMinutes: 35,
      caloriesBurned: 300,
      source: "manual",
      createdAt: new Date().toISOString()
    }
  ],
  cravingLogs: [],
  weeklyDeficits: [420, 620, 310, 550, 270, 680, 0],
  cravingRemaining: 600,
  cravingRunning: false
};

let state = loadState();
let timerId = null;

const app = document.querySelector("#app");

function loadState() {
  const saved = localStorage.getItem("deficitGlowState");
  if (!saved) return structuredClone(seedState);
  try {
    return { ...structuredClone(seedState), ...JSON.parse(saved) };
  } catch {
    return structuredClone(seedState);
  }
}

function saveState() {
  localStorage.setItem("deficitGlowState", JSON.stringify(state));
}

function money(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function kgToLb(kg) {
  return Number(kg || 0) * 2.20462;
}

function lbToKg(lb) {
  return Number(lb || 0) / 2.20462;
}

function cmToFeetInches(cm) {
  const totalInches = Math.round(Number(cm || 0) / 2.54);
  return {
    feet: Math.floor(totalInches / 12),
    inches: totalInches % 12
  };
}

function feetInchesToCm(feet, inches) {
  return (Number(feet || 0) * 12 + Number(inches || 0)) * 2.54;
}

function daysUntil(dateString) {
  const target = new Date(`${dateString}T12:00:00`);
  const now = new Date();
  return Math.max(1, Math.ceil((target - now) / 86400000));
}

function getFoodById(id) {
  return state.foods.find((food) => food.id === id);
}

function todayFoodLogs() {
  return state.foodLogs.filter((log) => log.date === todayIso);
}

function todayExerciseLogs() {
  return state.exerciseLogs.filter((log) => log.date === todayIso);
}

function caloriesEaten() {
  return todayFoodLogs().reduce((sum, log) => sum + Number(log.calories || 0), 0);
}

function nutrientTotals() {
  return todayFoodLogs().reduce((totals, log) => {
    const food = getFoodById(log.foodItemId) || {};
    const quantity = Number(log.quantity || 1);
    nutrientOptions.forEach(({ key }) => {
      totals[key] = (totals[key] || 0) + Number(food[key] || 0) * quantity;
    });
    return totals;
  }, {});
}

function exerciseCalories() {
  return todayExerciseLogs().reduce((sum, log) => sum + Number(log.caloriesBurned || 0), 0);
}

function dailyDeficit() {
  return Number(state.user.dailyCalorieTarget || 0) - caloriesEaten() + exerciseCalories();
}

function accumulatedDeficit() {
  const historic = state.weeklyDeficits.reduce((sum, value) => sum + Number(value || 0), 0);
  return historic + dailyDeficit();
}

function oneKgProgress() {
  return clamp((accumulatedDeficit() / DEFICIT_PER_KG) * 100, 0, 100);
}

function estimatedKgLost() {
  return accumulatedDeficit() / DEFICIT_PER_KG;
}

function currentWeekDeficits() {
  const week = [...state.weeklyDeficits];
  week[6] = dailyDeficit();
  return week;
}

function weeklyTotalDeficit() {
  return currentWeekDeficits().reduce((sum, value) => sum + Number(value || 0), 0);
}

function goalMath() {
  const kgToLose = Math.max(0, Number(state.user.currentWeightKg) - Number(state.user.goalWeightKg));
  const totalDeficit = kgToLose * DEFICIT_PER_KG;
  const days = daysUntil(state.user.goalEventDate);
  return {
    kgToLose,
    totalDeficit,
    days,
    suggestedDailyDeficit: totalDeficit / days
  };
}

function setRoute(route) {
  state.route = route;
  saveState();
  render();
}

function updateNav() {
  document.querySelectorAll(".nav-item").forEach((button) => {
    const route = button.dataset.route;
    button.classList.toggle("active", route === state.route);
    button.classList.toggle("hidden", state.route === "onboarding");
  });
}

function header(title, eyebrow = "Deficit Glow", action = "") {
  return `
    <header class="topline">
      <div>
        <p class="eyebrow">${eyebrow}</p>
        <h2>${title}</h2>
      </div>
      ${action}
    </header>
  `;
}

function render() {
  updateNav();
  clearInterval(timerId);
  timerId = null;
  const routes = {
    onboarding: renderOnboarding,
    home: renderHome,
    food: renderFood,
    search: renderSearch,
    barcode: renderBarcode,
    exercise: renderExercise,
    craving: renderCraving,
    progress: renderProgress,
    vision: renderVision
  };
  app.innerHTML = routes[state.route]();
  bindCurrentScreen();
  if (state.route === "craving" && state.cravingRunning) startCravingTimer();
}

function renderOnboarding() {
  const math = goalMath();
  const unitSystem = state.user.unitSystem || "metric";
  const usesUsUnits = unitSystem === "us";
  const heightParts = cmToFeetInches(state.user.height);
  const currentWeightValue = usesUsUnits ? kgToLb(state.user.currentWeightKg).toFixed(1) : Number(state.user.currentWeightKg).toFixed(1);
  const goalWeightValue = usesUsUnits ? kgToLb(state.user.goalWeightKg).toFixed(1) : Number(state.user.goalWeightKg).toFixed(1);
  return `
    <section class="hero">
      <div>
        <p class="eyebrow">Premium deficit tracking</p>
        <h1>Deficit Glow</h1>
        <p class="muted">See exactly how food and movement shift your progress toward each 1 kg milestone.</p>
      </div>
      <div class="hero-media">
        <img src="deficit-glow-vision.png" alt="Soft wellness still life" />
        <div class="hero-badge">
          <strong>${money(Math.round(math.suggestedDailyDeficit))} kcal</strong>
          <span class="muted">suggested daily deficit for your event timeline</span>
        </div>
      </div>
      <form id="onboardingForm" class="card glass form-grid">
        <label>Units<select id="unitSystemSelect" name="unitSystem">
          <option value="metric" ${unitSystem === "metric" ? "selected" : ""}>Metric (kg, cm)</option>
          <option value="us" ${unitSystem === "us" ? "selected" : ""}>US (lb, ft/in)</option>
        </select></label>
        <div class="grid-2">
          <label>Name<input name="name" value="${state.user.name}" required /></label>
          <label>Age<input name="age" type="number" min="13" value="${state.user.age}" required /></label>
        </div>
        <div class="grid-2">
          <label>Current ${usesUsUnits ? "lb" : "kg"}<input name="currentWeight" type="number" step="0.1" value="${currentWeightValue}" required /></label>
          <label>Goal ${usesUsUnits ? "lb" : "kg"}<input name="goalWeight" type="number" step="0.1" value="${goalWeightValue}" required /></label>
        </div>
        <div class="grid-2 ${usesUsUnits ? "hidden" : ""}">
          <label>Height cm<input name="heightCm" type="number" value="${Math.round(state.user.height)}" ${usesUsUnits ? "" : "required"} /></label>
          <span></span>
        </div>
        <div class="grid-2 ${usesUsUnits ? "" : "hidden"}">
          <label>Height ft<input name="heightFeet" type="number" min="1" value="${heightParts.feet}" ${usesUsUnits ? "required" : ""} /></label>
          <label>Height in<input name="heightInches" type="number" min="0" max="11" value="${heightParts.inches}" ${usesUsUnits ? "required" : ""} /></label>
        </div>
        <div class="grid-2">
          <label>Gender<select name="gender">
            ${["Female", "Male", "Non-binary", "Prefer not to say"].map((g) => `<option ${g === state.user.gender ? "selected" : ""}>${g}</option>`).join("")}
          </select></label>
          <label>Target daily calories<input name="dailyCalorieTarget" type="number" value="${state.user.dailyCalorieTarget}" required /></label>
        </div>
        <label>Activity level<select name="activityLevel">
          ${["Sedentary", "Lightly active", "Moderately active", "Very active"].map((level) => `<option ${level === state.user.activityLevel ? "selected" : ""}>${level}</option>`).join("")}
        </select></label>
        <div class="grid-2">
          <label>Goal event<input name="goalEventName" value="${state.user.goalEventName}" placeholder="Vacation, wedding, birthday" /></label>
          <label>Event date<input name="goalEventDate" type="date" value="${state.user.goalEventDate}" required /></label>
        </div>
        <label>Optional goal image<input id="goalImageInput" type="file" accept="image/*" /></label>
        <label>Optional inspiration image<input id="inspirationImageInput" type="file" accept="image/*" /></label>
        <div class="formula">
          Goal: ${math.kgToLose.toFixed(1)} kg x 7,700 = ${money(Math.round(math.totalDeficit))} kcal.
          ${math.days} days left, about ${money(Math.round(math.suggestedDailyDeficit))} kcal per day.
        </div>
        <p class="tiny muted">This app provides estimates only. Weight loss varies by body, metabolism, water retention, hormones, and consistency.</p>
        <button class="btn primary full" type="submit">Enter dashboard</button>
      </form>
    </section>
  `;
}

function renderHome() {
  const deficit = dailyDeficit();
  const progress = oneKgProgress();
  const accumulated = accumulatedDeficit();
  const week = currentWeekDeficits();
  const weeklyTotal = weeklyTotalDeficit();
  const maxWeekDeficit = Math.max(...week.map(Math.abs), 1);
  const totals = nutrientTotals();
  const selectedNutrients = state.selectedNutrients?.length ? state.selectedNutrients : ["protein", "sodium", "fiber"];
  const unitSystem = state.user.unitSystem || "metric";
  const weightUnit = unitSystem === "us" ? "lb" : "kg";
  const currentWeight = unitSystem === "us" ? kgToLb(state.user.currentWeightKg) : state.user.currentWeightKg;
  const goalWeight = unitSystem === "us" ? kgToLb(state.user.goalWeightKg) : state.user.goalWeightKg;
  const status = deficit >= 0
    ? "You are moving toward your goal."
    : "You are over target today. You can reset with your next choice.";
  return `
    ${header(`Hi, ${state.user.name}`, "Today")}
    <section class="card lux">
      <div class="row">
        <div>
          <p class="eyebrow">Today's Deficit</p>
          <h1>${money(deficit)} kcal</h1>
        </div>
        <button class="btn icon-only" data-route-jump="food" title="Quick add food">+</button>
      </div>
      <p class="muted">${status}</p>
      <div class="formula">Target ${money(state.user.dailyCalorieTarget)} - eaten ${money(caloriesEaten())} + exercise ${money(exerciseCalories())} = ${money(deficit)} kcal</div>
    </section>
    <section class="card glass">
      <div class="progress-wrap">
        <div class="ring" style="--angle: ${progress * 3.6}deg">
          <div class="ring-inner"><strong>${Math.round(progress)}%</strong><span class="tiny muted">of 1 kg</span></div>
        </div>
        <div>
          <h3>Next 7,700 kcal milestone</h3>
          <p class="muted">You are ${money(Math.round(accumulated))} kcal into your next 7,700 kcal.</p>
          <p><strong>Estimated fat-loss equivalent: ${estimatedKgLost().toFixed(2)} kg.</strong></p>
        </div>
      </div>
    </section>
    <section class="grid-2">
      ${metric("Calories eaten", `${money(caloriesEaten())} kcal`)}
      ${metric("Daily target", `${money(state.user.dailyCalorieTarget)} kcal`)}
      ${metric("Food deficit", `${money(state.user.dailyCalorieTarget - caloriesEaten())} kcal`)}
      ${metric("Exercise burned", `${money(exerciseCalories())} kcal`)}
    </section>
    <section class="card champagne">
      <div class="row">
        <div>
          <p class="eyebrow">Units</p>
          <h3>${unitSystem === "us" ? "US version" : "Metric version"}</h3>
          <p class="muted">${currentWeight.toFixed(1)} ${weightUnit} now -> ${goalWeight.toFixed(1)} ${weightUnit} goal</p>
        </div>
        <select id="homeUnitSelect" class="compact-select" aria-label="Units">
          <option value="metric" ${unitSystem === "metric" ? "selected" : ""}>kg/cm</option>
          <option value="us" ${unitSystem === "us" ? "selected" : ""}>lb/ft</option>
        </select>
      </div>
    </section>
    <section class="card glass">
      <div class="row">
        <div>
          <p class="eyebrow">Daily nutrients</p>
          <h2>Your chosen macros</h2>
        </div>
        <span class="tiny muted">from logged food</span>
      </div>
      <div class="nutrient-picker" aria-label="Choose daily nutrients">
        ${nutrientOptions.map((nutrient) => `
          <button class="chip ${selectedNutrients.includes(nutrient.key) ? "active" : ""}" data-nutrient-toggle="${nutrient.key}">
            ${nutrient.label}
          </button>
        `).join("")}
      </div>
      <div class="nutrient-grid">
        ${selectedNutrients.map((key) => {
          const nutrient = nutrientOptions.find((item) => item.key === key);
          if (!nutrient) return "";
          const value = totals[key] || 0;
          const percent = clamp((value / nutrient.target) * 100, 0, 100);
          return `
            <article class="nutrient-card">
              <div class="row">
                <span>${nutrient.label}</span>
                <strong>${money(Math.round(value))}${nutrient.unit}</strong>
              </div>
              <div class="bar slim"><span style="--w:${percent}%"></span></div>
              <small>${Math.round(percent)}% of ${money(nutrient.target)}${nutrient.unit} guide</small>
            </article>
          `;
        }).join("")}
      </div>
    </section>
    <section class="card glass">
      <div class="row">
        <div>
          <p class="eyebrow">Weekly deficit</p>
          <h2>${money(Math.round(weeklyTotal))} kcal</h2>
        </div>
        <span class="tiny muted">Mon-Sun</span>
      </div>
      <div class="mini-chart" aria-label="Weekly deficit from Monday to Sunday">
        ${["M", "T", "W", "T", "F", "S", "S"].map((day, index) => `
          <div class="mini-bar">
            <span class="${week[index] < 0 ? "surplus" : ""}" style="--h:${Math.max(8, (Math.abs(week[index]) / maxWeekDeficit) * 82)}px"></span>
            <small>${day}</small>
          </div>
        `).join("")}
      </div>
      <p class="tiny muted">This week equals ${(weeklyTotal / DEFICIT_PER_KG).toFixed(2)} kg of estimated progress using 7,700 kcal per kg.</p>
    </section>
    <section class="card champagne">
      <h3>Small choice, visible progress</h3>
      <p class="muted">${goalMath().days} days until ${state.user.goalEventName}. Your math is visible, but the tone stays gentle.</p>
      <div class="quick-actions">
        <button class="btn primary" data-route-jump="craving">I'm Craving Something</button>
        <button class="btn soft" data-route-jump="exercise">Add Exercise</button>
      </div>
    </section>
  `;
}

function metric(label, value) {
  return `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`;
}

function renderFood() {
  const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snacks"];
  return `
    ${header("Food Log", "Quick add", `<button class="btn icon-only" data-route-jump="search" title="Search branded food">S</button>`)}
    <section class="card glass">
      <div class="tabs">${mealTypes.map((meal) => `<button class="tab ${state.selectedMeal === meal ? "active" : ""}" data-meal="${meal}">${meal}</button>`).join("")}</div>
      <form id="quickFoodForm" class="form-grid">
        <label>Food name<input name="name" placeholder="Greek yogurt, salad, latte" required /></label>
        <div class="grid-2">
          <label>Calories<input name="calories" type="number" min="0" placeholder="220" required /></label>
          <label>Serving<input name="servingSize" placeholder="1 bowl" /></label>
        </div>
        <div class="grid-2">
          <label>Protein<input name="protein" type="number" min="0" value="0" /></label>
          <label>Carbs<input name="carbs" type="number" min="0" value="0" /></label>
        </div>
        <div class="grid-2">
          <label>Fat<input name="fat" type="number" min="0" value="0" /></label>
          <label>Fiber<input name="fiber" type="number" min="0" value="0" /></label>
        </div>
        <div class="grid-2">
          <label>Sugar<input name="sugar" type="number" min="0" value="0" /></label>
          <label>Sodium mg<input name="sodium" type="number" min="0" value="0" /></label>
        </div>
        <button class="btn primary full" type="submit">Add to ${state.selectedMeal}</button>
      </form>
    </section>
    <section class="quick-actions">
      <button class="btn soft" data-route-jump="search">Search branded food</button>
      <button class="btn soft" data-route-jump="barcode">Scan or enter barcode</button>
    </section>
    ${mealTypes.map(renderMealSection).join("")}
  `;
}

function renderMealSection(meal) {
  const logs = todayFoodLogs().filter((log) => log.mealType === meal);
  return `
    <h3 class="meal-heading">${meal}</h3>
    <div class="list">
      ${logs.length ? logs.map(renderFoodLog).join("") : `<div class="item muted">No ${meal.toLowerCase()} items yet.</div>`}
    </div>
  `;
}

function renderFoodLog(log) {
  const food = getFoodById(log.foodItemId) || {};
  return `
    <article class="item row">
      <div>
        <strong>${food.name || "Custom food"}</strong>
        <small>${food.brand || "User-created"} . ${food.servingSize || "serving"} . ${food.protein || 0}g protein</small>
      </div>
      <strong>${money(log.calories)} kcal</strong>
    </article>
  `;
}

function renderSearch() {
  return `
    ${header("Branded Food Search", "Mock database", `<button class="btn icon-only" data-route-jump="food" title="Back">B</button>`)}
    <section class="card glass form-grid">
      <label>Search<input id="foodSearch" value="" placeholder="Chobani Greek Yogurt, Starbucks latte" autofocus /></label>
      <p class="tiny muted">MVP mock data now. Later: Open Food Facts, USDA FoodData Central, Nutritionix, then private user-created foods.</p>
    </section>
    <section id="searchResults" class="list">${renderSearchResults("")}</section>
  `;
}

function renderSearchResults(query) {
  const q = query.toLowerCase();
  const results = state.foods.filter((food) => `${food.brand} ${food.name}`.toLowerCase().includes(q));
  return results.map((food) => `
    <article class="item">
      <div class="row">
        <div>
          <strong>${food.brand} ${food.name}</strong>
          <small>${food.servingSize} . ${food.calories} kcal . P${food.protein} C${food.carbs} F${food.fat} . ${food.source}</small>
        </div>
        <button class="btn" data-add-food="${food.id}">Add</button>
      </div>
    </article>
  `).join("") || `<div class="item">No result. Create it manually from Log Food.</div>`;
}

function renderBarcode() {
  return `
    ${header("Barcode Scanner", "Placeholder", `<button class="btn icon-only" data-route-jump="food" title="Back">B</button>`)}
    <section class="scanner card">
      <div>
        <div class="scanner-box"></div>
        <p class="muted">Camera scanning will connect later. Enter a barcode for the MVP lookup.</p>
      </div>
    </section>
    <section class="card glass form-grid">
      <label>Barcode<input id="barcodeInput" placeholder="Try 888849000001" /></label>
      <button class="btn primary full" id="barcodeLookup">Find product</button>
      <div id="barcodeResult" class="item muted">Product result will appear here.</div>
    </section>
  `;
}

function renderExercise() {
  return `
    ${header("Exercise", "Manual and synced", `<button class="btn icon-only" data-route-jump="home" title="Back">B</button>`)}
    <section class="card glass">
      <form id="exerciseForm" class="form-grid">
        <label>Exercise type<input name="exerciseType" placeholder="Pilates, walk, cycling" required /></label>
        <div class="grid-2">
          <label>Duration minutes<input name="durationMinutes" type="number" min="1" value="30" required /></label>
          <label>Calories burned<input name="caloriesBurned" type="number" min="0" value="180" required /></label>
        </div>
        <label>Source<select name="source">
          <option>manual</option>
          <option>Apple Health</option>
          <option>Google Fit</option>
          <option>Fitbit</option>
        </select></label>
        <button class="btn primary full" type="submit">Add exercise calories</button>
      </form>
    </section>
    <section class="card champagne">
      <h3>Synced exercise placeholder</h3>
      <p class="muted">Apple Health, Google Fit, and Fitbit can plug into this model later as source-specific ExerciseLog entries.</p>
    </section>
    <section class="list">${todayExerciseLogs().map((log) => `
      <article class="item row">
        <div><strong>${log.exerciseType}</strong><small>${log.durationMinutes} min . ${log.source}</small></div>
        <strong>+${money(log.caloriesBurned)} kcal</strong>
      </article>
    `).join("")}</section>
  `;
}

function renderCraving() {
  const minutes = String(Math.floor(state.cravingRemaining / 60)).padStart(2, "0");
  const seconds = String(state.cravingRemaining % 60).padStart(2, "0");
  const elapsed = 600 - state.cravingRemaining;
  const timerPct = clamp((elapsed / 600) * 100, 0, 100);
  return `
    ${header("Craving Mode", "10-minute pause")}
    <section class="card lux">
      <div class="timer" style="--timer-angle: ${timerPct * 3.6}deg">
        <div class="timer-inner">
          <div><strong>${minutes}:${seconds}</strong><span class="tiny muted">counts as a win</span></div>
        </div>
      </div>
      <h2>Pause. This craving is temporary.</h2>
      <p class="muted">You don't need to be perfect. Just make the next choice intentional.</p>
      <div class="quick-actions">
        <button class="btn primary" id="toggleTimer">${state.cravingRunning ? "Pause timer" : "Start timer"}</button>
        <button class="btn soft" id="resetTimer">Reset 10 minutes</button>
      </div>
    </section>
    <section class="card glass">
      <div class="progress-wrap">
        <div class="vision-tile"><img src="${state.user.goalImageUrl}" alt="Goal reminder" /><span>${state.user.goalEventName}</span></div>
        <div>
          <h3>${goalMath().days} days left</h3>
          <p class="muted">You have completed ${Math.round(oneKgProgress())}% of your 1 kg deficit milestone.</p>
          <p><strong>Your future self is being built by small decisions.</strong></p>
        </div>
      </div>
    </section>
    <section class="grid-2">
      <button class="btn soft" data-craving-action="I waited 10 minutes">I waited 10 minutes</button>
      <button class="btn soft" data-route-jump="food">Log a planned snack</button>
      <button class="btn soft" data-craving-action="I still want it">I still want it</button>
      <button class="btn primary" data-craving-action="Craving passed">Craving passed</button>
    </section>
  `;
}

function renderVision() {
  return `
    ${header("Goal Vision Board", "Event energy")}
    <section class="card lux">
      <h2>${goalMath().days} days until ${state.user.goalEventName}.</h2>
      <p class="muted">You have completed ${Math.round(oneKgProgress())}% of your 1 kg deficit milestone.</p>
      <div class="bar"><span style="--w:${oneKgProgress()}%"></span></div>
    </section>
    <section class="vision-grid">
      ${visionTile(state.user.goalImageUrl, "Future-self inspiration")}
      ${visionTile(state.user.inspirationImageUrl, "Celebrity or body inspiration")}
      ${visionTile("deficit-glow-vision.png", "Dress, bikini, or event")}
      ${visionTile("deficit-glow-vision.png", "Vacation or celebration")}
    </section>
    <section class="card glass form-grid">
      <label>Update future-self image<input id="visionGoalUpload" type="file" accept="image/*" /></label>
      <label>Update inspiration image<input id="visionInspoUpload" type="file" accept="image/*" /></label>
      <p class="muted">Motivational note: waiting 10 minutes, logging honestly, and choosing intentionally all count.</p>
    </section>
  `;
}

function visionTile(src, label) {
  return `<div class="vision-tile"><img src="${src}" alt="${label}" /><span>${label}</span></div>`;
}

function renderProgress() {
  const week = currentWeekDeficits();
  const weeklyTotal = weeklyTotalDeficit();
  const max = Math.max(...week.map(Math.abs), 1);
  return `
    ${header("Weekly Progress", "Monday to Sunday")}
    <section class="card glass">
      <div class="grid-2">
        ${metric("Weekly total", `${money(Math.round(weeklyTotal))} kcal`)}
        ${metric("Estimated kg", `${(weeklyTotal / DEFICIT_PER_KG).toFixed(2)} kg`)}
      </div>
      <div class="chart">
        ${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => `
          <div class="bar-col">
            <div class="bar-line" style="--h:${Math.max(8, (Math.abs(week[index]) / max) * 164)}px"></div>
            <small>${day}</small>
          </div>
        `).join("")}
      </div>
    </section>
    <section class="card champagne">
      <h3>Formula</h3>
      <p class="muted">Weekly estimated kg = weekly deficit / 7,700. Daily deficit = target - eaten + exercise.</p>
    </section>
  `;
}

function bindCurrentScreen() {
  document.querySelectorAll("[data-route], [data-route-jump]").forEach((button) => {
    button.addEventListener("click", () => setRoute(button.dataset.route || button.dataset.routeJump));
  });

  document.querySelectorAll("[data-meal]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedMeal = button.dataset.meal;
      saveState();
      render();
    });
  });

  document.querySelectorAll("[data-nutrient-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.nutrientToggle;
      const selected = state.selectedNutrients?.length ? [...state.selectedNutrients] : ["protein", "sodium", "fiber"];
      state.selectedNutrients = selected.includes(key)
        ? selected.filter((item) => item !== key)
        : [...selected, key];
      if (state.selectedNutrients.length === 0) state.selectedNutrients = [key];
      saveState();
      render();
    });
  });

  document.querySelector("#unitSystemSelect")?.addEventListener("change", (event) => {
    state.user.unitSystem = event.target.value;
    saveState();
    render();
  });

  document.querySelector("#homeUnitSelect")?.addEventListener("change", (event) => {
    state.user.unitSystem = event.target.value;
    saveState();
    render();
  });

  document.querySelector("#onboardingForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const unitSystem = data.get("unitSystem") || state.user.unitSystem || "metric";
    const height = unitSystem === "us"
      ? feetInchesToCm(data.get("heightFeet"), data.get("heightInches"))
      : Number(data.get("heightCm"));
    const currentWeightKg = unitSystem === "us"
      ? lbToKg(data.get("currentWeight"))
      : Number(data.get("currentWeight"));
    const goalWeightKg = unitSystem === "us"
      ? lbToKg(data.get("goalWeight"))
      : Number(data.get("goalWeight"));
    state.user = {
      ...state.user,
      name: data.get("name"),
      unitSystem,
      age: Number(data.get("age")),
      gender: data.get("gender"),
      height,
      currentWeightKg,
      goalWeightKg,
      activityLevel: data.get("activityLevel"),
      dailyCalorieTarget: Number(data.get("dailyCalorieTarget")),
      goalEventName: data.get("goalEventName"),
      goalEventDate: data.get("goalEventDate")
    };
    state.route = "home";
    saveState();
    render();
  });

  bindImageInput("#goalImageInput", "goalImageUrl");
  bindImageInput("#inspirationImageInput", "inspirationImageUrl");
  bindImageInput("#visionGoalUpload", "goalImageUrl");
  bindImageInput("#visionInspoUpload", "inspirationImageUrl");

  document.querySelector("#quickFoodForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const food = {
      id: `food-${Date.now()}`,
      userId: state.user.id,
      name: data.get("name"),
      brand: "User-created",
      servingSize: data.get("servingSize") || "1 serving",
      calories: Number(data.get("calories")),
      protein: Number(data.get("protein")),
      carbs: Number(data.get("carbs")),
      fat: Number(data.get("fat")),
      fiber: Number(data.get("fiber")),
      sugar: Number(data.get("sugar")),
      sodium: Number(data.get("sodium")),
      barcode: "",
      source: "user-created",
      createdAt: new Date().toISOString()
    };
    state.foods.push(food);
    logFood(food.id, state.selectedMeal);
    render();
  });

  document.querySelector("#foodSearch")?.addEventListener("input", (event) => {
    document.querySelector("#searchResults").innerHTML = renderSearchResults(event.target.value);
    bindAddFoodButtons();
  });
  bindAddFoodButtons();

  document.querySelector("#barcodeLookup")?.addEventListener("click", () => {
    const value = document.querySelector("#barcodeInput").value.trim();
    const found = state.foods.find((food) => food.barcode === value);
    const result = document.querySelector("#barcodeResult");
    if (!found) {
      result.innerHTML = `<strong>Product not found.</strong><small>Add manually from the Food Log page.</small>`;
      return;
    }
    result.innerHTML = `
      <div class="row">
        <div><strong>${found.brand} ${found.name}</strong><small>${found.servingSize} . ${found.calories} kcal</small></div>
        <button class="btn" data-add-food="${found.id}">Add</button>
      </div>
    `;
    bindAddFoodButtons();
  });

  document.querySelector("#exerciseForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    state.exerciseLogs.push({
      id: `ex-${Date.now()}`,
      userId: state.user.id,
      date: todayIso,
      exerciseType: data.get("exerciseType"),
      durationMinutes: Number(data.get("durationMinutes")),
      caloriesBurned: Number(data.get("caloriesBurned")),
      source: data.get("source"),
      createdAt: new Date().toISOString()
    });
    saveState();
    render();
  });

  document.querySelector("#toggleTimer")?.addEventListener("click", () => {
    state.cravingRunning = !state.cravingRunning;
    saveState();
    render();
  });

  document.querySelector("#resetTimer")?.addEventListener("click", () => {
    state.cravingRemaining = 600;
    state.cravingRunning = false;
    saveState();
    render();
  });

  document.querySelectorAll("[data-craving-action]").forEach((button) => {
    button.addEventListener("click", () => {
      state.cravingLogs.push({
        id: `crave-${Date.now()}`,
        userId: state.user.id,
        date: todayIso,
        cravingType: "unspecified",
        actionTaken: button.dataset.cravingAction,
        timerCompleted: state.cravingRemaining === 0,
        notes: "",
        createdAt: new Date().toISOString()
      });
      if (button.dataset.cravingAction === "I waited 10 minutes") state.cravingRemaining = 0;
      state.cravingRunning = false;
      saveState();
      render();
    });
  });
}

function bindAddFoodButtons() {
  document.querySelectorAll("[data-add-food]").forEach((button) => {
    button.addEventListener("click", () => {
      logFood(button.dataset.addFood, state.selectedMeal || "Snacks");
      setRoute("food");
    });
  });
}

function bindImageInput(selector, key) {
  document.querySelector(selector)?.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      state.user[key] = reader.result;
      saveState();
      render();
    };
    reader.readAsDataURL(file);
  });
}

function logFood(foodId, mealType) {
  const food = getFoodById(foodId);
  if (!food) return;
  state.foodLogs.push({
    id: `log-${Date.now()}`,
    userId: state.user.id,
    foodItemId: food.id,
    date: todayIso,
    mealType,
    quantity: 1,
    calories: food.calories,
    createdAt: new Date().toISOString()
  });
  saveState();
}

function startCravingTimer() {
  timerId = setInterval(() => {
    if (!state.cravingRunning) return;
    state.cravingRemaining = Math.max(0, state.cravingRemaining - 1);
    if (state.cravingRemaining === 0) state.cravingRunning = false;
    saveState();
    render();
  }, 1000);
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  button.blur();
});

render();
