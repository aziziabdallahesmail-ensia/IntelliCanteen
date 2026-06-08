/* ==========================================================
   IntelliCanteen Forecast Studio - Frontend Controller
   Implements layout logic, translations, dynamic Chart.js,
   number animations, and full interactive bindings.
   ========================================================== */

// Element selectors
const form = document.getElementById("predict-form");
const statusEl = document.getElementById("status");
const predictBtn = document.getElementById("predict-btn");
const predictBtnText = document.getElementById("predict-btn-text");
const resultBreakfast = document.getElementById("result-breakfast");
const resultLaunch = document.getElementById("result-launch");
const resultDinner = document.getElementById("result-dinner");
const rawOutput = document.getElementById("raw-output");
const restoList = document.getElementById("resto-list");
const douList = document.getElementById("dou-list");
const restoInput = document.getElementById("resto-name");
const douInput = document.getElementById("dou-code");
const forecastDateInput = document.getElementById("forecast-date");

// Stats Overview Elements
const statBreakfast = document.getElementById("stat-breakfast");
const statLunch = document.getElementById("stat-lunch");
const statDinner = document.getElementById("stat-dinner");
const statResto = document.getElementById("stat-resto");

// Mobile Navigation Elements
const hamburgerBtn = document.getElementById("hamburger-btn");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("sidebar-overlay");

// Demand Warning Elements
const demandWarning = document.getElementById("demand-warning");
const demandWarningText = document.getElementById("demand-warning-text");

// Category and Lag display elements
const categoryInputs = document.querySelectorAll("[data-group='category']");
const lagDisplays = document.querySelectorAll("[data-group='lag']");

// State
let currentLang = localStorage.getItem("intellicanteen_lang") || "en";
let forecastChart = null;
let demandEvolutionChart = null;
let currentLags = {};
let demandFetchTimer = null;

// Categories list in exact ordering
const CATEGORIES = [
  "Bread & Bakery",
  "Rice & Pasta",
  "Legumes",
  "Poultry",
  "Red Meat",
  "Fish & Seafood",
  "Eggs",
  "Dairy & Cheese",
  "Vegetables & Salads",
  "Soups & Broths",
  "Cooked Dishes & Stews",
  "Potato Dishes",
  "Fruits",
  "Sweets & Desserts",
  "Beverages",
  "Condiments & Spreads"
];

// Sample payload for filling
const samplePayload = {
  date: "2024-02-02",
  resto_name: "ANON_0035909ef97c",
  dou_code: 301,
  categories: {
    "Bread & Bakery": 1,
    "Rice & Pasta": 1,
    Legumes: 0,
    Poultry: 1,
    "Red Meat": 0,
    "Fish & Seafood": 0,
    Eggs: 1,
    "Dairy & Cheese": 1,
    "Vegetables & Salads": 1,
    "Soups & Broths": 0,
    "Cooked Dishes & Stews": 0,
    "Potato Dishes": 0,
    Fruits: 1,
    "Sweets & Desserts": 0,
    Beverages: 1,
    "Condiments & Spreads": 0
  }
};

