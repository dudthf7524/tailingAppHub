import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform
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

type DownloadType = 'pet' | 'health' | 'all';
type ViewMode = 'weekly' | 'daily';

export default function CSVDownload() {
  const accessToken = useSelector((state: RootState) => state.user.accessToken);

  // ---- 날짜 헤더용 상태 ----
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showPickerHeader, setShowPickerHeader] = useState(false);

  // ---- 기존 CSV 다운로드 상태 ----
  const [downloadType, setDownloadType] = useState<DownloadType>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // ---- 날짜 유틸 ----
  const KOR_DAYS = ['일', '월', '화', '수', '목', '금', '토'];
  const z = (n: number) => String(n).padStart(2, '0');
  const fmtYMD = (d: Date) => `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
  const fmtMDKR = (d: Date) => `${d.getMonth() + 1}월 ${d.getDate()}일`;

  const startOfWeekMon = (d: Date) => {
    const temp = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const day = temp.getDay(); // 0:일 ~ 6:토
    const diff = (day + 6) % 7; // 월요일 시작
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

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleStartDateConfirm = (date: Date) => {
    setStartDate(formatDate(date));
    setShowStartDatePicker(false);
  };

  const handleEndDateConfirm = (date: Date) => {
    setEndDate(formatDate(date));
    setShowEndDatePicker(false);
  };

  const downloadCSV = async () => {
    if (!startDate || !endDate) {
      Alert.alert('알림', '시작일과 종료일을 선택해주세요.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      Alert.alert('알림', '시작일은 종료일보다 이전이어야 합니다.');
      return;
    }

    try {
      setIsDownloading(true);

      const response = await api.get('/data/export', {
        params: { type: downloadType, startDate, endDate },
        headers: { authorization: `${accessToken}` },
      });

      const csvData = response.data.data.csv || response.data.data;
      const fileName = `${downloadType}_data_${startDate}_${endDate}.csv`;
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
      console.error('CSV 다운로드 오류:', error);
      Alert.alert('오류', error?.response?.data?.message || 'CSV 다운로드에 실패했습니다.');
    } finally {
      setIsDownloading(false);
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
            <Ionicons name="calendar-outline" size={22} color={COLORS.cardBg} />
          </TouchableOpacity>
        </View>

        {/* 주간/일일 표시 */}
        {viewMode === 'weekly' ? (
          <>
            <Text style={styles.rangeText}>{weeklyRangeText}</Text>
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
        ) : (
          <View style={styles.dailyBox}>
            <Text style={styles.dailyDate}>
              {`${selectedDate.getFullYear()}년 ${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일 (${KOR_DAYS[selectedDate.getDay()]})`}
            </Text>
          </View>
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
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* 날짜 헤더: 카드 위에 배치 */}
        <DateHeader />

        <View style={styles.card}>
          <View style={styles.header}>
            <Ionicons name="download-outline" size={32} color={COLORS.primary} />
            <Text style={styles.headerTitle}>CSV 파일 다운로드</Text>
            <Text style={styles.headerSubtitle}>데이터를 CSV 파일로 내보내기</Text>
          </View>

          <View style={styles.divider} />

          {/* 다운로드 유형 선택 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>다운로드 유형</Text>
            <View style={styles.typeContainer}>
              <TouchableOpacity
                style={[styles.typeButton, downloadType === 'pet' && styles.typeButtonSelected]}
                onPress={() => setDownloadType('pet')}
              >
                <Ionicons
                  name="paw"
                  size={24}
                  color={downloadType === 'pet' ? '#FFF' : COLORS.text}
                />
                <Text style={[styles.typeButtonText, downloadType === 'pet' && styles.typeButtonTextSelected]}>
                  펫 정보
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeButton, downloadType === 'health' && styles.typeButtonSelected]}
                onPress={() => setDownloadType('health')}
              >
                <Ionicons
                  name="fitness"
                  size={24}
                  color={downloadType === 'health' ? '#FFF' : COLORS.text}
                />
                <Text style={[styles.typeButtonText, downloadType === 'health' && styles.typeButtonTextSelected]}>
                  건강 데이터
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeButton, downloadType === 'all' && styles.typeButtonSelected]}
                onPress={() => setDownloadType('all')}
              >
                <Ionicons
                  name="albums"
                  size={24}
                  color={downloadType === 'all' ? '#FFF' : COLORS.text}
                />
                <Text style={[styles.typeButtonText, downloadType === 'all' && styles.typeButtonTextSelected]}>
                  전체 데이터
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 기간 선택 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>기간 선택</Text>

            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Text style={styles.dateLabel}>시작일</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text style={[styles.dateText, !startDate && styles.datePlaceholder]}>
                    {startDate || 'YYYY-MM-DD'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color={COLORS.hint} />
                </TouchableOpacity>
              </View>

              <View style={styles.dateSeparator}>
                <Text style={styles.dateSeparatorText}>~</Text>
              </View>

              <View style={styles.dateField}>
                <Text style={styles.dateLabel}>종료일</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Text style={[styles.dateText, !endDate && styles.datePlaceholder]}>
                    {endDate || 'YYYY-MM-DD'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color={COLORS.hint} />
                </TouchableOpacity>
              </View>
            </View>

            {/* 빠른 선택 */}
            <View style={styles.quickSelectContainer}>
              <TouchableOpacity
                style={styles.quickSelectButton}
                onPress={() => {
                  const today = new Date();
                  const lastWeek = new Date(today);
                  lastWeek.setDate(today.getDate() - 7);
                  setStartDate(formatDate(lastWeek));
                  setEndDate(formatDate(today));
                }}
              >
                <Text style={styles.quickSelectText}>최근 7일</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickSelectButton}
                onPress={() => {
                  const today = new Date();
                  const lastMonth = new Date(today);
                  lastMonth.setMonth(today.getMonth() - 1);
                  setStartDate(formatDate(lastMonth));
                  setEndDate(formatDate(today));
                }}
              >
                <Text style={styles.quickSelectText}>최근 1개월</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickSelectButton}
                onPress={() => {
                  const today = new Date();
                  const lastThreeMonths = new Date(today);
                  lastThreeMonths.setMonth(today.getMonth() - 3);
                  setStartDate(formatDate(lastThreeMonths));
                  setEndDate(formatDate(today));
                }}
              >
                <Text style={styles.quickSelectText}>최근 3개월</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 안내 */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={COLORS.primary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoText}>CSV 파일은 엑셀이나 스프레드시트에서 열 수 있습니다.</Text>
              <Text style={styles.infoText}>다운로드한 파일은 파일 앱 또는 다운로드 폴더에 저장됩니다.</Text>
            </View>
          </View>

          {/* 다운로드 버튼 */}
          <TouchableOpacity
            style={[styles.downloadButton, isDownloading && styles.downloadButtonDisabled]}
            onPress={downloadCSV}
            disabled={isDownloading}
          >
            <Ionicons
              name={isDownloading ? 'hourglass-outline' : 'download'}
              size={20}
              color="#FFF"
            />
            <Text style={styles.downloadButtonText}>
              {isDownloading ? '다운로드 중...' : 'CSV 파일 다운로드'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 시작/종료 달력 모달 (기존) */}
      <DateTimePickerModal
        isVisible={showStartDatePicker}
        mode="date"
        onConfirm={handleStartDateConfirm}
        onCancel={() => setShowStartDatePicker(false)}
        date={startDate ? new Date(startDate) : new Date()}
        confirmTextIOS="확인"
        cancelTextIOS="취소"
        locale="ko_KR"
      />
      <DateTimePickerModal
        isVisible={showEndDatePicker}
        mode="date"
        onConfirm={handleEndDateConfirm}
        onCancel={() => setShowEndDatePicker(false)}
        date={endDate ? new Date(endDate) : new Date()}
        confirmTextIOS="확인"
        cancelTextIOS="취소"
        locale="ko_KR"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 16 },

  // ---- 날짜 헤더 ----
  dateHeaderWrap: {
    backgroundColor: '#111213',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#222326',
    marginBottom: 16,
    borderRadius: 16,
  },
  tabRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tabGroup: { flexDirection: 'row', backgroundColor: '#1B1C20', borderRadius: 12, padding: 4, gap: 6 },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  tabBtnActive: { backgroundColor: '#2A2B31' },
  tabText: { color: '#9CA3AF', fontWeight: '700', fontSize: 14 },
  tabTextActive: { color: '#FFFFFF' },
  calendarBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  rangeText: { marginTop: 10, color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  weekStrip: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' },
  dayCell: { alignItems: 'center', width: 42 },
  dayLabel: { color: '#9CA3AF', fontSize: 12, marginBottom: 6 },
  dayCircle: {
    width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1E1F24',
  },
  dayCircleSelected: { backgroundColor: '#F6B7AA' },
  dayNum: { color: '#E5E7EB', fontWeight: '700' },
  dayNumSelected: { color: '#111213' },
  dailyBox: { marginTop: 10 },
  dailyDate: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },

  // ---- 기존 카드/폼 ----
  card: { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 20 },
  header: { alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginTop: 12 },
  headerSubtitle: { fontSize: 14, color: COLORS.hint, marginTop: 4 },
  divider: { height: 1, backgroundColor: '#EFE7E0', marginVertical: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginBottom: 16 },
  typeContainer: { flexDirection: 'row', gap: 12 },
  typeButton: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12,
    borderWidth: 2, borderColor: '#EFE7E0', backgroundColor: '#FFF',
  },
  typeButtonSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginTop: 8 },
  typeButtonTextSelected: { color: '#FFF' },

  dateRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  dateField: { flex: 1 },
  dateLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  dateInput: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#EFE7E0',
    paddingHorizontal: 16, paddingVertical: 12, height: 48,
  },
  dateText: { fontSize: 16, color: COLORS.text, flex: 1 },
  datePlaceholder: { color: COLORS.hint },
  dateSeparator: { paddingHorizontal: 8, paddingTop: 28 },
  dateSeparatorText: { fontSize: 18, fontWeight: '600', color: COLORS.hint },

  quickSelectContainer: { flexDirection: 'row', gap: 8 },
  quickSelectButton: {
    flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#F8F9FA',
    borderWidth: 1, borderColor: '#EFE7E0', alignItems: 'center',
  },
  quickSelectText: { fontSize: 13, fontWeight: '600', color: COLORS.text },

  infoBox: {
    flexDirection: 'row', backgroundColor: '#FFF5F0', padding: 16,
    borderRadius: 12, borderWidth: 1, borderColor: '#FFE0D1', marginBottom: 24,
  },
  infoTextContainer: { flex: 1, marginLeft: 12 },
  infoText: { fontSize: 13, color: COLORS.text, lineHeight: 20, marginBottom: 4 },

  downloadButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, borderRadius: 28, height: 56,
    shadowColor: '#F0663F', shadowOpacity: 0.25, shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 }, elevation: 4,
  },
  downloadButtonDisabled: { opacity: 0.6 },
  downloadButtonText: { fontSize: 18, fontWeight: '700', color: '#FFF', marginLeft: 8 },
});
