     // ---------- Helpers ----------
function byId(id) {
  return document.getElementById(id);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function round(value, decimals) {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

function dateKey(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  return Math.floor(diff / 86400000);
}

function getWeekDates(reference) {
  const d = new Date(reference);
  d.setHours(0, 0, 0, 0);
  const dow = (d.getDay() + 6) % 7; // Monday = 0
  const monday = new Date(d);
  monday.setDate(d.getDate() - dow);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return day;
  });
}

// ---------- State ----------
const STORAGE_KEY = "paceStudioState";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    return {};
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch (err) {
    // ignore storage errors (e.g. private browsing)
  }
}

const saved = loadState();
saved.daily = saved.daily || {};

function ensureDay(key) {
  if (!saved.daily[key]) {
    saved.daily[key] = {
      words: {},
      vocabDone: false,
      readingDone: false,
      writingWords: 0,
      writingDone: false,
      mathCorrect: 0,
      mathDone: false
    };
  }
  return saved.daily[key];
}

const today = new Date();
const todayKey = dateKey(today);
const todayEntry = ensureDay(todayKey);

// ---------- Content: Vocabulary ----------
const WORD_BANK = [
  { word: "abundant", def: "existing in great quantity", example: "Fresh fruit was abundant at the market stall." },
  { word: "adapt", def: "change to suit new conditions", example: "Animals adapt to survive in the desert heat." },
  { word: "ambiguous", def: "open to more than one meaning", example: "His answer was ambiguous, so we asked him to explain." },
  { word: "analyse", def: "examine something in detail", example: "We had to analyse the results before writing the report." },
  { word: "authentic", def: "genuine and real, not a copy", example: "The museum displayed an authentic Roman coin." },
  { word: "benevolent", def: "kind, caring and generous", example: "The benevolent coach helped every player improve." },
  { word: "collaborate", def: "work together on something", example: "The team decided to collaborate on the science project." },
  { word: "concise", def: "giving information clearly in few words", example: "Her concise summary saved everyone time." },
  { word: "contradict", def: "say the opposite of something", example: "The new evidence seemed to contradict the old theory." },
  { word: "deduce", def: "work something out from evidence", example: "The detective could deduce who left the footprints." },
  { word: "diligent", def: "hardworking and careful", example: "The diligent student finished his homework early." },
  { word: "eloquent", def: "fluent and persuasive in speech", example: "The eloquent captain inspired the whole team." },
  { word: "evaluate", def: "judge the value or quality of something", example: "Coaches evaluate players during every training session." },
  { word: "exaggerate", def: "make something seem bigger than it is", example: "Don't exaggerate the size of the fish you caught." },
  { word: "feasible", def: "possible to do easily", example: "Is it feasible to finish the build by Friday?" },
  { word: "fluctuate", def: "rise and fall irregularly", example: "Scores can fluctuate a lot during a tournament." },
  { word: "hypothesis", def: "a proposed explanation to be tested", example: "Our hypothesis was that plants grow faster in sunlight." },
  { word: "inevitable", def: "certain to happen", example: "A rematch felt inevitable after such a close game." },
  { word: "innovative", def: "introducing new ideas or methods", example: "The innovative design won first prize at the fair." },
  { word: "justify", def: "show or prove something is right", example: "Can you justify your answer with evidence?" },
  { word: "legitimate", def: "allowed by the rules or law", example: "He had a legitimate reason for arriving late." },
  { word: "meticulous", def: "extremely careful and precise", example: "She was meticulous when checking her working." },
  { word: "novel", def: "new and original", example: "The engineer proposed a novel way to build the bridge." },
  { word: "obstacle", def: "something that blocks progress", example: "The fallen branch was an obstacle on the bike trail." },
  { word: "perspective", def: "a particular way of viewing something", example: "Try to see the match from the referee's perspective." },
  { word: "plausible", def: "seeming reasonable or likely true", example: "That's a plausible explanation for the missing homework." },
  { word: "reluctant", def: "unwilling and hesitant", example: "He was reluctant to try the spicy noodles at first." },
  { word: "resilient", def: "able to recover quickly from difficulty", example: "Bamboo is resilient and bends without breaking." },
  { word: "significant", def: "important or noteworthy", example: "There was a significant jump in his fitness scores." },
  { word: "sufficient", def: "enough for a particular purpose", example: "We packed sufficient supplies for the camping trip." },
  { word: "tedious", def: "long, slow and boring", example: "Copying notes by hand can feel tedious." },
  { word: "thorough", def: "complete and careful in every detail", example: "She gave the essay a thorough edit before handing it in." },
  { word: "unanimous", def: "agreed on by everyone", example: "The vote was unanimous in favour of the excursion." },
  { word: "unprecedented", def: "never done or known before", example: "The team reached an unprecedented number of wins." },
  { word: "versatile", def: "able to adapt to many different uses", example: "A versatile athlete can play several positions well." },
  { word: "vivid", def: "producing powerful, clear images in the mind", example: "He gave a vivid description of the thunderstorm." },
  { word: "articulate", def: "expressing thoughts clearly and fluently", example: "She gave an articulate answer to a tricky question." },
  { word: "compromise", def: "an agreement reached by both sides giving a little", example: "The siblings reached a compromise about the TV remote." },
  { word: "persistent", def: "continuing firmly despite difficulty", example: "Her persistent practice paid off at the swim meet." },
  { word: "spontaneous", def: "done without planning, on the spur of the moment", example: "The spontaneous trip to the skate park was so much fun." }
];