// Unified Translations Dictionary
const translations = {
  en: {
    app_title: "IntelliCanteen Forecast Studio",
    sidebar_title: "IntelliCanteen",
    sidebar_subtitle: "MESRS Algerian University Portal",
    nav_dashboard: "Dashboard",
    nav_forecast: "Forecast Studio",
    nav_analytics: "Analytics",
    sidebar_footer_text: "IntelliCanteen Model v1.0.0",
    topbar_title: "IntelliCanteen Forecast Studio",
    stat_breakfast: "Breakfast Forecast",
    stat_lunch: "Lunch Forecast",
    stat_dinner: "Dinner Forecast",
    stat_resto: "Active Canteen",
    form_title: "Parameters Studio",
    sec_resto: "Restaurant & Date",
    lbl_resto_name: "Restaurant name",
    hint_resto: "Start typing to see known restaurants.",
    lbl_dou_code: "Dou code",
    lbl_date: "Forecast date",
    hint_weekend: "Weekend logic matches training: Friday and Saturday are treated as weekend.",
    sec_categories: "Menu Category Mix",
    btn_reset_categories: "Set all to 0",
    sec_demand: "Recent Demand (Actual Counts)",
    lag_breakfast: "Breakfast",
    lag_lunch: "Lunch",
    lag_dinner: "Dinner",
    lag_last_day: "Last day",
    lag_last_week: "Last week",
    lag_avg: "Average previous",
    btn_fill_sample: "Fill sample",
    btn_predict: "Predict demand",
    btn_predicting: "Predicting...",
    results_title: "Forecast Results",
    results_hint: "Counts are shown on the original scale.",
    res_breakfast: "Breakfast",
    res_lunch: "Lunch",
    res_dinner: "Dinner",
    res_meals: "meals",
    raw_summary: "View log-scale output",
    raw_waiting: "Awaiting prediction...",
    chart_demand_evolution: "Demand Evolution",
    err_fill_fields: "Please fill restaurant name, dou code, and date.",
    msg_ready: "Prediction ready.",
    msg_restos_fail: "Could not load restaurant list",

    // Categories
    cat_bread: "Bread & Bakery",
    cat_rice: "Rice & Pasta",
    cat_legumes: "Legumes",
    cat_poultry: "Poultry",
    cat_red_meat: "Red Meat",
    cat_fish: "Fish & Seafood",
    cat_eggs: "Eggs",
    cat_dairy: "Dairy & Cheese",
    cat_vegetables: "Vegetables & Salads",
    cat_soups: "Soups & Broths",
    cat_cooked: "Cooked Dishes & Stews",
    cat_potato: "Potato Dishes",
    cat_fruits: "Fruits",
    cat_sweets: "Sweets & Desserts",
    cat_beverages: "Beverages",
    cat_condiments: "Condiments & Spreads",
    meta_year: "Year",
    meta_month: "Month",
    meta_weekend: "Weekend",
    meta_start: "Month Start",
    meta_end: "Month End",
    meta_yes: "Yes",
    meta_no: "No",
    meta_sin_cos: "Sine/Cosine Features"
  },
  fr: {
    app_title: "Studio de Prévision IntelliCanteen",
    sidebar_title: "IntelliCanteen",
    sidebar_subtitle: "MESRS Portail Universitaire Algérien",
    nav_dashboard: "Tableau de bord",
    nav_forecast: "Studio de Prévision",
    nav_analytics: "Analyses",
    sidebar_footer_text: "Modèle IntelliCanteen v1.0.0",
    topbar_title: "Studio de Prévision IntelliCanteen",
    stat_breakfast: "Prévision Petit-déjeuner",
    stat_lunch: "Prévision Déjeuner",
    stat_dinner: "Prévision Dîner",
    stat_resto: "Cantine Active",
    form_title: "Studio de Paramètres",
    sec_resto: "Restaurant & Date",
    lbl_resto_name: "Nom du restaurant",
    hint_resto: "Saisissez pour voir les restaurants connus.",
    lbl_dou_code: "Code DOU",
    lbl_date: "Date de prévision",
    hint_weekend: "La logique correspond : le vendredi et le samedi sont traités comme week-end.",
    sec_categories: "Mix de Catégories du Menu",
    btn_reset_categories: "Mettre tout à 0",
    sec_demand: "Demande Récente (Chiffres Réels)",
    lag_breakfast: "Petit-déjeuner",
    lag_lunch: "Déjeuner",
    lag_dinner: "Dîner",
    lag_last_day: "Dernier jour",
    lag_last_week: "Semaine dernière",
    lag_avg: "Moyenne précédente",
    btn_fill_sample: "Remplir un exemple",
    btn_predict: "Prédire la demande",
    btn_predicting: "Prévision en cours...",
    results_title: "Résultats des Prévisions",
    results_hint: "Les comptes sont affichés à l'échelle d'origine.",
    res_breakfast: "Petit-déjeuner",
    res_lunch: "Déjeuner",
    res_dinner: "Dîner",
    res_meals: "repas",
    raw_summary: "Afficher la sortie log",
    raw_waiting: "En attente de prévision...",
    chart_demand_evolution: "Évolution de la Demande",
    err_fill_fields: "Veuillez remplir le nom du restaurant, le code DOU et la date.",
    msg_ready: "Prévision prête.",
    msg_restos_fail: "Impossible de charger la liste des restaurants",

    // Categories
    cat_bread: "Pain & Boulangerie",
    cat_rice: "Riz & Pâtes",
    cat_legumes: "Légumineuses",
    cat_poultry: "Volaille",
    cat_red_meat: "Viande Rouge",
    cat_fish: "Poisson & Fruits de mer",
    cat_eggs: "Œufs",
    cat_dairy: "Produits Laitiers & Fromage",
    cat_vegetables: "Légumes & Salades",
    cat_soups: "Soupes & Bouillons",
    cat_cooked: "Plats Cuisinés & Ragoûts",
    cat_potato: "Plats de Pommes de terre",
    cat_fruits: "Fruits",
    cat_sweets: "Sucreries & Desserts",
    cat_beverages: "Boissons",
    cat_condiments: "Condiments & Tartinades",
    meta_year: "Année",
    meta_month: "Mois",
    meta_weekend: "Week-end",
    meta_start: "Début de mois",
    meta_end: "Fin de mois",
    meta_yes: "Oui",
    meta_no: "Non",
    meta_sin_cos: "Fonctions Sinus/Cosinus"
  },
  ar: {
    app_title: "إنتيلي كانتين - استوديو التوقعات",
    sidebar_title: "إنتيلي كانتين",
    sidebar_subtitle: "MESRS البوابة الجامعية الجزائرية",
    nav_dashboard: "لوحة التحكم",
    nav_forecast: "استوديو التوقعات",
    nav_analytics: "التحليلات",
    sidebar_footer_text: "نموذج إنتيلي كانتين v1.0.0",
    topbar_title: "إنتيلي كانتين - استوديو توقعات الوجبات",
    stat_breakfast: "توقعات الإفطار",
    stat_lunch: "توقعات الغداء",
    stat_dinner: "توقعات العشاء",
    stat_resto: "المطعم النشط",
    form_title: "استوديو المعلمات",
    sec_resto: "المطعم والتاريخ",
    lbl_resto_name: "اسم المطعم",
    hint_resto: "ابدأ الكتابة لمشاهدة المطاعم المعروفة.",
    lbl_dou_code: "رمز مديرية DOU",
    lbl_date: "تاريخ التوقعات",
    hint_weekend: "منطق عطلة نهاية الأسبوع يطابق التدريب: يعتبر الجمعة والسبت عطلة.",
    sec_categories: "مزيج فئات القائمة",
    btn_reset_categories: "تعيين الكل إلى 0",
    sec_demand: "الطلب الأخير (الأعداد الفعلية)",
    lag_breakfast: "الإفطار",
    lag_lunch: "الغداء",
    lag_dinner: "العشاء",
    lag_last_day: "اليوم السابق",
    lag_last_week: "الأسبوع السابق",
    lag_avg: "المعدل السابق",
    btn_fill_sample: "ملء عينة",
    btn_predict: "توقع الطلب",
    btn_predicting: "جاري التوقع...",
    results_title: "نتائج التوقعات",
    results_hint: "تظهر الأعداد على المقياس الأصلي الطبيعي.",
    res_breakfast: "الإفطار",
    res_lunch: "الغداء",
    res_dinner: "العشاء",
    res_meals: "وجبات",
    raw_summary: "عرض مخرجات المقياس اللوغاريتمي",
    raw_waiting: "في انتظار التوقعات...",
    chart_demand_evolution: "تطور الطلب",
    err_fill_fields: "يرجى ملء اسم المطعم، رمز DOU، والتاريخ.",
    msg_ready: "التوقع جاهز.",
    msg_restos_fail: "فشل تحميل قائمة المطاعم",

    // Categories
    cat_bread: "الخبز والمخبوزات",
    cat_rice: "الأرز والمعكرونة",
    cat_legumes: "البقوليات",
    cat_poultry: "الدواجن",
    cat_red_meat: "اللحوم الحمراء",
    cat_fish: "الأسماك والمأكولات البحرية",
    cat_eggs: "البيض",
    cat_dairy: "الألبان والأجبان",
    cat_vegetables: "الخضروات والسلطات",
    cat_soups: "الحساء والمرق",
    cat_cooked: "الأطباق المطبوخة واليخنات",
    cat_potato: "أطباق البطاطس",
    cat_fruits: "الفواكه",
    cat_sweets: "الحلويات والتحلية",
    cat_beverages: "المشروبات",
    cat_condiments: "التوابل والدهون",
    meta_year: "السنة",
    meta_month: "الشهر",
    meta_weekend: "عطلة نهاية الأسبوع",
    meta_start: "بداية الشهر",
    meta_end: "نهاية الشهر",
    meta_yes: "نعم",
    meta_no: "لا",
    meta_sin_cos: "ميزات الجيب وجيب التمام (Sin/Cos)"
  }
};

