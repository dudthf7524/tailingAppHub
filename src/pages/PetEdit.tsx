import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView,
    Alert, Pressable
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import api from '../constant/contants';
import { RootState } from '../store/reducer';
import { useSelector } from 'react-redux';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';

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

type PetEditParams = {
    PetEdit: {
        pet: any;
    };
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

export default function PetEdit() {
    const route = useRoute<RouteProp<PetEditParams, 'PetEdit'>>();
    const navigation = useNavigation<any>();
    const accessToken = useSelector((state: RootState) => state.user.accessToken);
    const petData = route.params?.pet;

    const [form, setForm] = useState<PetForm>({
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showBirthDateModal, setShowBirthDateModal] = useState(false);
    const [showAdmissionDateModal, setShowAdmissionDateModal] = useState(false);

    // 기존 데이터 로드
    useEffect(() => {
        if (petData) {
            setForm({
                name: petData.name || '',
                species: petData.species || '',
                breed: petData.breed || '',
                weight: petData.weight ? String(petData.weight) : '',
                gender: petData.gender || '',
                neutering: petData.neutering || '',
                birthDate: petData.birthDate || '',
                admissionDate: petData.admissionDate || '',
                veterinarian: petData.veterinarian || '',
                diagnosis: petData.diagnosis || '',
                medicalHistory: petData.medicalHistory || '',
            });
        }
    }, [petData]);

    const updateForm = (key: keyof PetForm, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    // 날짜 선택 핸들러
    const handleBirthDateConfirm = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        updateForm('birthDate', `${year}-${month}-${day}`);
        setShowBirthDateModal(false);
    };

    const handleAdmissionDateConfirm = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        updateForm('admissionDate', `${year}-${month}-${day}`);
        setShowAdmissionDateModal(false);
    };

    const validateForm = () => {
        if (!form.name.trim()) {
            Alert.alert('알림', '환자 이름을 입력하세요.');
            return false;
        }
        if (!form.species) {
            Alert.alert('알림', '환자 종류를 선택하세요.');
            return false;
        }
        if (!form.weight.trim()) {
            Alert.alert('알림', '환자 체중을 입력하세요.');
            return false;
        }
        if (!form.gender) {
            Alert.alert('알림', '환자 성별을 선택하세요.');
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

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            setIsSubmitting(true);
            const response = await api.post(`/pet/edit`, {
                id: petData.id,
                name: form.name.trim(),
                species: form.species,
                breed: form.breed.trim(),
                weight: parseFloat(form.weight),
                gender: form.gender,
                neutering: form.neutering,
                birthDate: form.birthDate.trim(),
                admissionDate: form.admissionDate.trim(),
                veterinarian: form.veterinarian.trim(),
                diagnosis: form.diagnosis.trim(),
                medicalHistory: form.medicalHistory.trim(),
            }, {
                headers: { authorization: `${accessToken}` },
            });

            if (response.status === 200) {
                Alert.alert('성공', response.data.message, [
                    {
                        text: '확인', onPress: () => {
                            // 메인 탭의 환자 목록으로 이동
                            navigation.navigate('MainTabs', { screen: 'PetList' });
                        }
                    }
                ]);
            }


        } catch (error: any) {
            console.error('환자 수정 오류:', error);
            Alert.alert('오류', error?.response?.data?.message || '환자 수정 중 오류가 발생했습니다.');
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
                        label="환자 이름"
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
                        <Text style={styles.buttonText}>{isSubmitting ? '처리 중...' : '수정하기'}</Text>
                    </Pressable>
                </View>
            </ScrollView>

            {/* 날짜 선택 모달들 */}
            <DateTimePickerModal
                isVisible={showBirthDateModal}
                mode="date"
                onConfirm={handleBirthDateConfirm}
                onCancel={() => setShowBirthDateModal(false)}
                date={form.birthDate ? new Date(form.birthDate) : new Date()}
                confirmTextIOS="확인"
                cancelTextIOS="취소"
                locale="ko_KR"
            />
            <DateTimePickerModal
                isVisible={showAdmissionDateModal}
                mode="date"
                onConfirm={handleAdmissionDateConfirm}
                onCancel={() => setShowAdmissionDateModal(false)}
                date={form.admissionDate ? new Date(form.admissionDate) : new Date()}
                confirmTextIOS="확인"
                cancelTextIOS="취소"
                locale="ko_KR"
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
        backgroundColor: COLORS.cardBg,
        // borderRadius: 16,
        padding: 20,
        // shadowColor: '#000',
        // shadowOpacity: 0.06,
        // shadowRadius: 12,
        // shadowOffset: { width: 0, height: 6 },
        // elevation: 3,
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
});
