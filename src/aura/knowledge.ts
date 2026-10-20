import { Phase } from '../utils/prediction';
import { parseISO } from '../utils/date';

export type AuraCtx = {
  cycleDay: number;
  phase: Phase;
  daysUntilNextPeriod: number;
  cycleLength: number;
  periodLength: number;
  nextPeriodStart: string;
  ovulationDate: string;
  fertileStart: string;
  fertileEnd: string;
  recentSymptoms: string[];
};

export type AuraInput = {
  text: string;
  ctx: AuraCtx | null;
  dataEnabled: boolean;
  hasData: boolean;
};

export type AuraReply = { text: string; suggestions?: string[] };

export const DISCLAIMER = `Aura shares general information, not medical advice, and cannot diagnose anything. For severe or worrying symptoms, please see a doctor.`;

export const STARTERS = [
  'What phase am I in?',
  'When is my next period?',
  'Self-care for today',
  'Why do I get cramps?',
  'Is my cycle normal?',
];

export const WELCOME_TEXT = `Hi, I'm Aura, your private cycle companion. I run entirely on your phone, so our chats never leave this device.\n\nI can explain your cycle, answer common period questions and suggest gentle self-care. Switch on "Use my cycle data" above if you'd like answers based on your logs.\n\nI'm not a doctor, so for severe or worrying symptoms please see one.`;

