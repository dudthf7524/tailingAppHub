import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useTailingData } from '../contexts/TailingDataContext';
import Svg, { Path, Line, Text as SvgText } from 'react-native-svg';
import VitalStats from '../components/VitalStats';
import Ionicons from 'react-native-vector-icons/Ionicons';

const COLORS = {
    primary: '#F0663F',
    bg: '#FAF6F2',
    text: '#333333',
    cardBg: '#FFFFFF',
    hint: '#7A7A7A',
    success: '#27AE60',
};

type IRDataPoint = {
    timestamp: number;
    value: number;
};

const screenWidth = Dimensions.get('window').width;

const IRMonitor = () => {
    const route = useRoute();
    const { deviceId, deviceName } = route.params as { deviceId: string; deviceName: string };
    const { tailingData } = useTailingData();
    
    const [data, setData] = useState<IRDataPoint[]>([]);
    const [isAutoScrolling, setIsAutoScrolling] = useState(true);
    const scrollViewRef = useRef<ScrollView>(null);

    const pointsPerView = 100;
    const pointWidth = screenWidth / pointsPerView;
    const chartWidth = Math.max(screenWidth, pointsPerView * pointWidth);
    const chartHeight = 220;
    const padding = 40;
    const graphHeight = chartHeight - padding;

    // Y축 범위 계산
    const getYAxisRange = () => {
        if (!data || data.length === 0) {
            return { min: 0, max: 20000 };
        }

        const values = data
            .map(point => point.value)
            .filter(value => typeof value === 'number' && !isNaN(value) && isFinite(value));

        if (values.length === 0) {
            return { min: 0, max: 20000 };
        }

        const min = Math.min(...values);
        const max = Math.max(...values);
        
        if (min === max) {
            return { min: Math.max(0, min - 1000), max: max + 1000 };
        }

        const paddingValue = (max - min) * 0.1;
        return {
            min: Math.max(0, min - paddingValue),
            max: max + paddingValue
        };
    };

    const [hrData, setHrData] = useState<IRDataPoint[]>([]);
    const [spo2Data, setSpo2Data] = useState<IRDataPoint[]>([]);

    // IR 데이터를 그래프 데이터로 변환 (1초마다)
    useEffect(() => {
        try {
            const dataList = tailingData[deviceId] || [];
            
            if (!isAutoScrolling || !dataList || dataList.length === 0) return;
            
            // IR 값 추출
            const irValues = dataList
                .filter(item => typeof item.ir === 'number' && !isNaN(item.ir) && isFinite(item.ir))
                .map(item => item.ir);
            
            if (irValues.length === 0) return;
            
            // 데이터 포인트 수를 줄임
            const step = Math.max(1, Math.floor(irValues.length / 100));
            
            const newIrPoints: IRDataPoint[] = irValues
                .filter((_, index) => index % step === 0)
                .map((value, index) => ({
                    timestamp: Date.now() + index * 20,
                    value: value
                }));
            
            setData(prevData => {
                const updatedData = [...prevData, ...newIrPoints];
                return updatedData.slice(-100);
            });

            const hrValues = dataList
                .filter(item => typeof item.hr === 'number' && !isNaN(item.hr) && isFinite(item.hr))
                .map(item => item.hr);
            
            const spo2Values = dataList
                .filter(item => typeof item.spo2 === 'number' && !isNaN(item.spo2) && isFinite(item.spo2))
                .map(item => item.spo2);
            
            if (hrValues.length > 0) {
                const lastHrValue = hrValues[hrValues.length - 1];
                setHrData(prevData => {
                    const newPoint: IRDataPoint = {
                        timestamp: Date.now(),
                        value: lastHrValue
                    };
                    const updatedData = [...prevData, newPoint];
                    return updatedData.slice(-100);
                });
            }
            
            if (spo2Values.length > 0) {
                const lastSpo2Value = spo2Values[spo2Values.length - 1];
                setSpo2Data(prevData => {
                    const newPoint: IRDataPoint = {
                        timestamp: Date.now(),
                        value: lastSpo2Value
                    };
                    const updatedData = [...prevData, newPoint];
                    return updatedData.slice(-100);
                });
            }
        } catch (error) {
            console.error('Error processing IR data:', error);
        }
    }, [deviceId, tailingData, isAutoScrolling]);

    // HR, SPO2 데이터 업데이트 (4초마다)
    useEffect(() => {
        const interval = setInterval(() => {
            try {
                const dataList = tailingData[deviceId] || [];
                console.log("aaaaaaaaaaaaa")
                
                if (!dataList || dataList.length === 0) return;
                
                const hrValues = dataList
                    .filter(item => typeof item.hr === 'number' && !isNaN(item.hr) && isFinite(item.hr))
                    .map(item => item.hr);
                    console.log("hrValues", hrValues)
                
                const spo2Values = dataList
                    .filter(item => typeof item.spo2 === 'number' && !isNaN(item.spo2) && isFinite(item.spo2))
                    .map(item => item.spo2);
                
                if (hrValues.length > 0) {
                    const lastHrValue = hrValues[hrValues.length - 1];
                    setHrData(prevData => {
                        const newPoint: IRDataPoint = {
                            timestamp: Date.now(),
                            value: lastHrValue
                        };
                        const updatedData = [...prevData, newPoint];
                        return updatedData.slice(-100);
                    });
                }
                
                if (spo2Values.length > 0) {
                    const lastSpo2Value = spo2Values[spo2Values.length - 1];
                    setSpo2Data(prevData => {
                        const newPoint: IRDataPoint = {
                            timestamp: Date.now(),
                            value: lastSpo2Value
                        };
                        const updatedData = [...prevData, newPoint];
                        return updatedData.slice(-100);
                    });
                }
            } catch (error) {
                console.error('Error processing HR/SPO2 data:', error);
            }
        }, 4000); // 4초마다
        
        return () => clearInterval(interval);
    }, [deviceId, tailingData]);

    // 자동 스크롤
    useEffect(() => {
        if (!isAutoScrolling) return;

        const scrollInterval = setInterval(() => {
            if (scrollViewRef.current) {
                scrollViewRef.current.scrollToEnd({ animated: false });
            }
        }, 500);

        return () => clearInterval(scrollInterval);
    }, [isAutoScrolling]);

    // Y축 레이블 생성
    const getYLabels = () => {
        const { min, max } = getYAxisRange();
        const range = max - min;
        if (range <= 0) return ['0', '5000', '10000', '15000', '20000'];

        const step = range / 4;
        return Array.from({ length: 5 }, (_, i) => 
            Math.round(min + step * i).toString()
        ).reverse();
    };

    // X축 레이블 생성 (시간을 0,1,2,3으로)
    const getXLabels = () => {
        if (!data || data.length === 0) return [];
        
        // 그래프 전체 너비에서 0, 1/3, 2/3, 끝 지점에 레이블 배치
        const graphWidthTotal = chartWidth - padding;
        const positions = [
            padding + 50,  // 0: 더 오른쪽으로
            padding + graphWidthTotal / 3, 
            padding + (graphWidthTotal * 2) / 3, 
            chartWidth - 20
        ];
        
        return [0, 1, 2, 3].map((label, i) => ({
            x: positions[i],
            time: label.toString()
        }));
    };

    // SVG Path 생성 - 최적화 (제공된 코드 방식)
    const createPath = () => {
        try {
            if (!data || data.length === 0) return '';
            
            const { min, max } = getYAxisRange();
            const range = max - min;
            
            if (range <= 0) return '';

            // 데이터 포인트 수를 줄임 (모든 포인트를 사용하지 않고 일부만 사용)
            const step = Math.max(1, Math.floor(data.length / 100));
            const points = data
                .filter((_, index) => index % step === 0) // 데이터 포인트 샘플링
                .filter(point => typeof point.value === 'number' && !isNaN(point.value) && isFinite(point.value))
                .map((item, index) => {
                    const x = index * pointWidth * step + padding;
                    const y = chartHeight - padding - ((item.value - min) / range) * graphHeight;
                    return `${x},${y}`;
                });

            return points.length > 0 ? `M ${points.join(' L ')}` : '';
        } catch (error) {
            console.error('Error creating path:', error);
            return '';
        }
    };

    const yLabels = getYLabels();
    const xLabels = getXLabels();
    const lastData = tailingData[deviceId]?.[tailingData[deviceId].length - 1];

    if (data.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>데이터 수집 중...</Text>
            </View>
        );
    }

    const minValue = data.length > 0 ? Math.min(...data.map(p => p.value)) : 0;
    const maxValue = data.length > 0 ? Math.max(...data.map(p => p.value)) : 0;
    const avgValue = data.length > 0 ? data.map(p => p.value).reduce((a, b) => a + b, 0) / data.length : 0;

    const currentHr = hrData.length > 0 ? hrData[hrData.length - 1]?.value : 0;
    const currentSpo2 = spo2Data.length > 0 ? spo2Data[spo2Data.length - 1]?.value : 0;
    const currentTemp = lastData?.temp || 0;
    const batteryLevel = lastData?.battery || 0;

    // 배터리 아이콘 선택
    const getBatteryIcon = (level: number) => {
        if (level >= 75) return 'battery-full';
        if (level >= 50) return 'battery-half';
        if (level >= 25) return 'battery-half-outline';
        return 'battery-dead';
    };

    // 배터리 색상 선택
    const getBatteryColor = (level: number) => {
        if (level >= 50) return '#27AE60';
        if (level >= 25) return '#F39C12';
        return '#E74C3C';
    };

    return (
        <ScrollView style={styles.scrollView}>
            <View style={styles.headerCard}>
                <View style={styles.headerTop}>
                    <Text style={styles.title}>{deviceName}</Text>
                    <View style={styles.batteryContainer}>
                        <Ionicons 
                            name={getBatteryIcon(batteryLevel)} 
                            size={20} 
                            color={getBatteryColor(batteryLevel)} 
                        />
                        <Text style={styles.batteryText}>{batteryLevel}%</Text>
                    </View>
                </View>
            </View>

           
            <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>IR 신호 그래프</Text>
                <View style={styles.chartWrapper}>
                    <View style={styles.yAxisLabels}>
                        {yLabels.map((label, index) => (
                            <Text key={index} style={styles.yAxisLabel}>
                                {label}
                            </Text>
                        ))}
                    </View>
                    <ScrollView 
                        ref={scrollViewRef}
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        style={styles.graphContainer}
                    >
                        <Svg width={chartWidth} height={chartHeight}>
                            {/* 그리드 라인 */}
                            {yLabels.map((_, index) => (
                                <Line
                                    key={index}
                                    x1={padding}
                                    y1={padding + (graphHeight * index) / 4}
                                    x2={chartWidth}
                                    y2={padding + (graphHeight * index) / 4}
                                    stroke="#E0E0E0"
                                    strokeWidth="1"
                                />
                            ))}
                            
                            {/* 데이터 라인 */}
                            {data.length > 0 && (
                                <Path
                                    d={createPath()}
                                    stroke={COLORS.primary}
                                    strokeWidth="2"
                                    fill="none"
                                />
                            )}
                        </Svg>
                    </ScrollView>
                </View>
                
                {/* X축 레이블을 SVG 바깥에 표시 */}
                <View style={styles.xAxisLabelContainer}>
                    <Text style={styles.xAxisLabelText}>0</Text>
                    <View style={{ flex: 1 }} />
                    <Text style={styles.xAxisLabelText}>1</Text>
                    <View style={{ flex: 1 }} />
                    <Text style={styles.xAxisLabelText}>2</Text>
                    <View style={{ flex: 1 }} />
                    <Text style={styles.xAxisLabelText}>3</Text>
                </View>
                <TouchableOpacity 
                    style={styles.playButton} 
                    onPress={() => setIsAutoScrolling(!isAutoScrolling)}
                >
                    <Text style={styles.playButtonText}>
                        {isAutoScrolling ? '정지' : '재생'}
                    </Text>
                </TouchableOpacity>
            </View>

            <VitalStats hr={currentHr} spo2={currentSpo2} temp={currentTemp} />

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollView: {
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
        fontSize: 16,
        color: COLORS.hint,
        textAlign: 'center',
    },
    headerCard: {
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
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.primary,
    },
    batteryContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    batteryText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    deviceName: {
        fontSize: 14,
        color: COLORS.hint,
    },
    currentValueCard: {
        backgroundColor: COLORS.cardBg,
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    valueHeader: {
        alignItems: 'center',
    },
    valueLabel: {
        fontSize: 14,
        color: COLORS.hint,
        marginBottom: 8,
    },
    value: {
        fontSize: 40,
        fontWeight: '700',
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
    chartTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 12,
    },
    chartWrapper: {
        flexDirection: 'row',
        height: 220,
        alignItems: 'center',
    },
    yAxisLabels: {
        width: 50,
        height: '100%',
        justifyContent: 'space-between',
        paddingVertical: 10,
        marginRight: 5,
    },
    yAxisLabel: {
        fontSize: 12,
        color: COLORS.hint,
        textAlign: 'right',
        paddingRight: 5,
    },
    graphContainer: {
        flex: 1,
    },
    playButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        alignSelf: 'center',
        marginTop: 12,
    },
    playButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    xAxisLabelContainer: {
        height: 30,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 50,
        marginHorizontal: -16,
    },
    xAxisLabelText: {
        fontSize: 12,
        color: COLORS.hint,
        textAlign: 'center',
        minWidth: 50,
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
    statsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.primary,
        marginBottom: 8,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
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

export default IRMonitor;

