import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

const PIN_KEY = 'ct_pin';
const BIO_KEY = 'ct_bio';

type LockContextType = {
  loading: boolean;
  locked: boolean;
  pinSet: boolean;
  biometricEnabled: boolean;
  setPin: (pin: string) => Promise<void>;
  removePin: () => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  isBiometricAvailable: () => Promise<boolean>;
  setBiometric: (on: boolean) => Promise<boolean>;
  unlockWithBiometric: () => Promise<void>;
  runWithoutLock: <T>(fn: () => Promise<T>) => Promise<T>;
};

const LockContext = createContext<LockContextType | null>(null);

export function LockProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [pinSet, setPinSet] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  // Some system dialogs (share sheet, biometric prompt) send the app to the
  // background briefly. This flag stops them from triggering a lock.
  const ignoreBackground = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const pin = await SecureStore.getItemAsync(PIN_KEY);
        const bio = await SecureStore.getItemAsync(BIO_KEY);
        setPinSet(!!pin);
        setBiometricEnabled(bio === '1');
        setLocked(!!pin); // start locked if a PIN exists
      } catch (e) {
        console.warn('Could not read lock settings', e);
      }
      setLoading(false);
    })();
  }, []);

  // lock when the app goes to the background
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' && pinSet && !ignoreBackground.current) {
        setLocked(true);
      }
    });
    return () => sub.remove();
  }, [pinSet]);

  const runWithoutLock = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    ignoreBackground.current = true;
    try {
      return await fn();
    } finally {
      setTimeout(() => {
        ignoreBackground.current = false;
      }, 1500);
    }
  }, []);

  const setPin = async (pin: string) => {
    await SecureStore.setItemAsync(PIN_KEY, pin);
    setPinSet(true);
  };

  const removePin = async () => {
    await SecureStore.deleteItemAsync(PIN_KEY);
    await SecureStore.deleteItemAsync(BIO_KEY);
    setPinSet(false);
    setBiometricEnabled(false);
    setLocked(false);
  };

  const verifyPin = async (pin: string) => {
    const stored = await SecureStore.getItemAsync(PIN_KEY);
    const ok = stored === pin;
    if (ok) setLocked(false);
    return ok;
  };

  const isBiometricAvailable = async () => {
    try {
      const hw = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return hw && enrolled;
    } catch {
      return false;
    }
  };

  const authenticate = (message: string) =>
    runWithoutLock(() =>
      LocalAuthentication.authenticateAsync({
        promptMessage: message,
        cancelLabel: 'Cancel',
        disableDeviceFallback: true,
      })
    );

  const setBiometric = async (on: boolean) => {
    if (on) {
      const res = await authenticate('Confirm to enable biometric unlock');
      if (!res.success) return false;
      await SecureStore.setItemAsync(BIO_KEY, '1');
      setBiometricEnabled(true);
    } else {
      await SecureStore.deleteItemAsync(BIO_KEY);
      setBiometricEnabled(false);
    }
    return true;
  };

  const unlockWithBiometric = async () => {
    const res = await authenticate('Unlock your cycle tracker');
    if (res.success) setLocked(false);
  };

  return (
    <LockContext.Provider
      value={{
        loading, locked, pinSet, biometricEnabled,
        setPin, removePin, verifyPin, isBiometricAvailable,
        setBiometric, unlockWithBiometric, runWithoutLock,
      }}
    >
      {children}
    </LockContext.Provider>
  );
}

export function useLock() {
  const ctx = useContext(LockContext);
  if (!ctx) throw new Error('useLock must be used inside LockProvider');
  return ctx;
}