/* ==========================================================
   Interactive Layout - Collapsible Parameter Sections
   ========================================================== */
function setupCollapsibleSections() {
  const headers = document.querySelectorAll(".form-section__header");
  headers.forEach((header) => {
    header.addEventListener("click", () => {
      // Find toggle inside the header, ignoring other buttons (like the reset button in categories)
      const toggle = header.querySelector(".form-section__toggle");
      const content = header.nextElementSibling;
      if (toggle && content) {
        content.classList.toggle("collapsed");
        toggle.classList.toggle("rotated");
      }
    });
  });
}

/* ==========================================================
   Mobile Sidebar drawer bindings
   ========================================================== */
function setupMobileDrawer() {
  if (hamburgerBtn && sidebar && overlay) {
    hamburgerBtn.addEventListener("click", () => {
      sidebar.classList.add("open");
      overlay.classList.add("active");
    });

    overlay.addEventListener("click", () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("active");
    });
  }
}

/* ==========================================================
   Multilingual Controller (EN / FR / AR)
   ========================================================== */
function switchLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("intellicanteen_lang", lang);

  // Set document directions and lang attributes
  if (lang === "ar") {
    document.documentElement.dir = "rtl";
    document.documentElement.lang = "ar";
  } else {
    document.documentElement.dir = "ltr";
    document.documentElement.lang = lang;
  }

  // Update text of elements with [data-translate]
  const translateElements = document.querySelectorAll("[data-translate]");
  translateElements.forEach((el) => {
    const key = el.getAttribute("data-translate");
    const translation = translations[lang][key];
    if (translation) {
      // If it is input element, update placeholder
      if (el.tagName === "INPUT") {
        el.setAttribute("placeholder", translation);
      } else {
        el.textContent = translation;
      }
    }
  });

  // Handle active states on language switcher buttons
  const switcherBtns = document.querySelectorAll(".lang-switcher__btn");
  switcherBtns.forEach((btn) => {
    if (btn.getAttribute("data-lang") === lang) {
      btn.classList.add("lang-switcher__btn--active");
    } else {
      btn.classList.remove("lang-switcher__btn--active");
    }
  });

  // Re-draw Charts with translated titles/labels
  updateChartLabels();
}