function wordsForToday() {
  const group = dayOfYear(today) % 4;
  return WORD_BANK.slice(group * 10, group * 10 + 10);
}

function renderWords() {
  const list = wordsForToday();
  byId("wordGrid").innerHTML = list.map((item, index) => {
    const known = !!todayEntry.words[index];
    return `
      <button class="word-card ${known ? "known" : ""}" data-word-index="${index}" type="button">
        <div class="word-head">
          <strong>${item.word}</strong>
          <span class="check-badge">${known ? "\u2713" : ""}</span>
        </div>
        <span class="word-def">${item.def}</span>
        <span class="word-example">${item.example}</span>
      </button>
    `;
  }).join("");

  byId("wordGrid").querySelectorAll(".word-card").forEach((card) => {
    card.addEventListener("click", () => {
      const index = Number(card.dataset.wordIndex);
      todayEntry.words[index] = !todayEntry.words[index];
      updateVocabStatus();
      saveState();
      renderWords();
      renderProgress();
      renderWeek();
      renderQuestBanner();
    });
  });
}

function updateVocabStatus() {
  const knownCount = Object.values(todayEntry.words).filter(Boolean).length;
  todayEntry.vocabDone = knownCount >= 7;
}

// ---------- Content: Reading & Writing ----------
const READING_PASSAGES = [
  {
    title: "The Fastest Land Animal",
    text: "The cheetah is built for speed. Its long legs, flexible spine and light frame let it reach speeds of over 100 kilometres per hour in just a few seconds. Unlike most cats, a cheetah's claws barely retract, giving it grip like a sprinter's running shoes. But that speed comes at a cost: a cheetah can only sprint for around 20 to 30 seconds before it overheats and needs to rest.",
    questions: [
      "What three features help a cheetah run so fast?",
      "Why do cheetahs stop sprinting after only 20 to 30 seconds?",
      "How are a cheetah's claws different from most other cats?"
    ]
  },
  {
    title: "The Kid Who Built a Rover",
    text: "When Marcus was eleven, he found an old remote-control car in his garage. Instead of throwing it out, he pulled it apart and rebuilt it with a phone-controlled motor and a small camera. He drove it around the backyard, streaming the video to his tablet like a real Mars rover. His teacher saw a video of it and invited him to demonstrate it to the whole school at assembly.",
    questions: [
      "What did Marcus use to control his rover?",
      "Why is his invention compared to a Mars rover?",
      "What happened after his teacher saw the video?"
    ]
  },
  {
    title: "Robots Under the Sea",
    text: "Underwater robots, called ROVs, help scientists explore parts of the ocean that are too deep or dangerous for divers. Fitted with lights, cameras and robotic arms, an ROV is guided from a ship using a long cable. Some ROVs have discovered shipwrecks, new species of fish and even hot vents on the ocean floor where strange creatures live without any sunlight at all.",
    questions: [
      "What does ROV stand for and how is it controlled?",
      "Name two things ROVs have discovered in the ocean.",
      "Why are ROVs used instead of human divers in some places?"
    ]
  }
];

