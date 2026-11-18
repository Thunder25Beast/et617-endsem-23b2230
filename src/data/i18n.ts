// ALL learner-facing interface text lives here, in simple Hindi (Devanagari) and simple English.
// Rule: never say "incorrect" / "गलत जवाब" to the learner — we say "दोबारा सोचते हैं" (let's think again).
// Question text lives next to each question in src/data/questions.ts.
// Placeholders like {n} are filled by fill() in engine/text.ts.

import type { L, Lang, MisTag, Rep, RuleId, SkillId } from "@/engine/types";

export const IDENTITY = "23B2230 | ET 617 End Sem | P4 T1 L2 C1";

export const STR = {
  appName: { hi: "अंक साथी", en: "Ank Saathi" },
  appTag: { hi: "minus नंबरों का दोस्त", en: "Your friend for minus numbers" },
  langSwitch: { hi: "English", en: "हिंदी" },
  langSwitchLabel: { hi: "भाषा बदलो", en: "Change language" },

  // status chip + banner + data
  online: { hi: "Online", en: "Online" },
  slow: { hi: "Slow · धीमा", en: "Slow" },
  offline: { hi: "Offline · ऑफ़लाइन", en: "Offline" },
  netStatus: { hi: "नेट की हालत", en: "Network status" },
  bannerHi: { hi: "नेट धीमा है। ऑफ़लाइन अभ्यास मोड (सेव किए हुए सवाल)।", en: "नेट धीमा है। ऑफ़लाइन अभ्यास मोड (सेव किए हुए सवाल)।" },
  bannerEn: { hi: "", en: "Slow network. Offline practice mode (saved questions)." },
  dataUsed: { hi: "Data used this session (AI)", en: "Data used this session (AI)" },
  demoResponse: { hi: "Demo response", en: "Demo response" },
  aiMade: { hi: "AI ने बनाया", en: "Made by AI" },
  savedQ: { hi: "सेव किया हुआ सवाल", en: "Saved question" },

  // nav
  navLearn: { hi: "सीखो", en: "Learn" },
  navPractice: { hi: "अभ्यास", en: "Practice" },
  navProgress: { hi: "प्रगति", en: "Progress" },
  navAbout: { hi: "About", en: "About" },
  navWho: { hi: "बच्चा बदलो", en: "Switch learner" },

  // who is learning
  whoTitle: { hi: "आज कौन सीख रहा है?", en: "Who is learning today?" },
  whoSub: { hi: "अपने नाम पर tap करो।", en: "Tap your name." },
  whoNone: { hi: "अभी कोई नाम नहीं है। नीचे अपना नाम जोड़ो।", en: "No names yet. Add yours below." },
  addTitle: { hi: "नया बच्चा जोड़ो", en: "Add a new learner" },
  nickname: { hi: "छोटा नाम (nickname)", en: "Nickname" },
  nicknamePh: { hi: "जैसे: Pooja", en: "e.g. Pooja" },
  pickEmoji: { hi: "अपना emoji चुनो", en: "Pick your emoji" },
  addBtn: { hi: "जोड़ो और शुरू करो", en: "Add and start" },
  noPassword: { hi: "कोई email या password नहीं चाहिए। तुम्हारी प्रगति इसी tablet में सेव रहती है।", en: "No email or password. Your progress is saved on this tablet." },
  remove: { hi: "हटाओ", en: "Remove" },
  removeConfirm: { hi: "पक्का हटाना है? सारी प्रगति मिट जाएगी।", en: "Remove for sure? All progress will be deleted." },
  stars: { hi: "तारे", en: "stars" },

  // quick check
  qcTitle: { hi: "छोटी सी जाँच", en: "Quick check" },
  qcIntro: { hi: "4 छोटे सवाल। चलो देखते हैं तुम कहाँ से शुरू करो। कोई नंबर नहीं कटेगा!", en: "4 short questions. Let's see where you should start. No marks!" },
  qcOf: { hi: "सवाल {n} / 4", en: "Question {n} of 4" },
  qc1: { hi: "इस number line पर निशान किस नंबर पर है?", en: "Which number is the marker on?" },
  qc2: { hi: "कौन सा बड़ा है?", en: "Which is greater?" },
  qc3: { hi: "हल करो: {a} - {b} = ?", en: "Solve: {a} - {b} = ?" },
  qc4: { hi: "हल करो: {a} + {b} = ?", en: "Solve: {a} + {b} = ?" },
  qcDone: { hi: "बढ़िया! जाँच पूरी हुई।", en: "Great! Quick check done." },
  qcStart: { hi: "हम शुरू करेंगे: {skill}, लेवल {level}", en: "We will start with: {skill}, level {level}" },
  qcGap: { hi: "पहले number line का छोटा पाठ करेंगे।", en: "First we will do a short number line lesson." },
  qcWhole: { hi: "पूरे नंबरों के घटाने पर भी ध्यान देंगे।", en: "We will also practise whole number subtraction." },
  qcM1: { hi: "छोटा-बड़ा पहचानने पर ध्यान देंगे।", en: "We will focus on which number is bigger." },
  qcGo: { hi: "सीखना शुरू करो", en: "Start learning" },
  qcSkipToPractice: { hi: "सीधा अभ्यास", en: "Go straight to practice" },

  // learn
  learnTitle: { hi: "सीखो", en: "Learn" },
  chunkOf: { hi: "हिस्सा {n} / 3", en: "Part {n} of 3" },
  back: { hi: "पीछे", en: "Back" },
  next: { hi: "आगे", en: "Next" },
  skip: { hi: "छोड़ो", en: "Skip" },
  toPractice: { hi: "अभ्यास शुरू करो", en: "Start practice" },
  keyIdea: { hi: "मुख्य बात", en: "Key idea" },
  letsSee: { hi: "चलो देखते हैं!", en: "Let's see!" },

  la_title: { hi: "minus नंबर: 0 के बाएँ", en: "Minus numbers: left of 0" },
  la_intro: { hi: "Mall की lift याद करो।", en: "Think of a mall lift." },
  la_s1: { hi: "Ground floor = 0।", en: "Ground floor = 0." },
  la_s2: { hi: "नीचे basement: -1, फिर -2।", en: "Below are basements: -1, then -2." },
  la_s3: { hi: "number line पर ये 0 के बाएँ बैठते हैं।", en: "On the number line they sit to the left of 0." },
  la_key: { hi: "minus नंबर हमेशा 0 के बाएँ होते हैं।", en: "Minus numbers are always left of 0." },

  lb_title: { hi: "छोटा-बड़ा: उधार से सोचो", en: "Comparing: think about udhaar" },
  lb_intro: { hi: "उधार (debt) को minus में लिखते हैं।", en: "We write a debt (udhaar) as a minus number." },
  lb_s1: { hi: "₹8 का उधार = -8। ₹3 का उधार = -3।", en: "Owing ₹8 = -8. Owing ₹3 = -3." },
  lb_s2: { hi: "किसका हाल बुरा? जिस पर ₹8 का उधार है!", en: "Who is worse off? The one who owes ₹8!" },
  lb_s3: { hi: "इसलिए -8, -3 से छोटा है: -8 < -3।", en: "So -8 is less than -3: -8 < -3." },
  lb_key: { hi: "number line पर बाएँ वाला नंबर छोटा होता है।", en: "On the number line, the number on the left is smaller." },

  lc_title: { hi: "जोड़ना-घटाना: number line पर चलो", en: "Add and subtract: walk on the number line" },
  lc_intro: { hi: "plus = दाएँ चलो। minus = बाएँ चलो।", en: "Plus = walk right. Minus = walk left." },
  lc_s1: { hi: "5 - (-3): तुम्हारे पास ₹5 हैं।", en: "5 - (-3): you have ₹5." },
  lc_s2: { hi: "₹3 का उधार हट गया (एक minus हटाया)।", en: "A ₹3 debt is removed (a minus is taken away)." },
  lc_s3: { hi: "अब तुम्हारी कीमत ₹8 है।", en: "Now you are worth ₹8." },
  lc_s4: { hi: "number line पर: 5 से 3 कदम दाएँ = 8।", en: "On the number line: 3 steps right from 5 = 8." },
  lc_key: { hi: "minus नंबर घटाना = दाएँ चलना। 5 - (-3) = 8", en: "Subtracting a minus number = moving right. 5 - (-3) = 8" },

  // practice
  practiceTitle: { hi: "अभ्यास", en: "Practice" },
  qNum: { hi: "सवाल {n}", en: "Question {n}" },
  level: { hi: "लेवल", en: "Level" },
  preparing: { hi: "सवाल तैयार हो रहा है…", en: "Getting your question ready…" },
  hint: { hi: "Hint", en: "Hint" },
  hint1: { hi: "Hint 1", en: "Hint 1" },
  hint2: { hi: "Hint 2", en: "Hint 2" },
  noMoreHints: { hi: "दोनों hint देख लिए", en: "Both hints used" },
  lineTool: { hi: "Number line", en: "Number line" },
  lineOn: { hi: "number line दिखाओ", en: "Show number line" },
  lineOff: { hi: "number line छुपाओ", en: "Hide number line" },
  lineAutoNote: { hi: "number line अपने आप चालू की है।", en: "The number line was turned on for you." },
  lineTap: { hi: "line पर tap करके निशान लगाओ। तीर से 1 कदम चलो।", en: "Tap the line to place a marker. Use arrows to move 1 step." },
  marker: { hi: "निशान", en: "Marker" },
  left: { hi: "बाएँ", en: "Left" },
  right: { hi: "दाएँ", en: "Right" },
  why: { hi: "यह सवाल क्यों?", en: "Why this question?" },
  check: { hi: "जाँचो", en: "Check" },
  clear: { hi: "मिटाओ", en: "Clear" },
  minus: { hi: "− minus", en: "− minus" },
  yourAnswer: { hi: "तुम्हारा जवाब", en: "Your answer" },
  tapPlace: { hi: "पहले line पर tap करो", en: "Tap the line first" },
  orderTap: { hi: "नंबरों पर छोटे से बड़े क्रम में tap करो।", en: "Tap the numbers from smallest to largest." },
  orderReset: { hi: "फिर से", en: "Start again" },
  agreeQ: { hi: "क्या यह सही है?", en: "Is this right?" },
  agreeYes: { hi: "हाँ, सही है", en: "Yes, right" },
  agreeNo: { hi: "नहीं, सही नहीं है", en: "No, not right" },
  writeWhy: { hi: "क्यों? अपने शब्दों में लिखो (Hindi या English)", en: "Why? Write in your own words (Hindi or English)" },
  starters: { hi: "शुरुआत के लिए tap करो:", en: "Tap to start a sentence:" },
  chars: { hi: "{n}/200 अक्षर", en: "{n}/200 letters" },
  checking: { hi: "पढ़ रहे हैं…", en: "Reading…" },
  nextQ: { hi: "अगला सवाल", en: "Next question" },
  reteachGo: { hi: "चलो फिर से समझते हैं", en: "Let's understand it again" },
  seeFeedback: { hi: "पूरा समझाओ", en: "Explain more" },
  askDidi: { hi: "दीदी या भैया से पूछो। तुम्हारा जवाब उन्हें दिखाओ।", en: "Ask your didi or bhaiya. Show them your answer." },
  aiJudged: { hi: "AI ने पढ़ा", en: "Read by AI" },
  localJudged: { hi: "tablet ने खुद पढ़ा", en: "Checked on this tablet" },
  wellDone: { hi: "बहुत बढ़िया!", en: "Well done!" },
  thinkAgain: { hi: "दोबारा सोचते हैं", en: "Let's think again" },
  remediationTag: { hi: "आसान अभ्यास", en: "Easy practice" },
  twinTag: { hi: "वैसा ही नया सवाल", en: "Twin question" },
  skillDone: { hi: "सारे लेवल पूरे! अब मिले-जुले सवाल।", en: "All levels done! Now mixed practice." },

  // feedback & re-teach
  fbTitle: { hi: "चलो फिर से समझते हैं", en: "Let's understand it again" },
  fbTitleCorrect: { hi: "शाबाश!", en: "Great work!" },
  fbNone: { hi: "अभी कोई feedback नहीं। पहले एक सवाल करो।", en: "No feedback yet. Try a question first." },
  fbNextTwin: { hi: "अब वैसा ही एक नया सवाल करते हैं।", en: "Now let's do a similar new question." },
  fbNextS0: { hi: "अब number line के 2 आसान सवाल।", en: "Now 2 easy number line questions." },
  miniTitle: { hi: "Number line का छोटा पाठ", en: "A short number line lesson" },
  mini_s1: { hi: "0 बीच में है।", en: "0 is in the middle." },
  mini_s2: { hi: "plus नंबर 0 के दाएँ: 1, 2, 3…", en: "Plus numbers are right of 0: 1, 2, 3…" },
  mini_s3: { hi: "minus नंबर 0 के बाएँ: -1, -2, -3…", en: "Minus numbers are left of 0: -1, -2, -3…" },
  mini_s4: { hi: "lift में: ऊपर के floor plus, basement minus।", en: "In a lift: upper floors are plus, basements are minus." },
  mini_key: { hi: "बाएँ = छोटा, दाएँ = बड़ा।", en: "Left = smaller, right = bigger." },
  goPractice: { hi: "अभ्यास पर चलो", en: "Go to practice" },

  // re-teach: comparing (M1)
  rc_numberline_title: { hi: "Number line से देखो", en: "Look at the number line" },
  rc_numberline_s1: { hi: "{lo} और {hi} को number line पर ढूँढो।", en: "Find {lo} and {hi} on the number line." },
  rc_numberline_s2: { hi: "जो ज़्यादा बाएँ है, वह छोटा है।", en: "The one further left is smaller." },
  rc_numberline_s3: { hi: "{lo} बाएँ है, इसलिए {lo} < {hi}।", en: "{lo} is on the left, so {lo} < {hi}." },
  rc_numberline_key: { hi: "बाएँ = छोटा, दाएँ = बड़ा", en: "Left = smaller, right = bigger" },
  rc_udhaar_title: { hi: "उधार से सोचो", en: "Think about udhaar" },
  rc_udhaar_s1: { hi: "{lo} मतलब ₹{absLo} का उधार।", en: "{lo} means owing ₹{absLo}." },
  rc_udhaar_s2: { hi: "{hi} मतलब {hiMeaning}।", en: "{hi} means {hiMeaning}." },
  rc_udhaar_s3: { hi: "₹{absLo} का उधार ज़्यादा बुरा है। इसलिए {lo} छोटा है।", en: "Owing ₹{absLo} is worse. So {lo} is smaller." },
  rc_udhaar_key: { hi: "ज़्यादा उधार = छोटा नंबर", en: "More debt = smaller number" },
  rc_lift_title: { hi: "Lift से सोचो", en: "Think about the lift" },
  rc_lift_s1: { hi: "Ground floor 0 है। basement 0 से नीचे हैं।", en: "Ground floor is 0. Basements are below 0." },
  rc_lift_s2: { hi: "floor {lo}, floor {hi} से भी नीचे है।", en: "Floor {lo} is even lower than floor {hi}." },
  rc_lift_s3: { hi: "जो ज़्यादा नीचे, वह छोटा: {lo} < {hi}।", en: "Lower means smaller: {lo} < {hi}." },
  rc_lift_key: { hi: "नीचे = छोटा", en: "Lower = smaller" },
  owingPrefix: { hi: "₹{n} का उधार", en: "owing ₹{n}" },
  havingPrefix: { hi: "₹{n} पास में", en: "having ₹{n}" },
  nothing: { hi: "न उधार, न पैसा", en: "no money, no debt" },

  // re-teach: arithmetic (M1 sign dropped / M2)
  ra_numberline_title: { hi: "Number line पर चलकर देखो", en: "Walk it on the number line" },
  ra_numberline_s1: { hi: "{a} पर खड़े हो जाओ।", en: "Stand on {a}." },
  ra_numberline_s2: { hi: "{move}", en: "{move}" },
  ra_numberline_s3: { hi: "तुम {ans} पर पहुँचे।", en: "You reach {ans}." },
  ra_udhaar_title: { hi: "उधार की कहानी", en: "The udhaar story" },
  ra_udhaar_s1: { hi: "शुरू में: {start}।", en: "At the start: {start}." },
  ra_udhaar_s2: { hi: "{action}", en: "{action}" },
  ra_udhaar_s3: { hi: "अब: {ans}।", en: "Now: {ans}." },
  ra_lift_title: { hi: "Lift से सोचो", en: "Think about the lift" },
  ra_lift_s1: { hi: "Lift floor {a} पर है।", en: "The lift is on floor {a}." },
  ra_lift_s2: { hi: "{liftMove}", en: "{liftMove}" },
  ra_lift_s3: { hi: "अब lift floor {ans} पर है।", en: "Now the lift is on floor {ans}." },
  moveRight: { hi: "{n} कदम दाएँ चलो।", en: "Walk {n} steps right." },
  moveLeft: { hi: "{n} कदम बाएँ चलो।", en: "Walk {n} steps left." },
  moveSubNeg: { hi: "minus नंबर घटाना = उल्टा घूमो। {n} कदम दाएँ चलो।", en: "Subtracting a minus number = turn around. Walk {n} steps right." },
  actGet: { hi: "₹{n} मिले।", en: "You get ₹{n}." },
  actBorrow: { hi: "₹{n} का और उधार लिया।", en: "You borrow ₹{n} more." },
  actSpend: { hi: "₹{n} खर्च हो गए।", en: "You spend ₹{n}." },
  actRemoveDebt: { hi: "₹{n} का उधार हट गया! अच्छी खबर।", en: "A ₹{n} debt is removed! Good news." },
  liftUp: { hi: "lift {n} floor ऊपर गई।", en: "The lift goes up {n} floors." },
  liftDown: { hi: "lift {n} floor नीचे गई।", en: "The lift goes down {n} floors." },
  liftCancelDown: { hi: "{n} floor नीचे जाना cancel हुआ, यानी {n} floor ऊपर।", en: "Going down {n} floors is cancelled, so it goes up {n} floors." },
  ra_key_add: { hi: "plus नंबर जोड़ो = दाएँ। minus नंबर जोड़ो = बाएँ।", en: "Add a plus number = right. Add a minus number = left." },
  ra_key_sub: { hi: "plus नंबर घटाओ = बाएँ। minus नंबर घटाओ = दाएँ।", en: "Subtract a plus number = left. Subtract a minus number = right." },

  // progress
  progTitle: { hi: "मेरी प्रगति", en: "My progress" },
  starsEarned: { hi: "{n} तारे मिले", en: "{n} stars earned" },
  attemptsDone: { hi: "{n} सवाल किए, {c} सही", en: "{n} questions done, {c} right" },
  lastDecisions: { hi: "पिछले 10 फ़ैसले (और क्यों)", en: "Last 10 decisions (and why)" },
  noDecisions: { hi: "अभी कोई फ़ैसला नहीं। अभ्यास शुरू करो!", en: "No decisions yet. Start practising!" },
  download: { hi: "पूरा log डाउनलोड करो (JSON)", en: "Download full event log (JSON)" },
  nowAt: { hi: "अभी: {skill}, लेवल {level}", en: "Now: {skill}, level {level}" },
  doneSkill: { hi: "पूरा", en: "done" },
  redoCheck: { hi: "जाँच फिर से करो", en: "Redo quick check" },

  // about
  aboutTitle: { hi: "About", en: "About" },
  aboutToken: { hi: "पहचान", en: "Identity" },
  aboutCard: { hi: "Card", en: "Card" },
  cardP: { hi: "P4: सवाल अपने आप बनाने वाला adaptive tutor", en: "P4: adaptive tutor with automatic question generation" },
  cardT: { hi: "T1: Class 7 पूर्णांक (integers) — minus नंबरों के साथ जोड़-घटाना", en: "T1: Class 7 integers — operations with negative numbers" },
  cardL: { hi: "L2: Pooja Jadhav, 12 साल, Class 7", en: "L2: Pooja Jadhav, 12, Class 7" },
  cardC: { hi: "C1: कम internet (low bandwidth)", en: "C1: low bandwidth" },
  personaTitle: { hi: "यह किसके लिए है", en: "Who it is for" },
  persona1: { hi: "Pooja, 12, Mumbai की बस्ती से, Hindi medium Class 7, पहली पीढ़ी की learner।", en: "Pooja, 12, from a Mumbai settlement, Hindi medium Class 7, first-generation learner." },
  persona2: { hi: "NGO centre में 2-3 बच्चों के साथ एक tablet, लगभग 20 मिनट। घर पर maths में मदद नहीं।", en: "Shares one tablet with 2–3 children at an NGO centre for ~20 minutes. No maths help at home." },
  persona3: { hi: "उलझन: -8 को -3 से बड़ा मानना (M1), और 5 - (-3) = 2 सोचना (M2)।", en: "Confusions: thinks -8 > -3 (M1) and 5 - (-3) = 2 (M2)." },
  aiTitle: { hi: "AI क्या करता है", en: "What the AI does" },
  ai1: { hi: "नए सवाल बनाता है (सिर्फ़ नंबर और शब्द)। सही जवाब हमेशा app खुद निकालता है।", en: "Writes new questions (numbers and words only). The app always computes the correct answer itself." },
  ai2: { hi: "बच्चे की लिखी बात पढ़कर बताता है: sound, M1, M2, partial या unclear।", en: "Reads the learner's explanation and labels it: sound, M1, M2, partial or unclear." },
  ai3: { hi: "हर call: 8 सेकंड की सीमा, 2 KB से छोटा, दोबारा कोशिश नहीं।", en: "Every call: 8 second limit, under 2 KB, no retry." },
  aiFailTitle: { hi: "AI न चले तो", en: "When the AI fails" },
  aiFail1: { hi: "app चुपचाप सेव किए हुए सवालों पर चलता है और ऊपर पट्टी दिखाता है।", en: "The app silently switches to saved questions and shows a banner." },
  aiFail2: { hi: "लिखी बात को tablet खुद keywords से जाँचता है। AI और tablet की राय न मिले तो: 'दीदी या भैया से पूछो'।", en: "The tablet checks explanations with keywords. If AI and tablet disagree: 'Ask didi or bhaiya'." },
  simSlow: { hi: "Simulate slow network (AI बंद, fallback चालू)", en: "Simulate slow network (forces the fallback)" },
  demoMode: { hi: "Demo mode (रिकॉर्ड किए AI जवाब)", en: "Demo mode (recorded AI responses)" },
  demoNote: { hi: "Demo mode में net इस्तेमाल नहीं होता। जवाबों पर 'Demo response' लिखा आता है।", en: "Demo mode uses no network. Answers are labelled 'Demo response'." },
  libsTitle: { hi: "इस्तेमाल हुई libraries", en: "Libraries used" },
  libs: { hi: "React, TanStack Router/Start, Tailwind CSS, vite-plugin-pwa (Workbox service worker)। कोई चित्र, video, audio या web font नहीं।", en: "React, TanStack Router/Start, Tailwind CSS, vite-plugin-pwa (Workbox service worker). No images, video, audio or web fonts." },
  offlineTitle: { hi: "बिना net के", en: "Without internet" },
  offlineText: { hi: "पहली बार खुलने के बाद पूरा app बिना net के चलता है (published app में)।", en: "After the first load the whole app works with no internet (in the published app)." },
} satisfies Record<string, L>;

