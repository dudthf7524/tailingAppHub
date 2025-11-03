import React, { useCallback, useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, Alert, FlatList, TextInput, ActivityIndicator
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store/reducer';
import api from '../constant/contants';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

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
    address: string;
    name: string | null;
    hubAddress?: string;
    updatedAt?: string;
}

export default function DeviceNameEdit() {
    const accessToken = useSelector((state: RootState) => state.user.accessToken);
    const [deviceList, setDeviceList] = useState<Device[]>([]);
    const [fetching, setFetching] = useState(false);
    const [editingMac, setEditingMac] = useState<string | null>(null);
    const [draft, setDraft] = useState('');
    const [saving, setSaving] = useState(false);
    console.log("deviceList", deviceList)
    const load = useCallback(async () => {
        try {
            setFetching(true);
            const response = await api.get('/device/list/name', {
                headers: { authorization: `${accessToken}` },
            });
            if (response.data?.data) {
                setDeviceList(response.data.data);
            } else if (Array.isArray(response.data)) {
                setDeviceList(response.data);
            }
        } catch (e: any) {
            console.error(e);
            Alert.alert('오류', '목록을 불러오지 못했습니다.');
        } finally {
            setFetching(false);
        }
    }, [accessToken]);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    const startEdit = useCallback((mac: string, currentName?: string | null) => {
        setEditingMac(mac);
        setDraft(currentName ?? '');
    }, []);

    const cancelEdit = useCallback(() => {
        setEditingMac(null);
        setDraft('');
    }, []);

    const save = useCallback(
        async (mac: string) => {
            const name = draft.trim();
            if (!name) {
                Alert.alert('알림', '이름을 입력하세요.');
                return;
            }
            if (name.length > 30) {
                Alert.alert('알림', '이름은 30자 이하로 입력하세요.');
                return;
            }
            try {
                setSaving(true);
                await api.post('/device/edit', {
                    address: mac,
                    name: name,
                }, {
                    headers: { authorization: `${accessToken}` },
                });

                Alert.alert('완료', '디바이스 이름이 변경되었습니다.');
                await load();
                cancelEdit();
            } catch (e: any) {
                console.error(e);
                Alert.alert('오류', e?.response?.data?.message || e?.response?.data?.error || '저장 중 오류가 발생했습니다.');
            } finally {
                setSaving(false);
            }
        },
        [draft, load, cancelEdit, accessToken],
    );

    const renderItem = useCallback(
        ({ item }: { item: Device }) => {
            const isEditing = editingMac === item.address;
            return (
                <View style={styles.row}>
                    <View style={styles.rowLeft}>
                        <View style={styles.deviceHeader}>
                            <Ionicons name="watch" size={20} color={COLORS.primary} />
                            <View style={{ flex: 1 }}>
                                {/* <Text style={styles.label}>디바이스명</Text> */}
                                {isEditing ? (
                                    <TextInput
                                        value={draft}
                                        onChangeText={setDraft}
                                        placeholder="디바이스 이름"
                                        style={styles.input}
                                        editable={!saving}
                                        returnKeyType="done"
                                        onSubmitEditing={() => save(item.address)}
                                    />
                                ) : (
                                    <Text style={styles.name}>
                                        {item.name || '디바이스'}
                                    </Text>
                                )}
                            </View>
                            {!isEditing && (
                                <TouchableOpacity
                                    style={styles.editButton}
                                    onPress={() => startEdit(item.address, item.name)}
                                >
                                    <Ionicons name="create-outline" size={24} color={COLORS.primary} />
                                </TouchableOpacity>
                            )}
                        </View>
                        <Text style={styles.mac}>MAC: {item.address}</Text>
                        {isEditing && (
                            <View style={styles.buttonRow}>
                                <TouchableOpacity
                                    style={[styles.btn, styles.btnPrimary, saving && styles.btnDisabled]}
                                    onPress={() => save(item.address)}
                                    disabled={saving}
                                >
                                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>저장</Text>}
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.btn, styles.btnGhost]}
                                    onPress={cancelEdit}
                                    disabled={saving}
                                >
                                    <Text style={[styles.btnText, styles.btnGhostText]}>취소</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            );
        },
        [draft, editingMac, saving, save, cancelEdit, startEdit],
    );

    const keyExtractor = useCallback((item: Device) => item.address, []);

    return (
        <ScrollView style={styles.container}>
            <View style={styles.section}>
                {deviceList.length === 0 ? (
                    <View style={styles.emptyWrap}>
                        <Ionicons name="watch-outline" size={48} color={COLORS.hint} />
                        <Text style={styles.emptyText}>등록된 디바이스가 없습니다.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={deviceList}
                        keyExtractor={keyExtractor}
                        renderItem={renderItem}
                        ItemSeparatorComponent={() => <View style={styles.sep} />}
                        scrollEnabled={false}
                    />
                )}
            </View>
        </ScrollView>
    );
}

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
        borderRadius: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
        color: COLORS.text,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    rowLeft: {
        flex: 1,
        paddingRight: 12,
    },
    rowRight: {
        flexDirection: 'row',
        gap: 8,
    },
    deviceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 4,
    },
    label: {
        fontSize: 14,
        color: COLORS.hint,
        marginBottom: 8,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    mac: {
        fontSize: 12,
        color: COLORS.hint,
        marginLeft: 28,
    },
    input: {
        height: 40,
        borderWidth: 1,
        borderColor: '#EFE7E0',
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: '#fff',
        fontSize: 16,
    },
    editButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
        marginLeft: 28,
    },
    btn: {
        height: 36,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 60,
    },
    btnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
    btnPrimary: {
        backgroundColor: COLORS.primary,
    },
    btnOutline: {
        borderWidth: 1,
        borderColor: COLORS.primary,
        backgroundColor: '#fff',
    },
    btnOutlineText: {
        color: COLORS.primary,
    },
    btnGhost: {
        backgroundColor: '#f5f5f5',
    },
    btnGhostText: {
        color: COLORS.text,
    },
    btnDisabled: {
        opacity: 0.6,
    },
    sep: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#eee',
    },
    emptyWrap: {
        alignItems: 'center',
        paddingVertical: 48,
    },
    emptyText: {
        marginTop: 12,
        color: COLORS.hint,
        fontSize: 14,
    },
});

