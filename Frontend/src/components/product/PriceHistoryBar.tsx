import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Colors, Spacing } from '../../theme';

interface PriceHistoryBarProps {
  history: Array<{ price: number; recordedAt: string }>; // iso strings from backend
  currentPrice: number;
}

export const PriceHistoryBar: React.FC<PriceHistoryBarProps> = ({
  history,
  currentPrice,
}) => {
  if (!history || history.length === 0) {
    return <Text style={styles.noData}>No history</Text>;
  }
  const prices = history.map(h => h.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const position = (currentPrice - min) / range;
  const indicator = Math.max(0, Math.min(1, position));

  return (
    <View style={styles.container}>
      <View style={[styles.bar, { backgroundColor: Colors.surfaceBorder }]}>
        <View style={[styles.indicator, { left: `${indicator * 100}%` }]} />
      </View>
      <View style={styles.labelsRow}>
        <Text style={styles.labelSmall}>₹{min.toLocaleString()}</Text>
        <Text style={styles.labelSmall}>₹{max.toLocaleString()}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', paddingVertical: Spacing.xs },
  bar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.surfaceBorder,
  },
  indicator: {
    position: 'absolute',
    top: -2,
    width: 4,
    height: 12,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  labelSmall: { fontSize: 10, color: Colors.textMuted },
  noData: { fontSize: 12, color: Colors.textMuted },
});