function passageForToday() {
  return READING_PASSAGES[dayOfYear(today) % READING_PASSAGES.length];
}

const WRITING_PROMPTS = [
  "Write about a video game you'd invent. What's the goal, and how do players win?",
  "Describe your ultimate treehouse or cubby. What's inside it, and who's allowed in?",
  "You wake up with one superpower for a single day. What do you choose, and what do you do with it?",
  "Write step-by-step instructions for making your favourite snack, as if teaching a friend.",
  "Persuade a friend to try your favourite sport or hobby. Give them three good reasons.",
  "Write a diary entry from an astronaut's first day exploring Mars.",
  "Describe the most exciting sports moment you've ever played in or watched."
];

function promptForToday() {
  if (typeof saved.promptIndex !== "number") {
    saved.promptIndex = dayOfYear(today) % WRITING_PROMPTS.length;
  }
  return WRITING_PROMPTS[((saved.promptIndex % WRITING_PROMPTS.length) + WRITING_PROMPTS.length) % WRITING_PROMPTS.length];
}

function renderEnglish() {
  const passage = passageForToday();
  byId("readingTitle").textContent = passage.title;
  byId("readingText").textContent = passage.text;
  byId("readingQuestions").innerHTML = passage.questions.map((q) => `<li>${q}</li>`).join("");
  byId("readingBadge").textContent = todayEntry.readingDone ? "\u2713 Marked as read today" : "";

  byId("writingPrompt").textContent = promptForToday();
  byId("writingDraft").value = todayEntry.writingDraft || "";
  updateWordCount();
}

function updateWordCount() {
  const text = byId("writingDraft").value.trim();
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  byId("wordCount").textContent = `${words} ${words === 1 ? "word" : "words"}`;
  return words;
}

// ---------- Content: Maths (Year 7 & 8 question bank) ----------
let currentQuestions = [];

const sin = (deg) => Math.sin((deg * Math.PI) / 180);
const cos = (deg) => Math.cos((deg * Math.PI) / 180);
const tan = (deg) => Math.tan((deg * Math.PI) / 180);

