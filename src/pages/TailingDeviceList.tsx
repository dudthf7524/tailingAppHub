import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTailingData } from '../contexts/TailingDataContext';
import { SafeAreaView } from 'react-native-safe-area-context';

const TailingDeviceList = () => {
    const { tailingData } = useTailingData();
    const navigation = useNavigation();
    return (
        <SafeAreaView edges={['top']}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>모니터링 가능한 기기 목록</Text>
                {Object.keys(tailingData).map((deviceId) => (
                    <TouchableOpacity
                        key={deviceId}
                        style={styles.deviceButton}
                        onPress={() => navigation.navigate('TailingDashBoard', { deviceId })}
                        // onPress={() => navigation.navigate('TailingDashBoard')}

                    >
                        <Text style={styles.deviceText}>{deviceId.toUpperCase()}</Text>
                    </TouchableOpacity>
                ))}
                {/* <Text style={styles.title}>
                    전체보기
                </Text>

                <TouchableOpacity
                    style={styles.deviceButton}
                    onPress={() => navigation.navigate('Tailing1TextDisplay')}
                >
                    <Text style={styles.deviceText}>전체보기</Text>
                </TouchableOpacity> */}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    deviceButton: {
        backgroundColor: '#F0663F',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    deviceText: {
        fontSize: 16,
        color: '#fff',
        textAlign: 'center',
    },
});

export default TailingDeviceList;
