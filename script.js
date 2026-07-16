/*
  Seerati — Part 08 · GitHub Pages release
  الأقسام المتكررة تستخدم معرّفًا مستقلًا لكل عنصر، لذلك الحذف والتعديل
  يصيبان العنصر الصحيح حتى لو تشابهت البيانات.
*/

(function () {
  "use strict";

  const PROFILE_FIELDS = ["fullName", "jobTitle", "summary", "phone", "email"];
  const BUILTIN_SECTIONS = ["summary", "experience", "education", "skills", "languages"];
  const STORAGE_KEY = "seerati.cv.v1";
  let saveTimer = null;

  function createEmptyProfile() {
    return { fullName: "", jobTitle: "", summary: "", phone: "", email: "" };
  }

  function createEmptyCv() {
    return {
      profile: createEmptyProfile(),
      skills: [],
      experiences: [],
      education: [],
      languages: [],
      customSections: [],
      sectionOrder: BUILTIN_SECTIONS.slice(),
      hiddenSections: []
    };
  }

  function makeId(prefix) {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return prefix + "-" + window.crypto.randomUUID();
    }
    return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9);
  }

  function cleanText(value) {
    return typeof value === "string" ? value : "";
  }

  function cleanArray(value) {
    return Array.isArray(value) ? value.filter(function (item) {
      return item && typeof item === "object";
    }) : [];
  }

  function normalizeCv(rawCv) {
    const raw = rawCv && typeof rawCv === "object" ? rawCv : {};
    const result = createEmptyCv();
    const profile = raw.profile && typeof raw.profile === "object" ? raw.profile : {};
    PROFILE_FIELDS.forEach(function (field) { result.profile[field] = cleanText(profile[field]); });

    result.skills = cleanArray(raw.skills).map(function (item) {
      return { id: cleanText(item.id) || makeId("skill"), label: cleanText(item.label) };
    }).filter(function (item) { return item.label.trim(); }).slice(0, 30);

    result.experiences = cleanArray(raw.experiences).map(function (item) {
      return {
        id: cleanText(item.id) || makeId("experience"),
        role: cleanText(item.role),
        company: cleanText(item.company),
        startDate: cleanText(item.startDate),
        endDate: cleanText(item.endDate),
        description: cleanText(item.description)
      };
    }).slice(0, 40);

    result.education = cleanArray(raw.education).map(function (item) {
      return {
        id: cleanText(item.id) || makeId("education"),
        degree: cleanText(item.degree),
        institution: cleanText(item.institution),
        startDate: cleanText(item.startDate),
        endDate: cleanText(item.endDate)
      };
    }).slice(0, 40);

    result.languages = cleanArray(raw.languages).map(function (item) {
      const allowedLevels = ["beginner", "intermediate", "advanced", "fluent", "native"];
      return {
        id: cleanText(item.id) || makeId("language"),
        name: cleanText(item.name),
        level: allowedLevels.indexOf(item.level) >= 0 ? item.level : "intermediate"
      };
    }).slice(0, 30);

    result.customSections = cleanArray(raw.customSections).map(function (item) {
      return {
        id: cleanText(item.id) || makeId("custom"),
        title: cleanText(item.title),
        content: cleanText(item.content)
      };
    }).filter(function (item) { return item.title.trim(); }).slice(0, 20);

    const validIds = BUILTIN_SECTIONS.concat(result.customSections.map(function (item) { return item.id; }));
    const requestedOrder = Array.isArray(raw.sectionOrder) ? raw.sectionOrder : [];
    result.sectionOrder = requestedOrder.filter(function (id, index) {
      return validIds.indexOf(id) >= 0 && requestedOrder.indexOf(id) === index;
    });
    validIds.forEach(function (id) {
      if (result.sectionOrder.indexOf(id) < 0) result.sectionOrder.push(id);
    });
    result.hiddenSections = Array.isArray(raw.hiddenSections) ? raw.hiddenSections.filter(function (id) {
      return validIds.indexOf(id) >= 0;
    }) : [];
    return result;
  }

  function defaultState() {
    return {
      ui: {
        language: "ar",
        template: "professional",
        accent: "#1c7c75",
        hideEmpty: true,
        density: "comfortable",
        exportState: "preparing"
      },
      cv: { ar: createEmptyCv(), en: createEmptyCv() }
    };
  }

  function loadStoredState() {
    const fallback = defaultState();
    try {
      const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
      if (!parsed || typeof parsed !== "object") return fallback;
      const rawUi = parsed.ui && typeof parsed.ui === "object" ? parsed.ui : {};
      const templates = ["professional", "modern", "graduate", "minimal", "bold"];
      fallback.ui.language = rawUi.language === "en" ? "en" : "ar";
      fallback.ui.template = templates.indexOf(rawUi.template) >= 0 ? rawUi.template : "professional";
      fallback.ui.accent = /^#[0-9a-f]{6}$/i.test(rawUi.accent) ? rawUi.accent : "#1c7c75";
      fallback.ui.hideEmpty = typeof rawUi.hideEmpty === "boolean" ? rawUi.hideEmpty : true;
      fallback.ui.density = rawUi.density === "compact" ? "compact" : "comfortable";
      fallback.cv.ar = normalizeCv(parsed.cv && parsed.cv.ar);
      fallback.cv.en = normalizeCv(parsed.cv && parsed.cv.en);
      return fallback;
    } catch (error) {
      console.warn("Seerati: saved data could not be restored.", error);
      return fallback;
    }
  }

  const appState = loadStoredState();

  const copy = {
    ar: {
      brandAr: "سيرتي",
      headerBadge: "مجاني · مفتوح المصدر",
      eyebrow: "النسخة النهائية",
      pageTitle: "سيرتك، من جهازك مباشرة.",
      pageIntro: "بدون تسجيل أو خادم: اكتب، خصّص، احفظ داخل جهازك، وبعدها حمّل ملفك.",
      jumpEditor: "النموذج",
      jumpPreview: "المعاينة",
      formKicker: "بياناتك الأساسية",
      formTitle: "خلّنا نتعرّف عليك",
      completionTitle: "اكتمال البيانات الأساسية",
      fullNameLabel: "الاسم الكامل",
      fullNamePlaceholder: "مثال: نورة العتيبي",
      jobTitleLabel: "المسمى الوظيفي",
      jobTitlePlaceholder: "مثال: مصممة تجربة مستخدم",
      summaryLabel: "نبذة شخصية",
      summaryHint: "سطران أو ثلاثة تكفي",
      summaryPlaceholder: "اكتب نبذة قصيرة عن خبرتك والشيء الذي يميزك…",
      phoneLabel: "رقم التواصل",
      phonePlaceholder: "05x xxx xxxx",
      emailLabel: "البريد الإلكتروني",
      emailPlaceholder: "name@example.com",
      emailError: "اكتب بريدًا صحيحًا مثل name@example.com",
      designKicker: "شكل السيرة",
      designTitle: "اختر الستايل اللي يناسبك",
      designHint: "تقدر تغيّره بأي وقت",
      templateLabel: "القالب",
      templateProfessional: "احترافي",
      templateProfessionalHint: "مرتب وواضح",
      templateModern: "عصري",
      templateModernHint: "جريء بلمسة لون",
      templateGraduate: "خريجين",
      templateGraduateHint: "يقدّم التعليم والمهارات",
      templateMinimal: "مختصر",
      templateMinimalHint: "نظيف وبدون زحمة",
      templateBold: "جريء",
      templateBoldHint: "عنوان قوي وواضح",
      colorLabel: "لون العناوين",
      customColorLabel: "لونك",
      densityLabel: "تباعد السيرة",
      densityComfortable: "مريح",
      densityCompact: "مختصر",
      hideEmptyLabel: "إخفاء الأقسام الفارغة",
      emptySection: "أضف بيانات هذا القسم عشان تظهر هنا.",
      printButton: "طباعة",
      pdfButton: "تحميل PDF",
      exportPreparing: "لحظة، نجهّز الخط العربي للتصدير…",
      exportReady: "جاهزة للطباعة والتحميل.",
      exportWorking: "جارٍ تجهيز ملف PDF…",
      exportFailed: "ما قدرنا نجهّز الملف. جرّب مرة ثانية.",
      exportFontFailed: "الخط المحلي ما تحمّل، لذلك وقفنا التصدير عشان ما تطلع العربية بشكل غلط.",
      detailsKicker: "تفاصيل السيرة",
      detailsTitle: "وش الأشياء اللي تميزك؟",
      detailsHint: "أضف اللي تحتاجه واترك الباقي",
      skillsEditorTitle: "المهارات",
      skillPlaceholder: "مثال: إدارة المشاريع",
      addSkill: "إضافة مهارة",
      duplicateSkill: "هذه المهارة مضافة من قبل.",
      skillLimit: "وصلت للحد المناسب من المهارات.",
      experienceEditorTitle: "الخبرات الوظيفية",
      addExperience: "+ إضافة خبرة",
      educationEditorTitle: "التعليم",
      addEducation: "+ إضافة مؤهل",
      languagesEditorTitle: "اللغات",
      addLanguage: "+ إضافة لغة",
      roleLabel: "المسمى الوظيفي",
      companyLabel: "الشركة أو الجهة",
      startLabel: "من",
      endLabel: "إلى",
      descriptionLabel: "وش كانت مهامك أو إنجازاتك؟",
      degreeLabel: "المؤهل أو التخصص",
      institutionLabel: "الجامعة أو الجهة التعليمية",
      languageNameLabel: "اللغة",
      levelLabel: "مستوى الإتقان",
      levelBeginner: "مبتدئ",
      levelIntermediate: "متوسط",
      levelAdvanced: "متقدم",
      levelFluent: "طليق",
      levelNative: "لغة أم",
      experienceItem: "خبرة",
      educationItem: "مؤهل",
      languageItem: "لغة",
      removeItem: "حذف",
      emptySkills: "أضف أول مهارة من الخانة فوق.",
      emptyExperience: "ما أضفت خبرة إلى الآن.",
      emptyEducation: "ما أضفت مؤهل إلى الآن.",
      emptyLanguages: "ما أضفت لغة إلى الآن.",
      clearForm: "مسح بيانات هذه اللغة",
      memoryNote: "الحفظ تلقائي، والعربي والإنجليزي منفصلين",
      stateEmpty: "ابدأ بكتابة اسمك الكامل.",
      stateProgress: "بداية حلوة — كمّل بقية بياناتك.",
      stateComplete: "ممتاز، بياناتك الأساسية اكتملت.",
      stateCleared: "تم مسح بيانات السيرة العربية.",
      previewLabel: "معاينة السيرة",
      previewTitle: "نسختك الكاملة",
      offlineChip: "حفظ تلقائي",
      resumeName: "اسمك هنا",
      resumeRole: "المسمى الوظيفي",
      summarySection: "نبذة شخصية",
      experienceSection: "الخبرات",
      educationSection: "التعليم",
      skillsSection: "المهارات",
      languagesSection: "اللغات",
      advancedKicker: "تخصيص متقدم",
      advancedTitle: "رتّبها على طريقتك",
      advancedHint: "الترتيب والحفظ يصيرون تلقائي",
      sectionOrderTitle: "ترتيب الأقسام",
      sectionOrderHint: "حرّك القسم فوق أو تحت، أو اخفه من السيرة.",
      customSectionsTitle: "أقسامك الخاصة",
      customSectionsHint: "مثل الدورات، المشاريع، التطوع أو أي قسم تحتاجه.",
      customSectionPlaceholder: "مثال: المشاريع",
      addCustomSection: "إضافة قسم",
      customTitleLabel: "اسم القسم",
      customContentLabel: "محتوى القسم",
      customContentPlaceholder: "اكتب التفاصيل هنا…",
      emptyCustomSections: "ما أضفت قسم خاص إلى الآن.",
      moveUp: "تحريك فوق",
      moveDown: "تحريك تحت",
      hideSection: "إخفاء",
      showSection: "إظهار",
      removeSectionConfirm: "متأكد تبغى تحذف هذا القسم؟",
      clearConfirm: "متأكد تبغى تمسح كل بيانات هذه اللغة؟",
      saveReady: "الحفظ التلقائي جاهز.",
      saveSaving: "جارٍ الحفظ…",
      saveSaved: "تم الحفظ داخل جهازك.",
      saveError: "تعذر الحفظ داخل المتصفح.",
      footerText: "صُمّم ليجعل البداية أسهل.",
      privacyText: "بياناتك لا تغادر جهازك",
      fontLoading: "جارٍ تجهيز الخط المحلي…",
      fontReady: "الخط العربي المحلي جاهز",
      fontError: "تعذر تحميل الخط المحلي",
      openPrototype: "السيرة الذاتية",
      conceptEyebrow: "الفكرة تبدأ من هنا",
      conceptTitle: "سيرة ذاتية مرتبة،<br><span>بدون تعقيد.</span>",
      conceptIntro: "كثير ناس عندهم خبرات ممتازة، لكن يوقفهم سؤال واحد: كيف أرتبها في سيرة واضحة؟",
      stepOneTitle: "اكتب بياناتك",
      stepOneText: "نموذج بسيط وواضح",
      stepTwoTitle: "شاهد النتيجة",
      stepTwoText: "معاينة تتحدث مباشرة",
      stepThreeTitle: "حمّل سيرتك",
      stepThreeText: "ملف PDF جاهز للإرسال",
      sketchForm: "نموذج الإدخال",
      sketchPreview: "صفحة السيرة",
      sketchResult: "PDF",
      sketchCaption: "الفكرة: كل شيء في شاشة واحدة",
      conceptFooter: "من رسم بسيط… إلى أداة يستخدمها أي شخص."
    },
    en: {
      brandAr: "Seerati",
      headerBadge: "Free · Open source",
      eyebrow: "Final release",
      pageTitle: "Your CV, right from your device.",
      pageIntro: "No account or server: write, customize, save locally, and export your file.",
      jumpEditor: "Editor",
      jumpPreview: "Preview",
      formKicker: "Basic details",
      formTitle: "Let’s get to know you",
      completionTitle: "Basic details completion",
      fullNameLabel: "Full name",
      fullNamePlaceholder: "Example: Nora Alotaibi",
      jobTitleLabel: "Job title",
      jobTitlePlaceholder: "Example: UX Designer",
      summaryLabel: "Professional summary",
      summaryHint: "Two or three lines is enough",
      summaryPlaceholder: "Write a short summary about your experience and strengths…",
      phoneLabel: "Phone number",
      phonePlaceholder: "+966 5x xxx xxxx",
      emailLabel: "Email address",
      emailPlaceholder: "name@example.com",
      emailError: "Enter a valid address such as name@example.com",
      designKicker: "CV style",
      designTitle: "Choose the look that fits you",
      designHint: "Change it whenever you like",
      templateLabel: "Template",
      templateProfessional: "Professional",
      templateProfessionalHint: "Clean and structured",
      templateModern: "Modern",
      templateModernHint: "Bold with a color block",
      templateGraduate: "Graduate",
      templateGraduateHint: "Puts education and skills first",
      templateMinimal: "Minimal",
      templateMinimalHint: "Clean and distraction-free",
      templateBold: "Bold",
      templateBoldHint: "A strong, clear heading",
      colorLabel: "Heading color",
      customColorLabel: "Custom",
      densityLabel: "Spacing",
      densityComfortable: "Comfortable",
      densityCompact: "Compact",
      hideEmptyLabel: "Hide empty sections",
      emptySection: "Add details to show this section.",
      printButton: "Print",
      pdfButton: "Download PDF",
      exportPreparing: "One moment, preparing the local Arabic font…",
      exportReady: "Ready to print and download.",
      exportWorking: "Preparing your PDF…",
      exportFailed: "The file could not be created. Please try again.",
      exportFontFailed: "The local font did not load, so export is paused to protect Arabic text.",
      detailsKicker: "CV details",
      detailsTitle: "What makes you stand out?",
      detailsHint: "Add what you need and leave the rest",
      skillsEditorTitle: "Skills",
      skillPlaceholder: "Example: Project management",
      addSkill: "Add skill",
      duplicateSkill: "That skill is already on the list.",
      skillLimit: "You have reached the recommended skill limit.",
      experienceEditorTitle: "Work experience",
      addExperience: "+ Add experience",
      educationEditorTitle: "Education",
      addEducation: "+ Add education",
      languagesEditorTitle: "Languages",
      addLanguage: "+ Add language",
      roleLabel: "Job title",
      companyLabel: "Company or organization",
      startLabel: "From",
      endLabel: "To",
      descriptionLabel: "Responsibilities or achievements",
      degreeLabel: "Degree or major",
      institutionLabel: "School or institution",
      languageNameLabel: "Language",
      levelLabel: "Proficiency",
      levelBeginner: "Beginner",
      levelIntermediate: "Intermediate",
      levelAdvanced: "Advanced",
      levelFluent: "Fluent",
      levelNative: "Native",
      experienceItem: "Experience",
      educationItem: "Education",
      languageItem: "Language",
      removeItem: "Remove",
      emptySkills: "Add your first skill above.",
      emptyExperience: "No experience added yet.",
      emptyEducation: "No education added yet.",
      emptyLanguages: "No language added yet.",
      clearForm: "Clear this language",
      memoryNote: "Auto-saved, with separate Arabic and English data",
      stateEmpty: "Start by entering your full name.",
      stateProgress: "Nice start — complete the rest of your details.",
      stateComplete: "Great, your basic details are complete.",
      stateCleared: "English CV data has been cleared.",
      previewLabel: "CV preview",
      previewTitle: "Your complete version",
      offlineChip: "Auto-saved",
      resumeName: "Your name here",
      resumeRole: "Job title",
      summarySection: "Summary",
      experienceSection: "Experience",
      educationSection: "Education",
      skillsSection: "Skills",
      languagesSection: "Languages",
      advancedKicker: "Advanced customization",
      advancedTitle: "Arrange it your way",
      advancedHint: "Ordering and saving happen automatically",
      sectionOrderTitle: "Section order",
      sectionOrderHint: "Move a section up or down, or hide it from the CV.",
      customSectionsTitle: "Custom sections",
      customSectionsHint: "Courses, projects, volunteering, or anything else you need.",
      customSectionPlaceholder: "Example: Projects",
      addCustomSection: "Add section",
      customTitleLabel: "Section name",
      customContentLabel: "Section content",
      customContentPlaceholder: "Write the details here…",
      emptyCustomSections: "No custom sections added yet.",
      moveUp: "Move up",
      moveDown: "Move down",
      hideSection: "Hide",
      showSection: "Show",
      removeSectionConfirm: "Are you sure you want to remove this section?",
      clearConfirm: "Are you sure you want to clear all data for this language?",
      saveReady: "Auto-save is ready.",
      saveSaving: "Saving…",
      saveSaved: "Saved on your device.",
      saveError: "Your browser could not save the data.",
      footerText: "Designed to make starting easier.",
      privacyText: "Your data stays on your device",
      fontLoading: "Preparing the local font…",
      fontReady: "Local Arabic font is ready",
      fontError: "The local font could not load",
      openPrototype: "CV builder",
      conceptEyebrow: "It starts with an idea",
      conceptTitle: "A polished CV,<br><span>without the hassle.</span>",
      conceptIntro: "Many people have great experience, but one question stops them: how do I organize it into a clear CV?",
      stepOneTitle: "Enter your details",
      stepOneText: "A simple, clear form",
      stepTwoTitle: "See the result",
      stepTwoText: "A preview that updates instantly",
      stepThreeTitle: "Download your CV",
      stepThreeText: "A PDF ready to send",
      sketchForm: "Input form",
      sketchPreview: "CV page",
      sketchResult: "PDF",
      sketchCaption: "The idea: everything on one screen",
      conceptFooter: "From a simple sketch… to a tool anyone can use."
    }
  };

  function activeCv() {
    return appState.cv[appState.ui.language];
  }

  function dictionary() {
    return copy[appState.ui.language];
  }

  function previewText(value) {
    const textValue = String(value || "");
    return appState.ui.language === "ar" ? textValue.replace(/ /g, "\u00a0") : textValue;
  }

  function setSaveStatus(state) {
    const status = document.querySelector("[data-save-status]");
    if (!status) return;
    status.classList.toggle("is-saving", state === "saving");
    status.classList.toggle("is-error", state === "error");
    if (state === "saving") status.textContent = dictionary().saveSaving;
    else if (state === "saved") status.textContent = dictionary().saveSaved;
    else if (state === "error") status.textContent = dictionary().saveError;
    else status.textContent = dictionary().saveReady;
  }

  function saveSoon() {
    window.clearTimeout(saveTimer);
    setSaveStatus("saving");
    saveTimer = window.setTimeout(function () {
      try {
        const stateToSave = {
          ui: {
            language: appState.ui.language,
            template: appState.ui.template,
            accent: appState.ui.accent,
            hideEmpty: appState.ui.hideEmpty,
            density: appState.ui.density
          },
          cv: appState.cv
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
        setSaveStatus("saved");
      } catch (error) {
        setSaveStatus("error");
        console.warn("Seerati: data could not be saved.", error);
      }
    }, 260);
  }

  function translatePage() {
    const words = dictionary();
    document.querySelectorAll("[data-i18n]").forEach(function (element) {
      const key = element.dataset.i18n;
      if (words[key] === undefined) return;
      if (key === "conceptTitle") element.innerHTML = words[key];
      else if (element.closest("[data-live-preview]")) element.textContent = previewText(words[key]);
      else element.textContent = words[key];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (element) {
      const key = element.dataset.i18nPlaceholder;
      if (words[key] !== undefined) element.placeholder = words[key];
    });
  }

  function setLanguage(language) {
    if (!copy[language]) return;
    appState.ui.language = language;
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    translatePage();
    document.querySelectorAll("[data-lang]").forEach(function (button) {
      const active = button.dataset.lang === language;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    applyDesign();
    renderForm();
    renderCollectionEditors();
    refreshFontStatusCopy();
    updateExportUi();
    saveSoon();
  }

  function renderForm() {
    const profile = activeCv().profile;
    document.querySelectorAll("[data-profile-field]").forEach(function (field) {
      field.value = profile[field.dataset.profileField] || "";
      field.removeAttribute("aria-invalid");
      delete field.dataset.touched;
    });
    const emailError = document.querySelector("[data-email-error]");
    if (emailError) emailError.textContent = "";
    updateSummaryCounter();
    updateCompletion();
    renderPreview();
  }

  function updateSummaryCounter() {
    const counter = document.querySelector("[data-summary-counter]");
    if (counter) counter.textContent = activeCv().profile.summary.length + " / 600";
  }

  function updateCompletion(messageType) {
    const profile = activeCv().profile;
    const completed = PROFILE_FIELDS.filter(function (field) {
      return profile[field].trim().length > 0;
    }).length;
    const label = document.querySelector("[data-completion-label]");
    const bar = document.querySelector("[data-completion-bar]");
    const message = document.querySelector("[data-state-message]");
    if (label) label.textContent = completed + " / " + PROFILE_FIELDS.length;
    if (bar) bar.style.width = ((completed / PROFILE_FIELDS.length) * 100) + "%";
    if (!message) return;
    if (messageType === "cleared") message.textContent = dictionary().stateCleared;
    else if (completed === 0) message.textContent = dictionary().stateEmpty;
    else if (completed === PROFILE_FIELDS.length) message.textContent = dictionary().stateComplete;
    else message.textContent = dictionary().stateProgress;
  }

  function validateEmail(emailField, forceMessage) {
    const error = document.querySelector("[data-email-error]");
    if (!emailField || !error) return true;
    const hasValue = emailField.value.trim().length > 0;
    const valid = !hasValue || emailField.validity.valid;
    const show = !valid && (forceMessage || emailField.dataset.touched === "true");
    emailField.setAttribute("aria-invalid", String(show));
    error.textContent = show ? dictionary().emailError : "";
    return valid;
  }

  function element(tag, className, textValue) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (textValue !== undefined) node.textContent = textValue;
    return node;
  }

  function emptyNote(textValue) {
    return element("p", "empty-editor-note", textValue);
  }

  function createEditorField(labelText, value, onInput, options) {
    const settings = options || {};
    const group = element("label", "repeat-field" + (settings.wide ? " wide" : ""));
    group.appendChild(element("span", "", labelText));
    let input;
    if (settings.type === "textarea") {
      input = document.createElement("textarea");
      input.rows = 3;
      input.maxLength = settings.maxLength || 500;
    } else {
      input = document.createElement("input");
      input.type = settings.type || "text";
      input.maxLength = settings.maxLength || 100;
    }
    input.value = value || "";
    input.addEventListener("input", function () {
      onInput(input.value);
      renderPreview();
    });
    group.appendChild(input);
    return group;
  }

  function createSelectField(labelText, value, onChange) {
    const group = element("label", "repeat-field");
    group.appendChild(element("span", "", labelText));
    const select = document.createElement("select");
    ["beginner", "intermediate", "advanced", "fluent", "native"].forEach(function (level) {
      const option = document.createElement("option");
      option.value = level;
      option.textContent = dictionary()["level" + level.charAt(0).toUpperCase() + level.slice(1)];
      select.appendChild(option);
    });
    select.value = value || "intermediate";
    select.addEventListener("change", function () {
      onChange(select.value);
      renderPreview();
    });
    group.appendChild(select);
    return group;
  }

  function createRepeatCard(item, index, kind, fields, removeHandler) {
    const words = dictionary();
    const card = element("article", "repeat-item");
    const heading = element("div", "repeat-item-head");
    heading.appendChild(element("strong", "", words[kind + "Item"] + " " + (index + 1)));
    const remove = element("button", "remove-item", words.removeItem);
    remove.type = "button";
    remove.addEventListener("click", removeHandler);
    heading.appendChild(remove);
    card.appendChild(heading);
    const grid = element("div", "repeat-item-grid");
    fields.forEach(function (field) { grid.appendChild(field); });
    card.appendChild(grid);
    return card;
  }

  function renderSkillsEditor() {
    const container = document.querySelector("[data-skills-editor]");
    if (!container) return;
    container.replaceChildren();
    const skills = activeCv().skills;
    if (!skills.length) {
      container.appendChild(emptyNote(dictionary().emptySkills));
      return;
    }
    skills.forEach(function (skill) {
      const chip = element("span", "editor-chip");
      chip.appendChild(element("span", "", skill.label));
      const remove = element("button", "chip-remove", "×");
      remove.type = "button";
      remove.setAttribute("aria-label", dictionary().removeItem + " " + skill.label);
      remove.addEventListener("click", function () {
        activeCv().skills = activeCv().skills.filter(function (entry) { return entry.id !== skill.id; });
        renderSkillsEditor();
        renderPreview();
      });
      chip.appendChild(remove);
      container.appendChild(chip);
    });
  }

  function renderExperienceEditor() {
    const container = document.querySelector("[data-experiences-editor]");
    if (!container) return;
    container.replaceChildren();
    const items = activeCv().experiences;
    if (!items.length) {
      container.appendChild(emptyNote(dictionary().emptyExperience));
      return;
    }
    items.forEach(function (item, index) {
      const fields = [
        createEditorField(dictionary().roleLabel, item.role, function (value) { item.role = value; }),
        createEditorField(dictionary().companyLabel, item.company, function (value) { item.company = value; }),
        createEditorField(dictionary().startLabel, item.startDate, function (value) { item.startDate = value; }),
        createEditorField(dictionary().endLabel, item.endDate, function (value) { item.endDate = value; }),
        createEditorField(dictionary().descriptionLabel, item.description, function (value) { item.description = value; }, { type: "textarea", wide: true, maxLength: 600 })
      ];
      container.appendChild(createRepeatCard(item, index, "experience", fields, function () {
        activeCv().experiences = activeCv().experiences.filter(function (entry) { return entry.id !== item.id; });
        renderExperienceEditor();
        renderPreview();
      }));
    });
  }

  function renderEducationEditor() {
    const container = document.querySelector("[data-education-editor]");
    if (!container) return;
    container.replaceChildren();
    const items = activeCv().education;
    if (!items.length) {
      container.appendChild(emptyNote(dictionary().emptyEducation));
      return;
    }
    items.forEach(function (item, index) {
      const fields = [
        createEditorField(dictionary().degreeLabel, item.degree, function (value) { item.degree = value; }),
        createEditorField(dictionary().institutionLabel, item.institution, function (value) { item.institution = value; }),
        createEditorField(dictionary().startLabel, item.startDate, function (value) { item.startDate = value; }),
        createEditorField(dictionary().endLabel, item.endDate, function (value) { item.endDate = value; })
      ];
      container.appendChild(createRepeatCard(item, index, "education", fields, function () {
        activeCv().education = activeCv().education.filter(function (entry) { return entry.id !== item.id; });
        renderEducationEditor();
        renderPreview();
      }));
    });
  }

  function renderLanguagesEditor() {
    const container = document.querySelector("[data-languages-editor]");
    if (!container) return;
    container.replaceChildren();
    const items = activeCv().languages;
    if (!items.length) {
      container.appendChild(emptyNote(dictionary().emptyLanguages));
      return;
    }
    items.forEach(function (item, index) {
      const fields = [
        createEditorField(dictionary().languageNameLabel, item.name, function (value) { item.name = value; }),
        createSelectField(dictionary().levelLabel, item.level, function (value) { item.level = value; })
      ];
      container.appendChild(createRepeatCard(item, index, "language", fields, function () {
        activeCv().languages = activeCv().languages.filter(function (entry) { return entry.id !== item.id; });
        renderLanguagesEditor();
        renderPreview();
      }));
    });
  }

  function sectionLabel(sectionId) {
    const labelKeys = {
      summary: "summarySection",
      experience: "experienceSection",
      education: "educationSection",
      skills: "skillsSection",
      languages: "languagesSection"
    };
    if (labelKeys[sectionId]) return dictionary()[labelKeys[sectionId]];
    const custom = activeCv().customSections.find(function (item) { return item.id === sectionId; });
    return custom ? (custom.title.trim() || dictionary().customSectionsTitle) : sectionId;
  }

  function renderSectionOrderEditor() {
    const container = document.querySelector("[data-section-order-list]");
    if (!container) return;
    container.replaceChildren();
    activeCv().sectionOrder.forEach(function (sectionId, index) {
      const row = element("div", "section-order-item");
      const hidden = activeCv().hiddenSections.indexOf(sectionId) >= 0;
      row.classList.toggle("is-hidden", hidden);
      row.appendChild(element("strong", "", sectionLabel(sectionId)));

      const actions = element("div", "order-actions");
      const up = element("button", "", "↑");
      up.type = "button";
      up.disabled = index === 0;
      up.title = dictionary().moveUp;
      up.setAttribute("aria-label", dictionary().moveUp + " " + sectionLabel(sectionId));
      up.addEventListener("click", function () {
        if (index === 0) return;
        const order = activeCv().sectionOrder;
        const previous = order[index - 1];
        order[index - 1] = sectionId;
        order[index] = previous;
        renderSectionOrderEditor();
        renderPreview();
      });

      const down = element("button", "", "↓");
      down.type = "button";
      down.disabled = index === activeCv().sectionOrder.length - 1;
      down.title = dictionary().moveDown;
      down.setAttribute("aria-label", dictionary().moveDown + " " + sectionLabel(sectionId));
      down.addEventListener("click", function () {
        const order = activeCv().sectionOrder;
        if (index >= order.length - 1) return;
        const next = order[index + 1];
        order[index + 1] = sectionId;
        order[index] = next;
        renderSectionOrderEditor();
        renderPreview();
      });

      const visibility = element("button", "", hidden ? "○" : "●");
      visibility.type = "button";
      visibility.title = hidden ? dictionary().showSection : dictionary().hideSection;
      visibility.setAttribute("aria-label", visibility.title + " " + sectionLabel(sectionId));
      visibility.addEventListener("click", function () {
        const hiddenSections = activeCv().hiddenSections;
        const hiddenIndex = hiddenSections.indexOf(sectionId);
        if (hiddenIndex >= 0) hiddenSections.splice(hiddenIndex, 1);
        else hiddenSections.push(sectionId);
        renderSectionOrderEditor();
        renderPreview();
      });

      actions.appendChild(up);
      actions.appendChild(down);
      actions.appendChild(visibility);
      row.appendChild(actions);
      container.appendChild(row);
    });
  }

  function renderCustomSectionsEditor() {
    const container = document.querySelector("[data-custom-sections-editor]");
    if (!container) return;
    container.replaceChildren();
    const items = activeCv().customSections;
    if (!items.length) {
      container.appendChild(emptyNote(dictionary().emptyCustomSections));
      return;
    }

    items.forEach(function (item) {
      const card = element("article", "custom-section-card");
      const head = element("div", "custom-section-head");
      const title = document.createElement("input");
      title.type = "text";
      title.maxLength = 60;
      title.value = item.title;
      title.setAttribute("aria-label", dictionary().customTitleLabel);
      title.addEventListener("input", function () {
        item.title = title.value;
        renderSectionOrderEditor();
        renderPreview();
      });
      const remove = element("button", "remove-item", dictionary().removeItem);
      remove.type = "button";
      remove.addEventListener("click", function () {
        if (!window.confirm(dictionary().removeSectionConfirm)) return;
        activeCv().customSections = activeCv().customSections.filter(function (entry) { return entry.id !== item.id; });
        activeCv().sectionOrder = activeCv().sectionOrder.filter(function (id) { return id !== item.id; });
        activeCv().hiddenSections = activeCv().hiddenSections.filter(function (id) { return id !== item.id; });
        renderCustomSectionsEditor();
        renderSectionOrderEditor();
        renderPreview();
      });
      head.appendChild(title);
      head.appendChild(remove);
      card.appendChild(head);

      const content = document.createElement("textarea");
      content.rows = 4;
      content.maxLength = 1200;
      content.value = item.content;
      content.placeholder = dictionary().customContentPlaceholder;
      content.setAttribute("aria-label", dictionary().customContentLabel);
      content.addEventListener("input", function () {
        item.content = content.value;
        renderPreview();
      });
      card.appendChild(content);
      container.appendChild(card);
    });
  }

  function renderCollectionEditors() {
    renderSkillsEditor();
    renderExperienceEditor();
    renderEducationEditor();
    renderLanguagesEditor();
    renderCustomSectionsEditor();
    renderSectionOrderEditor();
  }

  function previewPlaceholder(field) {
    const placeholders = {
      fullName: dictionary().resumeName,
      jobTitle: dictionary().resumeRole,
      email: dictionary().emailPlaceholder,
      phone: dictionary().phonePlaceholder
    };
    return placeholders[field] || "";
  }

  function pulsePreviewValue(node) {
    if (!node) return;
    node.classList.remove("preview-value-pulse");
    window.requestAnimationFrame(function () {
      node.classList.add("preview-value-pulse");
      window.setTimeout(function () { node.classList.remove("preview-value-pulse"); }, 360);
    });
  }

  function setSectionVisibility(name, visible) {
    const section = document.querySelector('[data-preview-section="' + name + '"]');
    const manuallyHidden = activeCv().hiddenSections.indexOf(name) >= 0;
    if (section) section.hidden = manuallyHidden || (!visible && appState.ui.hideEmpty);
  }

  function renderCustomSectionsPreview() {
    const body = document.querySelector("[data-resume-body]");
    if (!body) return;
    body.querySelectorAll("[data-custom-preview]").forEach(function (section) { section.remove(); });
    activeCv().customSections.forEach(function (item) {
      const section = element("section", "resume-section");
      section.dataset.customPreview = "true";
      section.dataset.previewSection = item.id;
      section.appendChild(element("h3", "", previewText(item.title.trim() || dictionary().customSectionsTitle)));
      section.appendChild(element("p", item.content.trim() ? "custom-preview-content" : "resume-empty-placeholder", previewText(item.content.trim() || dictionary().emptySection)));
      body.appendChild(section);
      setSectionVisibility(item.id, Boolean(item.content.trim()));
    });
  }

  function applySectionOrder() {
    const body = document.querySelector("[data-resume-body]");
    if (!body) return;
    body.querySelectorAll("[data-preview-section]").forEach(function (section) {
      const index = activeCv().sectionOrder.indexOf(section.dataset.previewSection);
      section.style.order = String(index >= 0 ? index : 999);
    });
  }

  function dateRange(startDate, endDate) {
    return [startDate.trim(), endDate.trim()].filter(Boolean).join(" - ");
  }

  function renderProfilePreview(animateField) {
    const profile = activeCv().profile;
    ["fullName", "jobTitle", "email", "phone"].forEach(function (field) {
      const node = document.querySelector('[data-preview-field="' + field + '"]');
      if (!node) return;
      node.textContent = previewText(profile[field].trim() || previewPlaceholder(field));
      if (animateField === field) pulsePreviewValue(node);
    });
    const summary = document.querySelector("[data-preview-summary]");
    if (summary) {
      summary.textContent = previewText(profile.summary.trim() || dictionary().emptySection);
      setSectionVisibility("summary", Boolean(profile.summary.trim()));
      if (animateField === "summary") pulsePreviewValue(summary);
    }
  }

  function renderExperiencesPreview() {
    const container = document.querySelector("[data-preview-experiences]");
    if (!container) return;
    container.replaceChildren();
    const items = activeCv().experiences.filter(function (item) {
      return item.role.trim() || item.company.trim() || item.startDate.trim() || item.endDate.trim() || item.description.trim();
    });
    items.forEach(function (item) {
      const card = element("article", "resume-entry");
      const head = element("div", "resume-entry-head");
      head.appendChild(element("strong", "", previewText(item.role.trim() || item.company.trim())));
      const dates = dateRange(item.startDate, item.endDate);
      card.appendChild(head);
      if (item.role.trim() && item.company.trim()) card.appendChild(element("b", "resume-entry-subtitle", previewText(item.company.trim())));
      if (dates) card.appendChild(element("span", "resume-entry-date", dates));
      if (item.description.trim()) card.appendChild(element("p", "resume-entry-description", previewText(item.description.trim())));
      container.appendChild(card);
    });
    if (!items.length) container.appendChild(element("p", "resume-empty-placeholder", dictionary().emptySection));
    setSectionVisibility("experience", items.length > 0);
  }

  function renderEducationPreview() {
    const container = document.querySelector("[data-preview-education]");
    if (!container) return;
    container.replaceChildren();
    const items = activeCv().education.filter(function (item) {
      return item.degree.trim() || item.institution.trim() || item.startDate.trim() || item.endDate.trim();
    });
    items.forEach(function (item) {
      const card = element("article", "resume-entry");
      const head = element("div", "resume-entry-head");
      head.appendChild(element("strong", "", previewText(item.degree.trim() || item.institution.trim())));
      const dates = dateRange(item.startDate, item.endDate);
      card.appendChild(head);
      if (item.degree.trim() && item.institution.trim()) card.appendChild(element("b", "resume-entry-subtitle", previewText(item.institution.trim())));
      if (dates) card.appendChild(element("span", "resume-entry-date", dates));
      container.appendChild(card);
    });
    if (!items.length) container.appendChild(element("p", "resume-empty-placeholder", dictionary().emptySection));
    setSectionVisibility("education", items.length > 0);
  }

  function renderSkillsPreview() {
    const container = document.querySelector("[data-preview-skills]");
    if (!container) return;
    container.replaceChildren();
    activeCv().skills.forEach(function (skill) {
      container.appendChild(element("span", "resume-skill", previewText(skill.label)));
    });
    if (!activeCv().skills.length) container.appendChild(element("p", "resume-empty-placeholder", dictionary().emptySection));
    setSectionVisibility("skills", activeCv().skills.length > 0);
  }

  function renderLanguagesPreview() {
    const container = document.querySelector("[data-preview-languages]");
    if (!container) return;
    container.replaceChildren();
    const items = activeCv().languages.filter(function (item) { return item.name.trim(); });
    items.forEach(function (item) {
      const row = element("div", "resume-language");
      row.appendChild(element("strong", "", previewText(item.name.trim())));
      const key = "level" + item.level.charAt(0).toUpperCase() + item.level.slice(1);
      row.appendChild(element("span", "", previewText(dictionary()[key])));
      container.appendChild(row);
    });
    if (!items.length) container.appendChild(element("p", "resume-empty-placeholder", dictionary().emptySection));
    setSectionVisibility("languages", items.length > 0);
  }

  function renderPreview(animateField) {
    renderProfilePreview(animateField);
    renderExperiencesPreview();
    renderEducationPreview();
    renderSkillsPreview();
    renderLanguagesPreview();
    renderCustomSectionsPreview();
    applySectionOrder();
    saveSoon();
  }

  function addSkill() {
    const input = document.querySelector("[data-new-skill]");
    const feedback = document.querySelector("[data-skill-feedback]");
    if (!input) return;
    const label = input.value.trim();
    if (!label) return;
    if (activeCv().skills.length >= 20) {
      if (feedback) feedback.textContent = dictionary().skillLimit;
      return;
    }
    const duplicate = activeCv().skills.some(function (skill) {
      return skill.label.toLocaleLowerCase() === label.toLocaleLowerCase();
    });
    if (duplicate) {
      if (feedback) feedback.textContent = dictionary().duplicateSkill;
      return;
    }
    activeCv().skills.push({ id: makeId("skill"), label: label });
    input.value = "";
    if (feedback) feedback.textContent = "";
    renderSkillsEditor();
    renderPreview();
    input.focus();
  }

  function initializeProfileForm() {
    const form = document.querySelector("#profileForm");
    if (!form) return;
    form.querySelectorAll("[data-profile-field]").forEach(function (field) {
      field.addEventListener("input", function () {
        const key = field.dataset.profileField;
        activeCv().profile[key] = field.value;
        if (key === "summary") updateSummaryCounter();
        if (key === "email") validateEmail(field, false);
        updateCompletion();
        renderPreview(key);
      });
      if (field.dataset.profileField === "email") {
        field.addEventListener("blur", function () {
          field.dataset.touched = "true";
          validateEmail(field, true);
        });
      }
    });
  }

  function initializeCollectionButtons() {
    const skillButton = document.querySelector("[data-add-skill]");
    const skillInput = document.querySelector("[data-new-skill]");
    if (skillButton) skillButton.addEventListener("click", addSkill);
    if (skillInput) {
      skillInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          addSkill();
        }
      });
    }

    const experienceButton = document.querySelector("[data-add-experience]");
    if (experienceButton) experienceButton.addEventListener("click", function () {
      activeCv().experiences.push({ id: makeId("experience"), role: "", company: "", startDate: "", endDate: "", description: "" });
      renderExperienceEditor();
      renderPreview();
    });

    const educationButton = document.querySelector("[data-add-education]");
    if (educationButton) educationButton.addEventListener("click", function () {
      activeCv().education.push({ id: makeId("education"), degree: "", institution: "", startDate: "", endDate: "" });
      renderEducationEditor();
      renderPreview();
    });

    const languageButton = document.querySelector("[data-add-language]");
    if (languageButton) languageButton.addEventListener("click", function () {
      activeCv().languages.push({ id: makeId("language"), name: "", level: "intermediate" });
      renderLanguagesEditor();
      renderPreview();
    });

    const customButton = document.querySelector("[data-add-custom-section]");
    const customInput = document.querySelector("[data-new-custom-title]");
    function addCustomSection() {
      if (!customInput) return;
      const title = customInput.value.trim();
      if (!title) {
        customInput.focus();
        return;
      }
      const item = { id: makeId("custom"), title: title, content: "" };
      activeCv().customSections.push(item);
      activeCv().sectionOrder.push(item.id);
      customInput.value = "";
      renderCustomSectionsEditor();
      renderSectionOrderEditor();
      renderPreview();
    }
    if (customButton) customButton.addEventListener("click", addCustomSection);
    if (customInput) {
      customInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          addCustomSection();
        }
      });
    }
  }

  function initializeClearButton() {
    const clearButton = document.querySelector("[data-clear-form]");
    if (!clearButton) return;
    clearButton.addEventListener("click", function () {
      if (!window.confirm(dictionary().clearConfirm)) return;
      appState.cv[appState.ui.language] = createEmptyCv();
      renderForm();
      renderCollectionEditors();
      updateCompletion("cleared");
      const firstField = document.querySelector('[data-profile-field="fullName"]');
      if (firstField) firstField.focus();
    });
  }

  function applyDesign() {
    const paper = document.querySelector("[data-live-preview]");
    if (paper) {
      paper.classList.remove(
        "template-professional",
        "template-modern",
        "template-graduate",
        "template-minimal",
        "template-bold",
        "density-comfortable",
        "density-compact"
      );
      paper.classList.add("template-" + appState.ui.template);
      paper.classList.add("density-" + appState.ui.density);
      paper.style.setProperty("--resume-accent", appState.ui.accent);
    }

    document.querySelectorAll("[data-template]").forEach(function (button) {
      const active = button.dataset.template === appState.ui.template;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    document.querySelectorAll("[data-accent]").forEach(function (button) {
      const active = button.dataset.accent.toLowerCase() === appState.ui.accent.toLowerCase();
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    const hideEmpty = document.querySelector("[data-hide-empty]");
    if (hideEmpty) hideEmpty.checked = appState.ui.hideEmpty;

    const customAccent = document.querySelector("[data-custom-accent]");
    if (customAccent) customAccent.value = appState.ui.accent;

    const density = document.querySelector("[data-density]");
    if (density) density.value = appState.ui.density;
    saveSoon();
  }

  function initializeDesignControls() {
    document.querySelectorAll("[data-template]").forEach(function (button) {
      button.addEventListener("click", function () {
        appState.ui.template = button.dataset.template;
        applyDesign();
      });
    });

    document.querySelectorAll("[data-accent]").forEach(function (button) {
      button.addEventListener("click", function () {
        appState.ui.accent = button.dataset.accent;
        applyDesign();
      });
    });

    const hideEmpty = document.querySelector("[data-hide-empty]");
    if (hideEmpty) {
      hideEmpty.addEventListener("change", function () {
        appState.ui.hideEmpty = hideEmpty.checked;
        renderPreview();
      });
    }

    const customAccent = document.querySelector("[data-custom-accent]");
    if (customAccent) {
      customAccent.addEventListener("input", function () {
        appState.ui.accent = customAccent.value;
        applyDesign();
      });
    }

    const density = document.querySelector("[data-density]");
    if (density) {
      density.addEventListener("change", function () {
        appState.ui.density = density.value === "compact" ? "compact" : "comfortable";
        applyDesign();
      });
    }
  }

  function initializeMobileJump() {
    document.querySelectorAll("[data-scroll-to]").forEach(function (button) {
      button.addEventListener("click", function () {
        const panel = document.querySelector('[data-workspace-panel="' + button.dataset.scrollTo + '"]');
        if (panel) panel.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function refreshFontStatusCopy() {
    document.querySelectorAll("[data-font-status]").forEach(function (status) {
      const label = status.querySelector("[data-font-status-label]");
      if (!label) return;
      if (status.dataset.fontStatus === "ready") label.textContent = dictionary().fontReady;
      else if (status.dataset.fontStatus === "error") label.textContent = dictionary().fontError;
      else label.textContent = dictionary().fontLoading;
    });
  }

  function updateExportUi() {
    const status = document.querySelector("[data-export-status]");
    const buttons = document.querySelectorAll("[data-print-cv], [data-download-pdf]");
    const state = appState.ui.exportState;
    buttons.forEach(function (button) {
      button.disabled = state !== "ready";
    });
    if (!status) return;
    status.classList.toggle("is-ready", state === "ready");
    status.classList.toggle("is-error", state === "error");
    if (state === "ready") status.textContent = dictionary().exportReady;
    else if (state === "working") status.textContent = dictionary().exportWorking;
    else if (state === "error") status.textContent = dictionary().exportFontFailed;
    else if (state === "failed") status.textContent = dictionary().exportFailed;
    else status.textContent = dictionary().exportPreparing;
  }

  function setExportState(state) {
    appState.ui.exportState = state;
    updateExportUi();
  }

  async function prepareLocalFont() {
    const statuses = document.querySelectorAll("[data-font-status]");
    try {
      if (!document.fonts || typeof document.fonts.load !== "function") throw new Error("Font Loading API unavailable");
      const regular = await document.fonts.load('400 16px "Noto Sans Arabic"');
      const bold = await document.fonts.load('700 28px "Noto Sans Arabic"');
      await document.fonts.ready;
      if (!regular.length || !bold.length) throw new Error("Local font file did not load");
      statuses.forEach(function (status) { status.dataset.fontStatus = "ready"; });
      document.documentElement.classList.add("font-is-ready");
      setExportState("ready");
      refreshFontStatusCopy();
      return true;
    } catch (error) {
      statuses.forEach(function (status) { status.dataset.fontStatus = "error"; });
      setExportState("error");
      console.warn("Seerati: local font could not load.", error);
    }
    refreshFontStatusCopy();
    return false;
  }

  function pdfFilename() {
    const fallback = appState.ui.language === "ar" ? "سيرتي" : "Seerati";
    const name = activeCv().profile.fullName.trim() || fallback;
    const arabicMap = {
      ا: "a", أ: "a", إ: "i", آ: "a", ب: "b", ت: "t", ث: "th", ج: "j", ح: "h",
      خ: "kh", د: "d", ذ: "th", ر: "r", ز: "z", س: "s", ش: "sh", ص: "s", ض: "d",
      ط: "t", ظ: "z", ع: "a", غ: "gh", ف: "f", ق: "q", ك: "k", ل: "l", م: "m",
      ن: "n", ه: "h", ة: "h", و: "w", ي: "y", ى: "a", ئ: "y", ؤ: "w", ء: ""
    };
    const readableName = Array.from(name).map(function (letter) {
      return arabicMap[letter] !== undefined ? arabicMap[letter] : letter;
    }).join("");
    const safeName = readableName
      .normalize("NFKD")
      .replace(/[\u0300-\u036f\u064b-\u065f]/g, "")
      .replace(/[^a-zA-Z0-9 _-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60) || "Seerati";
    return safeName + "-" + appState.ui.language.toUpperCase() + ".pdf";
  }

  function initializeExportControls(fontReadyPromise) {
    const printButton = document.querySelector("[data-print-cv]");
    const pdfButton = document.querySelector("[data-download-pdf]");

    if (printButton) {
      printButton.addEventListener("click", async function () {
        const fontReady = await fontReadyPromise;
        if (!fontReady) return;
        await document.fonts.ready;
        window.print();
      });
    }

    if (pdfButton) {
      pdfButton.addEventListener("click", async function () {
        const fontReady = await fontReadyPromise;
        if (!fontReady) return;
        const paper = document.querySelector("[data-live-preview]");
        if (!paper || typeof window.html2pdf !== "function") {
          setExportState("failed");
          return;
        }

        setExportState("working");
        paper.classList.add("is-exporting");
        try {
          await document.fonts.ready;
          await window.html2pdf()
            .set({
              margin: 0,
              filename: pdfFilename(),
              image: { type: "jpeg", quality: 0.98 },
              html2canvas: {
                scale: 2,
                useCORS: false,
                allowTaint: false,
                backgroundColor: "#ffffff",
                logging: false
              },
              jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
              pagebreak: {
                mode: ["css", "legacy"],
                avoid: [".resume-entry", ".resume-section"]
              }
            })
            .from(paper)
            .save();
          setExportState("ready");
        } catch (error) {
          setExportState("failed");
          console.warn("Seerati: PDF export failed.", error);
          window.setTimeout(function () {
            if (appState.ui.exportState === "failed") setExportState("ready");
          }, 4500);
        } finally {
          paper.classList.remove("is-exporting");
        }
      });
    }
  }

  document.querySelectorAll("[data-lang]").forEach(function (button) {
    button.addEventListener("click", function () { setLanguage(button.dataset.lang); });
  });

  initializeProfileForm();
  initializeCollectionButtons();
  initializeClearButton();
  initializeDesignControls();
  initializeMobileJump();
  setLanguage(appState.ui.language);
  const fontReadyPromise = prepareLocalFont();
  initializeExportControls(fontReadyPromise);
})();