function setupLanguageSwitcher() {
  const btnEn = document.getElementById("btn-en");
  const btnFr = document.getElementById("btn-fr");
  const btnAr = document.getElementById("btn-ar");

  if (btnEn) btnEn.addEventListener("click", () => switchLanguage("en"));
  if (btnFr) btnFr.addEventListener("click", () => switchLanguage("fr"));
  if (btnAr) btnAr.addEventListener("click", () => switchLanguage("ar"));

  // Initial loading
  switchLanguage(currentLang);
}

/* ==========================================================
   Chart.js Implementations & Configurations
   ========================================================== */
function initCharts() {
  // Global defaults configuration for sleek font matching
  Chart.defaults.font.family = "inherit";
  Chart.defaults.color = "var(--gray-500)";

  // 1. Forecast Comparison Chart (bar)
  const forecastCtx = document.getElementById("forecast-chart").getContext("2d");
  forecastChart = new Chart(forecastCtx, {
    type: "bar",
    data: {
      labels: [translations[currentLang].res_breakfast, translations[currentLang].res_lunch, translations[currentLang].res_dinner],
      datasets: [
        {
          data: [0, 0, 0],
          backgroundColor: [
            "rgba(255, 152, 0, 0.2)",  // Amber (Breakfast)
            "rgba(0, 150, 136, 0.2)",  // Teal (Lunch)
            "rgba(30, 136, 229, 0.2)"   // Blue (Dinner)
          ],
          borderColor: [
            "#FF9800",
            "#009688",
            "#1E88E5"
          ],
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          padding: 12,
          cornerRadius: 8,
          backgroundColor: "var(--gray-900)",
          titleColor: "#fff",
          bodyColor: "var(--primary-100)"
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { weight: "600" } } },
        y: {
          border: { dash: [4, 4] },
          grid: { color: "var(--gray-200)" },
          beginAtZero: true
        }
      }
    }
  });

  // 2. Demand Evolution Chart (line)
  const demandCtx = document.getElementById("demand-evolution-chart").getContext("2d");
  demandEvolutionChart = new Chart(demandCtx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: translations[currentLang].lag_breakfast,
          data: [],
          borderColor: "#FF9800",
          backgroundColor: "rgba(255, 152, 0, 0.05)",
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 1.5,
          pointHoverRadius: 5,
          pointBackgroundColor: "#FF9800",
          fill: true
        },
        {
          label: translations[currentLang].lag_lunch,
          data: [],
          borderColor: "#009688",
          backgroundColor: "rgba(0, 150, 136, 0.05)",
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 1.5,
          pointHoverRadius: 5,
          pointBackgroundColor: "#009688",
          fill: true
        },
        {
          label: translations[currentLang].lag_dinner,
          data: [],
          borderColor: "#1E88E5",
          backgroundColor: "rgba(30, 136, 229, 0.05)",
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 1.5,
          pointHoverRadius: 5,
          pointBackgroundColor: "#1E88E5",
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top" },
        tooltip: {
          padding: 12,
          cornerRadius: 8,
          mode: "index",
          intersect: false
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            maxRotation: 45,
            maxTicksLimit: 20,
            font: { size: 10 }
          }
        },
        y: {
          border: { dash: [4, 4] },
          grid: { color: "var(--gray-200)" },
          beginAtZero: true,
          title: {
            display: true,
            text: "Meals",
            font: { size: 11, weight: "600" },
            color: "var(--gray-500)"
          }
        }
      },
      interaction: {
        mode: "index",
        intersect: false
      }
    }
  });
}

