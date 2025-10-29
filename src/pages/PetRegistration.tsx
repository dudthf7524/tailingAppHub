import React, { useState } from 'react';
import {
    View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView,
    Alert, Platform, Pressable, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import api from '../constant/contants';
import { RootState } from '../store/reducer';
import { useSelector } from 'react-redux';

const COLORS = {
    primary: '#F0663F',
    bg: '#FAF6F2',
    text: '#333333',
    cardBg: '#FFFFFF',
    hint: '#7A7A7A',
    success: '#27AE60',
    error: '#E74C3C',
};

type PetForm = {
    name: string;
    species: string;
    breed: string;
    weight: string;
    gender: 'male' | 'female' | '';
    neutering: 'sterilized' | 'intact' | '';
    birthDate: string;
    admissionDate: string;
    veterinarian: string;
    diagnosis: string;
    medicalHistory: string;
};

const PET_SPECIES = [
    { label: '개', value: 'dog' },
    { label: '고양이', value: 'cat' },
    { label: '기타', value: 'other' },
];

const GENDER_OPTIONS = [
    { label: '수컷', value: 'male' },
    { label: '암컷', value: 'female' },
];

const NEUTERING_OPTIONS = [
    { label: '중성화함', value: 'sterilized' },
    { label: '중성화안함', value: 'intact' },
];

export default function PetRegistration() {
    const accessToken = useSelector((state: RootState) => state.user.accessToken);
    const [form, setForm] = useState<PetForm>({
        name: '',
        species: '',
        breed: '',
        weight: '',
        gender: '', // 기본값: 선택 안함
        neutering: '', // 기본값: 선택 안함
        birthDate: '',
        admissionDate: '',
        veterinarian: '',
        diagnosis: '',
        medicalHistory: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showBirthDateModal, setShowBirthDateModal] = useState(false);
    const [showAdmissionDateModal, setShowAdmissionDateModal] = useState(false);

    const updateForm = (key: keyof PetForm, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    // 날짜 포맷팅 함수
    const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // 간단한 달력 컴포넌트
    const SimpleCalendar = ({
        visible,
        onClose,
        onSelect,
        title
    }: {
        visible: boolean;
        onClose: () => void;
        onSelect: (date: Date) => void;
        title: string;
    }) => {
        const [selectedDate, setSelectedDate] = useState(new Date());

        const handleConfirm = () => {
            onSelect(selectedDate);
            onClose();
        };

        const generateCalendarDays = () => {
            const year = selectedDate.getFullYear();
            const month = selectedDate.getMonth();
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const daysInMonth = lastDay.getDate();
            const startingDayOfWeek = firstDay.getDay();

            const days = [];

            // 빈 날짜들
            for (let i = 0; i < startingDayOfWeek; i++) {
                days.push(null);
            }

            // 실제 날짜들
            for (let day = 1; day <= daysInMonth; day++) {
                days.push(day);
            }

            return days;
        };

        const changeMonth = (direction: 'prev' | 'next') => {
            const newDate = new Date(selectedDate);
            if (direction === 'prev') {
                newDate.setMonth(newDate.getMonth() - 1);
            } else {
                newDate.setMonth(newDate.getMonth() + 1);
            }
            setSelectedDate(newDate);
        };

        if (!visible) return null;

        return (
            <Modal visible={visible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.calendarModal}>
                        <View style={styles.calendarHeader}>
                            <TouchableOpacity onPress={() => changeMonth('prev')}>
                                <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
                            </TouchableOpacity>
                            <Text style={styles.calendarTitle}>
                                {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월
                            </Text>
                            <TouchableOpacity onPress={() => changeMonth('next')}>
                                <Ionicons name="chevron-forward" size={24} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.calendarDays}>
                            {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                                <Text key={day} style={styles.dayHeader}>{day}</Text>
                            ))}
                        </View>

                        <View style={styles.calendarGrid}>
                            {generateCalendarDays().map((day, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.dayButton,
                                        day ? styles.dayButtonActive : null,
                                        day === selectedDate.getDate() ? styles.dayButtonSelected : null
                                    ]}
                                    onPress={() => day && setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day))}
                                    disabled={!day}
                                >
                                    <Text style={[
                                        styles.dayText,
                                        day ? styles.dayTextActive : null,
                                        day === selectedDate.getDate() ? styles.dayTextSelected : null
                                    ]}>
                                        {day}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.calendarActions}>
                            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                                <Text style={styles.cancelButtonText}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                                <Text style={styles.confirmButtonText}>확인</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    const validateForm = () => {
        if (!form.name.trim()) {
            Alert.alert('알림', '펫 이름을 입력하세요.');
            return false;
        }
        if (!form.species) {
            Alert.alert('알림', '펫 종류를 선택하세요.');
            return false;
        }
        if (!form.weight.trim()) {
            Alert.alert('알림', '펫 체중을 입력하세요.');
            return false;
        }
        if (!form.gender) {
            Alert.alert('알림', '펫 성별을 선택하세요.');
            return false;
        }
        if (!form.neutering) {
            Alert.alert('알림', '중성화 여부를 선택하세요.');
            return false;
        }
        if (!form.birthDate.trim()) {
            Alert.alert('알림', '생년월일을 입력하세요.');
            return false;
        }
        if (!form.admissionDate.trim()) {
            Alert.alert('알림', '입원일을 입력하세요.');
            return false;
        }
        if (!form.veterinarian.trim()) {
            Alert.alert('알림', '주치의를 입력하세요.');
            return false;
        }
        if (!form.diagnosis.trim()) {
            Alert.alert('알림', '진단명을 입력하세요.');
            return false;
        }
        return true;
    };

    console.log("accessToken", accessToken);

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            setIsSubmitting(true);
            const response = await api.post('/pet/register', {
                name: form.name.trim(),
                species: form.species,
                breed: form.breed.trim(),
                weight: parseFloat(form.weight),
                gender: form.gender, // string: 'male' | 'female'
                neutering: form.neutering, // string: 'sterilized' | 'intact'
                birthDate: form.birthDate.trim(),
                admissionDate: form.admissionDate.trim(),
                veterinarian: form.veterinarian.trim(),
                diagnosis: form.diagnosis.trim(),
                medicalHistory: form.medicalHistory.trim(),
            }, {
                headers: { authorization: `${accessToken}` },
            });

            if(response.status === 200){

            }

            Alert.alert('성공', `${response.data.message}`, [
                {
                    text: '확인', onPress: () => {
                        // 폼 초기화
                        setForm({
                            name: '',
                            species: '',
                            breed: '',
                            weight: '',
                            gender: '',
                            neutering: '',
                            birthDate: '',
                            admissionDate: '',
                            veterinarian: '',
                            diagnosis: '',
                            medicalHistory: '',
                        });
                    }
                }
            ]);
        } catch (error: any) {
            console.error('펫 등록 오류:', error);
            Alert.alert('오류', error?.response?.data?.message || '펫 등록 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                {/* 카드 */}
                <View style={styles.card}>
                    {/* 기본 정보 섹션 */}
                    <Text style={styles.sectionTitle}>기본 정보</Text>

                    <LabeledInput
                        label="펫 이름"
                        value={form.name}
                        onChangeText={v => updateForm('name', v)}
                        placeholder="예) 멍멍이"
                    />

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginBottom: 16 }}>
                            <Text style={styles.inputLabel}>생년월일</Text>
                            <TouchableOpacity
                                style={styles.dateInput}
                                onPress={() => setShowBirthDateModal(true)}
                            >
                                <Text style={[styles.dateText, !form.birthDate && styles.placeholderText]}>
                                    {form.birthDate || 'YYYY-MM-DD'}
                                </Text>
                                <Ionicons name="calendar-outline" size={20} color={COLORS.hint} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={{ marginBottom: 16 }}>
                        <Text style={styles.inputLabel}>종류</Text>
                        <View style={styles.optionContainer}>
                            {PET_SPECIES.map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        styles.optionButton,
                                        form.species === option.value && styles.optionButtonSelected
                                    ]}
                                    onPress={() => updateForm('species', option.value)}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        form.species === option.value && styles.optionTextSelected
                                    ]}>
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <LabeledInput
                        label="품종"
                        value={form.breed}
                        onChangeText={v => updateForm('breed', v)}
                        placeholder="예) 골든 리트리버"
                    />

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <LabeledInput
                                label="체중(kg)"
                                value={form.weight}
                                onChangeText={v => updateForm('weight', v)}
                                placeholder="체중"
                            />
                        </View>
                    </View>

                    <View style={{ marginBottom: 16 }}>
                        <Text style={styles.inputLabel}>성별</Text>
                        <View style={styles.optionContainer}>
                            {GENDER_OPTIONS.map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        styles.optionButton,
                                        form.gender === option.value && styles.optionButtonSelected
                                    ]}
                                    onPress={() => updateForm('gender', option.value)}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        form.gender === option.value && styles.optionTextSelected
                                    ]}>
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={{ marginBottom: 16 }}>
                        <Text style={styles.inputLabel}>중성화</Text>
                        <View style={styles.optionContainer}>
                            {NEUTERING_OPTIONS.map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        styles.optionButton,
                                        form.neutering === option.value && styles.optionButtonSelected
                                    ]}
                                    onPress={() => updateForm('neutering', option.value)}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        form.neutering === option.value && styles.optionTextSelected
                                    ]}>
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* 의료 정보 섹션 */}
                    <View style={styles.sectionDivider} />
                    <Text style={styles.sectionTitle}>의료 정보</Text>

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginBottom: 16 }}>
                            <Text style={styles.inputLabel}>입원일</Text>
                            <TouchableOpacity
                                style={styles.dateInput}
                                onPress={() => setShowAdmissionDateModal(true)}
                            >
                                <Text style={[styles.dateText, !form.admissionDate && styles.placeholderText]}>
                                    {form.admissionDate || 'YYYY-MM-DD'}
                                </Text>
                                <Ionicons name="calendar-outline" size={20} color={COLORS.hint} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <LabeledInput
                        label="주치의"
                        value={form.veterinarian}
                        onChangeText={v => updateForm('veterinarian', v)}
                        placeholder="담당 수의사명을 입력하세요"
                    />

                    <LabeledInput
                        label="진단명"
                        value={form.diagnosis}
                        onChangeText={v => updateForm('diagnosis', v)}
                        placeholder="현재 진단명을 입력하세요"
                    />

                    <LabeledInput
                        label="과거병력"
                        value={form.medicalHistory}
                        onChangeText={v => updateForm('medicalHistory', v)}
                        placeholder="과거 병력이나 치료 이력을 입력하세요"
                        multiline={true}
                    />

                    <Pressable
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                        style={({ pressed }) => [
                            styles.button,
                            isSubmitting && { opacity: 0.5 },
                            pressed && { transform: [{ scale: 0.99 }] },
                        ]}
                    >
                        <Text style={styles.buttonText}>{isSubmitting ? '처리 중...' : '펫 등록하기'}</Text>
                    </Pressable>
                </View>
            </ScrollView>

            {/* 달력 모달들 */}
            <SimpleCalendar
                visible={showBirthDateModal}
                onClose={() => setShowBirthDateModal(false)}
                onSelect={(date) => updateForm('birthDate', formatDate(date))}
                title="생년월일"
            />
            <SimpleCalendar
                visible={showAdmissionDateModal}
                onClose={() => setShowAdmissionDateModal(false)}
                onSelect={(date) => updateForm('admissionDate', formatDate(date))}
                title="입원일"
            />
        </View>
    );
}