const QUESTION_BANK = {
  algebra: [
    { prompt: "Solve for x: 3x + 7 = 22", answer: 5, help: "Subtract 7 from both sides, then divide by 3.", unit: "" },
    { prompt: "Solve for x: 5x - 4 = 21", answer: 5, help: "Add 4 to both sides, then divide by 5.", unit: "" },
    { prompt: "Solve for x: 2(x + 3) = 16", answer: 5, help: "Expand to 2x + 6 = 16, then solve.", unit: "" },
    { prompt: "Solve for x: x/4 + 2 = 9", answer: 28, help: "Subtract 2, then multiply both sides by 4.", unit: "" },
    { prompt: "If a = 4 and b = 7, find the value of 3a + 2b.", answer: 26, help: "Substitute the values in: 3(4) + 2(7).", unit: "" },
    { prompt: "If x = 6, find the value of 2x^2 - 5.", answer: 67, help: "Square first: 2(36) - 5.", unit: "" },
    { prompt: "Solve for x: 7x = 4x + 18", answer: 6, help: "Subtract 4x from both sides, then divide by 3.", unit: "" },
    { prompt: "Solve for x: 4x + 9 = 3x + 20", answer: 11, help: "Subtract 3x and 9 from both sides.", unit: "" },
    { prompt: "Find the value of 3(x + 5) - 2x when x = 4.", answer: 19, help: "Expand to x + 15, then substitute x = 4.", unit: "" },
    { prompt: "Solve for x: (x - 3)/2 = 5", answer: 13, help: "Multiply both sides by 2, then add 3.", unit: "" },
    { prompt: "If y = 3x - 2 and x = 7, find y.", answer: 19, help: "Substitute x = 7 into the equation.", unit: "" },
    { prompt: "Solve for x: 9 - x = 2x + 3", answer: 2, help: "Add x to both sides, then subtract 3.", unit: "" },
    { prompt: "A number tripled and then increased by 5 equals 29. What is the number?", answer: 8, help: "Write as 3n + 5 = 29, then solve.", unit: "" },
    { prompt: "Solve for x: 2x/3 = 10", answer: 15, help: "Multiply both sides by 3, then divide by 2.", unit: "" },
    { prompt: "If p = 2 and q = 5, find the value of p^2 + q^2.", answer: 29, help: "Square each value, then add.", unit: "" }
  ],
  fractions: [
    { prompt: "What is 3/5 of 40?", answer: 24, help: "Divide 40 by 5, then multiply by 3.", unit: "" },
    { prompt: "What is 45% of 160?", answer: 72, help: "Multiply 160 by 45, then divide by 100.", unit: "" },
    { prompt: "Write 7/8 as a decimal, rounded to 2 decimal places.", answer: 0.88, help: "Divide 7 by 8.", unit: "" },
    { prompt: "A shirt priced at $60 is discounted by 15%. What is the sale price?", answer: 51, help: "Find 15% of 60, then subtract it.", unit: "dollars" },
    { prompt: "18/24 simplifies to what decimal?", answer: 0.75, help: "Simplify to 3/4, then convert to a decimal.", unit: "" },
    { prompt: "Increase $80 by 25%. What is the new amount?", answer: 100, help: "Find 25% of 80, then add it on.", unit: "dollars" },
    { prompt: "What is 2/3 + 1/6? Give your answer as a decimal, rounded to 2 decimals.", answer: 0.83, help: "Use a common denominator of 6, then convert.", unit: "" },
    { prompt: "A recipe uses 3/4 cup of sugar for 6 people. How many cups for 8 people?", answer: 1, help: "Find sugar per person, then multiply by 8.", unit: "cups" },
    { prompt: "What is 120% of 45?", answer: 54, help: "Multiply 45 by 120, then divide by 100.", unit: "" },
    { prompt: "Convert 0.35 to a percentage. Give the number only (e.g. 35 for 35%).", answer: 35, help: "Multiply the decimal by 100.", unit: "" },
    { prompt: "A jacket cost $150 last year. This year it is 20% cheaper. What is this year's price?", answer: 120, help: "Find 20% of 150, then subtract it.", unit: "dollars" },
    { prompt: "What is 5/9 of 81?", answer: 45, help: "Divide 81 by 9, then multiply by 5.", unit: "" },
    { prompt: "If 40% of a number is 32, what is the number?", answer: 80, help: "Divide 32 by 40, then multiply by 100.", unit: "" },
    { prompt: "What is 7/10 - 2/5? Give your answer as a decimal.", answer: 0.3, help: "Convert both to tenths first: 7/10 - 4/10.", unit: "" },
    { prompt: "A test has 25 questions. A student got 92% correct. How many questions did they get right?", answer: 23, help: "Multiply 25 by 0.92, then round.", unit: "" }
  ],
  geometry: [
    { prompt: "Find the area of a rectangle with length 12 cm and width 7 cm.", answer: 84, help: "Area = length x width.", unit: "cm^2" },
    { prompt: "Find the perimeter of a rectangle with length 15 cm and width 9 cm.", answer: 48, help: "Perimeter = 2(length + width).", unit: "cm" },
    { prompt: "Find the area of a triangle with base 10 cm and height 6 cm.", answer: 30, help: "Area = base x height / 2.", unit: "cm^2" },
    { prompt: "Find the circumference of a circle with radius 7 cm. Use pi = 3.14, round to 1 decimal.", answer: 44.0, help: "Circumference = 2 x pi x radius.", unit: "cm" },
    { prompt: "Find the area of a circle with radius 5 cm. Use pi = 3.14, round to 1 decimal.", answer: 78.5, help: "Area = pi x radius^2.", unit: "cm^2" },
    { prompt: "Two angles on a straight line are 65 degrees and x degrees. Find x.", answer: 115, help: "Angles on a straight line add to 180.", unit: "degrees" },
    { prompt: "The angles in a triangle are 40, 65 and x degrees. Find x.", answer: 75, help: "Angles in a triangle add to 180.", unit: "degrees" },
    { prompt: "Find the area of a parallelogram with base 9 cm and height 4 cm.", answer: 36, help: "Area = base x height.", unit: "cm^2" },
    { prompt: "A rectangular prism has length 5 cm, width 3 cm and height 4 cm. Find its volume.", answer: 60, help: "Volume = length x width x height.", unit: "cm^3" },
    { prompt: "Find the area of a trapezium with parallel sides 8 cm and 12 cm, and height 5 cm.", answer: 50, help: "Area = ((a + b) / 2) x height.", unit: "cm^2" },
    { prompt: "The angles in a quadrilateral are 90, 90, 60 and x degrees. Find x.", answer: 120, help: "Angles in a quadrilateral add to 360.", unit: "degrees" },
    { prompt: "Find the surface area of a cube with side length 4 cm.", answer: 96, help: "Surface area = 6 x side^2.", unit: "cm^2" },
    { prompt: "A circle has diameter 10 cm. Find its radius.", answer: 5, help: "Radius = diameter / 2.", unit: "cm" },
    { prompt: "Find the volume of a cylinder with radius 3 cm and height 10 cm. Use pi = 3.14, round to nearest whole number.", answer: 283, help: "Volume = pi x radius^2 x height.", unit: "cm^3" },
    { prompt: "Two complementary angles: one is 34 degrees. Find the other.", answer: 56, help: "Complementary angles add to 90.", unit: "degrees" }
  ],
  pythagoras: [
    { prompt: "A right triangle has shorter sides 3 cm and 4 cm. Find the hypotenuse.", answer: 5, help: "Use a^2 + b^2 = c^2.", unit: "cm" },
    { prompt: "A right triangle has shorter sides 5 cm and 12 cm. Find the hypotenuse.", answer: 13, help: "Use a^2 + b^2 = c^2.", unit: "cm" },
    { prompt: "A right triangle has shorter sides 6 cm and 8 cm. Find the hypotenuse.", answer: 10, help: "Use a^2 + b^2 = c^2.", unit: "cm" },
    { prompt: "A right triangle has shorter sides 8 cm and 15 cm. Find the hypotenuse.", answer: 17, help: "Use a^2 + b^2 = c^2.", unit: "cm" },
    { prompt: "A right triangle has shorter sides 7 cm and 24 cm. Find the hypotenuse.", answer: 25, help: "Use a^2 + b^2 = c^2.", unit: "cm" },
    { prompt: "A right triangle has shorter sides 9 cm and 12 cm. Find the hypotenuse.", answer: 15, help: "Use a^2 + b^2 = c^2.", unit: "cm" },
    { prompt: "A right triangle has hypotenuse 13 cm and one leg 5 cm. Find the other leg.", answer: 12, help: "Rearrange to c^2 - a^2 = b^2.", unit: "cm" },
    { prompt: "A right triangle has hypotenuse 10 cm and one leg 6 cm. Find the other leg.", answer: 8, help: "Rearrange to c^2 - a^2 = b^2.", unit: "cm" },
    { prompt: "A right triangle has hypotenuse 17 cm and one leg 8 cm. Find the other leg.", answer: 15, help: "Rearrange to c^2 - a^2 = b^2.", unit: "cm" },
    { prompt: "A right triangle has hypotenuse 25 cm and one leg 7 cm. Find the other leg.", answer: 24, help: "Rearrange to c^2 - a^2 = b^2.", unit: "cm" },
    { prompt: "A ladder 13 m long leans against a wall. Its base is 5 m from the wall. How high up the wall does it reach?", answer: 12, help: "The ladder is the hypotenuse of a right triangle.", unit: "m" },
    { prompt: "A rectangle has length 12 cm and width 5 cm. Find the length of its diagonal.", answer: 13, help: "The diagonal is the hypotenuse of a right triangle.", unit: "cm" }
  ],
  trigonometry: [
    { prompt: "A right triangle has an angle of 30 degrees and hypotenuse 10 cm. Find the opposite side, rounded to 1 decimal.", answer: round(10 * sin(30), 1), help: "opposite = hypotenuse x sin(angle).", unit: "cm" },
    { prompt: "A right triangle has an angle of 45 degrees and adjacent side 8 cm. Find the opposite side, rounded to 1 decimal.", answer: round(8 * tan(45), 1), help: "opposite = adjacent x tan(angle).", unit: "cm" },
    { prompt: "A right triangle has an angle of 60 degrees and hypotenuse 12 cm. Find the adjacent side, rounded to 1 decimal.", answer: round(12 * cos(60), 1), help: "adjacent = hypotenuse x cos(angle).", unit: "cm" },
    { prompt: "A right triangle has an angle of 40 degrees and adjacent side 15 cm. Find the opposite side, rounded to 1 decimal.", answer: round(15 * tan(40), 1), help: "opposite = adjacent x tan(angle).", unit: "cm" },
    { prompt: "A right triangle has an angle of 50 degrees and hypotenuse 20 cm. Find the opposite side, rounded to 1 decimal.", answer: round(20 * sin(50), 1), help: "opposite = hypotenuse x sin(angle).", unit: "cm" },
    { prompt: "A right triangle has an angle of 25 degrees and opposite side 10 cm. Find the hypotenuse, rounded to 1 decimal.", answer: round(10 / sin(25), 1), help: "hypotenuse = opposite / sin(angle).", unit: "cm" },
    { prompt: "A right triangle has an angle of 35 degrees and adjacent side 9 cm. Find the opposite side, rounded to 1 decimal.", answer: round(9 * tan(35), 1), help: "opposite = adjacent x tan(angle).", unit: "cm" },
    { prompt: "A right triangle has an angle of 55 degrees and hypotenuse 14 cm. Find the adjacent side, rounded to 1 decimal.", answer: round(14 * cos(55), 1), help: "adjacent = hypotenuse x cos(angle).", unit: "cm" },
    { prompt: "A right triangle has an angle of 20 degrees and hypotenuse 18 cm. Find the opposite side, rounded to 1 decimal.", answer: round(18 * sin(20), 1), help: "opposite = hypotenuse x sin(angle).", unit: "cm" },
    { prompt: "A right triangle has an angle of 70 degrees and adjacent side 5 cm. Find the opposite side, rounded to 1 decimal.", answer: round(5 * tan(70), 1), help: "opposite = adjacent x tan(angle).", unit: "cm" },
    { prompt: "A right triangle has an angle of 15 degrees and hypotenuse 30 cm. Find the adjacent side, rounded to 1 decimal.", answer: round(30 * cos(15), 1), help: "adjacent = hypotenuse x cos(angle).", unit: "cm" },
    { prompt: "A right triangle has an angle of 48 degrees and opposite side 11 cm. Find the hypotenuse, rounded to 1 decimal.", answer: round(11 / sin(48), 1), help: "hypotenuse = opposite / sin(angle).", unit: "cm" }
  ]
};