// ---------- helpers ----------
const fmt = (iso: string) =>
  parseISO(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;
const bullets = (items: string[]) => items.map((i) => `- ${i}`).join('\n');
const r = (text: string, suggestions?: string[]): AuraReply => ({ text, suggestions });

const phaseName: Record<Phase, string> = {
  menstrual: 'menstrual phase',
  follicular: 'follicular phase',
  ovulation: 'ovulation phase',
  luteal: 'luteal phase',
};

const phaseBlurb: Record<Phase, string> = {
  menstrual: `The lining of the uterus is shedding. Energy can be lower and cramps are common.`,
  follicular: `Estrogen is rising as your body prepares an egg. Many people feel more energetic and upbeat.`,
  ovulation: `An egg is likely being released around now, so this is your most fertile time.`,
  luteal: `Progesterone is higher. Some people notice PMS, bloating, tiredness or mood changes.`,
};

const whenText = (c: AuraCtx) => {
  const d = c.daysUntilNextPeriod;
  if (d < 0) return `${plural(-d, 'day')} past the expected date`;
  if (d === 0) return 'today';
  return `in ${plural(d, 'day')} (around ${fmt(c.nextPeriodStart)})`;
};

const hint = (c: AuraCtx | null, phases: Phase[], text: string) =>
  c && phases.includes(c.phase)
    ? `\n\nRight now you're on cycle day ${c.cycleDay} (${phaseName[c.phase]}). ${text}`
    : '';

// ---------- safety ----------
const SELF_HARM = [
  /\bkill myself/, /\bsuicid/, /\bend my life/, /\bwant to die/, /\bhurt myself/,
  /\bself harm/, /\bselfharm/, /\bdont want to live/, /\bno reason to live/,
];

const HEAVY = [
  /\bsoak\w*\b.{0,40}\b(pad|tampon|cup|through)/,
  /\b(pad|tampon)s?\b.{0,40}\b(every|each) (hour|hr|30 min|half hour)/,
  /\bclots?\b.{0,40}\b(bigger|larger|size of|golf|quarter|coin|lemon|egg)/,
  /\bextremely heavy\b/,
  /\bbleeding\b.{0,20}\b(wont|will not|not) stop/,
  /\bhemorrhag/,
];
const FAINT = [/\b(faint|fainted|fainting|passed out|pass out|collapse\w*|blacked out)\b/];
const PAIN = [
  /\b(severe|unbearable|excruciating|stabbing)\b.{0,30}\b(pain|cramp)/,
  /\b(pain|cramps?)\b.{0,30}\b(unbearable|severe|excruciating)\b/,
  /\bcant (walk|stand|move|breathe)\b/,
];
const TSS = [
  /\btoxic shock/,
  /\b(tampon|cup)\b.{0,40}\b(fever|rash)\b/,
  /\b(fever|rash)\b.{0,40}\b(tampon|cup)\b/,
];
const CHEST = [/\b(chest pain|trouble breathing|shortness of breath|cant breathe)\b/];

function selfHarmReply(): AuraReply {
  return r(
    `I'm really sorry you're hurting this much, and I'm glad you said it. You deserve support from a real person right now, and that's something I can't give you.\n\nIf you might act on these thoughts or are in immediate danger, call your local emergency number now. You can also reach a crisis line: in the US call or text 988, in India call Tele-MANAS at 14416, or find a helpline for your country at findahelpline.com.\n\nIf you can, tell someone you trust how you're feeling and ask them to stay with you. Please reach out to them first.`
  );
}

function emergency(t: string): AuraReply | null {
  const d: string[] = [];
  if (HEAVY.some((x) => x.test(t)))
    d.push(`Soaking through a pad or tampon every hour for two hours or more, or passing very large clots, needs prompt medical attention.`);
  if (FAINT.some((x) => x.test(t)))
    d.push(`Fainting or nearly fainting alongside a period problem should be checked urgently.`);
  if (PAIN.some((x) => x.test(t)))
    d.push(`Severe or sudden pain, especially on one side or with fever or fainting, should be checked urgently.`);
  if (/\bpregnan|\bpositive (pregnancy )?test/.test(t) && /\b(bleed|pain|cramp|spotting|dizz)/.test(t))
    d.push(`Pain or bleeding when you might be pregnant needs urgent medical attention, because it can be a sign of a problem such as an ectopic pregnancy.`);
  if (TSS.some((x) => x.test(t)))
    d.push(`A sudden high fever, rash or feeling very unwell while using a tampon or cup can be toxic shock syndrome. Remove it and get emergency care immediately.`);
  if (CHEST.some((x) => x.test(t)))
    d.push(`Chest pain or trouble breathing needs emergency care right away.`);
  if (!d.length) return null;
  return r(
    `What you've described could be serious, and I can't judge that safely in a chat.\n\n${d.join('\n\n')}\n\nPlease contact a doctor or urgent care today. If you feel faint or very weak, or the symptoms are severe or getting worse, call your local emergency number now and let someone near you know how you feel.`
  );
}

// ---------- knowledge ----------
type Intent = {
  id: string;
  keys?: string[];
  exact?: string[];
  exactWeight?: number;
  needsData?: boolean;
  reply: (c: AuraCtx | null) => AuraReply;
};

const SELF_CARE: Record<Phase, string[]> = {
  menstrual: [
    `Warmth helps: a heating pad or warm water bottle on your lower belly`,
    `Gentle movement such as a slow walk or stretching`,
    `Iron-rich foods (lentils, beans, leafy greens, eggs) and plenty of water`,
    `Allow yourself extra rest if you need it`,
  ],
  follicular: [
    `Energy often rises now, so it's a good time for workouts or starting something new`,
    `Protein-rich meals and plenty of vegetables`,
    `Plan demanding or social things while you feel sharp`,
  ],
  ovulation: [
    `Many people feel social and energetic around now`,
    `Stay hydrated and keep your meals regular`,
    `Mild one-sided twinges can be normal ovulation pain, but see a doctor if it is severe`,
  ],
  luteal: [
    `Keep meals and sleep regular, since blood sugar dips can make mood worse`,
    `If you feel bloated, go easy on salty food and drink water`,
    `Gentle exercise like walking or yoga can ease tension`,
    `Be kind to yourself: mood dips at this stage are common and pass`,
  ],
};

const SYMPTOM_TIPS: Record<string, string> = {
  Cramps: `For cramps: heat and gentle stretching often help`,
  Headache: `For headaches: water, regular meals and a break from screens`,
  Bloating: `For bloating: smaller meals, less salty food and a short walk`,
  Fatigue: `For tiredness: an earlier night and a short daylight walk can help more than caffeine`,
  Nausea: `For nausea: small frequent meals; ginger tea helps some people`,
  Insomnia: `For sleep: a regular wind-down routine and a cool, dark room`,
  'Back pain': `For back pain: warmth and gentle stretching`,
  'Breast tenderness': `For tender breasts: a supportive bra and a warm compress`,
  Acne: `For skin: a gentle cleanser, and try not to pick`,
  Cravings: `Cravings are normal: balanced meals with protein and fibre can keep them manageable`,
};

const INTENTS: Intent[] = [
  {
    id: 'greeting',
    exact: ['hi', 'hello', 'hey', 'hii', 'hiya', 'yo', 'namaste'],
    exactWeight: 1,
    keys: ['good morning', 'good evening', 'good afternoon'],
    reply: () =>
      r(`Hi! I'm Aura. I can explain your cycle, answer common period questions and suggest gentle self-care. What would you like to know?`, STARTERS),
  },
  {
    id: 'thanks',
    keys: ['thank', 'thx', 'appreciate'],
    reply: () => r(`You're very welcome. Ask me anything else whenever you like.`, ['Self-care for today', 'Is my cycle normal?']),
  },
  {
    id: 'bye',
    exact: ['bye', 'goodbye'],
    keys: ['good night'],
    reply: () => r(`Take care of yourself. I'm here whenever you want to chat.`),
  },
  {
    id: 'about',
    keys: ['who are you', 'what are you', 'what can you do', 'what can you help', 'your name', 'are you a doctor', 'are you real', 'are you ai', 'help me'],
    reply: () =>
      r(
        `I'm Aura, a built-in assistant that runs on your phone, with a library of answers written for this app.\n\nI can:\n${bullets([
          `explain cycle phases, ovulation and the fertile window`,
          `answer common questions about cramps, PMS, spotting, late or irregular periods`,
          `use your logs (if you allow it) to say where you are in your cycle`,
          `suggest gentle self-care`,
        ])}\n\nI'm not a doctor and I can't diagnose anything. If something worries you, please see a healthcare professional.`,
        STARTERS
      ),
  },
  {
    id: 'partner_share',
    keys: ['partner', 'boyfriend', 'girlfriend', 'husband', 'wife', 'share my cycle', 'share my data', 'share with'],
    reply: () =>
      r(
        `You can share your cycle with a partner from Settings, then Partner sharing, then Share my cycle.\n\n${bullets([
          `You choose Basic (cycle day, phase and predicted dates) or Detailed (adds today's flow, symptoms and mood)`,
          `Your notes are never shared`,
          `The data is encrypted on your phone, and your partner needs your one-time code to read it`,
          `You can stop sharing at any time, and their access ends immediately`,
        ])}\n\nOnly share with someone you trust. If you ever feel pressured to share, you are always free to say no.`,
        ['Is my data private?']
      ),
  },
  {
    id: 'privacy',
    keys: ['privacy', 'private', 'is my data safe', 'data safe', 'who can see', 'secret', 'stored', 'delete my chat', 'my data'],
    reply: () =>
      r(
        `Your cycle data and this chat are stored only on your phone, and there are no accounts. The one exception is partner sharing, which is off unless you start it: then an encrypted summary is stored on a server that cannot read it, until you stop sharing.\n\n${bullets([
          `The app can be locked with a PIN in Settings`,
          `Use the trash icon above to clear this conversation`,
          `Incognito starts a chat that is never saved`,
          `"Use my cycle data" is off unless you switch it on`,
        ])}`
      ),
  },
  {
    id: 'now_phase',
    needsData: true,
    keys: ['what phase', 'which phase', 'current phase', 'what day of my cycle', 'cycle day', 'where am i in my cycle', 'phase am i', 'what stage', 'how am i doing', 'today in my cycle'],
    reply: (c) =>
      r(
        `You're on cycle day ${c!.cycleDay}, in the ${phaseName[c!.phase]}. ${phaseBlurb[c!.phase]}\n\nYour next period is expected ${whenText(c!)}.`,
        ['Self-care for today', 'Explain the cycle phases']
      ),
  },
  {
    id: 'next_period',
    needsData: true,
    keys: ['next period', 'when will i get my period', 'when is my period', 'when do i get my period', 'when will my period', 'period due', 'when is my next', 'how many days until', 'days until', 'how long until my period', 'period come', 'when will i start'],
    reply: (c) =>
      r(
        `Your next period is expected ${whenText(c!)}, based on an average cycle of ${c!.cycleLength} days.\n\nThis is an estimate and can shift by several days, especially if your cycles are irregular. Logging every period makes it more accurate.`,
        ['How are predictions made?', 'Why is my period late?']
      ),
  },
  {
    id: 'ovulation_when',
    needsData: true,
    keys: ['when am i ovulating', 'when will i ovulate', 'my ovulation', 'fertile window', 'when is ovulation', 'am i fertile', 'fertile days', 'most fertile'],
    reply: (c) =>
      r(
        `Based on your logs, ovulation is estimated around ${fmt(c!.ovulationDate)}, and your fertile window is about ${fmt(c!.fertileStart)} to ${fmt(c!.fertileEnd)}.\n\nThese are estimates from your cycle history. They are not reliable enough to use as birth control, and ovulation can shift from cycle to cycle.`,
        ['What is ovulation?', 'Can I get pregnant on my period?']
      ),
  },
  {
    id: 'self_care',
    keys: ['self care', 'selfcare', 'take care of myself', 'feel better', 'what should i do today', 'tips for today', 'advice for today', 'suggest', 'recommend', 'how can i feel', 'relax', 'look after'],
    reply: (c) => {
      if (!c) {
        return r(
          `Here are some gentle ideas that suit most days:\n${bullets([
            `Drink water and eat regular meals`,
            `Move a little: a walk or some stretching`,
            `Protect your sleep`,
            `Take a few slow breaths when you feel tense`,
          ])}\n\nIf you switch on "Use my cycle data", I can tailor suggestions to your current phase and symptoms.`,
          ['Explain the cycle phases', 'Why do I get cramps?']
        );
      }
      const tips = [...SELF_CARE[c.phase]];
      c.recentSymptoms.forEach((s) => SYMPTOM_TIPS[s] && tips.push(SYMPTOM_TIPS[s]));
      return r(
        `You're on cycle day ${c.cycleDay} (${phaseName[c.phase]})${c.recentSymptoms.length ? ' and logged some symptoms recently' : ''}. A few ideas for today:\n${bullets(tips)}`,
        ['What helps with cramps?', 'What should I eat?']
      );
    },
  },
  {
    id: 'phases_overview',
    keys: ['cycle phases', 'phases of', 'four phases', 'stages of', 'what is the menstrual cycle', 'menstrual cycle', 'how does the cycle work', 'what is a cycle', 'cycle explained', 'explain my cycle', 'explain cycle'],
    reply: (c) =>
      r(
        `The menstrual cycle runs from the first day of one period to the day before the next, and has four phases:\n${bullets([
          `Menstrual: the period itself, when the uterine lining sheds`,
          `Follicular: estrogen rises and an egg matures (it overlaps with the period)`,
          `Ovulation: an egg is released, usually about 14 days before the next period`,
          `Luteal: progesterone rises; PMS symptoms can appear before the next period`,
        ])}${c ? `\n\nYou're currently in the ${phaseName[c.phase]}.` : ''}`,
        ['What is ovulation?', 'What is the luteal phase?']
      ),
  },
  {
    id: 'phase_menstrual',
    keys: ['menstrual phase', 'period phase'],
    reply: () => r(`The menstrual phase is your period, usually 2 to 7 days. Hormone levels are low, the uterine lining sheds, and cramps, tiredness or low mood are common. Rest, warmth and iron-rich foods can help.`, ['What helps with cramps?', 'Explain the cycle phases']),
  },
  {
    id: 'phase_follicular',
    keys: ['follicular'],
    reply: () => r(`In the follicular phase, estrogen rises and an egg matures in the ovary. Many people notice better mood and more energy as it goes on. It starts on day 1 of your period and lasts until ovulation.`, ['What is ovulation?']),
  },
  {
    id: 'phase_ovulation',
    keys: ['ovulat'],
    reply: (c) =>
      r(
        `Ovulation is when an ovary releases an egg. It usually happens about 14 days before your next period, so in a 28-day cycle that's around day 14, but it varies.\n\nSigns some people notice: clear, stretchy discharge, mild one-sided twinges, higher energy or libido. The egg lives about a day, and sperm can survive up to 5 days, which is why the fertile window is wider.${c ? `\n\nYour estimated ovulation date is ${fmt(c.ovulationDate)}.` : ''}`,
        ['Can I get pregnant on my period?', 'Explain the cycle phases']
      ),
  },
  {
    id: 'phase_luteal',
    keys: ['luteal'],
    reply: () => r(`The luteal phase comes after ovulation and lasts about 12 to 14 days until your next period. Progesterone rises, and if there's no pregnancy, hormones drop towards the end. That drop is when PMS symptoms such as bloating, tiredness, tender breasts or mood changes tend to appear.`, ['What is PMS?', 'Self-care for today']),
  },
  {
    id: 'normal_cycle',
    keys: ['normal cycle', 'cycle length', 'how long should', 'is my cycle normal', 'is my period normal', 'normal period', 'how long is a cycle', 'short cycle', 'long cycle', 'average cycle', 'how long does a period', 'period length'],
    reply: (c) =>
      r(
        `A typical adult cycle is 21 to 35 days, counted from the first day of one period to the first day of the next. It's normal for the length to vary by a few days each month. Periods usually last 2 to 7 days.${c ? `\n\nBased on your logs, your average cycle is ${c.cycleLength} days and your average period is ${c.periodLength} days.` : ''}\n\nIt's worth talking to a doctor if your cycles are regularly shorter than 21 or longer than 35 days, your period lasts longer than 7 days, or you go 3 months without one.`,
        ['Why are my periods irregular?', 'Why is my period late?']
      ),
  },
  {
    id: 'irregular',
    keys: ['irregular', 'unpredictable', 'cycle changes', 'varies', 'different every month', 'skipped period', 'cycle keeps changing', 'vary'],
    reply: () =>
      r(
        `Cycles that vary a lot can have many causes. Common ones include stress, big changes in weight or exercise, travel, illness, thyroid problems, PCOS, hormonal birth control, breastfeeding and perimenopause. Irregular cycles are also common in the first few years after a first period.\n\nA doctor can help if cycles are regularly shorter than 21 or longer than 35 days, if you skip several periods, or if irregular cycles are new for you. Keeping a log here gives them useful information.`,
        ['Is my cycle normal?', 'Can stress affect my period?']
      ),
  },
  {
    id: 'late_period',
    keys: ['late period', 'period is late', 'period late', 'missed period', 'miss my period', 'missed my period', 'no period', 'havent got my period', 'havent had my period', 'period hasnt', 'period has not', 'period didnt come', 'delayed', 'not come', 'not coming', 'overdue'],
    reply: (c) =>
      r(
        `${c && c.daysUntilNextPeriod < 0 ? `By your logs your period is ${plural(-c.daysUntilNextPeriod, 'day')} past the expected date.\n\n` : ''}A late period is common. Possible reasons include stress, illness, travel, weight change, intense exercise, PCOS, thyroid issues, breastfeeding, perimenopause or pregnancy.\n\n${bullets([
          `If you could be pregnant, a home test is reliable from the first day of a missed period`,
          `A one-off late period is usually nothing to worry about`,
          `See a doctor if you miss 3 periods in a row, or if lateness is unusual for you and you have other symptoms`,
        ])}`,
        ['Can stress affect my period?', 'Is my cycle normal?']
      ),
  },
  {
    id: 'cramps',
    keys: ['cramp', 'period pain', 'menstrual pain', 'painful period', 'pelvic pain', 'dysmenorrhea', 'stomach pain', 'abdominal pain', 'lower back pain', 'pain', 'hurt', 'ache'],
    reply: (c) =>
      r(
        `Cramps happen because the uterus contracts to shed its lining, helped along by chemicals called prostaglandins. Things that often help:\n${bullets([
          `Heat on your lower belly or back`,
          `Gentle movement, stretching or a short walk`,
          `Staying hydrated and resting when you can`,
          `Over-the-counter pain relief, if it's safe for you. Check the label or ask a pharmacist`,
        ])}\n\nSee a doctor if the pain stops you from doing daily things, keeps getting worse, doesn't respond to usual relief, or started suddenly after years of mild periods. Conditions like endometriosis or fibroids can cause painful periods and are treatable.${hint(c, ['menstrual'], `Cramps are very common at this stage.`)}`,
        ['Self-care for today', 'Is my cycle normal?']
      ),
  },
  {
    id: 'pms',
    keys: ['pms', 'premenstrual', 'pmdd', 'before my period', 'emotional before'],
    reply: (c) =>
      r(
        `PMS is a group of physical and emotional symptoms that show up in the week or two before a period and ease soon after it starts. Common ones: bloating, tender breasts, headaches, tiredness, cravings, irritability and low mood.\n\nWhat helps some people: regular sleep and meals, gentle exercise, cutting back on caffeine and salt, and tracking symptoms so you can plan around them.\n\nIf mood symptoms are severe, such as intense sadness, anxiety or anger that disrupts your life, talk to a doctor. This can be PMDD, which is treatable.${hint(c, ['luteal'], `PMS symptoms fit this stage.`)}`,
        ['Why am I so emotional?', 'Self-care for today']
      ),
  },
  {
    id: 'mood',
    keys: ['mood', 'sad', 'anxious', 'anxiety', 'cry', 'crying', 'depress', 'feel low', 'emotional', 'angry', 'irritab'],
    reply: (c) =>
      r(
        `Hormones shift through the cycle and can affect mood, especially in the days before a period. It doesn't mean something is wrong with you.\n\n${bullets([
          `Keep sleep and meals as regular as you can`,
          `Move your body gently, ideally outside`,
          `Try slow breathing: in for 4, out for 6, a few times`,
          `Talk to someone you trust`,
        ])}\n\nIf you feel low or anxious for more than a couple of weeks, or it feels heavy, please talk to a doctor or counsellor.${hint(c, ['luteal'], `Mood dips are common in this phase.`)}`,
        ['What is PMS?', 'Self-care for today']
      ),
  },
  {
    id: 'spotting',
    keys: ['spotting', 'light bleeding', 'bleeding between', 'between periods', 'pink discharge', 'mid cycle bleeding', 'breakthrough bleeding'],
    reply: () =>
      r(
        `Light spotting outside your period can have harmless causes, such as ovulation, a new or changed hormonal contraceptive, stress or the days just before or after a period.\n\nSee a doctor if spotting keeps happening, follows sex, comes with pain, or happens if you might be pregnant or after menopause.`,
        ['What is ovulation?', 'What colour should period blood be?']
      ),
  },
  {
    id: 'heavy_flow',
    keys: ['heavy period', 'heavy flow', 'heavy bleeding', 'long period', 'period lasts', 'period too long', 'clot', 'period wont stop', 'lasting more than'],
    reply: () =>
      r(
        `Periods vary, but these are signs to see a doctor soon:\n${bullets([
          `Bleeding for more than 7 days`,
          `Changing a pad or tampon more often than every 1 to 2 hours`,
          `Passing clots larger than about 2.5 cm (a coin)`,
          `Feeling tired, dizzy or breathless, which can mean low iron`,
        ])}\n\nHeavy periods are common and treatable. Iron-rich foods help, and a doctor can check your iron levels. If you're soaking through protection every hour, or feel faint, get urgent care.`,
        ['What should I eat?', 'Is my cycle normal?']
      ),
  },
  {
    id: 'light_flow',
    keys: ['light period', 'very light', 'short period', 'scanty', 'barely bleeding', 'less flow', 'light flow'],
    reply: () => r(`A lighter or shorter period can be normal for you. It can also change with stress, weight or exercise changes, hormonal contraception, breastfeeding or perimenopause. If your flow changes suddenly, or you could be pregnant, take a test and see a doctor if you're unsure.`, ['Is my cycle normal?']),
  },
  {
    id: 'blood_colour',
    keys: ['color', 'colour', 'dark blood', 'black blood', 'bright red', 'brown', 'clump'],
    reply: () =>
      r(
        `Period blood varies from bright red to dark red or brown. Brown or dark blood at the start or end is usually older blood and is normal. Pink can be light flow mixed with discharge.\n\nSee a doctor if you notice a strong, unpleasant smell, unusual discharge, or colour changes with pain or fever.`
      ),
  },
  {
    id: 'bloating',
    exact: ['gas'],
    keys: ['bloat', 'water retention', 'swollen', 'puffy'],
    reply: (c) =>
      r(
        `Bloating is common before and during a period because hormones cause the body to hold more water and slow digestion. It often helps to eat smaller meals, drink water, go easy on salty or very fizzy foods, and take a gentle walk.${hint(c, ['luteal', 'menstrual'], `Bloating is common at this stage.`)}`,
        ['What should I eat?', 'Self-care for today']
      ),
  },
  {
    id: 'headache',
    keys: ['headache', 'migraine', 'head ache'],
    reply: () => r(`Hormone changes, especially the drop in estrogen before a period, can trigger headaches or migraines. Staying hydrated, eating regularly, sleeping well and taking breaks from screens may help. If headaches are severe, come with vision changes, or are new and different, please see a doctor.`),
  },
  {
    id: 'fatigue',
    keys: ['tired', 'fatigue', 'exhaust', 'sleep', 'insomnia', 'low energy', 'sleepy'],
    reply: (c) =>
      r(
        `Tiredness and sleep changes are common around your period, partly because of hormones and partly because of low iron if your flow is heavy. A steady sleep schedule, a short daylight walk and iron-rich foods help many people.\n\nIf you're exhausted all the time, see a doctor, since low iron and thyroid problems are easy to check.${hint(c, ['menstrual', 'luteal'], `Low energy is common here.`)}`,
        ['What should I eat?', 'Self-care for today']
      ),
  },
  {
    id: 'acne',
    keys: ['acne', 'pimple', 'breakout', 'skin', 'zits'],
    reply: () => r(`Hormone shifts, particularly in the days before a period, can increase oil and cause breakouts. A gentle cleanser, avoiding picking and keeping a simple routine help. Persistent or painful acne is worth discussing with a doctor or dermatologist.`),
  },
  {
    id: 'digestive',
    keys: ['nausea', 'nauseous', 'vomit', 'sick to my stomach', 'diarrhea', 'diarrhoea', 'constipation', 'digest'],
    reply: () => r(`Prostaglandins, the same chemicals behind cramps, can also upset your digestion, causing nausea, loose stools or constipation around your period. Small frequent meals, water and ginger tea can help. If you vomit repeatedly, can't keep fluids down, or it comes with severe pain, get medical advice.`),
  },
  {
    id: 'exercise',
    exact: ['run', 'running', 'walk', 'walking', 'swim'],
    keys: ['exercise', 'workout', 'gym', 'yoga', 'swimming', 'working out'],
    reply: () =>
      r(`Exercise during your period is generally fine, and for many people it eases cramps and lifts mood. Listen to your body: gentle options like walking, yoga or swimming work well on low-energy days, and you can do harder workouts when you feel good. Swimming is fine with a tampon or menstrual cup.`, ['Self-care for today', 'What should I eat?']),
  },
  {
    id: 'food',
    keys: ['food', 'eat', 'diet', 'nutrition', 'iron', 'craving', 'sugar', 'chocolate', 'caffeine', 'coffee', 'hydrat', 'water', 'vitamin', 'supplement', 'magnesium', 'what to eat'],
    reply: () =>
      r(
        `There's no perfect period diet, but these help many people:\n${bullets([
          `Iron-rich foods such as lentils, beans, leafy greens, eggs or meat, especially if your flow is heavy (pair with vitamin C for better absorption)`,
          `Plenty of water, plus regular meals to keep energy and mood steady`,
          `Less salt if you get bloated, and less caffeine if you feel anxious or have trouble sleeping`,
        ])}\n\nCravings are normal and not a failure of willpower. For supplements, check with a doctor or pharmacist first.`,
        ['Self-care for today', 'Why am I tired?']
      ),
  },
  {
    id: 'pregnancy',
    keys: ['pregnan', 'get pregnant', 'conceive', 'trying to conceive', 'ttc', 'chance of pregnancy', 'pregnancy test', 'birth control', 'contracept', 'condom', 'pill'],
    reply: (c) =>
      r(
        `Some key points:\n${bullets([
          `Pregnancy is possible on any day of the cycle, including during a period, though it's less likely. Sperm can live up to 5 days`,
          `Predictions in this app are estimates and must not be used as birth control`,
          `If your period is late and you could be pregnant, home tests are reliable from the first day of a missed period. After a positive result, see a healthcare provider`,
          `Hormonal contraception (such as the pill) can change your bleeding pattern. Ask whoever prescribed it if you have concerns`,
        ])}${c ? `\n\nIf you're trying to conceive, your estimated fertile window is ${fmt(c.fertileStart)} to ${fmt(c.fertileEnd)}.` : ''}`,
        ['What is ovulation?', 'Why is my period late?']
      ),
  },
  {
    id: 'libido',
    keys: ['sex drive', 'libido', 'low desire', 'desire', 'in the mood', 'horny', 'sexual desire'],
    reply: (c) =>
      r(
        `Sex drive naturally shifts through the cycle. Many people feel more desire around ovulation, when hormone levels peak, and less in the days before a period. It varies a lot though, and some people feel the opposite. Stress, sleep, mood, health, relationships and some medicines (including certain hormonal contraceptives) all play a part.${c && c.phase === 'luteal' ? `\n\nYou're in the luteal phase, where desire often dips a little. That's normal.` : ''}\n\nThere is no "right" amount of desire, and you never owe anyone sex. If low desire worries you, or sex is painful or uncomfortable, a doctor can help, because both are common and often treatable.`,
        ['Painful sex or dryness', 'Can I get pregnant on my period?']
      ),
  },
  {
    id: 'sex_comfort',
    keys: ['painful sex', 'pain during sex', 'pain when having sex', 'hurts during sex', 'vaginal dryness', 'dryness', 'lubricant', 'lube', 'dyspareunia', 'sex hurts', 'uncomfortable sex'],
    reply: () =>
      r(
        `Discomfort or dryness during sex is common, and often fixable.\n\n${bullets([
          `Dryness can come from hormone changes (around your period, after childbirth, while breastfeeding, with some contraceptives, or in perimenopause). A water-based lubricant often helps`,
          `Take your time: more arousal and foreplay increase natural lubrication`,
          `Talk with your partner about pace and positions, and stop if anything hurts`,
          `Stress and tension can tighten muscles, so relaxing and going slowly helps`,
        ])}\n\nSee a doctor if pain keeps happening, if you bleed after sex, or if you notice unusual discharge, itching, burning or fever, since these can be signs of an infection or another condition that needs treatment.`,
        ['What is my sex drive like?']
      ),
  },
  {
    id: 'emergency_contraception',
    keys: ['emergency contraception', 'morning after', 'plan b', 'ipill', 'i pill', 'unprotected sex', 'condom broke', 'condom split', 'contraception failed'],
    reply: () =>
      r(
        `If you had unprotected sex or a method failed (like a condom breaking), emergency contraception can greatly reduce the chance of pregnancy, and the sooner it is taken the better.\n\n${bullets([
          `Some emergency pills work for up to 3 days and others up to 5 days`,
          `A copper IUD fitted by a doctor also works for up to 5 days`,
          `A pharmacist or doctor can tell you which option suits you. In many places the pill is available without a prescription`,
          `It does not protect against infections, so consider testing if you are worried`,
        ])}\n\nIf your next period is more than a week late, take a pregnancy test.`,
        ['Why is my period late?']
      ),
  },
  {
    id: 'sex',
    keys: ['sex', 'intercourse', 'intimacy'],
    reply: () => r(`Sex during a period is generally fine if you're comfortable, and some people find it eases cramps. Pregnancy and sexually transmitted infections are still possible, so use protection if you need it. Persistent pain during sex is worth mentioning to a doctor.`),
  },
  {
    id: 'hygiene',
    keys: ['tampon', 'pad', 'menstrual cup', 'cup', 'hygiene', 'pantyliner', 'change my pad', 'how often'],
    reply: () =>
      r(
        `Product guidance:\n${bullets([
          `Pads: change every few hours (about 4 to 6), or sooner if heavy`,
          `Tampons: change every 4 to 8 hours and never leave one in longer than 8 hours. Use the lowest absorbency that works`,
          `Menstrual cups: usually up to 12 hours. Follow your brand's instructions`,
        ])}\n\nIf you get a sudden high fever, rash or feel very unwell while using a tampon or cup, remove it and get emergency care, since it can be toxic shock syndrome.`
      ),
  },
  {
    id: 'first_period',
    keys: ['first period', 'menarche', 'teen', 'my daughter', 'young girl'],
    reply: () => r(`First periods usually start between ages 9 and 15, with an average around 12. Cycles are often irregular for the first couple of years. If there's no period by 15, or by about 3 years after breast development starts, a doctor can check that everything is on track.`),
  },
  {
    id: 'menopause',
    keys: ['menopause', 'perimenopause', 'hot flash', 'hot flush'],
    reply: () => r(`Perimenopause is the transition before menopause, often starting in the 40s. Cycles can become irregular, longer, shorter or heavier, and hot flushes, sleep changes and mood swings are common. Menopause is confirmed after 12 months with no period. A doctor can help with symptoms and rule out other causes.`),
  },
  {
    id: 'conditions',
    keys: ['pcos', 'polycystic', 'endometriosis', 'fibroid', 'thyroid'],
    reply: () => r(`Conditions like PCOS, endometriosis, fibroids and thyroid problems can all affect periods, causing irregular cycles, heavy bleeding or pain. I can't tell whether you have any of them, and only a doctor can diagnose them. If your symptoms are persistent, tracking them here and showing your logs to a doctor can really help.`),
  },
  {
    id: 'stress',
    keys: ['stress', 'overwhelm', 'burnout', 'work pressure', 'exam'],
    reply: () => r(`Yes, stress can affect your cycle. It can delay ovulation, which makes a period late, or change how heavy or painful it is. Sleep, movement, time outside and talking to someone can help. If your cycle stays disrupted for several months, check in with a doctor.`, ['Why is my period late?', 'Self-care for today']),
  },
  {
    id: 'predictions',
    keys: ['how do you predict', 'how accurate', 'predictions', 'how does the app', 'prediction', 'accuracy', 'how is it calculated', 'how are predictions'],
    reply: () =>
      r(
        `Predictions use your logged history:\n${bullets([
          `Cycle length: the average gap between your last few period start dates (up to 6 cycles). Gaps shorter than 15 or longer than 60 days are ignored as likely missed logs`,
          `Next period: your last start date plus that average`,
          `Ovulation: about 14 days before the next period`,
          `Fertile window: from 5 days before ovulation to 1 day after`,
        ])}\n\nWith little history the app uses your default cycle length from Settings. Estimates improve with more logs, but they're never exact.`
      ),
  },
  {
    id: 'app_help',
    keys: ['how do i log', 'how to log', 'how do i add', 'how do i delete', 'how to use', 'edit period', 'remove period', 'change my cycle length', 'where do i', 'export', 'reminder', 'notification', 'lock'],
    exact: ['pin'],
    reply: () =>
      r(
        `Quick guide:\n${bullets([
          `Log a period: Calendar tab, tap a day, then "Period started on this day". Tap a day in an ongoing period to mark its end or remove it`,
          `Log symptoms, mood and flow: Log tab`,
          `Change default cycle length, reminders, PIN lock, export or delete data: Settings tab`,
        ])}`
      ),
  },
];