function LabeledInput(props: {
    label: string;
    value: string;
    onChangeText: (v: string) => void;
    placeholder?: string;
    multiline?: boolean;
}) {
    const { label, value, onChangeText, placeholder, multiline } = props;
    return (
        <View style={{ marginBottom: 16 }}>
            <Text style={styles.inputLabel}>{label}</Text>
            <View style={styles.inputWrap}>
                <TextInput
                    style={[styles.input, multiline && styles.multilineInput]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.hint}
                    multiline={multiline}
                    numberOfLines={multiline ? 4 : 1}
                    textAlignVertical={multiline ? 'top' : 'center'}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    scroll: { padding: 16 },
    card: {
        backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 20,
        shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 }, elevation: 3,
    },
    inputLabel: { marginBottom: 8, color: COLORS.text, fontWeight: '600' },
    inputWrap: {
        position: 'relative', backgroundColor: '#fff', borderRadius: 28,
        borderWidth: 1, borderColor: '#EFE7E0', paddingHorizontal: 18, paddingVertical: 10,
    },
    input: { height: 44, fontSize: 16, color: COLORS.text, flex: 1 },
    multilineInput: { height: 100, paddingTop: 10 },
    row: { flexDirection: 'row' },
    sectionDivider: {
        height: 1,
        backgroundColor: '#EFE7E0',
        marginVertical: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 16,
    },
    optionContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    optionButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#EFE7E0',
        backgroundColor: '#FFF',
    },
    optionButtonSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    optionText: {
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '500',
    },
    optionTextSelected: {
        color: '#FFF',
    },
    button: {
        marginTop: 10, backgroundColor: COLORS.primary, borderRadius: 28,
        height: 52, alignItems: 'center', justifyContent: 'center',
        shadowColor: '#F0663F', shadowOpacity: 0.25, shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 }, elevation: 2,
    },
    buttonText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderRadius: 28,
        borderWidth: 1,
        borderColor: '#EFE7E0',
        paddingHorizontal: 18,
        paddingVertical: 10,
        height: 44,
    },
    dateText: {
        fontSize: 16,
        color: COLORS.text,
        flex: 1,
    },
    placeholderText: {
        color: COLORS.hint,
    },
    // 달력 모달 스타일
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    calendarModal: {
        backgroundColor: COLORS.cardBg,
        borderRadius: 16,
        padding: 20,
        width: '90%',
        maxWidth: 400,
    },
    calendarHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    calendarTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
    },
    calendarDays: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    dayHeader: {
        flex: 1,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.hint,
        paddingVertical: 8,
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
    },
    dayButton: {
        width: '14.28%',
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    dayButtonActive: {
        backgroundColor: '#F8F9FA',
        borderRadius: 20,
    },
    dayButtonSelected: {
        backgroundColor: COLORS.primary,
        borderRadius: 20,
    },
    dayText: {
        fontSize: 16,
        color: COLORS.hint,
    },
    dayTextActive: {
        color: COLORS.text,
    },
    dayTextSelected: {
        color: '#FFF',
        fontWeight: '600',
    },
    calendarActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        paddingVertical: 12,
        marginRight: 8,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    confirmButton: {
        flex: 1,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        paddingVertical: 12,
        marginLeft: 8,
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
});
