import React from 'react';
import { View } from 'react-native';
import { colors } from '../theme/colors';
import { useLock } from '../context/LockContext';
import LockScreen from './LockScreen';

export default function LockGate({ children }: { children: React.ReactNode }) {
  const { loading, locked } = useLock();
  if (loading) return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  if (locked) return <LockScreen />;
  return <>{children}</>;
}