export type StrKey = keyof typeof STR;

export const SKILL_NAMES: Record<SkillId, L> = {
  S0: { hi: "Number line पर पढ़ना", en: "Read the number line" },
  S1: { hi: "छोटा-बड़ा (Order and compare)", en: "Order and compare" },
  S2: { hi: "जोड़ (Add)", en: "Add" },
  S3: { hi: "घटाना (Subtract)", en: "Subtract" },
};

export const REP_NAMES: Record<Rep, L> = {
  numberline: { hi: "number line पर चलना", en: "a number line jump" },
  udhaar: { hi: "उधार की कहानी", en: "the udhaar story" },
  lift: { hi: "lift के floors", en: "lift floors" },
};

export const TAG_DESC: Record<MisTag, L> = {
  M1: { hi: "minus का निशान छूट गया / बड़ा अंक = बड़ा नंबर", en: "minus sign ignored / bigger digit = bigger number" },
  M2: { hi: "घटाने से हमेशा छोटा होता है", en: "subtraction always makes smaller" },
};

export const RULE_NAMES: Record<RuleId, L> = {
  START: { hi: "शुरुआत", en: "Start" },
  PREREQ: { hi: "पहले की बात (number line)", en: "Prerequisite" },
  ALT: { hi: "दूसरी तरह समझाया", en: "Alternative explanation" },
  HARDER: { hi: "मुश्किल सवाल", en: "Harder" },
  SAME: { hi: "वही लेवल, नया सवाल", en: "Same level, new variant" },
  REMEDIATION: { hi: "आसान अभ्यास", en: "Easy practice" },
  RETURN: { hi: "वापसी", en: "Return" },
};