const TOPIC_LIST = ["algebra", "fractions", "geometry", "pythagoras", "trigonometry"];
const questionQueues = {};

function shuffledCopy(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickTopic(selected) {
  if (selected !== "mixed") return selected;
  return TOPIC_LIST[randomInt(0, TOPIC_LIST.length - 1)];
}

function nextQuestion(topic) {
  if (!questionQueues[topic] || questionQueues[topic].length === 0) {
    questionQueues[topic] = shuffledCopy(QUESTION_BANK[topic]);
  }
  return questionQueues[topic].pop();
}

function renderMath() {
  const selected = byId("mathTopic").value;
  const count = Math.min(12, Math.max(4, Number(byId("questionCount").value) || 8));
  currentQuestions = Array.from({ length: count }, () => nextQuestion(pickTopic(selected)));
  byId("questionList").innerHTML = currentQuestions.map((q, index) => `
    <article class="question">
      <div>
        <p><strong>${index + 1}.</strong> ${q.prompt}</p>
        <small>${q.help}</small>
      </div>
      <div class="answer-box">
        <input type="number" step="0.01" aria-label="Answer for question ${index + 1}">
        <button data-check="${index}">Check</button>
        <span class="feedback" id="feedback${index}"></span>
      </div>
    </article>
  `).join("");

  byId("questionList").querySelectorAll("button[data-check]").forEach((button) => {
    button.addEventListener("click", () => checkAnswer(Number(button.dataset.check)));
  });
}

function checkAnswer(index) {
  const question = currentQuestions[index];
  const row = byId("questionList").children[index];
  const input = row.querySelector("input");
  const feedback = byId(`feedback${index}`);
  const value = Number(input.value);

  if (input.value.trim() === "") {
    feedback.textContent = "Try an answer first.";
    feedback.className = "feedback review";
    return;
  }

  const tolerance = Number.isInteger(question.answer) ? 0.01 : 0.06;
  if (Math.abs(value - question.answer) <= tolerance) {
    feedback.textContent = `Correct! ${question.answer} ${question.unit}`;
    feedback.className = "feedback correct";
    todayEntry.mathCorrect = (todayEntry.mathCorrect || 0) + 1;
    todayEntry.mathDone = todayEntry.mathCorrect >= 5;
    saveState();
    renderProgress();
    renderWeek();
    renderQuestBanner();
  } else {
    feedback.textContent = `Review it. Answer: ${question.answer} ${question.unit}`;
    feedback.className = "feedback review";
  }
}

function showAnswers() {
  currentQuestions.forEach((question, index) => {
    const feedback = byId(`feedback${index}`);
    feedback.textContent = `Answer: ${question.answer} ${question.unit}`;
    feedback.className = "feedback";
  });
}

// ---------- Progress, streak & weekly planner ----------
function taskFlags(entry) {
  return {
    vocab: !!entry.vocabDone,
    reading: !!entry.readingDone,
    writing: !!entry.writingDone,
    math: !!entry.mathDone
  };
}

function tasksCompleteCount(entry) {
  const flags = taskFlags(entry);
  return Object.values(flags).filter(Boolean).length;
}

function isDayComplete(entry) {
  return tasksCompleteCount(entry) === 4;
}

function computeStreak() {
  let streak = 0;
  const cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);
  // only count today if it's already fully complete; otherwise start from yesterday
  if (!isDayComplete(ensureDay(dateKey(cursor)))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (true) {
    const key = dateKey(cursor);
    const entry = saved.daily[key];
    if (entry && isDayComplete(entry)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function renderProgress() {
  const knownWords = Object.values(todayEntry.words || {}).filter(Boolean).length;
  const writingWords = updateWordCount();
  const tiles = [
    ["Words checked", knownWords, "of today's 10"],
    ["Writing", writingWords, "words drafted"],
    ["Maths checks", todayEntry.mathCorrect || 0, "correct answers"],
    ["Reading", todayEntry.readingDone ? "Done" : "Ready", "short task"]
  ];
  byId("progressGrid").innerHTML = tiles.map(([label, value, sub]) => `
    <article class="progress-tile">
      <span>${label}</span>
      <strong>${value}</strong>
      <span>${sub}</span>
    </article>
  `).join("");
}

function setTodayLabels() {
  byId("todayLabel").textContent = today.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric"
  });
  const streak = computeStreak();
  const flame = streak > 0 ? "\uD83D\uDD25 " : "";
  byId("streakLabel").textContent = `${flame}${streak} day streak`;
}

const WEEK_DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function renderWeek() {
  const weekDates = getWeekDates(today);
  const first = weekDates[0];
  const last = weekDates[6];
  byId("weekRangeLabel").textContent = `${first.toLocaleDateString(undefined, { month: "short", day: "numeric" })} \u2013 ${last.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;

  byId("weekGrid").innerHTML = weekDates.map((date, i) => {
    const key = dateKey(date);
    const entry = saved.daily[key];
    const flags = entry ? taskFlags(entry) : { vocab: false, reading: false, writing: false, math: false };
    const isToday = key === todayKey;
    const complete = entry ? isDayComplete(entry) : false;
    const classes = ["day-card"];
    if (isToday) classes.push("is-today");
    if (complete) classes.push("is-complete");

    return `
      <button class="${classes.join(" ")}" data-day-key="${key}" type="button">
        <span class="day-name">${WEEK_DAY_NAMES[i]}</span>
        <span class="day-num">${date.getDate()}</span>
        <span class="dot-row">
          <span class="dot ${flags.vocab ? "on" : ""}" title="Vocabulary"></span>
          <span class="dot ${flags.reading ? "on" : ""}" title="Reading"></span>
          <span class="dot ${flags.writing ? "on" : ""}" title="Writing"></span>
          <span class="dot ${flags.math ? "on" : ""}" title="Maths"></span>
        </span>
      </button>
    `;
  }).join("");

  byId("weekGrid").querySelectorAll(".day-card").forEach((card) => {
    card.addEventListener("click", () => {
      const key = card.dataset.dayKey;
      const label = new Date(key).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
      if (key === todayKey) {
        byId("weekInfo").textContent = `Today, ${label}: ${tasksCompleteCount(todayEntry)}/4 quests complete. Keep going!`;
        return;
      }
      const entry = saved.daily[key];
      if (!entry || tasksCompleteCount(entry) === 0) {
        const future = new Date(key) > new Date(todayKey);
        byId("weekInfo").textContent = future
          ? `${label} hasn't happened yet \u2013 come back then!`
          : `No quests were logged on ${label}.`;
        return;
      }
      byId("weekInfo").textContent = `${label}: ${tasksCompleteCount(entry)}/4 quests complete.`;
    });
  });
}

