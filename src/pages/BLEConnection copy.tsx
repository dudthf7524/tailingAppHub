import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, FlatList,
    Alert, Platform, PermissionsAndroid, ActivityIndicator
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import BleManager from 'react-native-ble-manager';
import api from '../constant/contants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken } from '../utils/token';

const COLORS = {
    primary: '#F0663F',
    bg: '#FAF6F2',
    text: '#333333',
    cardBg: '#FFFFFF',
    hint: '#7A7A7A',
    success: '#27AE60',
    error: '#E74C3C',
};

interface Device {
    id: string;
    name: string;
    rssi?: number;
    isConnected: boolean;
}

const SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const CHARACTERISTIC_UUID_RX = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

export default function BLEConnection() {
    const [isScanning, setIsScanning] = useState(false);
    const [connectedDevices, setConnectedDevices] = useState<Device[]>([]);
    const [availableDevices, setAvailableDevices] = useState<Device[]>([]);
    const [hasPermissions, setHasPermissions] = useState(false);

    const sendTextToESP32 = async (deviceId: string, text: string): Promise<boolean> => {
        try {
            console.log('📤 ESP32로 텍스트 전송:', text);

            Alert.alert('알림', `deviceId : ${deviceId} / text : ${text}`)

            // 문자열을 바이트 배열로 변환
            const textBytes: number[] = Array.from(text, (char: string) => char.charCodeAt(0));

            // BLE Write 실행
            // await BleManager.write(
            //     deviceId,                    // 연결된 디바이스 ID
            //     SERVICE_UUID,               // 서비스 UUID
            //     CHARACTERISTIC_UUID_RX,     // 특성 UUID
            //     textBytes                   // 전송할 데이터 (바이트 배열)
            // );

            console.log('✅ 텍스트 전송 성공!');
            return true;

        } catch (error) {
            console.error('❌ 텍스트 전송 실패:', error);
            return false;
        }
    };

    useEffect(() => {
        checkPermissions();
    }, []);

    const checkPermissions = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                ]);

                const allGranted = Object.values(granted).every(
                    status => status === PermissionsAndroid.RESULTS.GRANTED
                );
                setHasPermissions(allGranted);
            } catch (error) {
                console.error('권한 요청 실패:', error);
                setHasPermissions(false);
            }
        } else {
            setHasPermissions(true);
        }
    };

    const startScan = async () => {
        if (!hasPermissions) {
            Alert.alert('권한 필요', 'Bluetooth 및 위치 권한이 필요합니다.');
            return;
        }

        setIsScanning(true);
        setAvailableDevices([]);

        // 시뮬레이션된 장치 검색 (실제 BLE 라이브러리로 교체 필요)
        setTimeout(() => {
            const mockDevices: Device[] = [
                { id: 'device-1', name: 'Tailing Hub 001', rssi: -45, isConnected: false },
                // { id: 'device-2', name: 'Tailing Hub 002', rssi: -67, isConnected: false },
                // { id: 'device-3', name: 'Tailing Sensor A1', rssi: -52, isConnected: false },
            ];
            setAvailableDevices(mockDevices);
            setIsScanning(false);
        }, 3000);
    };

    const stopScan = () => {
        setIsScanning(false);
    };

    const connectToDevice = async (device: Device) => {
        Alert.alert(
            '연결 확인',
            `${device.name}에 연결하시겠습니까?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '연결',
                    onPress: async () => {
                        try {
                            // 실제 BLE 연결 로직 (라이브러리로 교체 필요)
                            const connectedDevice = { ...device, isConnected: true };
                            setConnectedDevices(prev => [...prev, connectedDevice]);
                            setAvailableDevices(prev => prev.filter(d => d.id !== device.id));
                            Alert.alert('연결 성공', `${device.name}에 연결되었습니다.`);
                            sendTextToESP32('aaa', 'creamoffMacAddress');
                            //서버
                            const token = await getToken();
                            const result = await api.post('/hub/register', {
                                // org_name: form.orgName.trim(),
                                // org_address: form.orgAddress.trim(),
                                // org_email: form.email.trim(),
                                // org_pw: form.password,
                                // org_phone: form.phone.replace(/\D/g, ''),
                                // marketingAgreed: false,
                                // smsAgreed: false,
                                // emailAgreed: false,
                                // pushAgreed: false,
                                mac_address: '허브의 맥 주소',
                                org_email: token?.org_email || ''
                            });
                            Alert.alert('알림', `${result?.data.message}`)

                        } catch (error) {
                            Alert.alert('연결 실패', '장치 연결에 실패했습니다.');
                        }
                    }
                }
            ]
        );
    };

    const disconnectDevice = (device: Device) => {
        Alert.alert(
            '연결 해제',
            `${device.name}의 연결을 해제하시겠습니까?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '해제',
                    onPress: () => {
                        setConnectedDevices(prev => prev.filter(d => d.id !== device.id));
                        Alert.alert('연결 해제', `${device.name}의 연결이 해제되었습니다.`);
                    }
                }
            ]
        );
    };

    const renderDeviceItem = ({ item, isConnected }: { item: Device; isConnected: boolean }) => (
        <View style={styles.deviceItem}>
            <View style={styles.deviceInfo}>
                <View style={styles.deviceHeader}>
                    <Ionicons
                        name={isConnected ? "bluetooth" : "bluetooth-outline"}
                        size={24}
                        color={isConnected ? COLORS.success : COLORS.primary}
                    />
                    <Text style={styles.deviceName}>{item.name}</Text>
                    {isConnected && (
                        <View style={styles.connectedBadge}>
                            <Text style={styles.connectedText}>연결됨</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.deviceId}>ID: {item.id}</Text>
                {item.rssi && (
                    <Text style={styles.rssi}>신호 강도: {item.rssi} dBm</Text>
                )}
            </View>
            <TouchableOpacity
                style={[
                    styles.actionButton,
                    isConnected ? styles.disconnectButton : styles.connectButton
                ]}
                onPress={() => isConnected ? disconnectDevice(item) : connectToDevice(item)}
            >
                <Text style={[
                    styles.actionButtonText,
                    isConnected ? styles.disconnectButtonText : styles.connectButtonText
                ]}>
                    {isConnected ? '연결 해제' : '연결'}
                </Text>
            </TouchableOpacity>
        </View>
    );

    const decodeJWT = (token: string) => {
        try {
            const base64Payload = token.split('.')[1];
            const payload = atob(base64Payload);
            return JSON.parse(payload);
        } catch (error) {
            console.error('JWT 디코딩 실패:', error);
            return null;
        }
    };
    const checkStoredToken = async () => {
        try {
            const accessToken = await AsyncStorage.getItem('accessToken');
            const refreshToken = await AsyncStorage.getItem('refreshToken');
            const token = await getToken();
            Alert.alert('알림', `${token?.org_email}`);
            console.log('checkLoginStatus - token:', token);
            console.log('=== 저장된 토큰 확인 ===');
            console.log('Access Token:', accessToken);
            console.log('Refresh Token:', refreshToken);

            if (accessToken) {
                const decodedToken = decodeJWT(accessToken);
                const userEmail = decodedToken?.email || decodedToken?.org_email || decodedToken?.sub || 'Unknown';
                console.log('저장된 토큰에서 추출한 이메일:', userEmail);
                console.log('저장된 토큰 전체 페이로드:', decodedToken);
            }

            console.log('======================');

            const emailInfo = accessToken ? decodeJWT(accessToken)?.email || decodeJWT(accessToken)?.org_email || 'Unknown' : 'None';
            Alert.alert('토큰 확인',
                `Access Token: ${accessToken ? '있음' : '없음'}\nRefresh Token: ${refreshToken ? '있음' : '없음'}\n토큰 내 이메일: ${emailInfo}`
            );
        } catch (error) {
            console.error('토큰 확인 실패:', error);
        }
    };
    return (
        <View style={styles.container}>
            {/* 헤더 */}
            <View style={styles.header}>
                <Text style={styles.title}>BLE 연결 관리</Text>
                <Text style={styles.subtitle}>허브와 센서 장치 연결</Text>
            </View>
            <TouchableOpacity onPress={checkStoredToken} style={{ marginTop: 10 }}>
                <Text style={[{ color: COLORS.hint, fontSize: 12 }]}>
                    저장된 토큰 확인 (디버그용)
                </Text>
            </TouchableOpacity>
            {/* 스캔 컨트롤 */}
            <View style={styles.scanSection}>
                <View style={styles.scanHeader}>
                    <Text style={styles.sectionTitle}>장치 검색</Text>
                    {isScanning && <ActivityIndicator size="small" color={COLORS.primary} />}
                </View>
                <View style={styles.scanButtons}>
                    <TouchableOpacity
                        style={[styles.scanButton, isScanning && styles.scanButtonDisabled]}
                        onPress={startScan}
                        disabled={isScanning}
                    >
                        <Ionicons name="search" size={16} color="#fff" />
                        <Text style={styles.scanButtonText}>
                            {isScanning ? '검색 중...' : '검색 시작'}
                        </Text>
                    </TouchableOpacity>
                    {isScanning && (
                        <TouchableOpacity style={styles.stopButton} onPress={stopScan}>
                            <Ionicons name="stop" size={16} color={COLORS.error} />
                            <Text style={styles.stopButtonText}>중지</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* 연결된 장치 */}
            {connectedDevices.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>연결된 장치 ({connectedDevices.length})</Text>
                    <FlatList
                        data={connectedDevices}
                        renderItem={({ item }) => renderDeviceItem({ item, isConnected: true })}
                        keyExtractor={(item) => item.id}
                        style={styles.deviceList}
                    />
                </View>
            )}

            {/* 사용 가능한 장치 */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    사용 가능한 장치 ({availableDevices.length})
                </Text>
                {availableDevices.length === 0 && !isScanning ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="bluetooth-outline" size={48} color={COLORS.hint} />
                        <Text style={styles.emptyText}>검색 버튼을 눌러 장치를 찾아보세요</Text>
                    </View>
                ) : (
                    <FlatList
                        data={availableDevices}
                        renderItem={({ item }) => renderDeviceItem({ item, isConnected: false })}
                        keyExtractor={(item) => item.id}
                        style={styles.deviceList}
                    />
                )}
            </View>

            {/* 권한 안내 */}
            {!hasPermissions && (
                <View style={styles.permissionWarning}>
                    <Ionicons name="warning" size={20} color={COLORS.error} />
                    <Text style={styles.permissionText}>
                        Bluetooth 및 위치 권한이 필요합니다
                    </Text>
                    <TouchableOpacity onPress={checkPermissions}>
                        <Text style={styles.permissionLink}>권한 확인</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    header: {
        paddingTop: 20,
        paddingHorizontal: 24,
        paddingBottom: 20,
        backgroundColor: COLORS.cardBg,
        borderBottomWidth: 1,
        borderBottomColor: '#EFE7E0',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.hint,
    },
    scanSection: {
        backgroundColor: COLORS.cardBg,
        margin: 16,
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
    },
    scanHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        flex: 1,
    },
    scanButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    scanButton: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 24,
        gap: 8,
        flex: 1,
        justifyContent: 'center',
    },
    scanButtonDisabled: {
        opacity: 0.7,
    },
    scanButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    stopButton: {
        borderWidth: 1,
        borderColor: COLORS.error,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 24,
        gap: 8,
        justifyContent: 'center',
    },
    stopButtonText: {
        color: COLORS.error,
        fontWeight: '600',
        fontSize: 14,
    },
    section: {
        backgroundColor: COLORS.cardBg,
        margin: 16,
        marginTop: 0,
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
        flex: 1,
    },
    deviceList: {
        marginTop: 12,
    },
    deviceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#EFE7E0',
    },
    deviceInfo: {
        flex: 1,
    },
    deviceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    deviceName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginLeft: 8,
        flex: 1,
    },
    connectedBadge: {
        backgroundColor: COLORS.success,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    connectedText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },
    deviceId: {
        fontSize: 12,
        color: COLORS.hint,
        marginBottom: 2,
        marginLeft: 32,
    },
    rssi: {
        fontSize: 12,
        color: COLORS.hint,
        marginLeft: 32,
    },
    actionButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginLeft: 12,
    },
    connectButton: {
        backgroundColor: COLORS.primary,
    },
    disconnectButton: {
        borderWidth: 1,
        borderColor: COLORS.error,
        backgroundColor: 'transparent',
    },
    actionButtonText: {
        fontSize: 12,
        fontWeight: '600',
    },
    connectButtonText: {
        color: '#fff',
    },
    disconnectButtonText: {
        color: COLORS.error,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        marginTop: 12,
        color: COLORS.hint,
        fontSize: 14,
        textAlign: 'center',
    },
    permissionWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3F3',
        margin: 16,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FFE0E0',
    },
    permissionText: {
        flex: 1,
        marginLeft: 8,
        color: COLORS.error,
        fontSize: 12,
    },
    permissionLink: {
        color: COLORS.primary,
        fontWeight: '600',
        fontSize: 12,
    },
});