function updateChartLabels() {
  if (!forecastChart) return;

  // Update Forecast Chart labels
  forecastChart.data.labels = [
    translations[currentLang].res_breakfast,
    translations[currentLang].res_lunch,
    translations[currentLang].res_dinner
  ];
  forecastChart.update();

  // Update Demand Evolution Chart legends
  if (demandEvolutionChart) {
    demandEvolutionChart.data.datasets[0].label = translations[currentLang].lag_breakfast;
    demandEvolutionChart.data.datasets[1].label = translations[currentLang].lag_lunch;
    demandEvolutionChart.data.datasets[2].label = translations[currentLang].lag_dinner;
    demandEvolutionChart.update();
  }
}

/* ==========================================================
   Demand History Fetching & Display
   ========================================================== */
function debouncedFetchDemandHistory() {
  if (demandFetchTimer) clearTimeout(demandFetchTimer);
  demandFetchTimer = setTimeout(() => {
    const restoName = restoInput ? restoInput.value.trim() : "";
    const dateVal = forecastDateInput ? forecastDateInput.value : "";
    if (restoName && dateVal) {
      fetchDemandHistory(restoName, dateVal);
    }
  }, 400);
}

async function fetchDemandHistory(restoName, dateStr) {
  // Clear warning
  if (demandWarning) demandWarning.classList.remove("visible");

  try {
    const params = new URLSearchParams({ resto_name: restoName, date: dateStr });
    const response = await fetch(`/api/demand_history?${params}`);

    if (!response.ok) {
      // Restaurant not found or other error — reset lag displays
      resetLagDisplays();
      clearDemandEvolutionChart();
      return;
    }

    const data = await response.json();

    // Show warning if future date
    if (data.warning && demandWarning && demandWarningText) {
      demandWarningText.textContent = data.warning;
      demandWarning.classList.add("visible");
    }

    // Update lag value displays
    currentLags = data.lags || {};
    lagDisplays.forEach((el) => {
      const field = el.getAttribute("data-field");
      if (currentLags[field] !== undefined) {
        el.textContent = Math.round(currentLags[field]).toLocaleString();
        el.classList.add("has-data");
      } else {
        el.textContent = "--";
        el.classList.remove("has-data");
      }
    });

    // Update demand evolution chart
    const timeSeries = data.time_series || [];
    if (demandEvolutionChart && timeSeries.length > 0) {
      demandEvolutionChart.data.labels = timeSeries.map(p => p.date);
      demandEvolutionChart.data.datasets[0].data = timeSeries.map(p => p.breakfast);
      demandEvolutionChart.data.datasets[1].data = timeSeries.map(p => p.launch);
      demandEvolutionChart.data.datasets[2].data = timeSeries.map(p => p.dinner);
      demandEvolutionChart.update();
    }
  } catch (error) {
    console.warn("Could not fetch demand history:", error);
  }
}

