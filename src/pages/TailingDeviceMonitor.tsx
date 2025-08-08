// import React from 'react';
// import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
// import { useRoute } from '@react-navigation/native';
// import { useTailingData } from './TailingDataContext';
// import { LineChart } from 'react-native-chart-kit';
// import Header from './header';

// const screenWidth = Dimensions.get('window').width;

// const TailingDeviceMonitor = () => {
//     const route = useRoute();
//     const { deviceId } = route.params as { deviceId: string };
//     const { tailingData } = useTailingData();
//     const dataList = tailingData[deviceId] || [];
//     const sliced = dataList.slice(-150); // 최근 150개

//     const startTime = sliced[0].timestamp; // 시작 시간 기준
//     const irData = sliced.map((d) => d.ir);

//     // x축 레이블: 0.0s, 0.1s, ..., 3.0s
//     const timeLabels = sliced.map((d) => ((d.timestamp - startTime) / 1000).toFixed(2));
//     if (dataList.length === 0) {
//         return (
//             <View style={styles.centered}>
//                 <Text>데이터가 없습니다.</Text>
//             </View>
//         );
//     }

//     const last = dataList[dataList.length - 1];

//     return (
//         <>
//             <Header title={deviceId} />

//             <ScrollView style={styles.container}>
//                 <Text style={styles.title}>{deviceId.toUpperCase()} 모니터링</Text>

//                 <LineChart
//                     data={{
//                         labels: Array.from({ length: 7 }, (_, i) => (i * 0.5).toFixed(1)), // 0~3초
//                         datasets: [
//                             {
//                                 data: dataList.slice(-150).map((d) => d.ir),
//                                 color: () => '#F0663F',
//                                 strokeWidth: 2,
//                             },
//                         ],
//                         legend: ['IR'],
//                     }}
//                     width={Math.max(screenWidth, 600)}
//                     height={220}
//                     chartConfig={{
//                         backgroundColor: '#ffffff',
//                         backgroundGradientFrom: '#ffffff',
//                         backgroundGradientTo: '#ffffff',
//                         decimalPlaces: 0,
//                         color: () => '#333333',
//                         labelColor: () => '#666',
//                         propsForDots: { r: '1' },
//                     }}
//                     withDots={false}
//                     withShadow={false}
//                     withInnerLines={true}
//                     bezier
//                     style={{ borderRadius: 12, marginBottom: 20 }}
//                 />
//                 {/* <LineChart
//                     data={{
//                         labels: timeLabels.filter((_, i) => i % 20 === 0), // 0.0, 0.6, 1.2, ..., 3.0 (6개 간격 표시)
//                         datasets: [
//                             {
//                                 data: irData,
//                                 color: () => '#F0663F',
//                                 strokeWidth: 2,
//                             },
//                         ],
//                         legend: ['IR (적외선)'],
//                     }}
//                     width={Math.max(screenWidth, 600)}
//                     height={220}
//                     chartConfig={{
//                         backgroundColor: '#ffffff',
//                         backgroundGradientFrom: '#ffffff',
//                         backgroundGradientTo: '#ffffff',
//                         decimalPlaces: 0,
//                         color: () => '#333333',
//                         labelColor: () => '#666',
//                         propsForDots: { r: '1' },
//                     }}
//                     withDots={false}
//                     withShadow={false}
//                     withInnerLines={true}
//                     bezier
//                     style={{ borderRadius: 12, marginBottom: 20 }}
//                 /> */}

//                 <View style={styles.vitalRow}>
//                     <View style={styles.vitalBox}>
//                         <Text style={styles.vitalLabel}>심박수</Text>
//                         <Text style={styles.vitalValue}>{last.hr} <Text style={styles.vitalUnit}>BPM</Text></Text>
//                     </View>
//                     <View style={styles.vitalBox}>
//                         <Text style={styles.vitalLabel}>산소포화도</Text>
//                         <Text style={styles.vitalValue}>{last.spo2} <Text style={styles.vitalUnit}>%</Text></Text>
//                     </View>
//                     <View style={styles.vitalBox}>
//                         <Text style={styles.vitalLabel}>체온</Text>
//                         <Text style={styles.vitalValue}>{last.temp} <Text style={styles.vitalUnit}>°C</Text></Text>
//                     </View>
//                 </View>
//                 <View style={styles.vitalRow}>
//                     <View style={styles.vitalBox}>
//                         <Text style={styles.vitalLabel}>배터리</Text>
//                         <Text style={styles.vitalValue}>{last.battery} <Text style={styles.vitalUnit}>%</Text></Text>
//                     </View>
//                 </View>
//             </ScrollView>
//         </>

//     );
// };

// const styles = StyleSheet.create({
//     container: {
//         padding: 16,
//     },
//     centered: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     title: {
//         fontSize: 18,
//         fontWeight: 'bold',
//         marginBottom: 12,
//         color: '#F0663F',
//     },
//     vitalRow: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         marginBottom: 16,
//     },
//     vitalBox: {
//         flex: 1,
//         marginHorizontal: 4,
//         padding: 12,
//         backgroundColor: '#fffbe6',
//         borderWidth: 1,
//         borderColor: '#f5b75c',
//         borderRadius: 12,
//         alignItems: 'center',
//     },
//     vitalLabel: {
//         fontSize: 14,
//         color: '#888',
//         marginBottom: 4,
//     },
//     vitalValue: {
//         fontSize: 20,
//         fontWeight: 'bold',
//         color: '#333',
//     },
//     vitalUnit: {
//         fontSize: 14,
//         color: '#666',
//     },
// });

