import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, FlatList,
    Alert, Platform, PermissionsAndroid, ActivityIndicator, TextInput, Modal, ScrollView
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import BleManager from 'react-native-ble-manager';
import { Buffer } from 'buffer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../store/reducer';


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

const SERVICE_UUID = '000000ff-0000-1000-8000-00805f9b34fb';
const CHARACTERISTIC_UUID_TX = '0000ff01-0000-1000-8000-00805f9b34fb';

export default function BLEConnection() {
    const [isScanning, setIsScanning] = useState(false);
    const [connectedDevices, setConnectedDevices] = useState<Device[]>([]);
    const [availableDevices, setAvailableDevices] = useState<Device[]>([]);
    const [hasPermissions, setHasPermissions] = useState(false);

    // WiFi 설정 관련 상태
    const [showWifiModal, setShowWifiModal] = useState(false);
    const [wifiSSID, setWifiSSID] = useState('');
    const [wifiPassword, setWifiPassword] = useState('');
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
    const [isProcessingWifiResponse, setIsProcessingWifiResponse] = useState(false);
    const [deviceMTU, setDeviceMTU] = useState<Map<string, number>>(new Map());
    const email = useSelector((state: RootState) => state.user.email);

    // 화면에 들어올 때마다 email 출력
    useEffect(() => {
        console.log("email : ", email);
    }, [email]);

    const sendTextToESP32 = async (deviceId: string, text: string): Promise<boolean> => {
        try {
            console.log('📤 ESP32로 전송할 데이터:', text);
            console.log('📤 Device ID:', deviceId);
            console.log("email : ", email);
            const texta = "s:" + text + email;

            console.log('📤 ESP32로 전송할 데이터:', texta);

            // 문자열을 UTF-8 바이트 배열로 변환 (버퍼 사용)
            const fullTextBytes = Buffer.from(texta, 'utf-8');
            const textBytes = Array.from(fullTextBytes);

            console.log('📦 변환된 바이트 배열:', textBytes);
            console.log('📦 바이트 배열 길이:', textBytes.length);

            // 협상된 MTU를 가져오거나 기본값 20바이트 사용
            const maxChunkSize = deviceMTU.get(deviceId) || 20;
            console.log('📏 사용 가능한 청크 크기:', maxChunkSize);

            // BLE 순차 전송하여 데이터가 정확히 전달되도록 함
            const CHUNK_SIZE = maxChunkSize;
            const totalChunks = Math.ceil(textBytes.length / CHUNK_SIZE);

            console.log(`📤 총 ${totalChunks}개 청크로 나누어 순차 전송합니다 (청크 크기: ${CHUNK_SIZE} bytes)`);

            // 마지막 청크가 17바이트 초과인지 추적
            let shouldSendEndMarker = false;

            // 순차적으로 전송 (각 청크가 완전히 전송될 때까지 대기)
            for (let i = 0; i < totalChunks; i++) {
                const start = i * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, textBytes.length);
                const chunk = textBytes.slice(start, end);

                // 마지막 청크인지 확인
                console.log("i : ", i);
                console.log("totalChunks : ", totalChunks);
                console.log("chunk.length : ", chunk.length);

                let finalChunk = chunk;

                if (i === totalChunks - 1) {
                    // 마지막 청크인 경우
                    const endMarker = Buffer.from("e:", 'utf-8');
                    const endBytes = Array.from(endMarker);

                    console.log("endBytes.length : ", endBytes.length);

                    // 마지막 청크가 17바이트 이하인 경우만 "e:"를 붙임
                    if (chunk.length <= 17) {
                        // "e:"를 앞에 붙임
                        finalChunk = [...endBytes, ...chunk];
                        console.log("✅ e: 추가 성공 (마지막 청크에 포함)");
                    } else {
                        shouldSendEndMarker = true;
                        console.log("❌ 마지막 청크가 17바이트 초과 - e: 별도 전송 예정");
                    }

                    // 바이트 배열을 문자열로 변환하여 출력
                    const chunkString = Buffer.from(finalChunk).toString('utf-8');
                    console.log(`📦 마지막 청크 전송 중... (${finalChunk.length} bytes)`);
                    console.log(`📝 청크 내용: "${chunkString}"`);
                } else {
                    // 바이트 배열을 문자열로 변환하여 출력
                    const chunkString = Buffer.from(chunk).toString('utf-8');
                    console.log(`📦 청크 ${i + 1}/${totalChunks} 전송 중... (${chunk.length} bytes)`);
                    console.log(`📝 청크 내용: "${chunkString}"`);
                }

                // 각 청크를 순차적으로 전송하고 완료될 때까지 대기
                await BleManager.write(
                    deviceId,
                    SERVICE_UUID,
                    CHARACTERISTIC_UUID_TX,
                    finalChunk
                );

                // 각 전송 사이에 짧은 지연 (BLE 스택이 안정적으로 처리할 수 있도록)
                if (i < totalChunks - 1) {
                    await new Promise(resolve => setTimeout(resolve, 2));
                }
            }

            // 마지막 청크가 17바이트 초과였던 경우 별도로 "e:" 전송
            if (shouldSendEndMarker) {
                const endMarker = Buffer.from("e:", 'utf-8');
                const endBytes = Array.from(endMarker);

                console.log('📦 마지막으로 "e:" 마커 전송 중...');
                console.log(`📝 마커 내용: "${Buffer.from(endBytes).toString('utf-8')}"`);

                await BleManager.write(
                    deviceId,
                    SERVICE_UUID,
                    CHARACTERISTIC_UUID_TX,
                    endBytes
                );
            }

            console.log('✅ 데이터 전송 성공!');
            return true;

        } catch (error) {
            console.error('❌ 데이터 전송 실패:', error);
            return false;
        }
    };

    useEffect(() => {
        let listeners: any[] = [];

        const initBLE = async () => {
            try {
                await BleManager.start({ showAlert: false });

                listeners = [
                    BleManager.onDiscoverPeripheral(handleDiscoverPeripheral),
                    BleManager.onStopScan(handleStopScan),
                    BleManager.onDidUpdateValueForCharacteristic(handleUpdateValueForCharacteristic),
                ];
            } catch (error) {
                console.error(error);
                // BLE 초기화 실패
            }
        };

        checkPermissions();
        initBLE();
    }, []);

    const handleDiscoverPeripheral = (peripheral: any) => {
        if (peripheral.name === 'ESP32_S3') {
            console.log("peripheral", peripheral)
            const device: Device = {
                id: peripheral.id,
                name: peripheral.name,
                rssi: peripheral.rssi,
                isConnected: false
            };

            setAvailableDevices(prev => {
                const exists = prev.find(d => d.id === device.id);
                if (!exists) {
                    return [...prev, device];
                }
                return prev;
            });
        }
    };

    const handleStopScan = () => {
        setIsScanning(false);
    };

    const handleUpdateValueForCharacteristic = useCallback((data: any) => {

        const value = data.value;
        console.log("value", value)
        const decodedValue = Buffer.from(value, 'base64').toString('utf-8');
        console.log("decodedValue", decodedValue)
        console.log("decodedValue 길이:", decodedValue.length)
        console.log("decodedValue 바이트:", [...decodedValue].map(c => c.charCodeAt(0)))

        // 공백 제거 후 비교
        const trimmedValue = decodedValue.trim();
        console.log("trimmedValue:", trimmedValue.length)
        console.log("trimmedValue:", trimmedValue)

        // 중복 처리 방지
        if (isProcessingWifiResponse) {
            console.log('이미 WiFi 응답 처리 중...');
            return;
        }

        // connectedDevices에서 현재 연결된 장치 찾기
        setConnectedDevices(prev => {
            console.log("connectedDevices", prev)
            const currentDevice = prev.find(d => d.isConnected);
            console.log("currentDevice", currentDevice)

            if (trimmedValue === "wifi connected success" && currentDevice) {

                console.log('🎉 WiFi 연결 성공! 장치 연결 해제 중...')
                setIsProcessingWifiResponse(true);
                disconnectDevice(currentDevice);
                // 3초 후 플래그 리셋
                setTimeout(() => setIsProcessingWifiResponse(false), 3000);
            } else if (trimmedValue === "wifi connect fail") {
                console.log('❌ WiFi 연결 실패 처리 중...')
                setIsProcessingWifiResponse(true);
                setShowWifiModal(true);
                Alert.alert('와이파이 연결에 실패 했습니다.');
                // 3초 후 플래그 리셋
                setTimeout(() => setIsProcessingWifiResponse(false), 3000);
            }

            return prev; // 상태 변경 없이 반환
        });
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
        try {
            const state = await BleManager.checkState();

            if (state === 'off') {
                Alert.alert('Bluetooth 오프', 'Bluetooth를 켜주세요.');
                setIsScanning(false);
                return;
            }

            if (isScanning) {
                BleManager.stopScan();
                setIsScanning(false);
                return;
            }

            setAvailableDevices([]);
            setIsScanning(true);

            BleManager.scan([], 10, true)
                .then(() => {
                    // 스캔 시작됨
                })
                .catch(() => {
                    setIsScanning(false);
                });

        } catch {
            setIsScanning(false);
            Alert.alert('스캔 실패', 'BLE 장치 스캔에 실패했습니다.');
        }
    };

    const stopScan = async () => {
        try {
            await BleManager.stopScan();
            setIsScanning(false);
        } catch (error) {
            console.error('스캔 중지 실패:', error);
            setIsScanning(false);
        }
    };

    const connectToDevice = async (device: Device) => {
        try {
            console.log('🔗 장치 연결 시도:', device.id);
            await BleManager.connect(device.id);

            console.log('🔍 서비스 검색 중...');
            // 연결 후 서비스와 특성 검색
            const services = await BleManager.retrieveServices(device.id);
            console.log('📋 검색된 서비스:', services);

            // RX characteristic에 대한 notification 시작 (데이터 수신용)
            try {
                console.log('🔔 Notification 시작...');
                await BleManager.startNotification(
                    device.id,
                    SERVICE_UUID,
                    CHARACTERISTIC_UUID_TX  // RX와 TX가 같은 characteristic인 경우
                );
                console.log('✅ Notification 시작됨');
            } catch (error) {
                console.error('❌ Notification 시작 실패:', error);
            }

            const connectedDevice = { ...device, isConnected: true };
            setConnectedDevices(prev => [...prev, connectedDevice]);
            setAvailableDevices(prev => prev.filter(d => d.id !== device.id));

            console.log('✅ 장치 연결 완료');
            // 연결 성공 후 WiFi 설정 모달 표시
            setSelectedDeviceId(device.id);
            setShowWifiModal(true);

        } catch (error) {
            console.error('❌ 장치 연결 실패:', error);
            Alert.alert('연결 실패', '장치 연결에 실패했습니다.');
        }
    };

    const sendWifiInfo = async () => {
        if (!selectedDeviceId || !wifiSSID) {
            Alert.alert('입력 오류', '모든 정보를 입력해주세요.');
            return;
        }

        try {
            console.log('🔧 WiFi 설정 전송 준비:');
            console.log('   SSID:', wifiSSID);
            console.log('   Password:', wifiPassword);

            const wifiInfo = `${wifiSSID},${wifiPassword},`;
            console.log('📦 최종 전송 데이터:', wifiInfo);

            const success = await sendTextToESP32(selectedDeviceId, wifiInfo);

            if (success) {
                // hub_address를 AsyncStorage에 저장 (설정 완료 표시)
                await AsyncStorage.setItem('hub_address', selectedDeviceId);

                Alert.alert(
                    '설정 완료',
                    'WiFi 정보가 전송되었습니다.\n설정이 완료되어 메인 화면으로 이동합니다.',
                    [
                        {
                            text: '확인',
                            onPress: () => {
                                // 앱 재시작을 위해 상태 변경 알림
                                setShowWifiModal(false);
                                setWifiSSID('');
                                setWifiPassword('');
                                // 강제로 앱을 다시 로드하거나 상태 업데이트
                                // setTimeout(() => {
                                //     Alert.alert('알림', '앱을 다시 시작해주세요.');
                                // }, 500);
                            }
                        }
                    ]
                );
            } else {
                Alert.alert('전송 실패', 'WiFi 정보 전송에 실패했습니다.');
            }
        } catch (error) {
            Alert.alert('전송 실패', 'WiFi 정보 전송에 실패했습니다.');
        }
    };

    const disconnectDevice = async (device: Device) => {
        try {
            // notification 중지
            try {
                await BleManager.stopNotification(
                    device.id,
                    SERVICE_UUID,
                    CHARACTERISTIC_UUID_TX
                );
                console.log('🔕 Notification 중지됨');
            } catch (error) {
                console.error('❌ Notification 중지 실패:', error);
            }

            await BleManager.disconnect(device.id);
            setConnectedDevices(prev => prev.filter(d => d.id !== device.id));
            Alert.alert('연결 해제', `와이파이 연결이 성공하여 블루투스 연결이 해제되었습니다.`);
        } catch (error) {
            Alert.alert('연결 해제 실패', '장치 연결 해제에 실패했습니다.');
        }
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

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            {/* 헤더 */}
            {/* <View style={styles.header}>
                <Text style={styles.title}>BLE 연결 관리</Text>
                <Text style={styles.subtitle}>허브와 센서 장치 연결</Text>
            </View> */}
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

            {/* WiFi 설정 모달 */}
            <Modal
                visible={showWifiModal}
                transparent={true}
                animationType="slide"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>WiFi 설정</Text>
                        <Text style={styles.modalSubtitle}>ESP32에 WiFi 정보를 전송합니다</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="WiFi 이름 (SSID)"
                            value={wifiSSID}
                            onChangeText={setWifiSSID}
                            autoCapitalize="none"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="WiFi 비밀번호"
                            value={wifiPassword}
                            onChangeText={setWifiPassword}
                            secureTextEntry={true}
                            autoCapitalize="none"
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    setShowWifiModal(false);
                                    setWifiSSID('');
                                    setWifiPassword('');
                                }}
                            >
                                <Text style={styles.cancelButtonText}>취소</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.sendButton]}
                                onPress={sendWifiInfo}
                            >
                                <Text style={styles.sendButtonText}>전송</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
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
        // borderRadius: 16,
        // shadowColor: '#000',
        // shadowOpacity: 0.06,
        // shadowRadius: 12,
        // shadowOffset: { width: 0, height: 6 },
        // elevation: 3,
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
        // borderRadius: 16,
        // shadowColor: '#000',
        // shadowOpacity: 0.06,
        // shadowRadius: 12,
        // shadowOffset: { width: 0, height: 6 },
        // elevation: 3,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: COLORS.cardBg,
        padding: 24,
        borderRadius: 16,
        width: '85%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        color: COLORS.hint,
        textAlign: 'center',
        marginBottom: 24,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 16,
        backgroundColor: '#F9F9F9',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#F0F0F0',
    },
    sendButton: {
        backgroundColor: COLORS.primary,
    },
    cancelButtonText: {
        color: COLORS.text,
        fontWeight: '600',
        fontSize: 14,
    },
    sendButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
});