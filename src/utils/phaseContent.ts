import { Phase, Prediction } from './prediction';
import { diffDays, todayISO } from './date';

export type Level = 1 | 2 | 3 | 4 | 5;

export const PHASE_INFO: Record<Phase, {
  label: string;
  icon: string;
  gradient: [string, string];
  short: string;
  body: string;
  energy: Level; energyText: string;
  mood: Level; moodText: string;
  desire: Level; desireText: string;
  tips: string[];
}> = {
  menstrual: {
    label: 'Period',
    icon: 'water',
    gradient: ['#E4576E', '#F4879B'],
    short: 'Your body is shedding the uterine lining.',
    body: 'Hormone levels are at their lowest. Feeling tired or crampy is completely normal. Rest and warmth help.',
    energy: 2, energyText: 'Lower than usual',
    mood: 2, moodText: 'More sensitive',
    desire: 2, desireText: 'Varies a lot',
    tips: [
      'Heat on your lower belly eases cramps',
      'Iron-rich foods like lentils, beans and leafy greens help replace what you lose',
      'A gentle stretch or slow walk can ease aches',
      'Rest without guilt. Your body is working hard',
    ],
  },
  follicular: {
    label: 'Follicular phase',
    icon: 'leaf',
    gradient: ['#2FA4A9', '#69C7C4'],
    short: 'Estrogen is rising and an egg is maturing.',
    body: 'Energy and mood usually climb through this phase. A good time to start something new, plan workouts or see people.',
    energy: 4, energyText: 'Rising',
    mood: 4, moodText: 'Upbeat',
    desire: 3, desireText: 'Starting to rise',
    tips: [
      'Great time for harder workouts',
      'Protein plus colourful veg keeps energy steady',
      'Plan big tasks or social events now',
      'Try something new while motivation is high',
    ],
  },
  ovulation: {
    label: 'Ovulation',
    icon: 'flower',
    gradient: ['#EE7B4A', '#F5A65B'],
    short: 'An egg is likely being released around now.',
    body: 'This is your peak. Energy, mood and confidence are often at their highest, and so is fertility.',
    energy: 5, energyText: 'At its peak',
    mood: 5, moodText: 'Often at its best',
    desire: 5, desireText: 'Often highest',
    tips: [
      'Drink water and keep meals regular',
      'Social plans and important conversations tend to go well',
      'A mild one-sided twinge can be normal',
      'If you are avoiding pregnancy, use contraception',
    ],
  },
  luteal: {
    label: 'Luteal phase',
    icon: 'moon',
    gradient: ['#7B5EA7', '#B08AD8'],
    short: 'Progesterone rises, then hormones drop before your period.',
    body: 'The first part can feel calm and focused. Closer to your period, PMS signs like tiredness, bloating or mood dips can appear.',
    energy: 3, energyText: 'Slowly easing',
    mood: 3, moodText: 'May dip near the end',
    desire: 2, desireText: 'Often lower',
    tips: [
      'Keep sleep and meals regular',
      'Go easy on salt and caffeine if you feel bloated',
      'Gentle exercise like yoga or walking helps tension',
      'Be kind to yourself. Dips pass',
    ],
  },
};

export const INTIMACY: Record<Phase, { title: string; points: string[] }> = {
  menstrual: {
    title: 'During your period',
    points: [
      'Sex during a period is safe if you both feel comfortable, and some people find it eases cramps.',
      'Pregnancy is unlikely but not impossible, and infections can still be passed on, so use protection if you need it.',
      'A dark towel and a comfortable position can make things more relaxed.',
      'If you are not in the mood, that is completely fine. Cuddling or a massage counts too.',
    ],
  },
  follicular: {
    title: 'In your follicular phase',
    points: [
      'Desire often starts to rise as estrogen climbs, and natural lubrication increases.',
      'Fertility is still low early on, but it rises as ovulation gets closer.',
      'Cycles vary, and sperm can survive for up to 5 days, so do not rely on "safe days".',
    ],
  },
  ovulation: {
    title: 'Around ovulation',
    points: [
      'Desire is often highest around now, and many people feel more confident and flirty.',
      'This is your most fertile time. If you are avoiding pregnancy, use reliable contraception.',
      'If you are trying to conceive, the day of ovulation and the two days before are the best chances.',
      'App predictions are estimates and are not birth control.',
    ],
  },
  luteal: {
    title: 'In your luteal phase',
    points: [
      'Desire often dips, especially in the days before your period, though some people feel more desire. Both are normal.',
      'Bloating or tender breasts can make some positions uncomfortable. Go at your own pace.',
      'Dryness can happen, and a water-based lubricant can help.',
      'Fertility is very low after ovulation, but ovulation can shift, so use protection if pregnancy would be a worry.',
    ],
  },
};

export type Chance = { label: string; level: Level; note: string };

export function pregnancyChance(p: Prediction, today: string = todayISO()): Chance {
  if (!p.hasData || !p.ovulationDate || p.daysUntilNextPeriod === null) {
    return { label: 'Unknown', level: 1, note: 'Log a period to see this.' };
  }
  if (p.daysUntilNextPeriod < 0) {
    return {
      label: 'Unclear',
      level: 2,
      note: 'Your period is late, so the estimate is less certain. Pregnancy is possible at any time.',
    };
  }
  if (p.phase === 'menstrual') {
    return {
      label: 'Very low',
      level: 1,
      note: 'Pregnancy is unlikely during a period, but not impossible, especially with shorter cycles.',
    };
  }
  const d = diffDays(today, p.ovulationDate);
  if (d >= -2 && d <= 0) {
    return {
      label: 'High',
      level: 5,
      note: 'You are in the most fertile days of your cycle, based on your logged history.',
    };
  }
  if ((d >= -5 && d <= -3) || d === 1) {
    return {
      label: 'Medium',
      level: 3,
      note: 'You are at the edge of your fertile window. Chances are rising or falling.',
    };
  }
  if (d > 1) {
    return {
      label: 'Very low',
      level: 1,
      note: 'Ovulation has most likely passed, so chances are very low until your next fertile window.',
    };
  }
  return {
    label: 'Low',
    level: 2,
    note: 'You are before your fertile window. Sperm can survive up to 5 days and ovulation can shift, so it is not zero.',
  };
}
