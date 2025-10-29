import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import IRMonitor from './IRMonitor';
import TemperatureMonitor from './TemperatureMonitor';

const COLORS = {
    primary: '#F0663F',
    bg: '#FAF6F2',
    text: '#333333',
    cardBg: '#FFFFFF',
    hint: '#7A7A7A',
    success: '#27AE60',
};

const MonitorDashboard = () => {
    const [selectedTab, setSelectedTab] = useState<'ir' | 'temp'>('ir');

    return (
        <SafeAreaView style={styles.container}>
            {/* 탭 버튼 */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tabButton, selectedTab === 'ir' && styles.tabButtonActive]}
                    onPress={() => setSelectedTab('ir')}
                >
                    <Text style={[styles.tabText, selectedTab === 'ir' && styles.tabTextActive]}>IR 신호</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, selectedTab === 'temp' && styles.tabButtonActive]}
                    onPress={() => setSelectedTab('temp')}
                >
                    <Text style={[styles.tabText, selectedTab === 'temp' && styles.tabTextActive]}>체온</Text>
                </TouchableOpacity>
            </View>

            {/* 콘텐츠 */}
            {selectedTab === 'ir' && <IRMonitor />}
            {selectedTab === 'temp' && <TemperatureMonitor />}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    tabContainer: {
        flexDirection: 'row',
        margin: 16,
        padding: 4,
        backgroundColor: COLORS.cardBg,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 16,
        alignItems: 'center',
        borderRadius: 8,
    },
    tabButtonActive: {
        backgroundColor: COLORS.primary,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.hint,
    },
    tabTextActive: {
        color: '#FFFFFF',
    },
});

export default MonitorDashboard;



