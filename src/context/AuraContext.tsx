import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppData } from './AppDataContext';
import { getPrediction } from '../utils/prediction';
import { addDays, todayISO } from '../utils/date';
import { AuraCtx, STARTERS, WELCOME_TEXT, respond } from '../aura/knowledge';

export type Msg = {
  id: string;
  role: 'user' | 'aura';
  text: string;
  suggestions?: string[];
  ts: number;
};

const KEY = 'cycle-tracker:aura:v1';
const MAX_SAVED = 100;

const newId = () => String(Date.now()) + Math.random().toString(36).slice(2, 7);
const makeWelcome = (): Msg => ({
  id: newId(),
  role: 'aura',
  text: WELCOME_TEXT,
  suggestions: STARTERS,
  ts: Date.now(),
});

type AuraContextType = {
  messages: Msg[];
  typing: boolean;
  useData: boolean;
  incognito: boolean;
  send: (text: string) => void;
  setUseData: (on: boolean) => void;
  setIncognito: (on: boolean) => void;
  clearConversation: () => void;
  clearAll: () => void;
};

const AuraContext = createContext<AuraContextType | null>(null);

export function AuraProvider({ children }: { children: React.ReactNode }) {
  const { periods, logs, settings } = useAppData();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [useData, setUseData] = useState(false);
  const [incognito, setIncognitoState] = useState(false);
  const [typing, setTyping] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          const p = JSON.parse(raw);
          setUseData(!!p.useData);
          setIncognitoState(!!p.incognito);
          const saved: Msg[] = Array.isArray(p.messages) ? p.messages : [];
          setMessages(saved.length ? saved : [makeWelcome()]);
        } else {
          setMessages([makeWelcome()]);
        }
      } catch {
        setMessages([makeWelcome()]);
      }
      setLoaded(true);
    })();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(
      KEY,
      JSON.stringify({
        messages: incognito ? [] : messages.slice(-MAX_SAVED),
        useData,
        incognito,
      })
    ).catch(() => {});
  }, [messages, useData, incognito, loaded]);

  const buildCtx = (): { ctx: AuraCtx | null; hasData: boolean } => {
    const p = getPrediction(periods, settings);
    if (!p.hasData) return { ctx: null, hasData: false };
    const today = todayISO();
    const syms: string[] = [];
    for (let i = 0; i < 3; i++) {
      (logs[addDays(today, -i)]?.symptoms ?? []).forEach((s) => {
        if (!syms.includes(s)) syms.push(s);
      });
    }
    return {
      hasData: true,
      ctx: {
        cycleDay: p.cycleDay as number,
        phase: p.phase as AuraCtx['phase'],
        daysUntilNextPeriod: p.daysUntilNextPeriod as number,
        cycleLength: p.cycleLength,
        periodLength: p.periodLength,
        nextPeriodStart: p.nextPeriodStart as string,
        ovulationDate: p.ovulationDate as string,
        fertileStart: p.fertileStart as string,
        fertileEnd: p.fertileEnd as string,
        recentSymptoms: syms,
      },
    };
  };

  const send = (text: string) => {
    const clean = text.trim();
    if (!clean || typing) return;
    setMessages((prev) => [...prev, { id: newId(), role: 'user', text: clean, ts: Date.now() }]);
    setTyping(true);

    const { ctx, hasData } = buildCtx();
    const reply = respond({
      text: clean,
      ctx: useData ? ctx : null,
      dataEnabled: useData,
      hasData,
    });

    timer.current = setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: newId(), role: 'aura', text: reply.text, suggestions: reply.suggestions, ts: Date.now() },
      ]);
      setTyping(false);
    }, 650);
  };

  const setIncognito = (on: boolean) => {
    setIncognitoState(on);
    setMessages([makeWelcome()]);
  };

  const clearConversation = () => setMessages([makeWelcome()]);

  const clearAll = () => {
    setMessages([makeWelcome()]);
    setUseData(false);
    setIncognitoState(false);
    AsyncStorage.removeItem(KEY).catch(() => {});
  };

  return (
    <AuraContext.Provider
      value={{ messages, typing, useData, incognito, send, setUseData, setIncognito, clearConversation, clearAll }}
    >
      {children}
    </AuraContext.Provider>
  );
}

export function useAura() {
  const ctx = useContext(AuraContext);
  if (!ctx) throw new Error('useAura must be used inside AuraProvider');
  return ctx;
}
