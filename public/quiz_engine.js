/**
 * Official Zahira National College A/L Science Portal
 * Synchronized Multi-Subject Wednesday Examination Engine
 * Supports: Physics, Combined Mathematics, Chemistry, and ICT
 * 
 * Cryptographically binds all students sitting any subject on Wednesday
 * to the exact same 100 questions using the weekly seed.
 */

const SUBJECTS_DATA = {
  physics: {
    id: "physics",
    name: "Physics",
    shortName: "Physics",
    icon: "bolt",
    emoji: "⚛️",
    color: "maroon",
    bgClass: "bg-maroon",
    textClass: "text-maroon",
    badgeClass: "bg-maroon/10 text-maroon border-maroon/30",
    description: "Sri Lankan G.C.E. A/L Physics: Mechanics, Waves, Thermal, Fields, Electricity, Electronics & Modern Physics.",
    units: (typeof PHYSICS_UNITS !== "undefined") ? PHYSICS_UNITS : [],
    getQuestions: (u) => (typeof ALL_PHYSICS_QUESTIONS !== "undefined" ? ALL_PHYSICS_QUESTIONS[u] : [])
  },
  combined_maths: {
    id: "combined_maths",
    name: "Combined Mathematics",
    shortName: "Combined Maths",
    icon: "calculate",
    emoji: "📐",
    color: "blue",
    bgClass: "bg-blue-600",
    textClass: "text-blue-700",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
    description: "Sri Lankan G.C.E. A/L Combined Maths: Pure Maths (Algebra, Trig, Coordinate Geometry, Calculus) and Applied Maths (Statics, Dynamics, Probability).",
    units: (typeof COMBINED_MATHS_UNITS !== "undefined") ? COMBINED_MATHS_UNITS : [],
    getQuestions: (u) => (typeof ALL_COMBINED_MATHS_QUESTIONS !== "undefined" ? ALL_COMBINED_MATHS_QUESTIONS[u] : [])
  },
  chemistry: {
    id: "chemistry",
    name: "Chemistry",
    shortName: "Chemistry",
    icon: "science",
    emoji: "🧪",
    color: "emerald",
    bgClass: "bg-emerald-600",
    textClass: "text-emerald-700",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    description: "Sri Lankan G.C.E. A/L Chemistry: General, Physical, Inorganic s/p/d block, and Organic Chemistry reaction mechanisms.",
    units: (typeof CHEMISTRY_UNITS !== "undefined") ? CHEMISTRY_UNITS : [],
    getQuestions: (u) => (typeof ALL_CHEMISTRY_QUESTIONS !== "undefined" ? ALL_CHEMISTRY_QUESTIONS[u] : [])
  },
  ict: {
    id: "ict",
    name: "Information & Communication Technology",
    shortName: "ICT",
    icon: "terminal",
    emoji: "💻",
    color: "indigo",
    bgClass: "bg-indigo-600",
    textClass: "text-indigo-700",
    badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
    description: "Sri Lankan G.C.E. A/L ICT: Logic Gates, Operating Systems, Networking, SQL Databases, Python Programming, and Web Technologies.",
    units: (typeof ICT_UNITS !== "undefined") ? ICT_UNITS : [],
    getQuestions: (u) => (typeof ALL_ICT_QUESTIONS !== "undefined" ? ALL_ICT_QUESTIONS[u] : [])
  }
};

/**
 * Returns 100 synchronized questions for the Wednesday exam:
 * Signature:
 *   getSynchronizedWednesdayQuestions(subjectId, unitId, weeklySeed)
 * Backward-compatible signature:
 *   getSynchronizedWednesdayQuestions(unitId, weeklySeed) => defaults to 'physics'
 */
