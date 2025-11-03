import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTailingData } from '../contexts/TailingDataContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../AppInner';
import Ionicons from 'react-native-vector-icons/Ionicons';
import api from '../constant/contants';
import { RootState } from '../store/reducer';
import { useSelector } from 'react-redux';
import PetSelectModal from '../components/PetSelectModal';

type Nav = NativeStackNavigationProp<RootStackParamList, 'TailingDeviceList'>;

const COLORS = {
    primary: '#F0663F',
    bg: '#FAF6F2',
    text: '#333333',
    cardBg: '#FFFFFF',
    hint: '#7A7A7A',
    success: '#27AE60',
    error: '#E74C3C',
};

const TailingDeviceList = () => {
    const { rawWebSocketData } = useTailingData();

    const navigation = useNavigation<Nav>();
    const route = useRoute<NativeStackScreenProps<RootStackParamList, 'TailingDeviceList'>['route']>();
    const [deviceKeys, setDeviceKeys] = useState<string[]>([]);
    const [deviceList, setDeviceList] = useState<any[]>([]);
    const [devicePetConnections, setDevicePetConnections] = useState<Record<string, any>>({});

    // console.log("=== 디버깅 ===");
    // console.log("웹소켓 원본 데이터 타입:", typeof rawWebSocketData);
    // console.log("웹소켓 원본 데이터 배열?:", Array.isArray(rawWebSocketData));
    // console.log("웹소켓 원본 데이터:", rawWebSocketData);
    // console.log("deviceKeys:", deviceKeys);
    // console.log("deviceList:", deviceList);

    const accessToken = useSelector((state: RootState) => state.user.accessToken);

    // 허브 정보 가져오기
    const hubAddress = route.params?.hubAddress;
    const hubName = route.params?.hubName;

    // 미등록 행의 입력값 관리: { [mac]: name }
    const [nameInputs, setNameInputs] = useState<Record<string, string>>({});
    const [registeringMac, setRegisteringMac] = useState<string | null>(null);

    // 펫 선택 모달 상태
    const [petSelectModalVisible, setPetSelectModalVisible] = useState(false);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
    const [selectedDeviceName, setSelectedDeviceName] = useState<string>('');
    const [selectedDeviceDbId, setSelectedDeviceDbId] = useState<string>('');

    // console.log("deviceList", deviceList)

    useEffect(() => {
        console.log('🔍 useEffect 실행 - rawWebSocketData:', rawWebSocketData);

        if (!rawWebSocketData) {
            console.log('⚠️ rawWebSocketData가 null/undefined');
            return;
        }

        // 배열인 경우 첫 번째 요소 확인
        let data = rawWebSocketData;
        if (Array.isArray(rawWebSocketData)) {
            // console.log('📦 배열로 받음, 길이:', rawWebSocketData.length);
            data = rawWebSocketData[0]; // 첫 번째 요소
        }

        // console.log('🔍 처리할 데이터:', data);

        // deviceAddress 추출
        const deviceAddress = data?.deviceAddress;
        // console.log('🔍 추출한 deviceAddress:', deviceAddress);

        if (deviceAddress) {
            // console.log('📡 웹소켓에서 디바이스 주소 수신:', deviceAddress);

            setDeviceKeys(prev => {
                if (!prev.includes(deviceAddress)) {
                    // console.log('✅ deviceKeys에 추가:', deviceAddress);
                    return [...prev, deviceAddress];
                }
                // console.log('⚠️ 이미 존재하는 디바이스:', deviceAddress);
                return prev;
            });
        } else {
            console.log('❌ deviceAddress를 찾을 수 없음');
        }
    }, [rawWebSocketData]);



    const fetchList = async () => {
        try {
            // 허브 주소가 있으면 쿼리 파라미터로 추가
            const url = hubAddress 
                ? `/device/list?hubAddress=${encodeURIComponent(hubAddress)}`
                : `/device/list`;
            
            const result = await api.get(url, {
                headers: { authorization: `Bearer ${accessToken}` },
            });
            // console.log("result", result);
            if (Array.isArray(result.data.data)) {
                setDeviceList(result.data.data);
            }

        } catch (e) {
            console.error('리스트 불러오기 실패', e);
        } finally {
        }
    };

    // 디바이스와 펫 연결 상태 확인
    const fetchDevicePetConnections = async () => {
        try {
            const result = await api.get(`/device/connect/pet/list`, {
                headers: { authorization: `${accessToken}` },
            });
            // console.log("device pet connections", result);
            // console.log("result : ", result.data.data);

            if (Array.isArray(result.data.data)) {
                // 배열을 MAC 주소를 key로 하는 객체로 변환
                const connectionsMap: Record<string, any> = {};
                result.data.data.forEach((item: any) => {
                    if (item.address) {
                        connectionsMap[item.address] = item;
                    }
                });
                setDevicePetConnections(connectionsMap);
            }
        } catch (e) {
            console.error('디바이스-펫 연결 상태 확인 실패', e);
        }
    };
    useEffect(() => {
        fetchList();
        fetchDevicePetConnections();
    }, [hubAddress]);

    // DB 리스트를 빠르게 조회하기 위한 맵
    const deviceMap = useMemo(() => {
        return deviceList.reduce((acc, d) => {
            acc[d.address] = d;
            return acc;
        }, {} as Record<string, any>);
    }, [deviceList]);

    const onChangeName = (mac: string, name: string) => {
        setNameInputs((prev) => ({ ...prev, [mac]: name }));
    };

    // 개별 등록
    const handleRegisterOne = async (mac: string) => {
        const name = (nameInputs[mac] || '').trim();
        if (!name) {
            Alert.alert('알림', '디바이스 이름을 입력하세요.');
            return;
        }
        try {
            setRegisteringMac(mac);
            await api.post('/device/register', {
                address: mac,
                name: name,
                hubAddress: hubAddress, // 허브 ID 추가
            }, {
                headers: { authorization: `Bearer ${accessToken}` },
            });
            // 성공 후 DB 리스트 새로고침
            await fetchList();
            // 입력값 정리
            setNameInputs((prev) => {
                const next = { ...prev };
                delete next[mac];
                return next;
            });
            Alert.alert('완료', '등록되었습니다.');
        } catch (e: any) {
            console.error('등록 오류:', e);
            Alert.alert('오류', e?.response?.data?.error || '등록 중 오류가 발생했습니다.');
        } finally {
            setRegisteringMac(null);
        }
    };

    // 펫 선택 모달 열기
    const handleOpenPetSelect = (deviceId: string, deviceName: string, deviceDbId: string) => {
        console.log(deviceId)
        setSelectedDeviceId(deviceId);
        setSelectedDeviceName(deviceName);
        setSelectedDeviceDbId(deviceDbId);
        setPetSelectModalVisible(true);
    };

    // 펫 선택 처리
    const handleSelectPet = async (pet: any) => {
        try {
            // 디바이스와 펫 연결 API 호출 - DB ID 사용
            await api.post('/device/connect/pet', {
                deviceAddress: selectedDeviceId, // DB에서 가져온 실제 디바이스 ID 사용
                petId: pet.id,
            }, {
                headers: { authorization: `Bearer ${accessToken}` },
            });

            Alert.alert('완료', `${pet.name}이(가) ${selectedDeviceName}에 연결되었습니다.`);

            // 연결 상태 새로고침
            await fetchDevicePetConnections();
        } catch (error: any) {
            console.error('펫 연결 실패:', error);
            Alert.alert('오류', '펫 연결에 실패했습니다.');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.section}>
                {deviceKeys.length === 0 && deviceList.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="phone-portrait-outline" size={48} color={COLORS.hint} />
                        <Text style={styles.emptyText}>연결된 디바이스가 없습니다</Text>
                    </View>
                ) : (
                    <ScrollView style={styles.deviceList} keyboardShouldPersistTaps="handled">
                        {/* 허브에서 잡힌 순서대로 렌더링 */}
                        {deviceKeys.map((mac) => {
                            const info = deviceMap[mac]; // DB에 있으면 객체, 없으면 undefined
                            const isRegistered = !!info;

                            return (
                                <View key={mac} style={styles.deviceItem}>
                                    <View style={styles.deviceInfo}>
                                        <View style={styles.deviceHeader}>
                                            <Ionicons
                                                name="phone-portrait"
                                                size={24}
                                                color={isRegistered ? COLORS.success : COLORS.hint}
                                            />
                                            {isRegistered ? (
                                                <Text style={styles.deviceName}>{info.name}</Text>
                                            ) : (
                                                <TextInput
                                                    style={styles.deviceInput}
                                                    placeholder="디바이스 이름 입력"
                                                    value={nameInputs[mac] ?? ''}
                                                    onChangeText={(t) => onChangeName(mac, t)}
                                                    returnKeyType="done"
                                                />
                                            )}
                                        </View>
                                    </View>

                                    {isRegistered ? (
                                        // 펫이 연결되어 있으면 펫 정보 표시 및 모니터링, 없으면 펫 선택 버튼
                                        devicePetConnections[mac] ? (
                                            <TouchableOpacity
                                                style={styles.petInfoContainer}
                                                onPress={() => navigation.navigate('TailingDashBoard', { deviceId: mac, deviceName: info.name, })}
                                            >
                                                <View style={styles.petInfoRow}>
                                                    <Ionicons name="paw" size={20} color={COLORS.success} />
                                                    <Text style={styles.petName}>
                                                        {devicePetConnections[mac].Pet?.pet_name}
                                                    </Text>
                                                    {devicePetConnections[mac].Pet?.breed && (
                                                        <Text style={styles.petBreed}>
                                                            ({devicePetConnections[mac].Pet.breed})
                                                        </Text>
                                                    )}
                                                </View>
                                                <View style={styles.monitorInfoRow}>
                                                    <Text style={styles.monitorLabel}>모니터링 →</Text>
                                                </View>
                                            </TouchableOpacity>
                                        ) : (
                                            <TouchableOpacity
                                                style={styles.petSelectBtn}
                                                onPress={() => handleOpenPetSelect(mac, info.name, info.id)}
                                            >
                                                <Text style={styles.petSelectBtnText}>펫 선택</Text>
                                            </TouchableOpacity>
                                        )
                                    ) : (
                                        <TouchableOpacity
                                            style={[
                                                styles.registerBtn,
                                                (!nameInputs[mac]?.trim() || registeringMac === mac) && styles.registerBtnDisabled
                                            ]}
                                            onPress={() => handleRegisterOne(mac)}
                                            disabled={!nameInputs[mac]?.trim() || registeringMac === mac}
                                        >
                                            {registeringMac === mac ? (
                                                <ActivityIndicator color="#fff" />
                                            ) : (
                                                <Text style={styles.registerBtnText}>등록하기</Text>
                                            )}
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        })}

                        {/* DB에는 있는데 지금 허브에서 안 보이는 기기 */}
                        {deviceList
                            .filter((d) => !deviceKeys.includes(d.address))
                            .map((d) => (
                                <View key={`db-${d.address}`} style={[styles.deviceItem, styles.deviceItemOffline]}>
                                    <View style={styles.deviceInfo}>
                                        <View style={styles.deviceHeader}>
                                            <Ionicons
                                                name="phone-portrait"
                                                size={24}
                                                color={COLORS.hint}
                                            />
                                            <Text style={styles.deviceName}>{d.name}</Text>
                                        </View>
                                        <Text style={styles.deviceId}>주소: {d.address}</Text>
                                    </View>
                                    <View style={styles.offlineBtn}>
                                        <Text style={styles.offlineBtnText}>오프라인</Text>
                                    </View>
                                </View>
                            ))}
                    </ScrollView>
                )}
            </View>

            {/* 펫 선택 모달 */}
            <PetSelectModal
                visible={petSelectModalVisible}
                onClose={() => setPetSelectModalVisible(false)}
                onSelectPet={handleSelectPet}
                deviceId={selectedDeviceId}
                deviceName={selectedDeviceName}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    section: {
        backgroundColor: COLORS.cardBg,
        margin: 16,
        marginTop: 16,
        padding: 20,
        flex: 1,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
    },
    hubInfo: {
        fontSize: 12,
        color: COLORS.hint,
        marginTop: 4,
        marginBottom: 8,
    },
    deviceList: {
        marginTop: 12,
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
    deviceItem: {
        flexDirection: 'column',
        alignItems: 'stretch',
        padding: 16,
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#EFE7E0',
    },
    deviceItemOffline: {
        opacity: 0.6,
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
    deviceInput: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginLeft: 8,
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: '#FFF',
    },
    deviceId: {
        fontSize: 12,
        color: COLORS.hint,
        marginLeft: 32,
    },
    monitorBtn: {
        backgroundColor: COLORS.success,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        alignSelf: 'flex-end',
        marginTop: 8,
    },
    monitorBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    registerBtn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        alignSelf: 'flex-end',
        marginTop: 8,
    },
    registerBtnDisabled: {
        opacity: 0.6,
    },
    registerBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    petSelectBtn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        alignSelf: 'flex-end',
        marginTop: 8,
    },
    petSelectBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    offlineBtn: {
        backgroundColor: COLORS.hint,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        alignSelf: 'flex-end',
        marginTop: 8,
    },
    offlineBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    petInfoContainer: {
        backgroundColor: '#F0F8F0',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.success,
        marginTop: 8,
    },
    petInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    petName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginLeft: 8,
    },
    petBreed: {
        fontSize: 14,
        color: COLORS.hint,
        marginLeft: 4,
    },
    monitorInfoRow: {
        alignItems: 'flex-end',
    },
    monitorLabel: {
        fontSize: 12,
        color: COLORS.success,
        fontWeight: '600',
    },
});

export default TailingDeviceList;
