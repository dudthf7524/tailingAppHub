import React from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useTailingData } from '../contexts/TailingDataContext';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;
const COLORS = {
    primary: '#F0663F',
    bg: '#FAF6F2',
    text: '#333333',
    cardBg: '#FFFFFF',
    hint: '#7A7A7A',
    success: '#27AE60',
};

const DeviceMonitor = () => {
    const route = useRoute();
    const { deviceId, deviceName } = route.params as { deviceId: string; deviceName: string };
    const { rawWebSocketData } = useTailingData();

    // rawWebSocketData에서 데이터 가져오기
    let dataList: any[] = [];

    // Handle array format
    if (Array.isArray(rawWebSocketData)) {
        const matchedData = rawWebSocketData.find((item: any) => item.deviceAddress === deviceId);
        if (matchedData && matchedData.deviceData) {
            dataList = matchedData.deviceData;
        }
    } else if (rawWebSocketData && rawWebSocketData.deviceAddress === deviceId && rawWebSocketData.deviceData) {
        dataList = rawWebSocketData.deviceData;
    }
    
    // 1초에 50개 데이터가 들어오므로, 50개마다 1개씩 선택 (다운샘플링)
    const sampledData = dataList.filter((_, index) => index % 50 === 0).slice(-60);

    // IR 값 추출 (문자열을 숫자로 변환)
    const irValues = sampledData
        .map(d => Number(d.ir))
        .filter(value => !isNaN(value) && isFinite(value));

    const lastData = dataList.length > 0 ? dataList[dataList.length - 1] : null;

    if (irValues.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>데이터를 기다리는 중...</Text>
                    <Text style={styles.emptySubText}>디바이스에서 데이터를 수집하는 중입니다</Text>
                </View>
            </View>
        );
    }

    // Y축 안정화를 위한 여유 공간
    const rawMinY = Math.min(...irValues);
    const rawMaxY = Math.max(...irValues);
    const padding = Math.max((rawMaxY - rawMinY) * 0.25, 50);
    
    const chartData = {
        labels: Array(11).fill(''),
        datasets: [{
            data: irValues.length > 0 ? irValues : [0],
            color: (opacity = 1) => COLORS.primary,
            strokeWidth: 2,
        }],
    };

    return (
        <View style={styles.container}>
            <ScrollView>
                {/* 헤더 */}
                <View style={styles.header}>
                    <Text style={styles.deviceName}>{deviceName}</Text>
                    <Text style={styles.title}>IR 신호 모니터링</Text>
                </View>

                {/* 차트 */}
                <View style={styles.chartCard}>
                    <LineChart
                        data={chartData}
                        width={screenWidth - 48}
                        height={300}
                        chartConfig={{
                            backgroundColor: COLORS.cardBg,
                            backgroundGradientFrom: COLORS.cardBg,
                            backgroundGradientTo: COLORS.cardBg,
                            decimalPlaces: 0,
                            color: (opacity = 1) => COLORS.primary,
                            labelColor: (opacity = 1) => COLORS.hint,
                            propsForDots: {
                                r: '3',
                                strokeWidth: '2',
                                stroke: COLORS.primary,
                            },
                        }}
                        bezier
                        style={{
                            marginVertical: 8,
                            borderRadius: 16,
                        }}
                        withInnerLines={true}
                        withVerticalLines={false}
                        withShadow={true}
                        withDots={false}
                        segments={5}
                    />
                    <Text style={styles.chartLabel}>시간 (초)</Text>
                </View>

                {/* 현재 값 */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>현재 값</Text>
                    <Text style={styles.infoValue}>{lastData ? Number(lastData.ir) || 0 : 0}</Text>
                </View>

                {/* 통계 */}
                <View style={styles.statsCard}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>최소값</Text>
                        <Text style={styles.statValue}>{rawMinY}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>최대값</Text>
                        <Text style={styles.statValue}>{rawMaxY}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>범위</Text>
                        <Text style={styles.statValue}>{rawMaxY - rawMinY}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>샘플</Text>
                        <Text style={styles.statValue}>{sampledData.length}</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubText: {
        fontSize: 14,
        color: COLORS.hint,
        textAlign: 'center',
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 16,
    },
    deviceName: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.primary,
    },
    chartCard: {
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
    chartLabel: {
        fontSize: 12,
        color: COLORS.hint,
        textAlign: 'right',
        marginTop: 8,
    },
    infoCard: {
        backgroundColor: COLORS.cardBg,
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    infoTitle: {
        fontSize: 14,
        color: COLORS.hint,
        marginBottom: 8,
    },
    infoValue: {
        fontSize: 36,
        fontWeight: '700',
        color: COLORS.primary,
    },
    statsCard: {
        backgroundColor: COLORS.cardBg,
        marginHorizontal: 16,
        marginBottom: 20,
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    statItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    statLabel: {
        fontSize: 14,
        color: COLORS.hint,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
});

export default DeviceMonitor;



