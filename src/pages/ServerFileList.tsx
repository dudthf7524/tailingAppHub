// src/screens/ServerFileList.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, RefreshControl } from 'react-native';
import axios from 'axios';
import { downCSV } from '../utils/download';

type ServerFile = {
  name: string;        // 실제 파일명 (다운로드에 사용)
  displayName?: string;// 화면용 이름 (서버가 주면 사용)
  device_name: string;
  url: string;         // 다운로드 URL
  mime?: string;
};

const API = 'http://192.168.0.42:3060';

function toDisplayName(name: string) {
  // "누렁이_tailing_1999_05_24.csv" → "누렁이_1999_05_24.csv"
  const dot = name.lastIndexOf('.');
  const ext = dot >= 0 ? name.slice(dot) : '';
  const base = dot >= 0 ? name.slice(0, dot) : name;
  const parts = base.split('_');
  if (parts.length > 1) parts.splice(1, 1); // 두 번째 조각(보통 'tailing') 제거
  return parts.join('_') + ext;
}

export default function ServerFileList() {
  const [files, setFiles] = useState<ServerFile[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFiles = useCallback(async () => {
    try {
      const { data } = await axios.get<ServerFile[]>(`${API}/files`);
      setFiles(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error(e);
      Alert.alert('오류', '파일 목록을 불러오지 못했습니다.');
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFiles();
    setRefreshing(false);
  }, [fetchFiles]);

  const onDownload = async (f: ServerFile) => {
    try {
      setDownloading(f.name);

      // 화면 라벨 (displayName 우선, 없으면 toDisplayName)
      const label = (f.displayName && f.displayName.trim().length > 0)
        ? f.displayName
        : toDisplayName(f.name);

      const savedPath = await downCSV(f.name, label); // ✅ 여기 변경!
      Alert.alert('저장완료');
    } catch (e: any) {
      console.error(e);
      Alert.alert('오류', e?.message ?? '다운로드에 실패했습니다.');
    } finally {
      setDownloading(null);
    }
  };

  const renderItem = ({ item }: { item: ServerFile }) => {
    const label = item.displayName && item.displayName.trim().length > 0
      ? item.displayName
      : toDisplayName(item.name); // 서버가 displayName 안 주면 클라에서 정리

    return (
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.url} numberOfLines={1}>기기이름</Text>
          <Text style={styles.name} numberOfLines={1}>{item.device_name}</Text>
          <Text style={styles.url} numberOfLines={1}>파일명</Text>
          <Text style={styles.name} numberOfLines={1}>{label}</Text>

          {/* 필요하면 URL도 Text로 감싸서 표시 */}
          {/* <Text style={styles.url} numberOfLines={1}>{item.url}</Text> */}
        </View>

        <TouchableOpacity
          style={[styles.btn, downloading === item.name && { opacity: 0.5 }]}
          onPress={() => onDownload(item)}
          disabled={downloading === item.name}
        >
          <Text style={styles.btnText}>
            {downloading === item.name ? '다운로드 중…' : '다운로드'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>서버 파일</Text>

      <FlatList
        data={files}
        keyExtractor={(f) => f.name} // 서버 파일명은 유니크하다고 가정
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        // refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.url}>파일이 없습니다</Text>}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { fontSize: 14, fontWeight: '600', color: '#222', marginBottom: 12 },
  url: { fontSize: 12, color: '#666' },
  btn: { backgroundColor: '#222', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14 },
  btnText: { color: '#fff', fontWeight: '700' },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: '#eee', marginVertical: 10 },
});