function resetLagDisplays() {
  currentLags = {};
  lagDisplays.forEach((el) => {
    el.textContent = "--";
    el.classList.remove("has-data");
  });
}

function clearDemandEvolutionChart() {
  if (!demandEvolutionChart) return;
  demandEvolutionChart.data.labels = [];
  demandEvolutionChart.data.datasets.forEach(ds => { ds.data = []; });
  demandEvolutionChart.update();
}

/* ==========================================================
   Dynamic Number Counters
   ========================================================== */
function animateNumber(element, target, duration = 1000) {
  const start = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Smooth easeOutQuad function
    const easeProgress = progress * (2 - progress);
    const currentValue = Math.round(start + (target - start) * easeProgress);

    element.textContent = isNaN(currentValue) ? "--" : currentValue.toLocaleString();

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  requestAnimationFrame(update);
}

/* ==========================================================
   Restaurant & DOU Code Loading and Datastores
   ========================================================== */
async function loadRestaurants() {
  if (!restoList) return;

  try {
    const response = await fetch("/api/restaurants");
    if (!response.ok) return;

    const data = await response.json();
    const restaurants = data.restaurants || [];
    const fragment = document.createDocumentFragment();

    restaurants.forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      fragment.appendChild(option);
    });

    restoList.innerHTML = "";
    restoList.appendChild(fragment);
  } catch (error) {
    console.warn("Could not load restaurant list", error);
  }
}

async function loadDouCodes() {
  if (!douList) return;

  try {
    const response = await fetch("/api/dou_codes");
    if (!response.ok) return;

    const data = await response.json();
    const codes = data.dou_codes || [];
    const fragment = document.createDocumentFragment();

    codes.forEach((code) => {
      const option = document.createElement("option");
      option.value = code;
      fragment.appendChild(option);
    });

    douList.innerHTML = "";
    douList.appendChild(fragment);
  } catch (error) {
    console.warn("Could not load DOU codes list", error);
  }
}

// Binds active canteen display in Overview Stats row
function bindCanteenStatOverview() {
  if (restoInput && statResto) {
    restoInput.addEventListener("input", () => {
      statResto.textContent = restoInput.value.trim() || "--";
    });
  }
}

/* ==========================================================
   General Utilities and Forms Handlers
   ========================================================== */
function setStatus(type, message) {
  if (!message) {
    statusEl.textContent = "";
    statusEl.className = "status-msg";
    return;
  }

  statusEl.textContent = message;
  statusEl.className = `status-msg status-msg--${type}`;
}

