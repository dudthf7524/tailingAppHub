import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const COLORS = {
    primary: '#F0663F',
    bg: '#FAF6F2',
    text: '#333333',
    cardBg: '#FFFFFF',
    hint: '#7A7A7A',
    success: '#27AE60',
};

type VitalStatsProps = {
    hr: number;
    spo2: number;
    temp: number;
};

const VitalStats = ({ hr, spo2, temp }: VitalStatsProps) => {
    return (
        <View style={styles.container}>
            {/* 심박수 */}
            <View style={styles.item}>
                <Ionicons name="pulse" size={28} color="#E74C3C" />
                <Text style={styles.label}>심박수</Text>
                <Text style={styles.value}>{Math.round(hr || 0)}</Text>
                <Text style={styles.unit}>bpm</Text>
            </View>

            <View style={styles.divider} />

            {/* 산소포화도 */}
            <View style={styles.item}>
                <Ionicons name="water" size={28} color="#2196F3" />
                <Text style={styles.label}>산소포화도</Text>
                <Text style={styles.value}>{Math.round(spo2 || 0)}</Text>
                <Text style={styles.unit}>%</Text>
            </View>

            <View style={styles.divider} />

            {/* 체온 */}
            <View style={styles.item}>
                <Ionicons name="thermometer" size={28} color="#E74C3C" />
                <Text style={styles.label}>체온</Text>
                <Text style={styles.value}>{(temp || 0).toFixed(1)}</Text>
                <Text style={styles.unit}>°C</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: COLORS.cardBg,
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    item: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: 12,
        color: COLORS.hint,
        marginBottom: 4,
        marginTop: 8,
        fontWeight: '500',
    },
    value: {
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 2,
    },
    unit: {
        fontSize: 11,
        color: COLORS.hint,
    },
    divider: {
        width: 1,
        backgroundColor: '#E0E0E0',
        marginHorizontal: 8,
    },
});

export default VitalStats;

