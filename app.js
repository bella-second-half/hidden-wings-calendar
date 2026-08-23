(() => {
  "use strict";

  const STORAGE_KEY = "my-second-half-calendar.v1";
  const THEME_KEY = "hidden-wings-theme.v1";
  const TEMPLATE_KEY = "hidden-wings-template.v1";
  const SOFT_THEMES = [
    { name: "樱花粉", color: "#e7b8c5" }, { name: "玫瑰粉", color: "#cf8fa3" }, { name: "豆沙粉", color: "#bd8d91" }, { name: "裸粉", color: "#d8b2aa" }, { name: "蜜桃粉", color: "#e6ad9e" },
    { name: "藕荷色", color: "#b99aaa" }, { name: "薰衣草紫", color: "#aaa0ce" }, { name: "灰紫", color: "#92869f" }, { name: "淡葡萄紫", color: "#ad8eb5" },
    { name: "天空蓝", color: "#8ebbd2" }, { name: "雾霾蓝", color: "#809eb0" }, { name: "冰川蓝", color: "#a8cad3" }, { name: "柔和深蓝", color: "#607b9b" },
    { name: "湖水蓝绿", color: "#73aaa8" }, { name: "青绿色", color: "#5f9d92" }, { name: "薄荷青", color: "#8fc8ba" }, { name: "孔雀蓝绿", color: "#4f8d89" },
    { name: "薄荷绿", color: "#a8c9ad" }, { name: "鼠尾草绿", color: "#91a98c" }, { name: "柔和橄榄绿", color: "#a5a36f" }, { name: "森林绿", color: "#607d67" },
    { name: "奶油黄", color: "#e6cf83" }, { name: "杏色", color: "#dfb47f" }, { name: "淡焦糖", color: "#c89f76" }, { name: "陶土橘", color: "#c98263" }, { name: "珊瑚色", color: "#d98272" },
    { name: "奶油白", color: "#e8dfcf" }, { name: "燕麦色", color: "#cbbba2" }, { name: "暖灰", color: "#a69d92" }, { name: "柔和炭灰", color: "#716f70" }
  ];
  const BRIGHT_THEMES = [
    { name: "明亮樱花粉", color: "#ef8faf" }, { name: "明亮玫瑰粉", color: "#dc648b" }, { name: "鲜明藕紫", color: "#b06aa0" }, { name: "明亮薰衣草", color: "#a582db" },
    { name: "晴空蓝", color: "#63ace0" }, { name: "亮婴儿蓝", color: "#83c5e8" }, { name: "澄澈湖蓝", color: "#47aeca" }, { name: "蒂芙尼蓝绿", color: "#36aa9a" }, { name: "明亮水蓝", color: "#50c4c7" },
    { name: "清新薄荷绿", color: "#79c9a5" }, { name: "苹果绿", color: "#8fbd55" }, { name: "明亮奶油黄", color: "#edcf58" }, { name: "明亮杏色", color: "#eda865" }, { name: "明亮珊瑚", color: "#e96f68" }, { name: "暖橙色", color: "#df8845" }
  ];
  const THEMES = [...SOFT_THEMES, ...BRIGHT_THEMES];
  const DEFAULT_SCORE_CATEGORIES = [
    { id: "positionRisk", label: "风险与仓位管理", max: 20 },
    { id: "discipline", label: "交易纪律", max: 20 },
    { id: "preMarketPlan", label: "盘前计划与交易逻辑", max: 15 },
    { id: "holdingExecution", label: "持仓与利润管理", max: 15 },
    { id: "entryExecution", label: "入场执行", max: 10 },
    { id: "exitExecution", label: "出场执行", max: 10 },
    { id: "emotionalAwareness", label: "情绪与决策控制", max: 10 }
  ];
  const app = document.querySelector("#app");
  const calendarTemplate = document.querySelector("#calendar-template");
  const dailyTemplate = document.querySelector("#daily-template");
  const MOODS = [
    { emoji: "😄", label: "特别开心" },
    { emoji: "🙂", label: "开心" },
    { emoji: "😐", label: "平平" },
    { emoji: "🙁", label: "低落" },
    { emoji: "😢", label: "难过" }
  ];
  let calendarCursor = startOfMonth(new Date());
  let saveTimer;
  let writingTimer;
  let closeMoodPicker;
  let selectedTheme = loadTheme();
  let templateStore = loadTemplate();

  applyTheme(selectedTheme);

  function loadStore() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  }

  function loadTemplate() {
    try {
      const saved = JSON.parse(localStorage.getItem(TEMPLATE_KEY));
      return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
    } catch {
      return {};
    }
  }

  function saveTemplate() {
    localStorage.setItem(TEMPLATE_KEY, JSON.stringify(templateStore));
  }

  let store = loadStore();

  function saveStore() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  function emptyDay() {
    return {
      direction: "", dailyQuote: "", quoteSource: "", tasks: [], review: "", lifeJournal: "",
      tradingScores: emptyTradingScores(), noTrade: false, biggestMistake: "", oneTradingChange: "",
      satisfaction: 0, keyword: "", oneSentence: "", mood: "",
      englishContent: "", englishTarget: 10, englishRepetitions: "", exerciseDone: false, exerciseMinutes: "",
      readingContent: "", readingMinutes: "", readingComplete: false,
      meditationSessions: "", meditationMinutes: "", meditationComplete: false,
      writingContent: "", writingAccumulatedMs: 0, writingSessionStart: null, writingHasStarted: false,
      rolledTaskCompletions: []
    };
  }

  function emptyTradingScores() {
    return { preMarketPlan: "", entryExecution: "", positionRisk: "", holdingExecution: "", exitExecution: "", discipline: "", emotionalAwareness: "" };
  }

  function getDay(key) {
    const saved = store[key] || {};
    return {
      ...emptyDay(),
      ...saved,
      tasks: [...(saved.tasks || [])],
      tradingScores: { ...emptyTradingScores(), ...(saved.tradingScores || {}) }
    };
  }

  function updateDay(key, changes, statusElement) {
    store[key] = { ...getDay(key), ...changes };
    // Persist on every change. The short timer below is only for the visual
    // save indicator, so quick date navigation can never discard an edit.
    saveStore();
    if (statusElement) {
      statusElement.className = "save-status saving";
      statusElement.innerHTML = "<span aria-hidden='true'>…</span> 正在保存";
    }
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      if (statusElement) {
        statusElement.className = "save-status";
        statusElement.innerHTML = "<span aria-hidden='true'>✓</span> 已保存到本机";
        setTimeout(() => statusElement.classList.add("faded"), 1400);
      }
    }, 180);
  }

  function dateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function dateFromKey(key) {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function startOfMonth(date) { return new Date(date.getFullYear(), date.getMonth(), 1); }
  function isSameDay(a, b) { return dateKey(a) === dateKey(b); }
  function shiftDate(date, days) { return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days); }

  function daysBetween(fromKey, toKey) {
    const dayMs = 24 * 60 * 60 * 1000;
    return Math.round((dateFromKey(toKey) - dateFromKey(fromKey)) / dayMs);
  }

  function taskReference(originKey, task) {
    return `${originKey}:${task.id}`;
  }

  function visibleTasks(key) {
    const ownTasks = getDay(key).tasks.map(task => ({ ...task, originKey: key, rolled: false }));
    const rolledTasks = [];
    const completionDates = new Map();
    Object.keys(store)
      .filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= key)
      .sort()
      .forEach(date => {
        (getDay(date).rolledTaskCompletions || []).forEach(reference => {
          if (!completionDates.has(reference)) completionDates.set(reference, date);
        });
      });

    Object.keys(store)
      .filter(originKey => /^\d{4}-\d{2}-\d{2}$/.test(originKey) && originKey < key)
      .sort()
      .forEach(originKey => {
        getDay(originKey).tasks.forEach(task => {
          if (task.complete) return;
          const reference = taskReference(originKey, task);
          const completionKey = completionDates.get(reference);
          if (!completionKey || completionKey === key) {
            rolledTasks.push({ ...task, complete: completionKey === key, originKey, rolled: true, reference });
          }
        });
      });

    return [...ownTasks, ...rolledTasks];
  }

  function readRoute() {
    const match = location.hash.match(/^#day\/(\d{4}-\d{2}-\d{2})$/);
    return match ? { view: "day", key: match[1] } : { view: "calendar" };
  }

  function render() {
    clearTimeout(saveTimer);
    clearInterval(writingTimer);
    const route = readRoute();
    if (route.view !== "calendar") exitHomeTemplateEditing();
    document.body.classList.toggle("daily-page", route.view === "day");
    document.body.classList.toggle("calendar-page", route.view === "calendar");
    route.view === "day" ? renderDaily(route.key) : renderCalendar();
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function renderCalendar() {
    exitHomeTemplateEditing();
    if (closeMoodPicker) closeMoodPicker();
    app.replaceChildren(calendarTemplate.content.cloneNode(true));
    const monthTitle = document.querySelector("#month-title");
    const grid = document.querySelector("#calendar-grid");
    monthTitle.textContent = calendarCursor.toLocaleDateString("zh-CN", { month: "long", year: "numeric" });

    const firstVisible = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth(), 1 - calendarCursor.getDay());
    const today = new Date();

    for (let i = 0; i < 42; i += 1) {
      const date = shiftDate(firstVisible, i);
      const key = dateKey(date);
      const data = getDay(key);
      const completed = data.tasks.filter(task => task.complete).length;
      const hasJournal = [data.direction, data.dailyQuote, data.review, data.lifeJournal, data.biggestMistake, data.oneTradingChange, data.oneSentence].some(value => value?.trim());
      const hasScore = data.noTrade || Object.values(data.tradingScores).some(value => value !== "");
      const hasPractice = data.englishContent.trim() || data.englishTarget !== 10 || data.englishRepetitions !== "" || data.exerciseDone || data.exerciseMinutes !== ""
        || data.readingContent.trim() || data.readingMinutes !== "" || data.readingComplete
        || data.meditationSessions !== "" || data.meditationMinutes !== "" || data.meditationComplete
        || data.writingContent.trim() || data.writingAccumulatedMs > 0 || data.writingSessionStart;
      const hasEntry = hasJournal || hasScore || hasPractice || data.tasks.length > 0 || data.satisfaction > 0 || data.keyword.trim() || data.quoteSource.trim() || data.mood;
      const cell = document.createElement("div");
      cell.className = "day-cell";
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("tabindex", "0");
      cell.setAttribute("aria-label", `${date.toLocaleDateString("zh-CN", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}${hasEntry ? "，有记录" : ""}`);
      if (date.getMonth() !== calendarCursor.getMonth()) cell.classList.add("outside");
      if (isSameDay(date, today)) cell.classList.add("today");
      if (hasEntry) cell.classList.add("has-entry");
      if (hasJournal) cell.classList.add("has-journal");
      if (data.tasks.length) cell.classList.add("has-tasks");

      const number = document.createElement("span");
      number.className = "day-number";
      number.textContent = date.getDate();
      cell.append(number);

      if (data.tasks.length) {
        const meta = document.createElement("span");
        meta.className = "day-meta";
        meta.textContent = `${completed}/${data.tasks.length}`;
        cell.append(meta);
      }
      if (data.keyword.trim()) {
        const keyword = document.createElement("span");
        keyword.className = "day-keyword";
        keyword.textContent = data.keyword.trim();
        cell.append(keyword);
      }
      if (hasEntry) {
        const marker = document.createElement("span");
        marker.className = "entry-marker";
        marker.setAttribute("aria-hidden", "true");
        marker.textContent = "✎";
        cell.append(marker);
      }

      const mood = MOODS.find(option => option.emoji === data.mood);
      const moodButton = document.createElement("button");
      moodButton.type = "button";
      moodButton.className = `mood-button${mood ? "" : " empty"}`;
      moodButton.textContent = mood?.emoji || "☺";
      moodButton.setAttribute("aria-label", mood ? `心情：${mood.label}，点击修改` : "设置这一天的心情");
      moodButton.setAttribute("aria-haspopup", "dialog");
      moodButton.setAttribute("aria-expanded", "false");
      moodButton.addEventListener("click", event => {
        event.stopPropagation();
        openMoodPicker(cell, moodButton, key, data.mood);
      });
      cell.append(moodButton);

      cell.addEventListener("click", () => { location.hash = `day/${key}`; });
      cell.addEventListener("keydown", event => {
        if (event.target === cell && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          location.hash = `day/${key}`;
        }
      });
      grid.append(cell);
    }

    document.querySelector("#previous-month").addEventListener("click", () => { calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1); renderCalendar(); });
    document.querySelector("#next-month").addEventListener("click", () => { calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1); renderCalendar(); });
    document.querySelector("#today-button").addEventListener("click", () => { calendarCursor = startOfMonth(new Date()); renderCalendar(); });
    setupDataBackup();
    setupThemePicker();
    setupHomeEditor();
  }

  function applyHomeTemplate() {
    const title = document.querySelector("#home-title");
    const subtitle = document.querySelector("#home-subtitle");
    const motto = document.querySelector("#home-motto");
    title.textContent = templateText("homeTitle", "隐形的翅膀");
    subtitle.textContent = templateText("homeSubtitle", "我的人生下半场日历");
    motto.textContent = templateText("homeMotto", "安静地过好今天，也好好地记录它");
    subtitle.classList.toggle("is-template-hidden", templateStore.homeSubtitleVisible === false);
    motto.classList.toggle("is-template-hidden", templateStore.homeMottoVisible === false);
    document.title = title.textContent || "隐形的翅膀";
    document.querySelector(".brand").setAttribute("aria-label", `${document.title}首页`);
  }

  function setupHomeTemplateFields() {
    [["#home-title", "homeTitle"], ["#home-subtitle", "homeSubtitle"], ["#home-motto", "homeMotto"]].forEach(([selector, key]) => {
      const element = document.querySelector(selector);
      element.addEventListener("input", () => {
        templateStore[key] = element.textContent;
        saveTemplate();
        if (key === "homeTitle") {
          document.title = element.textContent || "隐形的翅膀";
          document.querySelector(".brand").setAttribute("aria-label", `${document.title}首页`);
        }
      });
      element.addEventListener("keydown", event => {
        if (event.key === "Enter") { event.preventDefault(); element.blur(); }
      });
    });
    document.querySelector(".brand").addEventListener("click", event => {
      if (document.body.classList.contains("home-template-editing")) event.preventDefault();
    });
  }

  function exitHomeTemplateEditing() {
    document.body.classList.remove("home-template-editing");
    ["#home-title", "#home-subtitle", "#home-motto"].forEach(selector => document.querySelector(selector)?.setAttribute("contenteditable", "false"));
  }

  function setupHomeEditor() {
    const button = document.querySelector("#home-edit");
    const controls = document.querySelector("#home-template-controls");
    const subtitleToggle = document.querySelector("#show-home-subtitle");
    const mottoToggle = document.querySelector("#show-home-motto");
    let editing = false;

    const syncControls = () => {
      subtitleToggle.checked = templateStore.homeSubtitleVisible !== false;
      mottoToggle.checked = templateStore.homeMottoVisible !== false;
    };
    const setMode = enabled => {
      editing = enabled;
      document.body.classList.toggle("home-template-editing", enabled);
      button.textContent = enabled ? "完成编辑" : "编辑首页";
      button.classList.toggle("active", enabled);
      controls.hidden = !enabled;
      ["#home-title", "#home-subtitle", "#home-motto"].forEach(selector => document.querySelector(selector).setAttribute("contenteditable", String(enabled)));
      syncControls();
    };
    button.addEventListener("click", () => setMode(!editing));
    subtitleToggle.addEventListener("change", () => {
      templateStore.homeSubtitleVisible = subtitleToggle.checked;
      saveTemplate();
      applyHomeTemplate();
    });
    mottoToggle.addEventListener("change", () => {
      templateStore.homeMottoVisible = mottoToggle.checked;
      saveTemplate();
      applyHomeTemplate();
    });
    document.querySelector("#reset-home-template").addEventListener("click", () => {
      ["homeTitle", "homeSubtitle", "homeMotto", "homeSubtitleVisible", "homeMottoVisible"].forEach(key => delete templateStore[key]);
      saveTemplate();
      applyHomeTemplate();
      syncControls();
    });
  }

  function loadTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    return THEMES.some(theme => theme.color === saved) ? saved : "";
  }

  function mixColors(first, second, secondWeight) {
    const parse = color => color.slice(1).match(/.{2}/g).map(value => parseInt(value, 16));
    const a = parse(first);
    const b = parse(second);
    const mixed = a.map((value, index) => Math.round(value * (1 - secondWeight) + b[index] * secondWeight));
    return `#${mixed.map(value => value.toString(16).padStart(2, "0")).join("")}`;
  }

  function applyTheme(color) {
    const root = document.documentElement;
    const properties = ["--theme-main", "--theme-deep", "--theme-soft", "--theme-pale", "--theme-page", "--theme-border"];
    if (!color) {
      properties.forEach(property => root.style.removeProperty(property));
      return;
    }
    root.style.setProperty("--theme-main", color);
    root.style.setProperty("--theme-deep", mixColors(color, "#38342f", 0.64));
    root.style.setProperty("--theme-soft", mixColors(color, "#ffffff", 0.64));
    root.style.setProperty("--theme-pale", mixColors(color, "#ffffff", 0.82));
    root.style.setProperty("--theme-page", mixColors(color, "#f7f1e8", 0.78));
    root.style.setProperty("--theme-border", mixColors(color, "#665b50", 0.38));
  }

  function setupThemePicker() {
    const dialog = document.querySelector("#theme-dialog");
    const palette = document.querySelector("#theme-palette");
    const renderPalette = () => {
      palette.replaceChildren();
      [["Soft", SOFT_THEMES], ["Bright", BRIGHT_THEMES]].forEach(([groupName, themes]) => {
        const group = document.createElement("section");
        group.className = "theme-group";
        const heading = document.createElement("h3");
        heading.textContent = groupName;
        const swatches = document.createElement("div");
        swatches.className = "theme-swatches";
        themes.forEach(theme => {
        const swatch = document.createElement("button");
        swatch.type = "button";
        swatch.className = `theme-swatch${selectedTheme === theme.color ? " selected" : ""}`;
        swatch.title = theme.name;
        swatch.setAttribute("aria-label", theme.name);
        swatch.setAttribute("aria-pressed", String(selectedTheme === theme.color));
        const color = document.createElement("span");
        color.className = "swatch-color";
        color.style.background = theme.color;
        const check = document.createElement("span");
        check.className = "swatch-check";
        check.textContent = "✓";
        const label = document.createElement("span");
        label.className = "swatch-label";
        label.textContent = theme.name;
        color.append(check);
        swatch.append(color, label);
        swatch.addEventListener("click", () => {
          selectedTheme = theme.color;
          localStorage.setItem(THEME_KEY, selectedTheme);
          applyTheme(selectedTheme);
          renderPalette();
        });
          swatches.append(swatch);
        });
        group.append(heading, swatches);
        palette.append(group);
      });
    };
    document.querySelector("#theme-button").addEventListener("click", () => {
      renderPalette();
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    });
    document.querySelector("#reset-theme").addEventListener("click", () => {
      selectedTheme = "";
      localStorage.removeItem(THEME_KEY);
      applyTheme("");
      renderPalette();
    });
  }

  function setupDataBackup() {
    const dialog = document.querySelector("#data-dialog");
    const importInput = document.querySelector("#import-data");
    document.querySelector("#data-button").addEventListener("click", () => dialog.showModal());
    document.querySelector("#export-data").addEventListener("click", () => {
      const date = dateKey(new Date());
      const filename = `隐形的翅膀-数据备份-${date}.json`;
      const contents = JSON.stringify({ format: "hidden-wings-calendar-backup", version: 1, exportedAt: new Date().toISOString(), theme: selectedTheme, template: templateStore, data: store }, null, 2);
      const nativeBackup = window.webkit?.messageHandlers?.backup;
      if (nativeBackup) {
        nativeBackup.postMessage({ filename, contents });
        return;
      }
      const url = URL.createObjectURL(new Blob([contents], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    });
    importInput.addEventListener("change", async () => {
      const file = importInput.files?.[0];
      if (!file) return;
      try {
        const parsed = JSON.parse(await file.text());
        const imported = parsed?.format === "hidden-wings-calendar-backup" ? parsed.data : parsed;
        if (!imported || typeof imported !== "object" || Array.isArray(imported)) throw new Error("invalid backup");
        let added = 0;
        let kept = 0;
        Object.entries(imported).forEach(([key, value]) => {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !value || typeof value !== "object" || Array.isArray(value)) return;
          if (Object.prototype.hasOwnProperty.call(store, key)) kept += 1;
          else { store[key] = value; added += 1; }
        });
        if (parsed?.format === "hidden-wings-calendar-backup") {
          if (!selectedTheme && THEMES.some(theme => theme.color === parsed.theme)) {
            selectedTheme = parsed.theme;
            localStorage.setItem(THEME_KEY, selectedTheme);
            applyTheme(selectedTheme);
          }
          if (parsed.template && typeof parsed.template === "object" && !Array.isArray(parsed.template)) {
            templateStore = { ...parsed.template, ...templateStore };
            saveTemplate();
          }
        }
        saveStore();
        dialog.close();
        alert(`导入完成：新增 ${added} 天，保留现有 ${kept} 天。`);
        renderCalendar();
      } catch {
        alert("无法读取这份备份。请选择由本应用导出的 JSON 文件。");
      } finally {
        importInput.value = "";
      }
    });
  }

  function openMoodPicker(cell, trigger, key, selectedMood) {
    if (closeMoodPicker) closeMoodPicker();
    const picker = document.createElement("div");
    picker.className = "mood-picker";
    picker.setAttribute("role", "dialog");
    picker.setAttribute("aria-label", "选择这一天的心情");
    picker.addEventListener("click", event => event.stopPropagation());

    MOODS.forEach(option => {
      const choice = document.createElement("button");
      choice.type = "button";
      choice.className = `mood-choice${selectedMood === option.emoji ? " selected" : ""}`;
      choice.textContent = option.emoji;
      choice.title = option.label;
      choice.setAttribute("aria-label", option.label);
      choice.setAttribute("aria-pressed", String(selectedMood === option.emoji));
      choice.addEventListener("click", () => {
        updateDay(key, { mood: option.emoji });
        renderCalendar();
      });
      picker.append(choice);
    });

    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "clear-mood";
    clear.textContent = "清除心情";
    clear.disabled = !selectedMood;
    clear.addEventListener("click", () => {
      updateDay(key, { mood: "" });
      renderCalendar();
    });
    picker.append(clear);
    cell.append(picker);
    trigger.setAttribute("aria-expanded", "true");

    const handleOutside = event => {
      if (!picker.contains(event.target) && event.target !== trigger) cleanup();
    };
    const handleEscape = event => {
      if (event.key === "Escape") {
        cleanup();
        trigger.focus();
      }
    };
    const cleanup = () => {
      picker.remove();
      trigger.setAttribute("aria-expanded", "false");
      document.removeEventListener("click", handleOutside);
      document.removeEventListener("keydown", handleEscape);
      if (closeMoodPicker === cleanup) closeMoodPicker = null;
    };
    closeMoodPicker = cleanup;
    document.addEventListener("click", handleOutside);
    document.addEventListener("keydown", handleEscape);
    picker.querySelector("button:not(:disabled)")?.focus();
  }

  function renderDaily(key) {
    const date = dateFromKey(key);
    if (Number.isNaN(date.getTime()) || dateKey(date) !== key) { location.hash = "calendar"; return; }
    calendarCursor = startOfMonth(date);
    app.replaceChildren(dailyTemplate.content.cloneNode(true));
    applyTemplateToPage();
    const data = getDay(key);
    const status = document.querySelector("#save-status");

    document.querySelector("#day-year").textContent = `${date.getFullYear()}年`;
    document.querySelector("#day-title").textContent = date.toLocaleDateString("zh-CN", { weekday: "long", month: "long", day: "numeric" });

    bindText("#direction", "direction", data, key, status);
    bindText("#daily-quote", "dailyQuote", data, key, status);
    bindText("#quote-source", "quoteSource", data, key, status);
    bindText("#review", "review", data, key, status);
    bindText("#biggest-mistake", "biggestMistake", data, key, status);
    bindText("#one-trading-change", "oneTradingChange", data, key, status);
    bindText("#life-journal", "lifeJournal", data, key, status);
    bindText("#keyword", "keyword", data, key, status);
    bindText("#one-sentence", "oneSentence", data, key, status);
    const scoreController = setupTradingScore(data, key, status);
    setupPractices(data, key, status);
    setupWriting(data, key, status);

    const satisfaction = document.querySelector("#satisfaction");
    const satisfactionOutput = document.querySelector("#satisfaction-output");
    satisfaction.value = data.satisfaction || 0;
    satisfactionOutput.value = data.satisfaction || "—";
    satisfaction.addEventListener("input", () => {
      satisfactionOutput.value = satisfaction.value === "0" ? "—" : satisfaction.value;
      updateDay(key, { satisfaction: Number(satisfaction.value) }, status);
    });

    renderTasks(key, status);
    document.querySelector("#add-task").addEventListener("click", () => {
      const current = getDay(key);
      current.tasks.push({ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, name: "", number: "", note: "", complete: false });
      updateDay(key, { tasks: current.tasks }, status);
      renderTasks(key, status, true);
    });

    document.querySelector("#back-to-calendar").addEventListener("click", () => { location.hash = "calendar"; });
    document.querySelector("#previous-day").addEventListener("click", () => { location.hash = `day/${dateKey(shiftDate(date, -1))}`; });
    document.querySelector("#next-day").addEventListener("click", () => { location.hash = `day/${dateKey(shiftDate(date, 1))}`; });
    document.querySelector("#daily-today").addEventListener("click", () => { location.hash = `day/${dateKey(new Date())}`; });
    setupTemplateEditing(scoreController);
  }

  function applyTemplateToPage() {
    document.querySelectorAll("[data-template]").forEach(element => {
      element.dataset.templateDefault = element.textContent;
      if (Object.prototype.hasOwnProperty.call(templateStore, element.dataset.template)) element.textContent = templateStore[element.dataset.template];
    });
    document.querySelectorAll("[data-template-placeholder]").forEach(element => {
      element.dataset.templateDefault = element.placeholder;
      if (Object.prototype.hasOwnProperty.call(templateStore, element.dataset.templatePlaceholder)) element.placeholder = templateStore[element.dataset.templatePlaceholder];
    });
  }

  function templateText(key, fallback) {
    return Object.prototype.hasOwnProperty.call(templateStore, key) ? templateStore[key] : fallback;
  }

  function setupTemplateEditing(scoreController) {
    const toggle = document.querySelector("#template-edit");
    let editing = false;

    document.querySelectorAll("[data-template]").forEach(element => {
      element.addEventListener("input", () => {
        templateStore[element.dataset.template] = element.textContent;
        saveTemplate();
      });
      element.addEventListener("keydown", event => {
        if (event.key === "Enter") { event.preventDefault(); element.blur(); }
      });
    });

    const setMode = enabled => {
      editing = enabled;
      document.body.classList.toggle("template-editing", enabled);
      toggle.textContent = enabled ? "完成编辑" : "编辑模板";
      toggle.classList.toggle("active", enabled);
      document.querySelectorAll("[data-template]").forEach(element => element.setAttribute("contenteditable", String(enabled)));

      const controls = [...document.querySelectorAll(".journal-grid input, .journal-grid textarea, .journal-grid button")].filter(control => !control.closest(".score-template-toolbar"));
      controls.forEach(control => {
        if (enabled) {
          control.dataset.templateWasDisabled = String(control.disabled);
          control.dataset.templateWasReadonly = String(control.readOnly);
          if (control.matches("textarea, input[type='text'], input[type='number']")) control.readOnly = true;
          else control.disabled = true;
        } else {
          control.disabled = control.dataset.templateWasDisabled === "true";
          control.readOnly = control.dataset.templateWasReadonly === "true";
          delete control.dataset.templateWasDisabled;
          delete control.dataset.templateWasReadonly;
        }
      });

      document.querySelectorAll(".template-placeholder-editor").forEach(editor => editor.remove());
      if (enabled) {
        document.querySelectorAll("[data-template-placeholder]").forEach(field => {
          const editor = document.createElement("div");
          editor.className = "template-placeholder-editor";
          editor.contentEditable = "true";
          editor.textContent = field.placeholder;
          editor.addEventListener("input", () => {
            templateStore[field.dataset.templatePlaceholder] = editor.textContent;
            field.placeholder = editor.textContent;
            saveTemplate();
          });
          editor.addEventListener("keydown", event => {
            if (event.key === "Enter") { event.preventDefault(); editor.blur(); }
          });
          field.before(editor);
        });
      }
      scoreController.setTemplateMode(enabled);
    };
    toggle.addEventListener("click", () => setMode(!editing));
  }

  function bindText(selector, field, data, key, status) {
    const input = document.querySelector(selector);
    input.value = data[field];
    input.addEventListener("input", () => updateDay(key, { [field]: input.value }, status));
  }

  function getScoreCategories() {
    if (!Array.isArray(templateStore.scoreCategories)) return DEFAULT_SCORE_CATEGORIES.map(category => ({ ...category }));
    const ids = new Set();
    return templateStore.scoreCategories.flatMap(category => {
      if (!category || typeof category.id !== "string" || ids.has(category.id)) return [];
      ids.add(category.id);
      return [{ id: category.id, label: typeof category.label === "string" ? category.label : "评分项", max: Math.max(1, Math.min(1000, Math.floor(Number(category.max) || 1))) }];
    });
  }

  function setupTradingScore(data, key, status) {
    const module = document.querySelector(".trading-score");
    const noTrade = document.querySelector("#no-trade");
    const list = document.querySelector("#score-list");
    const total = document.querySelector("#trading-total");
    const enabledControl = document.querySelector("#score-module-enabled");
    const addCategory = document.querySelector("#add-score-category");
    let categories = getScoreCategories();
    let moduleEnabled = templateStore.scoreEnabled !== false;
    let templateMode = false;
    noTrade.checked = Boolean(data.noTrade);

    const maximumTotal = () => categories.reduce((sum, category) => sum + category.max, 0);
    const persistTemplate = () => {
      templateStore.scoreCategories = categories.map(category => ({ ...category }));
      templateStore.scoreEnabled = moduleEnabled;
      saveTemplate();
    };

    const moveCategory = (index, offset) => {
      const destination = index + offset;
      if (destination < 0 || destination >= categories.length) return;
      [categories[index], categories[destination]] = [categories[destination], categories[index]];
      persistTemplate();
      renderScoreList();
    };

    const renderScoreList = () => {
      module.classList.toggle("module-hidden", !moduleEnabled && !templateMode);
      module.classList.toggle("module-disabled", !moduleEnabled);
      enabledControl.checked = moduleEnabled;
      list.replaceChildren();

      if (templateMode) {
        categories.forEach((category, index) => {
          const row = document.createElement("div");
          row.className = "score-template-row";
          row.dataset.categoryId = category.id;
          const label = document.createElement("input");
          label.type = "text";
          label.className = "score-category-label";
          label.value = category.label;
          label.setAttribute("aria-label", "评分项名称");
          label.addEventListener("input", () => { category.label = label.value; persistTemplate(); });
          const maximum = document.createElement("input");
          maximum.type = "number";
          maximum.className = "score-category-max";
          maximum.min = "1";
          maximum.max = "1000";
          maximum.step = "1";
          maximum.value = category.max;
          maximum.setAttribute("aria-label", `${category.label}满分`);
          maximum.addEventListener("input", () => {
            category.max = Math.max(1, Math.min(1000, Math.floor(Number(maximum.value) || 1)));
            maximum.value = category.max;
            persistTemplate();
            total.value = `模板满分 ${maximumTotal()}`;
          });
          const controls = document.createElement("span");
          controls.className = "score-template-controls";
          const up = scoreTemplateButton("↑", "上移评分项", () => moveCategory(index, -1));
          const down = scoreTemplateButton("↓", "下移评分项", () => moveCategory(index, 1));
          const remove = scoreTemplateButton("×", "删除评分项", () => {
            categories.splice(index, 1);
            persistTemplate();
            renderScoreList();
          });
          up.disabled = index === 0;
          down.disabled = index === categories.length - 1;
          controls.append(up, down, remove);
          row.append(label, maximum, controls);
          list.append(row);
        });
        total.value = `模板满分 ${maximumTotal()}`;
        return;
      }

      categories.forEach(category => {
        const row = document.createElement("label");
        row.textContent = category.label;
        const maximum = document.createElement("span");
        maximum.textContent = `满分 ${category.max}`;
        const input = document.createElement("input");
        input.className = "score-input";
        input.dataset.score = category.id;
        input.type = "number";
        input.min = "0";
        input.max = category.max;
        input.step = "1";
        input.inputMode = "numeric";
        input.setAttribute("aria-label", `${category.label}得分，满分${category.max}分`);
        const savedValue = getDay(key).tradingScores[category.id];
        input.value = savedValue === "" || savedValue == null ? "" : Math.max(0, Math.min(category.max, Number(savedValue) || 0));
        input.addEventListener("input", () => {
          let value = input.value === "" ? "" : Math.max(0, Math.min(category.max, Number(input.value)));
          if (!Number.isFinite(value)) value = "";
          input.value = value;
          const scores = { ...getDay(key).tradingScores, [category.id]: value };
          updateDay(key, { tradingScores: scores }, status);
          updateTradingTotal([...list.querySelectorAll(".score-input")], total, noTrade.checked, maximumTotal());
        });
        row.append(maximum, input);
        list.append(row);
      });
      updateTradingTotal([...list.querySelectorAll(".score-input")], total, noTrade.checked, maximumTotal());
    };

    noTrade.addEventListener("change", () => {
      updateDay(key, { noTrade: noTrade.checked }, status);
      updateTradingTotal([...list.querySelectorAll(".score-input")], total, noTrade.checked, maximumTotal());
    });
    enabledControl.addEventListener("change", () => {
      moduleEnabled = enabledControl.checked;
      persistTemplate();
      module.classList.toggle("module-disabled", !moduleEnabled);
    });
    addCategory.addEventListener("click", () => {
      categories.push({ id: `custom-${Date.now()}-${Math.random().toString(16).slice(2)}`, label: "新评分项", max: 10 });
      persistTemplate();
      renderScoreList();
    });
    renderScoreList();
    return {
      setTemplateMode(enabled) {
        templateMode = enabled;
        module.classList.toggle("module-disabled", templateMode && !moduleEnabled);
        renderScoreList();
      }
    };
  }

  function scoreTemplateButton(text, label, handler) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    button.setAttribute("aria-label", label);
    button.addEventListener("click", handler);
    return button;
  }

  function updateTradingTotal(inputs, total, noTrade, maximumTotal) {
    inputs.forEach(input => { input.disabled = noTrade; });
    if (noTrade) {
      total.value = "N/A";
      return;
    }
    const score = inputs.reduce((sum, input) => sum + (Number(input.value) || 0), 0);
    total.value = `${score} / ${maximumTotal}`;
  }

  function setupPractices(data, key, status) {
    const englishContent = document.querySelector("#english-content");
    const englishTarget = document.querySelector("#english-target");
    const englishCount = document.querySelector("#english-repetitions");
    const englishComplete = document.querySelector("#english-complete");
    const exerciseDone = document.querySelector("#exercise-done");
    const exerciseMinutes = document.querySelector("#exercise-minutes");
    const readingContent = document.querySelector("#reading-content");
    const readingMinutes = document.querySelector("#reading-minutes");
    const readingComplete = document.querySelector("#reading-complete");
    const meditationSessions = document.querySelector("#meditation-sessions");
    const meditationMinutes = document.querySelector("#meditation-minutes");
    const meditationComplete = document.querySelector("#meditation-complete");

    englishContent.value = data.englishContent ?? "";
    englishTarget.value = data.englishTarget ?? 10;
    englishCount.value = data.englishRepetitions ?? "";
    exerciseDone.checked = Boolean(data.exerciseDone);
    exerciseMinutes.value = data.exerciseMinutes ?? "";
    readingContent.value = data.readingContent ?? "";
    readingMinutes.value = data.readingMinutes ?? "";
    readingComplete.checked = Boolean(data.readingComplete);
    meditationSessions.value = data.meditationSessions ?? "";
    meditationMinutes.value = data.meditationMinutes ?? "";
    meditationComplete.checked = Boolean(data.meditationComplete);

    const updateEnglishStatus = () => {
      const complete = Number(englishCount.value) >= Number(englishTarget.value || 10);
      englishComplete.checked = complete;
      englishComplete.closest("label").classList.toggle("complete", complete);
    };

    englishContent.addEventListener("input", () => updateDay(key, { englishContent: englishContent.value }, status));
    englishTarget.addEventListener("input", () => {
      const value = englishTarget.value === "" ? "" : Math.max(1, Math.floor(Number(englishTarget.value) || 1));
      if (value !== "") englishTarget.value = value;
      updateDay(key, { englishTarget: value }, status);
      updateEnglishStatus();
    });
    englishCount.addEventListener("input", () => {
      const value = normalizePracticeNumber(englishCount);
      updateDay(key, { englishRepetitions: value }, status);
      updateEnglishStatus();
    });
    exerciseDone.addEventListener("change", () => updateDay(key, { exerciseDone: exerciseDone.checked }, status));
    exerciseMinutes.addEventListener("input", () => {
      const value = normalizePracticeNumber(exerciseMinutes);
      updateDay(key, { exerciseMinutes: value }, status);
    });
    readingContent.addEventListener("input", () => updateDay(key, { readingContent: readingContent.value }, status));
    readingMinutes.addEventListener("input", () => {
      const value = normalizePracticeNumber(readingMinutes);
      updateDay(key, { readingMinutes: value }, status);
    });
    readingComplete.addEventListener("change", () => updateDay(key, { readingComplete: readingComplete.checked }, status));
    meditationSessions.addEventListener("input", () => {
      const value = normalizePracticeNumber(meditationSessions);
      updateDay(key, { meditationSessions: value }, status);
    });
    meditationMinutes.addEventListener("input", () => {
      const value = normalizePracticeNumber(meditationMinutes);
      updateDay(key, { meditationMinutes: value }, status);
    });
    meditationComplete.addEventListener("change", () => updateDay(key, { meditationComplete: meditationComplete.checked }, status));
    updateEnglishStatus();
  }

  function normalizePracticeNumber(input) {
    if (input.value === "") return "";
    const value = Math.max(0, Math.floor(Number(input.value) || 0));
    input.value = value;
    return value;
  }

  function activeWritingSession() {
    for (const [key, saved] of Object.entries(store)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(key) && Number.isFinite(Number(saved?.writingSessionStart)) && Number(saved.writingSessionStart) > 0) {
        return { key, start: Number(saved.writingSessionStart) };
      }
    }
    return null;
  }

  function formatWritingDuration(milliseconds) {
    const seconds = Math.max(0, Math.floor(Number(milliseconds || 0) / 1000));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return [hours, minutes, seconds % 60].map(value => String(value).padStart(2, "0")).join(":");
  }

  function setupWriting(data, key, status) {
    const content = document.querySelector("#writing-content");
    const output = document.querySelector("#writing-timer");
    const statusLabel = document.querySelector("#writing-status");
    const controlButton = document.querySelector("#writing-control");
    content.value = data.writingContent ?? "";
    content.addEventListener("input", () => updateDay(key, { writingContent: content.value }, status));

    const refresh = () => {
      const current = getDay(key);
      const active = activeWritingSession();
      const ownsActiveSession = active?.key === key;
      const elapsed = ownsActiveSession ? Math.max(0, Date.now() - active.start) : 0;
      output.value = formatWritingDuration((Number(current.writingAccumulatedMs) || 0) + elapsed);
      output.textContent = output.value;
      const hasStarted = current.writingHasStarted || current.writingAccumulatedMs > 0 || current.writingSessionStart;
      controlButton.textContent = active ? "暂停计时" : hasStarted ? "继续计时" : "开始计时";
      statusLabel.textContent = active ? "计时中" : hasStarted ? "已暂停" : "未计时";
      controlButton.setAttribute("aria-pressed", String(Boolean(active)));
    };

    const begin = () => {
      if (activeWritingSession()) return;
      const todayKey = dateKey(new Date());
      const startedAt = Date.now();
      updateDay(todayKey, { writingSessionStart: startedAt, writingHasStarted: true }, todayKey === key ? status : null);
      if (todayKey !== key) {
        location.hash = `day/${todayKey}`;
        return;
      }
      refresh();
    };

    controlButton.addEventListener("click", () => {
      const active = activeWritingSession();
      if (!active) {
        begin();
        return;
      }
      const current = getDay(active.key);
      const accumulated = (Number(current.writingAccumulatedMs) || 0) + Math.max(0, Date.now() - active.start);
      updateDay(active.key, { writingAccumulatedMs: accumulated, writingSessionStart: null, writingHasStarted: true }, active.key === key ? status : null);
      refresh();
    });

    refresh();
    writingTimer = setInterval(refresh, 250);
  }

  function renderTasks(key, status, focusLast = false) {
    const list = document.querySelector("#task-list");
    const progress = document.querySelector("#task-progress");
    const tasks = visibleTasks(key);
    const completed = tasks.filter(task => task.complete).length;
    progress.textContent = `${completed} / ${tasks.length} 已完成`;
    list.replaceChildren();

    if (!tasks.length) {
      const empty = document.createElement("p");
      empty.className = "empty-tasks";
      empty.dataset.template = "actionsEmpty";
      empty.textContent = templateText("actionsEmpty", "还没有行动事项，简单一点就好。");
      list.append(empty);
      return;
    }

    tasks.forEach((task, index) => {
      const row = document.createElement("div");
      row.className = `task-row${task.complete ? " done" : ""}`;
      row.dataset.id = task.id;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "task-check";
      checkbox.checked = task.complete;
      checkbox.setAttribute("aria-label", `将${task.name || "此事项"}标记为已完成`);

      const nameWrap = document.createElement("div");
      nameWrap.className = "task-name-wrap";
      const name = taskInput("task-name", "事项名称", task.name);
      nameWrap.append(name);
      if (task.rolled) {
        const rollover = document.createElement("small");
        rollover.className = "rollover-label";
        rollover.textContent = `↪ 顺延 ${daysBetween(task.originKey, key)} 天`;
        nameWrap.append(rollover);
      }
      const number = taskInput("task-number", "数量（选填）", task.number, "text", "numeric");
      const note = taskInput("task-note", "简短备注（选填）", task.note);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "delete-task";
      remove.setAttribute("aria-label", `删除${task.name || "此事项"}`);
      remove.textContent = "×";

      if (task.rolled) {
        name.readOnly = true;
        number.readOnly = true;
        note.readOnly = true;
        remove.hidden = true;
        checkbox.addEventListener("change", () => updateRolledTaskCompletion(key, task.reference, checkbox.checked, status));
      } else {
        checkbox.addEventListener("change", () => updateTask(key, task.id, { complete: checkbox.checked }, status, true));
        name.addEventListener("input", () => updateTask(key, task.id, { name: name.value }, status));
        number.addEventListener("input", () => updateTask(key, task.id, { number: number.value }, status));
        note.addEventListener("input", () => updateTask(key, task.id, { note: note.value }, status));
      }
      remove.addEventListener("click", () => {
        updateDay(key, { tasks: getDay(key).tasks.filter(item => item.id !== task.id) }, status);
        renderTasks(key, status);
      });
      row.append(checkbox, nameWrap, number, note, remove);
      list.append(row);
      if (focusLast && index === tasks.length - 1) requestAnimationFrame(() => name.focus());
    });
  }

  function taskInput(className, placeholder, value, type = "text", inputMode) {
    const input = document.createElement("input");
    input.type = type;
    input.className = `task-input ${className}`;
    input.placeholder = placeholder;
    input.value = value ?? "";
    if (inputMode) input.inputMode = inputMode;
    return input;
  }

  function updateTask(key, id, changes, status, rerender = false) {
    const tasks = getDay(key).tasks.map(task => task.id === id ? { ...task, ...changes } : task);
    updateDay(key, { tasks }, status);
    if (rerender) renderTasks(key, status);
  }

  function updateRolledTaskCompletion(key, reference, complete, status) {
    const current = getDay(key).rolledTaskCompletions || [];
    const completions = complete
      ? [...new Set([...current, reference])]
      : current.filter(item => item !== reference);
    updateDay(key, { rolledTaskCompletions: completions }, status);
    renderTasks(key, status);
  }

  window.addEventListener("hashchange", render);
  window.addEventListener("pagehide", () => { clearTimeout(saveTimer); saveStore(); });
  applyHomeTemplate();
  setupHomeTemplateFields();
  if (!location.hash) location.hash = "calendar";
  else render();
})();
