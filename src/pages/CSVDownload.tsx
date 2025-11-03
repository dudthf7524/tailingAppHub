import React, { useMemo, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useSelector } from 'react-redux';
import { RootState } from '../store/reducer';
import api from '../constant/contants';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

const COLORS = {
  primary: '#F0663F',
  bg: '#FAF6F2',
  text: '#333333',
  cardBg: '#FFFFFF',
  hint: '#7A7A7A',
  success: '#27AE60',
  error: '#E74C3C',
};

type ViewMode = 'weekly' | 'daily';

interface FileItem {
  id: string;
  name: string;
  date: string;
  size: string;
}

export default function CSVDownload() {
  const accessToken = useSelector((state: RootState) => state.user.accessToken);

  // ---- 날짜 헤더용 상태 ----
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showPickerHeader, setShowPickerHeader] = useState(false);

  // ---- 파일 리스트 상태 ----
  const [fileList, setFileList] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ---- 날짜 유틸 ----
  const KOR_DAYS = ['일', '월', '화', '수', '목', '금', '토'];
  const z = (n: number) => String(n).padStart(2, '0');
  const fmtYMD = (d: Date) => `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
  const fmtMDKR = (d: Date) => `${d.getMonth() + 1}월 ${d.getDate()}일`;

  const startOfWeekMon = (d: Date) => {
    const temp = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const day = temp.getDay();
    const diff = (day + 6) % 7;
    temp.setDate(temp.getDate() - diff);
    return temp;
  };

  const endOfWeekSun = (d: Date) => {
    const s = startOfWeekMon(d);
    const e = new Date(s);
    e.setDate(s.getDate() + 6);
    return e;
  };

  const getWeekDates = (d: Date) => {
    const s = startOfWeekMon(d);
    return Array.from({ length: 7 }, (_, i) => {
      const x = new Date(s);
      x.setDate(s.getDate() + i);
      return x;
    });
  };

  const weeklyRangeText = useMemo(() => {
    const s = startOfWeekMon(selectedDate);
    const e = endOfWeekSun(selectedDate);
    return `${fmtMDKR(s)} ~ ${fmtMDKR(e)}`;
  }, [selectedDate]);

  // 이전/다음 주 이동
  const goToPreviousWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedDate(newDate);
  };

  // 날짜 선택 시 파일 리스트 가져오기
  useEffect(() => {
    fetchFileList();
  }, [selectedDate, viewMode]);

  const fetchFileList = async () => {
    try {
      setIsLoading(true);

      let startDate, endDate;
      if (viewMode === 'weekly') {
        startDate = fmtYMD(startOfWeekMon(selectedDate));
        endDate = fmtYMD(endOfWeekSun(selectedDate));
      } else {
        startDate = fmtYMD(selectedDate);
        endDate = fmtYMD(selectedDate);
      }

      // API 호출 (실제 API 엔드포인트로 변경 필요)
      const response = await api.get('/data/files', {
        params: { startDate, endDate },
        headers: { authorization: `${accessToken}` },
      });

      // 임시 데이터 (실제로는 response.data에서 가져옴)
      const mockData: FileItem[] = [
        { id: '1', name: '펫 건강 데이터', date: fmtYMD(selectedDate), size: '2.5 MB' },
        { id: '2', name: '활동량 데이터', date: fmtYMD(selectedDate), size: '1.8 MB' },
        { id: '3', name: '체온 데이터', date: fmtYMD(selectedDate), size: '980 KB' },
      ];

      setFileList(mockData);
    } catch (error) {
      console.error('파일 목록 조회 실패:', error);
      // 에러 시에도 임시 데이터 표시
      const mockData: FileItem[] = [
        { id: '1', name: '펫 건강 데이터', date: fmtYMD(selectedDate), size: '2.5 MB' },
        { id: '2', name: '활동량 데이터', date: fmtYMD(selectedDate), size: '1.8 MB' },
        { id: '3', name: '체온 데이터', date: fmtYMD(selectedDate), size: '980 KB' },
      ];
      setFileList(mockData);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFile = async (file: FileItem) => {
    try {
      Alert.alert('다운로드', `${file.name} 파일을 다운로드하시겠습니까?`, [
        { text: '취소', style: 'cancel' },
        {
          text: '다운로드',
          onPress: async () => {
            try {
              const response = await api.get(`/data/export/${file.id}`, {
                headers: { authorization: `${accessToken}` },
              });

              const csvData = response.data.data.csv || response.data.data;
              const fileName = `${file.name}_${file.date}.csv`;
              const path = `${RNFS.DocumentDirectoryPath}/${fileName}`;

              await RNFS.writeFile(path, csvData, 'utf8');

              await Share.open({
                title: 'CSV 파일 저장',
                url: Platform.OS === 'android' ? `file://${path}` : path,
                type: 'text/csv',
                filename: fileName,
              });

              Alert.alert('성공', 'CSV 파일이 생성되었습니다.');
            } catch (error: any) {
              console.error('파일 다운로드 오류:', error);
              Alert.alert('오류', '파일 다운로드에 실패했습니다.');
            }
          }
        }
      ]);
    } catch (error) {
      console.error('다운로드 오류:', error);
    }
  };

  // ---- 날짜 헤더 컴포넌트 ----
  const DateHeader = () => {
    const weekDates = getWeekDates(selectedDate);

    return (
      <View style={styles.dateHeaderWrap}>
        {/* 탭 + 달력 아이콘 */}
        <View style={styles.tabRow}>
          <View style={styles.tabGroup}>
            <TouchableOpacity
              style={[styles.tabBtn, viewMode === 'weekly' && styles.tabBtnActive]}
              onPress={() => setViewMode('weekly')}
            >
              <Text style={[styles.tabText, viewMode === 'weekly' && styles.tabTextActive]}>주간</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, viewMode === 'daily' && styles.tabBtnActive]}
              onPress={() => setViewMode('daily')}
            >
              <Text style={[styles.tabText, viewMode === 'daily' && styles.tabTextActive]}>일일</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.calendarBtn}
            onPress={() => setShowPickerHeader(true)}
            accessibilityLabel="날짜 선택"
          >
            <Ionicons name="calendar-outline" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* 주간/일일 표시 */}
        {viewMode === 'weekly' ? (
          <View style={styles.weeklyNavigationBox}>
            <TouchableOpacity onPress={goToPreviousWeek} style={styles.weekNavBtn}>
              <Ionicons name="chevron-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.dailyDate}>
              {weeklyRangeText}
            </Text>
            <TouchableOpacity onPress={goToNextWeek} style={styles.weekNavBtn}>
              <Ionicons name="chevron-forward" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.weekStrip}>
              {weekDates.map((d) => {
                const isSelected = fmtYMD(d) === fmtYMD(selectedDate);
                return (
                  <TouchableOpacity
                    key={d.toISOString()}
                    style={styles.dayCell}
                    onPress={() => setSelectedDate(new Date(d))}
                  >
                    <Text style={styles.dayLabel}>{KOR_DAYS[d.getDay()]}</Text>
                    <View style={[styles.dayCircle, isSelected && styles.dayCircleSelected]}>
                      <Text style={[styles.dayNum, isSelected && styles.dayNumSelected]}>
                        {d.getDate()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* 헤더용 달력 모달 */}
        <DateTimePickerModal
          isVisible={showPickerHeader}
          mode="date"
          onConfirm={(d) => {
            setSelectedDate(d);
            setShowPickerHeader(false);
          }}
          onCancel={() => setShowPickerHeader(false)}
          date={selectedDate}
          confirmTextIOS="확인"
          cancelTextIOS="취소"
          locale="ko_KR"
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.mainCard}>
        {/* 날짜 헤더 */}
        <DateHeader />

        {/* 구분선 */}
        <View style={styles.divider} />

        {/* 파일 리스트 */}
        <ScrollView style={styles.fileListContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>파일 목록을 불러오는 중...</Text>
            </View>
          ) : fileList.length > 0 ? (
            fileList.map((file) => (
              <View key={file.id} style={styles.fileItem}>
                <View style={styles.fileInfo}>
                  <Ionicons name="document-text-outline" size={24} color={COLORS.primary} />
                  <View style={styles.fileTextContainer}>
                    <Text style={styles.fileName}>{file.name}</Text>
                    <Text style={styles.fileDetails}>{file.date} · {file.size}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.downloadBtn}
                  onPress={() => downloadFile(file)}
                >
                  <Ionicons name="download-outline" size={24} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={64} color={COLORS.hint} />
              <Text style={styles.emptyText}>선택한 날짜에 데이터가 없습니다</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg
  },
  mainCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    margin: 16,
    borderRadius: 16,
  },

  // ---- 날짜 헤더 ----
  dateHeaderWrap: {
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  tabGroup: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 4,
    gap: 6
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10
  },
  tabBtnActive: {
    backgroundColor: COLORS.cardBg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    color: COLORS.hint,
    fontWeight: '600',
    fontSize: 14
  },
  tabTextActive: {
    color: COLORS.text
  },
  calendarBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyBox: {
    marginTop: 16
  },
  weeklyNavigationBox: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekNavBtn: {
    padding: 8,
  },
  dailyDate: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  weekStrip: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  dayCell: {
    alignItems: 'center',
    width: 42
  },
  dayLabel: {
    color: COLORS.hint,
    fontSize: 12,
    marginBottom: 6
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  dayCircleSelected: {
    backgroundColor: COLORS.primary
  },
  dayNum: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 14,
  },
  dayNumSelected: {
    color: '#FFFFFF'
  },

  // ---- 구분선 ----
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 16,
  },

  // ---- 파일 리스트 ----
  fileListContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.hint,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  fileDetails: {
    fontSize: 13,
    color: COLORS.hint,
  },
  downloadBtn: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.hint,
  },
});
