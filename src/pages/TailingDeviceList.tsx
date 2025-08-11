import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTailingData } from '../contexts/TailingDataContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

const API = 'http://192.168.0.42:3060';

const TailingDeviceList = () => {
    const { tailingData } = useTailingData();
    const navigation = useNavigation();
    const [deviceKeys, setDeviceKeys] = useState<string[]>([]);
    const [deviceList, setDeviceList] = useState<{ mac_address: string; device_name: string }[]>([]);
    const [loadingList, setLoadingList] = useState(false);

    // 미등록 행의 입력값 관리: { [mac]: name }
    const [nameInputs, setNameInputs] = useState<Record<string, string>>({});
    const [registeringMac, setRegisteringMac] = useState<string | null>(null);

    useEffect(() => {
        setDeviceKeys(Object.keys(tailingData));
    }, [tailingData]);

    const fetchList = async () => {
        try {
            setLoadingList(true);
            const { data } = await axios.get(`${API}/macAddress/list`);
            if (Array.isArray(data.result)) {
                setDeviceList(data.result);
            }
        } catch (e) {
            console.error('리스트 불러오기 실패', e);
        } finally {
            setLoadingList(false);
        }
    };

    useEffect(() => {
        fetchList();
    }, []);

    // DB 리스트를 빠르게 조회하기 위한 맵
    const deviceMap = useMemo(() => {
        return deviceList.reduce((acc, d) => {
            acc[d.mac_address] = d;
            return acc;
        }, {} as Record<string, { mac_address: string; device_name: string }>);
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
            await axios.post(`${API}/macAddress/register`, {
                mac_address: mac, device_name: name,
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

    return (
        <SafeAreaView edges={['top']}>
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                <Text style={styles.title}>모니터링 가능한 기기 목록</Text>

                {/* {loadingList && <ActivityIndicator style={{ marginBottom: 12 }} />} */}

                {deviceKeys.length === 0 && (
                    <Text style={{ marginBottom: 12 }}>허브에서 연결된 기기가 없습니다.</Text>
                )}

                {/* 허브에서 잡힌 순서대로 렌더링 */}
                {deviceKeys.map((mac) => {
                    const info = deviceMap[mac]; // DB에 있으면 객체, 없으면 undefined
                    const isRegistered = !!info;

                    return (
                        <View key={mac} style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.mac}>{mac}</Text>
                                {isRegistered ? (
                                    <Text style={styles.name}>{info.device_name}</Text>
                                ) : (
                                    <TextInput
                                        style={styles.input}
                                        placeholder="디바이스 이름 입력"
                                        value={nameInputs[mac] ?? ''}
                                        onChangeText={(t) => onChangeName(mac, t)}
                                        returnKeyType="done"
                                    />
                                )}
                            </View>

                            {isRegistered ? (
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: '#4A6' }]}
                                    onPress={() => navigation.navigate('TailingDashBoard', { deviceId: mac, deviceName: info.device_name, })}
                                >
                                    <Text style={styles.actionText}>모니터링</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: '#F0663F' }, (!nameInputs[mac]?.trim() || registeringMac === mac) && { opacity: 0.6 }]}
                                    onPress={() => handleRegisterOne(mac)}
                                    disabled={!nameInputs[mac]?.trim() || registeringMac === mac}
                                >
                                    {registeringMac === mac ? (
                                        <ActivityIndicator />
                                    ) : (
                                        <Text style={styles.actionText}>등록하기</Text>
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>
                    );
                })}

                {/* DB에는 있는데 지금 허브에서 안 보이는 기기 (옵션) */}
                {deviceList
                    .filter((d) => !deviceKeys.includes(d.mac_address))
                    .map((d) => (
                        <View key={`db-${d.mac_address}`} style={[styles.row, { opacity: 0.6 }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.mac}>{d.mac_address}</Text>
                                <Text style={styles.name}>{d.device_name}</Text>
                            </View>
                            <View style={[styles.actionBtn, { backgroundColor: '#999' }]}>
                                <Text style={styles.actionText}>오프라인</Text>
                            </View>
                        </View>
                    ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { padding: 16, gap: 8 },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomColor: '#ddd',
        borderBottomWidth: StyleSheet.hairlineWidth,
        gap: 10,
    },
    mac: { fontSize: 13, color: '#666' },
    name: { fontSize: 16, fontWeight: '600', marginTop: 2 },
    input: {
        height: 38,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 10,
        marginTop: 4,
    },
    actionBtn: {
        minWidth: 92,
        height: 38,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
    },
    actionText: { color: '#fff', fontWeight: '700' },
});

export default TailingDeviceList;
