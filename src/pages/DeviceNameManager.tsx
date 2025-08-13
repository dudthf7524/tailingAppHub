// src/pages/DeviceNameManagerScreen.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import axios from 'axios';

const API = 'http://192.168.0.42:3060'; // 서버 주소/포트에 맞게 수정

type DeviceRow = {
    mac_address: string;
    device_name: string | null;
    updatedAt?: string;
};

export default function DeviceNameManagerScreen() {
    const [list, setList] = useState<DeviceRow[]>([]);
    const [fetching, setFetching] = useState(false);
    const [editingMac, setEditingMac] = useState<string | null>(null);
    const [draft, setDraft] = useState('');
    const [saving, setSaving] = useState(false);
    console.log("list", list)
    const load = useCallback(async () => {
        try {
            setFetching(true);
            const { data } = await axios.get<DeviceRow[]>(`${API}/devices`);
            console.log("data", data)
            setList(data);
        } catch (e) {
            console.error(e);
            Alert.alert('오류', '목록을 불러오지 못했습니다.');
        } finally {
            setFetching(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

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
                const { data } = await axios.put<{ ok: boolean }>(
                    `${API}/devices/edit`,
                    { mac_address: mac, device_name: name },
                );
                if (!data?.ok) {
                    Alert.alert('오류', '저장에 실패했습니다.');
                    return;
                }
                await load();
                cancelEdit();
            } catch (e: any) {
                console.error(e);
                Alert.alert('오류', e?.response?.data?.error ?? '저장 중 오류가 발생했습니다.');
            } finally {
                setSaving(false);
            }
        },
        [draft, load, cancelEdit],
    );

    const renderItem = useCallback(
        ({ item }: { item: DeviceRow }) => {
            const isEditing = editingMac === item.mac_address;
            return (
                <View style={styles.row}>
                    <View style={styles.rowLeft}>
                        {isEditing ? (
                            <TextInput
                                value={draft}
                                onChangeText={setDraft}
                                placeholder="기기 이름"
                                style={styles.input}
                                editable={!saving}
                                returnKeyType="done"
                                onSubmitEditing={() => save(item.mac_address)}
                            />
                        ) : (
                            <Text style={styles.name}>
                                {item.device_name || '—'}
                            </Text>
                        )}
                    </View>

                    <View style={styles.rowRight}>
                        {isEditing ? (
                            <>
                                <TouchableOpacity
                                    style={[styles.btn, styles.btnPrimary, saving && styles.btnDisabled]}
                                    onPress={() => save(item.mac_address)}
                                    disabled={saving}
                                >
                                    {saving ? <ActivityIndicator /> : <Text style={styles.btnText}>저장</Text>}
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.btn, styles.btnGhost]}
                                    onPress={cancelEdit}
                                    disabled={saving}
                                >
                                    <Text style={[styles.btnText, styles.btnGhostText]}>취소</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <TouchableOpacity
                                style={[styles.btn, styles.btnOutline]}
                                onPress={() => startEdit(item.mac_address, item.device_name)}
                            >
                                <Text style={[styles.btnText, styles.btnOutlineText]}>✏️ 수정</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            );
        },
        [draft, editingMac, saving, save, cancelEdit, startEdit],
    );

    const keyExtractor = useCallback((item: DeviceRow) => item.mac_address, []);

    const emptyComp = useMemo(
        () => (
            <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>등록된 기기가 없습니다.</Text>
            </View>
        ),
        [],
    );

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <Text style={styles.title}>기기 이름 관리</Text>

                <FlatList
                    data={list}
                    keyExtractor={keyExtractor}
                    renderItem={renderItem}
                    ItemSeparatorComponent={() => <View style={styles.sep} />}
                    ListEmptyComponent={!fetching ? emptyComp : null}
                    refreshControl={
                        <RefreshControl refreshing={fetching} onRefresh={load} />
                    }
                    contentContainerStyle={list.length === 0 ? { flex: 1, justifyContent: 'center' } : undefined}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },
    container: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
    title: { fontSize: 20, fontWeight: '700', marginBottom: 12, color: '#111' },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    rowLeft: { flex: 1, paddingRight: 12 },
    rowRight: { flexDirection: 'row', gap: 8 },

    mac: { fontSize: 12, color: '#888' },
    name: { fontSize: 16, fontWeight: '600', marginTop: 4, color: '#222' },

    input: {
        marginTop: 6,
        height: 40,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: '#fff',
    },

    btn: {
        height: 36,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

    btnPrimary: { backgroundColor: '#F0663F' },
    btnOutline: { borderWidth: 1, borderColor: '#F0663F', backgroundColor: '#fff' },
    btnOutlineText: { color: '#F0663F' },
    btnGhost: { backgroundColor: '#f5f5f5' },
    btnGhostText: { color: '#333' },
    btnDisabled: { opacity: 0.6 },

    sep: { height: StyleSheet.hairlineWidth, backgroundColor: '#eee' },
    emptyWrap: { alignItems: 'center', paddingVertical: 48 },
    emptyText: { color: '#666' },
});