// export default TailingDeviceMonitor;
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useTailingData } from '../contexts/TailingDataContext';
import Svg, { Path, Line, Text as SvgText } from 'react-native-svg';
import TailingData from './TailingData';

const chartHeight = 200;
const padding = 45;
const graphHeight = chartHeight - padding;

const TailingDeviceMonitor = () => {

    const screenWidth = Dimensions.get('window').width;
    const [orientation, setOrientation] = useState('PORTRAIT');

    const route = useRoute();
    const { deviceId } = route.params as { deviceId: string };
    const { tailingData } = useTailingData();
    const dataList = tailingData[deviceId] || [];
    const sliced = dataList.slice(-150);

    if (sliced.length === 0) {
        return (
            <>
                <View style={styles.centered}>
                    <Text>데이터가 없습니다.</Text>
                </View>
            </>

        );
    }

    const last = sliced[sliced.length - 1];
    const startTime = sliced[0].timestamp;
    const irData = sliced.map(d => d.ir);
    const timeDiffs = sliced.map(d => (d.timestamp - startTime) / 1000);

    // Y축 범위 계산
    const minY = Math.min(...irData);
    const maxY = Math.max(...irData);
    const yRange = maxY - minY || 1;

    const chartWidth = screenWidth * 1.5;
    const pointGap = chartWidth / irData.length;

    // SVG Path 생성
    const createPath = () => {
        return irData.map((value, index) => {
            const x = index * pointGap + padding;
            const y = padding + ((maxY - value) / yRange) * graphHeight;
            return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');
    };

    return (
        <>
            <ScrollView style={styles.container}>
                <Text style={styles.title}>{deviceId.toUpperCase()} 심박수</Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <Svg width={chartWidth} height={chartHeight + 50}>
                        {/* Y축 그리드 라인 및 라벨 */}
                        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
                            const yValue = Math.round(maxY - p * yRange).toString();
                            const yPos = padding + graphHeight * p;
                            return (
                                <React.Fragment key={`y-${i}`}>
                                    <Line
                                        x1={padding}
                                        y1={yPos}
                                        x2={chartWidth}
                                        y2={yPos}
                                        stroke="#ddd"
                                        strokeWidth="1"
                                    />
                                    <SvgText
                                        x={padding - 6}
                                        y={yPos + 4}
                                        fontSize="10"
                                        fill="#999"
                                        textAnchor="end"
                                    >
                                        {yValue}
                                    </SvgText>
                                </React.Fragment>
                            );
                        })}

                        {/* X축 시간 라벨 (5개만 고르게 표시) */}
                        {/* {sliced.map((_, index) => {
                            if (index % Math.floor(sliced.length / 5) !== 0) return null;
                            const x = index * pointGap + padding;
                            const label = ((sliced[index].timestamp - startTime) / 1000).toFixed(1) + 's';

                            return (
                                <SvgText
                                    key={`x-${index}`}
                                    x={x}
                                    y={chartHeight +20}
                                    fontSize="10"
                                    fill="#999"
                                    textAnchor="middle"
                                >
                                    {label}
                                </SvgText>
                            );
                        })} */}

                        {/* 데이터 라인 */}
                        <Path
                            d={createPath()}
                            stroke="#F0663F"
                            strokeWidth="2"
                            fill="none"
                        />
                    </Svg>
                </ScrollView>

                <TailingData
                    screen={orientation}
                    data={{
                        hrData: last.hr,
                        spo2Data: last.spo2,
                        tempData: last.temp,
                    }}
                />

                {/* <View style={styles.vitalRow}>
                    <View style={styles.vitalBox}>
                        <Text style={styles.vitalLabel}>심박수</Text>
                        <Text style={styles.vitalValue}>{last.hr} <Text style={styles.vitalUnit}>BPM</Text></Text>
                    </View>
                    <View style={styles.vitalBox}>
                        <Text style={styles.vitalLabel}>산소포화도</Text>
                        <Text style={styles.vitalValue}>{last.spo2} <Text style={styles.vitalUnit}>%</Text></Text>
                    </View>
                    <View style={styles.vitalBox}>
                        <Text style={styles.vitalLabel}>체온</Text>
                        <Text style={styles.vitalValue}>{last.temp} <Text style={styles.vitalUnit}>°C</Text></Text>
                    </View>
                </View>
                <View style={styles.vitalRow}>
                    <View style={styles.vitalBox}>
                        <Text style={styles.vitalLabel}>배터리</Text>
                        <Text style={styles.vitalValue}>{last.battery} <Text style={styles.vitalUnit}>%</Text></Text>
                    </View>
                </View> */}
            </ScrollView>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#F0663F',
    },
    vitalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    vitalBox: {
        flex: 1,
        marginHorizontal: 4,
        padding: 12,
        backgroundColor: '#fffbe6',
        borderWidth: 1,
        borderColor: '#f5b75c',
        borderRadius: 12,
        alignItems: 'center',
    },
    vitalLabel: {
        fontSize: 14,
        color: '#888',
        marginBottom: 4,
    },
    vitalValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    vitalUnit: {
        fontSize: 14,
        color: '#666',
    },
});

export default TailingDeviceMonitor;