// ---------- matching ----------
const normalize = (s: string) =>
  s.toLowerCase().replace(/['\u2019]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function score(intent: Intent, t: string): number {
  let s = 0;
  for (const k of intent.keys ?? []) {
    if (new RegExp('\\b' + esc(k)).test(t)) s += k.includes(' ') ? 3 : 2;
  }
  for (const e of intent.exact ?? []) {
    if (new RegExp('\\b' + esc(e) + '\\b').test(t)) s += intent.exactWeight ?? 2;
  }
  return s;
}

function noData(input: AuraInput): AuraReply {
  if (!input.dataEnabled) {
    return r(`I can answer that using your logs. Switch on "Use my cycle data" at the top of this screen (it stays on your phone), then ask again.`);
  }
  return r(`I don't have any logged periods yet. Log the start of your last period on the Home or Calendar tab and I can answer this.`);
}

const FALLBACK = `I'm not sure I have a good answer for that one yet. I'm a built-in assistant, so I know a set of cycle topics rather than everything. Here are some things I can help with.\n\nIf it's a symptom that worries you, a doctor or pharmacist is the right person to ask.`;

export function respond(input: AuraInput): AuraReply {
  const t = normalize(input.text);
  if (!t) return r(`I didn't catch that. What would you like to ask?`, STARTERS);

  if (SELF_HARM.some((x) => x.test(t))) return selfHarmReply();
  const em = emergency(t);
  if (em) return em;

  let best: Intent | null = null;
  let bestScore = 0;
  for (const it of INTENTS) {
    const s = score(it, t);
    if (s > bestScore) {
      best = it;
      bestScore = s;
    }
  }
  if (!best) return r(FALLBACK, ['Why is my period late?', 'What helps with cramps?', 'Explain the cycle phases', 'Is spotting normal?']);
  if (best.needsData && !input.ctx) return noData(input);
  return best.reply(input.ctx);
}