/** Reason sentences for the decision rule (shown in "Why this question?" and My progress). */
export const REASONS = {
  start: { hi: "Quick check के हिसाब से शुरुआत: {skill}, लेवल {level}।", en: "Starting at {skill}, level {level} from your quick check." },
  startNoCheck: { hi: "पहला सवाल: {skill}, लेवल {level}।", en: "First question: {skill}, level {level}." },
  prereqGap: { hi: "Quick check में number line पर जगह पहचानने में दिक्कत दिखी, इसलिए पहले number line का छोटा पाठ।", en: "The quick check showed a number line position gap, so first a short number line lesson." },
  prereq3: { hi: "लगातार {n} बार दोबारा सोचना पड़ा, इसलिए पहले number line का छोटा पाठ और 2 आसान सवाल।", en: "{n} answers in a row needed rethinking, so a short number line lesson and 2 easy tasks first." },
  prereqAfterAlt: { hi: "दूसरी तरह समझाने के बाद भी {tag} वाली सोच दिखी, इसलिए number line से फिर शुरू।", en: "{tag} showed up again after an alternative explanation, so back to the number line basics." },
  alt: { hi: "{tag} वाली सोच दिखी ({desc}), इसलिए {rep} से समझाया और वैसा ही नया सवाल।", en: "{tag} seen ({desc}), so explained with {rep}, then a twin question with new numbers." },
  harder: { hi: "मुश्किल सवाल क्योंकि {n} सही, {h} hint, तेज़ ({secs})।", en: "Harder question because {n} correct, {h} hint(s), fast ({secs})." },
  harderSound: { hi: " लिखी बात भी सही थी।", en: " The explanation was sound too." },
  levelUp: { hi: " अब लेवल {level}।", en: " Now level {level}." },
  nextSkill: { hi: " अब नई skill: {skill}।", en: " Next skill: {skill}." },
  allDone: { hi: " सारे लेवल पूरे, मिले-जुले सवाल।", en: " All levels done, mixed practice." },
  same: { hi: "उसी लेवल पर नया सवाल।", en: "Same level, new variant." },
  sameNotYet: { hi: " (मुश्किल सवाल के लिए 2 सही, कम hint और तेज़ जवाब चाहिए।)", en: " (Harder needs 2 correct, few hints and quick answers.)" },
  sameSlow: { hi: " जवाब में {s} सेकंड लगे।", en: " The answer took {s} seconds." },
  sameExplain: { hi: " लिखी बात पूरी साफ़ नहीं थी।", en: " The explanation was not fully clear." },
  autoLineHints: { hi: " 2 hint लिए, इसलिए number line अपने आप चालू।", en: " 2 hints were used, so the number line is on." },
  autoLineSkipped: { hi: " सीखो वाला हिस्सा छोड़ा था, इसलिए number line चालू।", en: " The Learn part was skipped, so the number line is on." },
  remediation: { hi: "आसान number line सवाल ({n} / {total})।", en: "Easy number line task ({n} of {total})." },
  returned: { hi: "आसान सवाल पूरे! वापस {skill}, लेवल {level} पर।", en: "Easy tasks done! Back to {skill}, level {level}." },
  profileM1: { hi: " Quick check में छोटा-बड़ा वाली उलझन दिखी थी, इसलिए compare/order सवाल।", en: " The quick check showed a comparing confusion, so compare/order questions." },
} satisfies Record<string, L>;

