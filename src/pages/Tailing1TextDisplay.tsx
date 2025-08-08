// components/TailingAllTextDisplay.tsx
// import React from 'react';
// import { ScrollView, Text, View } from 'react-native';
// import { useTailingData } from './TailingDataContext';

// const TailingAllTextDisplay = () => {
//   const { tailingData } = useTailingData(); // tailing1~5를 포함한 Record

//   return (
//     <ScrollView style={{ padding: 16 }}>
//       {Object.entries(tailingData).map(([deviceId, dataList]) => (
//         <View key={deviceId} style={{ marginBottom: 24 }}>
//           <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
//             {deviceId} 최근 데이터 ({dataList.length}개):
//           </Text>
//           <ScrollView style={{ maxHeight: 300 }}>
//             {dataList.map((data, idx) => (
//               <Text key={idx} style={{ marginBottom: 4 }}>
//                 #{data.seq} → val1: {data.val1}, val2: {data.val2}, val3: {data.val3}, val4: {data.val4}, val5: {data.val5}, val6: {data.val6}
//               </Text>
//             ))}
//           </ScrollView>
//         </View>
//       ))}
//     </ScrollView>
//   );
// };

// export default TailingAllTextDisplay;

import React from 'react';
import { ScrollView, Text, View, StyleSheet, Dimensions } from 'react-native';
import { useTailingData } from '../contexts/TailingDataContext';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const TailingAllTextDisplay = () => {
    const { tailingData } = useTailingData();

    return (
        <ScrollView style={{ padding: 16 }}>
            {Object.entries(tailingData).map(([deviceId, dataList]) => {
                if (dataList.length === 0) return null;

                const last = dataList[dataList.length - 1];

                const labels = dataList.map((d) => d.cnt.toString()).slice(-6);
                const hrData = dataList.map((d) => d.hr).slice(-50);
                const spo2Data = dataList.map((d) => d.spo2).slice(-50);
                const tempData = dataList.map((d) => d.temp).slice(-50);
                return (
                    <>
                        <View key={deviceId} style={styles.deviceSection}>
                            <Text style={styles.deviceTitle}>{deviceId.toUpperCase()} 최근 데이터 ({dataList.length}개)</Text>

                            {/* 차트 */}
                            {/* <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <LineChart
                                    data={{
                                        labels: Array.from({ length: 7 }, (_, i) => (i * 0.5).toFixed(1)), // 0.0 ~ 3.0초 (7개 라벨)
                                        datasets: [
                                            {
                                                data: dataList.slice(-150).map((d) => d.ir),
                                                color: () => '#F0663F',
                                                strokeWidth: 2,
                                            },
                                        ],
                                        legend: ['IR (적외선)'],
                                    }}
                                    width={Math.max(screenWidth, 600)}
                                    height={220}
                                    chartConfig={{
                                        backgroundColor: '#ffffff',
                                        backgroundGradientFrom: '#ffffff',
                                        backgroundGradientTo: '#ffffff',
                                        decimalPlaces: 0,
                                        color: () => '#ffffff',
                                        labelColor: () => '#666',
                                    }}
                                    withDots={false}
                                    withShadow={false}
                                    withInnerLines={true}
                                    bezier
                                    style={{ borderRadius: 12, marginBottom: 20 }}
                                />
                            </ScrollView> */}

                            {/* 실시간 값 박스 */}
                            <View style={styles.vitalRow}>
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
                            </View>

                            {/* 텍스트 데이터 */}
                            {/* <ScrollView style={{ maxHeight: 200 }}>
                            {dataList.map((data, idx) => (
                                <Text key={idx} style={{ marginBottom: 4, fontSize: 12 }}>
                                    #{data.seq} → val1: {data.val1}, val2: {data.val2}, val3: {data.val3}, val4(HR): {data.val4}, val5(SpO2): {data.val5}, val6(Temp): {data.val6}, val7(Bat): {data.val7}
                                </Text>
                            ))}
                        </ScrollView> */}
                        </View>
                    </>
                );
            })}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    deviceSection: {
        marginBottom: 40,
        flex: 1,
        padding: 20
    },
    deviceTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#F0663F',
    },
    vitalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingHorizontal: 4,
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

export default TailingAllTextDisplay;

