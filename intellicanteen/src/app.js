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

// Category and Lag inputs
const categoryInputs = document.querySelectorAll("[data-group='category']");
const lagInputs = document.querySelectorAll("[data-group='lag']");

// State
let currentLang = localStorage.getItem("intellicanteen_lang") || "en";
let forecastChart = null;
let menuChart = null;
let trendChart = null;

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
  },
  lags: {
    breakfast_last_day: 8,
    breakfast_last_week: 10,
    breakfast_avg_previous: 9,
    launch_last_day: 32,
    launch_last_week: 35,
    launch_avg_previous: 30,
    dinner_last_day: 14,
    dinner_last_week: 16,
    dinner_avg_previous: 15
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
    chart_menu_title: "Menu Category Distribution",
    chart_trend_title: "Recent Demand & Forecast Trend",
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
    chart_menu_title: "Distribution des Catégories du Menu",
    chart_trend_title: "Demande Récente & Tendance des Prévisions",
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
    chart_menu_title: "توزيع فئات قائمة الطعام",
    chart_trend_title: "الطلب الأخير وتوجهات التوقع",
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

  // 1. Forecast Comparison Chart
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

  // 2. Menu Category radar mix Chart
  const menuCtx = document.getElementById("menu-chart").getContext("2d");
  menuChart = new Chart(menuCtx, {
    type: "radar",
    data: {
      labels: CATEGORIES.map(cat => {
        // Find translation key matching index.html mapping
        const key = getCategoryTranslationKey(cat);
        return translations[currentLang][key] || cat;
      }),
      datasets: [
        {
          label: currentLang === "ar" ? "نسبة الفئة في القائمة" : (currentLang === "fr" ? "Proportion Menu" : "Menu Share"),
          data: Array(CATEGORIES.length).fill(0),
          backgroundColor: "rgba(0, 150, 136, 0.15)",
          borderColor: "rgba(0, 150, 136, 0.8)",
          pointBackgroundColor: "#009688",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "#009688",
          borderWidth: 2.5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        r: {
          grid: { color: "var(--gray-200)" },
          angleLines: { color: "var(--gray-200)" },
          suggestedMin: 0,
          suggestedMax: 3,
          ticks: { backdropColor: "transparent", color: "var(--gray-400)" }
        }
      }
    }
  });

  // 3. Recent Demand and Forecast Trend Chart
  const trendCtx = document.getElementById("trend-chart").getContext("2d");
  trendChart = new Chart(trendCtx, {
    type: "line",
    data: {
      labels: [
        translations[currentLang].lag_avg,
        translations[currentLang].lag_last_week,
        translations[currentLang].lag_last_day,
        currentLang === "ar" ? "التوقعات" : (currentLang === "fr" ? "Prévision" : "Forecast")
      ],
      datasets: [
        {
          label: translations[currentLang].lag_breakfast,
          data: [0, 0, 0, 0],
          borderColor: "#FF9800",
          backgroundColor: "rgba(255, 152, 0, 0.05)",
          tension: 0.35,
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: "#FF9800",
          fill: true
        },
        {
          label: translations[currentLang].lag_lunch,
          data: [0, 0, 0, 0],
          borderColor: "#009688",
          backgroundColor: "rgba(0, 150, 136, 0.05)",
          tension: 0.35,
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: "#009688",
          fill: true
        },
        {
          label: translations[currentLang].lag_dinner,
          data: [0, 0, 0, 0],
          borderColor: "#1E88E5",
          backgroundColor: "rgba(30, 136, 229, 0.05)",
          tension: 0.35,
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: "#1E88E5",
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top" }
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          border: { dash: [4, 4] },
          grid: { color: "var(--gray-200)" },
          beginAtZero: true
        }
      }
    }
  });

  // Listen to input changes in Category grids to update Radar Mix instantly
  categoryInputs.forEach((input) => {
    input.addEventListener("input", updateMenuChartFromInputs);
  });
}

function getCategoryTranslationKey(cat) {
  const map = {
    "Bread & Bakery": "cat_bread",
    "Rice & Pasta": "cat_rice",
    "Legumes": "cat_legumes",
    "Poultry": "cat_poultry",
    "Red Meat": "cat_red_meat",
    "Fish & Seafood": "cat_fish",
    "Eggs": "cat_eggs",
    "Dairy & Cheese": "cat_dairy",
    "Vegetables & Salads": "cat_vegetables",
    "Soups & Broths": "cat_soups",
    "Cooked Dishes & Stews": "cat_cooked",
    "Potato Dishes": "cat_potato",
    "Fruits": "cat_fruits",
    "Sweets & Desserts": "cat_sweets",
    "Beverages": "cat_beverages",
    "Condiments & Spreads": "cat_condiments"
  };
  return map[cat] || "";
}

function updateChartLabels() {
  if (!forecastChart || !menuChart || !trendChart) return;

  // Update Forecast Chart labels
  forecastChart.data.labels = [
    translations[currentLang].res_breakfast,
    translations[currentLang].res_lunch,
    translations[currentLang].res_dinner
  ];
  forecastChart.update();

  // Update Menu Chart labels
  menuChart.data.labels = CATEGORIES.map(cat => {
    const key = getCategoryTranslationKey(cat);
    return translations[currentLang][key] || cat;
  });
  menuChart.data.datasets[0].label = currentLang === "ar" ? "نسبة الفئة في القائمة" : (currentLang === "fr" ? "Proportion Menu" : "Menu Share");
  menuChart.update();

  // Update Trend Chart labels & legends
  trendChart.data.labels = [
    translations[currentLang].lag_avg,
    translations[currentLang].lag_last_week,
    translations[currentLang].lag_last_day,
    currentLang === "ar" ? "التوقعات" : (currentLang === "fr" ? "Prévision" : "Forecast")
  ];
  trendChart.data.datasets[0].label = translations[currentLang].lag_breakfast;
  trendChart.data.datasets[1].label = translations[currentLang].lag_lunch;
  trendChart.data.datasets[2].label = translations[currentLang].lag_dinner;
  trendChart.update();
}

function updateMenuChartFromInputs() {
  const datasetData = CATEGORIES.map((cat) => {
    const input = document.querySelector(`[data-field="${cat}"]`);
    if (input) {
      updateCategoryValueDisplay(input);
      return getNumber(input);
    }
    return 0;
  });

  if (!menuChart) return;

  menuChart.data.datasets[0].data = datasetData;
  menuChart.update();
}

function updateCategoryValueDisplay(input) {
  const container = input.closest(".mini-field");
  if (!container) return;
  const valueEl = container.querySelector(".mini-field__value");
  if (!valueEl) return;
  valueEl.textContent = String(getNumber(input));
}

function updateTrendChart(forecastVals) {
  if (!trendChart) return;

  // Lags coordinates order: [Average Previous, Last Week, Last Day, Forecast]
  const getLagVal = (field) => {
    const el = document.querySelector(`[data-field="${field}"]`);
    return el ? getNumber(el) : 0;
  };

  const breakfastVals = [
    getLagVal("breakfast_avg_previous"),
    getLagVal("breakfast_last_week"),
    getLagVal("breakfast_last_day"),
    forecastVals.breakfast || 0
  ];

  const lunchVals = [
    getLagVal("launch_avg_previous"),
    getLagVal("launch_last_week"),
    getLagVal("launch_last_day"),
    forecastVals.launch || 0
  ];

  const dinnerVals = [
    getLagVal("dinner_avg_previous"),
    getLagVal("dinner_last_week"),
    getLagVal("dinner_last_day"),
    forecastVals.dinner || 0
  ];

  trendChart.data.datasets[0].data = breakfastVals;
  trendChart.data.datasets[1].data = lunchVals;
  trendChart.data.datasets[2].data = dinnerVals;
  trendChart.update();
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
   Date Feature Extraction & Metadata Binding
   ========================================================== */
function extractDateFeatures(dateString) {
  if (!dateString) return null;
  const dateParts = dateString.split("-");
  if (dateParts.length !== 3) return null;
  
  const year = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10);
  const dayOfMonth = parseInt(dateParts[2], 10);
  
  // Custom Date parsing to avoid timezone shift offsets in vanilla JS Date constructor
  const dateObj = new Date(year, month - 1, dayOfMonth);
  if (isNaN(dateObj.getTime())) return null;

  // Python weekday() mapping: Monday is 0, Tuesday is 1, ..., Sunday is 6.
  // JS getDay() mapping: Sunday is 0, Monday is 1, ..., Saturday is 6.
  const jsDay = dateObj.getDay();
  const pythonDayOfWeek = (jsDay + 6) % 7;
  
  // Friday and Saturday are treated as weekend in training/Algerian university systems
  // (In Python dayOfWeek value 4 is Friday, 5 is Saturday)
  const isWeekend = (pythonDayOfWeek === 4 || pythonDayOfWeek === 5) ? 1 : 0;
  
  const isMonthStart = dayOfMonth === 1 ? 1 : 0;
  
  // Check last day of month
  const lastDayDate = new Date(year, month, 0);
  const lastDay = lastDayDate.getDate();
  const isMonthEnd = dayOfMonth === lastDay ? 1 : 0;
  
  // Trigonometric cyclical features matching CatBoost models
  const dayOfWeekSin = Math.sin(2 * Math.PI * pythonDayOfWeek / 7);
  const dayOfWeekCos = Math.cos(2 * Math.PI * pythonDayOfWeek / 7);
  const dayOfMonthSin = Math.sin(2 * Math.PI * dayOfMonth / 31);
  const dayOfMonthCos = Math.cos(2 * Math.PI * dayOfMonth / 31);
  const monthSin = Math.sin(2 * Math.PI * month / 12);
  const monthCos = Math.cos(2 * Math.PI * month / 12);
  
  return {
    month,
    year,
    is_weekend: isWeekend,
    is_month_start: isMonthStart,
    is_month_end: isMonthEnd,
    day_of_week_sin: dayOfWeekSin,
    day_of_week_cos: dayOfWeekCos,
    day_of_month_sin: dayOfMonthSin,
    day_of_month_cos: dayOfMonthCos,
    month_sin: monthSin,
    month_cos: monthCos
  };
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

function getNumber(input) {
  const value = parseFloat(input.value);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function fillSample() {
  forecastDateInput.value = samplePayload.date;
  restoInput.value = samplePayload.resto_name;
  douInput.value = samplePayload.dou_code;

  if (statResto) {
    statResto.textContent = samplePayload.resto_name;
  }

  categoryInputs.forEach((input) => {
    const key = input.dataset.field;
    input.value = samplePayload.categories[key] ?? 0;
  });

  lagInputs.forEach((input) => {
    const key = input.dataset.field;
    input.value = samplePayload.lags[key] ?? 0;
  });

  // Update dynamic visuals instantly on sample fill
  updateMenuChartFromInputs();

}

function resetCategories() {
  categoryInputs.forEach((input) => {
    input.value = 0;
  });
  updateMenuChartFromInputs();
}

function buildPayload() {
  const categories = {};
  categoryInputs.forEach((input) => {
    categories[input.dataset.field] = getNumber(input);
  });

  const lags = {};
  lagInputs.forEach((input) => {
    lags[input.dataset.field] = getNumber(input);
  });

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

    // Update Chart.js representations
    if (forecastChart) {
      forecastChart.data.datasets[0].data = [breakfastVal, launchVal, dinnerVal];
      forecastChart.update();
    }

    updateTrendChart({ breakfast: breakfastVal, launch: launchVal, dinner: dinnerVal });

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

  // Reset elements initially
  const fillSampleButton = document.getElementById("fill-sample");
  const resetCategoriesButton = document.getElementById("reset-categories");

  if (fillSampleButton) fillSampleButton.addEventListener("click", fillSample);
  if (resetCategoriesButton) resetCategoriesButton.addEventListener("click", resetCategories);

  form.addEventListener("submit", handleSubmit);
});