/** Generic feedback for AI-made questions (they have no authored feedback). */
export const GENERIC_FEEDBACK = {
  correct: { hi: "बहुत बढ़िया! जवाब {ans} है।", en: "Well done! The answer is {ans}." },
  M1: { hi: "दोबारा सोचते हैं। minus का निशान ध्यान से देखो। जवाब {ans} है।", en: "Let's think again. Look carefully at the minus sign. The answer is {ans}." },
  M2: { hi: "दोबारा सोचते हैं। minus नंबर घटाने से नंबर बढ़ता है। जवाब {ans} है।", en: "Let's think again. Subtracting a minus number makes it bigger. The answer is {ans}." },
  other: { hi: "दोबारा सोचते हैं। number line पर चलकर देखो। जवाब {ans} है।", en: "Let's think again. Walk it on the number line. The answer is {ans}." },
} satisfies Record<string, L>;

/** Sentence starters shown as tap chips under the explanation box. */
export const STARTERS: Record<MisTag, L[]> = {
  M1: [
    { hi: "नहीं, सही नहीं है, क्योंकि ", en: "No, not right, because " },
    { hi: "number line पर ", en: "On the number line " },
    { hi: "उधार सोचो: ", en: "Think about udhaar: " },
  ],
  M2: [
    { hi: "नहीं, सही नहीं है, क्योंकि ", en: "No, not right, because " },
    { hi: "उधार हट गया, तो ", en: "The debt is removed, so " },
    { hi: "number line पर ", en: "On the number line " },
  ],
};

export function tr(key: StrKey, lang: Lang): string {
  return STR[key][lang];
}