function getSynchronizedWednesdayQuestions(arg1, arg2, arg3) {
  let subjectId = "physics";
  let unitId = "all";
  let weeklySeed = 84920194;

  if (arg3 !== undefined) {
    subjectId = arg1 || "physics";
    unitId = arg2 !== undefined ? arg2 : "all";
    weeklySeed = Number(arg3) || 84920194;
  } else if (arg2 !== undefined) {
    if (SUBJECTS_DATA[arg1]) {
      subjectId = arg1;
      unitId = "all";
      weeklySeed = Number(arg2) || 84920194;
    } else {
      // (unitId, weeklySeed)
      subjectId = (window.STATE && window.STATE.selectedSubjectId) ? window.STATE.selectedSubjectId : "physics";
      unitId = arg1;
      weeklySeed = Number(arg2) || 84920194;
    }
  } else if (arg1 !== undefined) {
    unitId = arg1;
    weeklySeed = (window.STATE && window.STATE.wednesdayConfig && window.STATE.wednesdayConfig.seed)
      ? window.STATE.wednesdayConfig.seed
      : 84920194;
  }

  const subject = SUBJECTS_DATA[subjectId] || SUBJECTS_DATA.physics;
  let basePool = [];

  // Subject-specific salt for deterministic shuffling
  const subjectSalt = {
    physics: 10007,
    combined_maths: 29401,
    chemistry: 48197,
    ict: 67399
  }[subjectId] || 11113;

  // Collect base pool of questions
  if (unitId === "all" || unitId === "0" || unitId === 0) {
    for (let u = 1; u <= 8; u++) {
      const unitQs = subject.getQuestions(u) || [];
      const shuffledUnitQs = seededShuffle(unitQs, weeklySeed + subjectSalt + u * 17929);
      basePool.push(...shuffledUnitQs);
    }
  } else {
    const numId = parseInt(unitId, 10) || 1;
    const rawQs = subject.getQuestions(numId) || [];
    basePool = [...rawQs];
  }

  // Check if a question has been reported by students or administrators
  function isQuestionReported(q) {
    if (!q) return false;
    let reportedList = [];
    try {
      if (window.STATE && Array.isArray(window.STATE.reportedQuestions)) {
        reportedList = window.STATE.reportedQuestions;
      } else {
        reportedList = JSON.parse(localStorage.getItem("zsp_reported_questions") || "[]");
      }
    } catch (e) {
      reportedList = [];
    }

    const qId = q.id || (q.source ? `${q.source}_${q.q}` : q.q);
    const cleanStem = (q.q || "").replace(/^\[.*?\]\s*/, "").trim().toLowerCase();

    return reportedList.some(r => {
      if (r.status === "DISMISSED") return false;
      if (r.questionId && r.questionId === qId) return true;
      const rStem = (r.questionText || "").replace(/^\[.*?\]\s*/, "").trim().toLowerCase();
      return rStem === cleanStem;
    });
  }

  // Shuffle the candidate questions deterministically using this week's paperSeed
  const unitModifier = (typeof unitId === "number" || !isNaN(parseInt(unitId, 10)))
    ? (parseInt(unitId, 10) * 7919)
    : 88843;
  const paperSeed = (weeklySeed + subjectSalt + unitModifier) >>> 0;
  const randomizedQuestions = seededShuffle(basePool, paperSeed);

  // Strict deduplication & reported question exclusion:
  // Guarantees NO question with the same stem is EVER repeated in the quiz!
  const seenStems = new Set();
  const distinctPool = [];
  for (const q of randomizedQuestions) {
    if (isQuestionReported(q)) continue;
    const cleanStem = (q.q || "").replace(/^\[.*?\]\s*/, "").trim().toLowerCase();
    if (!seenStems.has(cleanStem)) {
      seenStems.add(cleanStem);
      distinctPool.push(q);
    }
  }

  // Take distinct questions without repeating
  const countToTake = (unitId === "all" || unitId === "0" || unitId === 0)
    ? Math.min(100, distinctPool.length)
    : Math.min(30, distinctPool.length);

  const finalQuestions = distinctPool.slice(0, countToTake);
  const subCode = subjectId.toUpperCase().replace("_", "").substring(0, 4);

  return finalQuestions.map((q, idx) => {
    return {
      ...q,
      id: q.id || `${subjectId}_u${unitId}_q${idx + 1}`,
      subjectId: subjectId,
      subjectName: subject.name,
      displayNumber: idx + 1,
      paperCode: `WED-${subCode}-${weeklySeed}`
    };
  });
}