function fillSample() {
  forecastDateInput.value = samplePayload.date;
  restoInput.value = samplePayload.resto_name;
  douInput.value = samplePayload.dou_code;

  if (statResto) {
    statResto.textContent = samplePayload.resto_name;
  }

  // Set category checkboxes from sample
  categoryInputs.forEach((input) => {
    const key = input.dataset.field;
    input.checked = (samplePayload.categories[key] ?? 0) === 1;
  });

  // Trigger demand history fetch for the sample restaurant + date
  fetchDemandHistory(samplePayload.resto_name, samplePayload.date);
}

function resetCategories() {
  categoryInputs.forEach((input) => {
    input.checked = false;
  });
}

function buildPayload() {
  const categories = {};
  categoryInputs.forEach((input) => {
    categories[input.dataset.field] = input.checked ? 1 : 0;
  });

  // Use the auto-fetched lag values
  const lags = { ...currentLags };

  return {
    date: forecastDateInput.value,
    resto_name: restoInput.value.trim(),
    dou_code: douInput.value.trim(),
    categories,
    lags
  };
}

async function handleSubmit(event) {
  event.preventDefault();
  setStatus("", "");

  const payload = buildPayload();

  if (!payload.date || !payload.resto_name || !payload.dou_code) {
    setStatus("error", translations[currentLang].err_fill_fields);
    return;
  }

  predictBtn.disabled = true;
  predictBtnText.textContent = translations[currentLang].btn_predicting;

  // Add a nice visual pulsing loading state to result cards
  const resultCards = document.querySelectorAll(".result-card");
  resultCards.forEach(card => card.classList.add("loading-pulse"));

  try {
    const response = await fetch("/api/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Prediction failed.");
    }

    const rounded = data.predictions_rounded || {};
    const breakfastVal = rounded.breakfast ?? 0;
    const launchVal = rounded.launch ?? 0;
    const dinnerVal = rounded.dinner ?? 0;

    // Animate metrics displays in results panel
    animateNumber(resultBreakfast, breakfastVal, 800);
    animateNumber(resultLaunch, launchVal, 800);
    animateNumber(resultDinner, dinnerVal, 800);

    // Animate stats cards overview row as well
    animateNumber(statBreakfast, breakfastVal, 1000);
    animateNumber(statLunch, launchVal, 1000);
    animateNumber(statDinner, dinnerVal, 1000);

    // Remove pulse and style cards active border
    resultCards.forEach(card => {
      card.classList.remove("loading-pulse");
      card.classList.add("has-data");
    });

    // Populate log-scale details code block
    rawOutput.textContent = JSON.stringify(data.predictions_log, null, 2);

    // Update Forecast Chart
    if (forecastChart) {
      forecastChart.data.datasets[0].data = [breakfastVal, launchVal, dinnerVal];
      forecastChart.update();
    }

    setStatus("success", translations[currentLang].msg_ready);
  } catch (error) {
    setStatus("error", error.message);
    resultCards.forEach(card => card.classList.remove("loading-pulse"));
  } finally {
    predictBtn.disabled = false;
    predictBtnText.textContent = translations[currentLang].btn_predict;
  }
}

/* ==========================================================
   Initialization on DOM Load
   ========================================================== */
document.addEventListener("DOMContentLoaded", () => {
  setupCollapsibleSections();
  setupMobileDrawer();
  setupLanguageSwitcher();
  initCharts();
  loadRestaurants();
  loadDouCodes();
  bindCanteenStatOverview();

  // Button bindings
  const fillSampleButton = document.getElementById("fill-sample");
  const resetCategoriesButton = document.getElementById("reset-categories");

  if (fillSampleButton) fillSampleButton.addEventListener("click", fillSample);
  if (resetCategoriesButton) resetCategoriesButton.addEventListener("click", resetCategories);

  // Trigger demand fetch when restaurant name or date changes
  if (restoInput) restoInput.addEventListener("input", debouncedFetchDemandHistory);
  if (forecastDateInput) forecastDateInput.addEventListener("change", debouncedFetchDemandHistory);

  form.addEventListener("submit", handleSubmit);
});
