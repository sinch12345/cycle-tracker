import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { colors } from '../theme/colors';
import { useAppData } from '../context/AppDataContext';
import { addDays, parseISO, todayISO } from '../utils/date';
import { getDayStatuses, getPrediction, DayStatus } from '../utils/prediction';

const statusStyle: Record<DayStatus, { bg: string; text: string; border?: string }> = {
  period: { bg: colors.period, text: '#FFFFFF' },
  predictedPeriod: { bg: colors.primaryLight, text: colors.period, border: colors.period },
  ovulation: { bg: colors.ovulation, text: '#FFFFFF' },
  fertile: { bg: colors.fertileLight, text: colors.fertile },
};

const statusLabel: Record<DayStatus, string> = {
  period: 'Period day',
  predictedPeriod: 'Predicted period',
  ovulation: 'Predicted ovulation',
  fertile: 'Fertile window',
};

export default function CalendarScreen() {
  const { periods, settings, startPeriod, endPeriod, deletePeriod } = useAppData();
  const today = todayISO();
  const [selected, setSelected] = useState<string>(today);

  const statuses = useMemo(() => getDayStatuses(periods, settings), [periods, settings]);
  const { periodLength } = useMemo(() => getPrediction(periods, settings), [periods, settings]);

  const marked = useMemo(() => {
    const m: Record<string, any> = {};
    Object.entries(statuses).forEach(([date, status]) => {
      const s = statusStyle[status];
      m[date] = {
        customStyles: {
          container: {
            backgroundColor: s.bg,
            borderWidth: s.border ? 1 : 0,
            borderColor: s.border,
          },
          text: { color: s.text, fontWeight: '600' },
        },
      };
    });
    const existing = m[selected]?.customStyles ?? { container: {}, text: {} };
    m[selected] = {
      customStyles: {
        container: { ...existing.container, borderWidth: 2, borderColor: colors.text },
        text: existing.text,
      },
    };
    return m;
  }, [statuses, selected]);

  // the logged period that contains the selected date, if any
  const periodOnSelected = periods.find((p) => {
    const end = p.endDate ?? addDays(p.startDate, periodLength - 1);
    return selected >= p.startDate && selected <= end;
  });

  const isFuture = selected > today;
  const status = statuses[selected];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <Calendar
        markingType="custom"
        markedDates={marked}
        onDayPress={(d: DateData) => setSelected(d.dateString)}
        firstDay={1}
        theme={{
          calendarBackground: colors.card,
          todayTextColor: colors.primary,
          arrowColor: colors.primary,
          monthTextColor: colors.text,
          textMonthFontWeight: '700',
        }}
        style={styles.calendar}
      />

      <View style={styles.legend}>
        {(Object.keys(statusStyle) as DayStatus[]).map((k) => (
          <View key={k} style={styles.legendItem}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: statusStyle[k].bg,
                  borderWidth: statusStyle[k].border ? 1 : 0,
                  borderColor: statusStyle[k].border,
                },
              ]}
            />
            <Text style={styles.legendText}>{statusLabel[k]}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.date}>{parseISO(selected).toDateString()}</Text>
        <Text style={styles.status}>{status ? statusLabel[status] : 'No special status'}</Text>

        {periodOnSelected ? (
          <>
            {!periodOnSelected.endDate && selected >= periodOnSelected.startDate && !isFuture && (
              <TouchableOpacity
                style={styles.btn}
                onPress={() => endPeriod(periodOnSelected.id, selected)}
              >
                <Text style={styles.btnText}>Period ended on this day</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.btn, styles.btnOutline]}
              onPress={() => deletePeriod(periodOnSelected.id)}
            >
              <Text style={[styles.btnText, { color: colors.primary }]}>Remove this period</Text>
            </TouchableOpacity>
          </>
        ) : isFuture ? (
          <Text style={styles.hint}>You can only log periods for today or past dates.</Text>
        ) : (
          <TouchableOpacity style={styles.btn} onPress={() => startPeriod(selected)}>
            <Text style={styles.btnText}>Period started on this day</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  calendar: { margin: 12, borderRadius: 16, paddingBottom: 8 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 14, height: 14, borderRadius: 7, marginRight: 6 },
  legendText: { color: colors.muted, fontSize: 12 },
  card: { margin: 16, padding: 16, backgroundColor: colors.card, borderRadius: 16 },
  date: { fontSize: 18, fontWeight: '700', color: colors.text },
  status: { color: colors.muted, marginTop: 4, marginBottom: 12 },
  hint: { color: colors.muted },
  btn: { backgroundColor: colors.primary, padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  btnOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary },
  btnText: { color: '#FFFFFF', fontWeight: '600' },
});