const QUEST_MESSAGES = [
  "Let's get started \u2013 pick a quest below!",
  "Great start! Keep the streak alive.",
  "Halfway there \u2013 you're crushing it today!",
  "One quest to go \u2013 so close!",
  "\uD83C\uDF89 All 4 quests done today. Legend status unlocked!"
];

function renderQuestBanner() {
  const count = tasksCompleteCount(todayEntry);
  byId("questBanner").innerHTML = `
    <span class="quest-icon">${count === 4 ? "\uD83C\uDFC6" : "\u26A1"}</span>
    <span>${QUEST_MESSAGES[count]}</span>
  `;
}

// ---------- Event wiring ----------
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((panel) => panel.classList.remove("active"));
    tab.classList.add("active");
    byId(tab.dataset.tab).classList.add("active");
  });
});

byId("resetVocab").addEventListener("click", () => {
  todayEntry.words = {};
  todayEntry.vocabDone = false;
  saveState();
  renderWords();
  renderProgress();
  renderWeek();
  renderQuestBanner();
});

byId("newPrompt").addEventListener("click", () => {
  saved.promptIndex = (typeof saved.promptIndex === "number" ? saved.promptIndex : 0) + 1;
  saveState();
  renderEnglish();
});

byId("markReadingDone").addEventListener("click", () => {
  todayEntry.readingDone = true;
  saveState();
  renderEnglish();
  renderProgress();
  renderWeek();
  renderQuestBanner();
  setTodayLabels();
});

byId("writingDraft").addEventListener("input", () => {
  todayEntry.writingDraft = byId("writingDraft").value;
  updateWordCount();
});

byId("saveWriting").addEventListener("click", () => {
  const words = updateWordCount();
  todayEntry.writingDraft = byId("writingDraft").value;
  todayEntry.writingWords = words;
  todayEntry.writingDone = words >= 40;
  saveState();
  renderProgress();
  renderWeek();
  renderQuestBanner();
  setTodayLabels();
});

byId("newMath").addEventListener("click", renderMath);
byId("showAnswers").addEventListener("click", showAnswers);
byId("mathTopic").addEventListener("change", renderMath);

byId("clearProgress").addEventListener("click", () => {
  delete saved.daily[todayKey];
  ensureDay(todayKey);
  saveState();
  location.reload();
});

// ---------- Init ----------
setTodayLabels();
renderWeek();
renderWords();
renderEnglish();
renderMath();
renderProgress();
renderQuestBanner();