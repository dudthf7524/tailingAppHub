import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Modal,
    KeyboardAvoidingView, Platform, ScrollView, Pressable
} from 'react-native';
import DaumPostcode from '@actbase/react-daum-postcode';
import api from '../constant/contants';
import { useSelector } from 'react-redux';
import { RootState } from '../store/reducer';
import { useNavigation, useRoute } from '@react-navigation/native';

const COLORS = {
    primary: '#F0663F',
    bg: '#FAF6F2',
    text: '#333333',
    cardBg: '#FFFFFF',
    hint: '#7A7A7A',
    success: '#27AE60',
    error: '#E74C3C',
};

type ProfileForm = {
    name: string;
    zipCode: string;
    baseAddress: string;
    detailAddress: string;
    phone1: string;
    phone2: string;
    phone3: string;
};

export default function ProfileEdit() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const accessToken = useSelector((state: RootState) => state.user.accessToken);
    const receivedUserInfo = route.params?.userInfo;

    const [form, setForm] = useState<ProfileForm>({
        name: '',
        zipCode: '',
        baseAddress: '',
        detailAddress: '',
        phone1: '010',
        phone2: '',
        phone3: '',
    });

    const [showAddressModal, setShowAddressModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // 전화번호 파싱 (010-1234-5678 형식에서 분리)
    const parsePhone = (phone: string) => {
        if (!phone) return { phone1: '010', phone2: '', phone3: '' };
        const parts = phone.split('-');
        if (parts.length === 3) {
            return {
                phone1: parts[0] || '010',
                phone2: parts[1] || '',
                phone3: parts[2] || '',
            };
        }
        return { phone1: '010', phone2: '', phone3: '' };
    };

    // 기존 사용자 정보를 폼에 로드
    useEffect(() => {
        if (receivedUserInfo) {
            console.log('ProfileEdit - receivedUserInfo:', receivedUserInfo);
            const phoneParts = parsePhone(receivedUserInfo.phone || '');

            setForm({
                name: receivedUserInfo.name || receivedUserInfo.orgName || '',
                zipCode: receivedUserInfo.postcode || '',
                baseAddress: receivedUserInfo.address || '',
                detailAddress: receivedUserInfo.detailAddress || '',
                phone1: phoneParts.phone1,
                phone2: phoneParts.phone2,
                phone3: phoneParts.phone3,
            });
        }
    }, [receivedUserInfo]);

    const set = (k: keyof ProfileForm, v: string) => {
        setForm(prev => ({ ...prev, [k]: v }));
    };

    const openAddressSearch = () => setShowAddressModal(true);

    const handleAddressSelect = (data: any) => {
        let baseAddress = data.address;
        let extraAddress = '';

        if (data.addressType === 'R') {
            if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
                extraAddress += data.bname;
            }
            if (data.buildingName !== '' && data.apartment === 'Y') {
                extraAddress += (extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName);
            }
            if (extraAddress !== '') {
                extraAddress = ` (${extraAddress})`;
            }
            baseAddress += extraAddress;
        }

        setForm(prev => ({
            ...prev,
            zipCode: data.zonecode,
            baseAddress: baseAddress,
            detailAddress: '' // 상세주소는 초기화
        }));
        setShowAddressModal(false);
    };

    // 전화번호 입력 핸들러
    const handlePhoneInput = (field: 'phone2' | 'phone3', value: string) => {
        const digits = value.replace(/\D/g, '');
        setForm(prev => ({ ...prev, [field]: digits }));
    };

    const onSave = async () => {
        // 기관명 유효성 검사
        if (!form.name.trim()) {
            Alert.alert('확인', '기관명을 입력하세요.');
            return;
        }
        // 주소 유효성 검사
        if (!form.zipCode.trim()) {
            Alert.alert('확인', '우편번호를 검색해주세요.');
            return;
        }
        if (!form.baseAddress.trim()) {
            Alert.alert('확인', '기본주소를 검색해주세요.');
            return;
        }
        if (!form.detailAddress.trim()) {
            Alert.alert('확인', '상세주소를 입력하세요.');
            return;
        }

        // 전화번호 유효성 검사
        if (!form.phone2.trim()) {
            Alert.alert('확인', '전화번호를 입력하세요.');
            return;
        }
        if (!form.phone3.trim()) {
            Alert.alert('확인', '전화번호를 입력하세요.');
            return;
        }

        try {
            setSubmitting(true);
            const fullPhone = form.phone1 + "-" + form.phone2 + "-" + form.phone3;

            await api.post('/user/edit', {
                name: form.name.trim(),
                postcode: form.zipCode.trim(),
                address: form.baseAddress.trim(),
                detail_address: form.detailAddress.trim(),
                phone: fullPhone,
            }, {
                headers: { authorization: `${accessToken}` },
            });

            Alert.alert('저장 완료', '프로필이 업데이트되었습니다.', [
                {
                    text: '확인',
                    onPress: () => {
                        // 더보기 페이지로 이동
                        navigation.reset({
                            index: 0,
                            routes: [
                                {
                                    name: 'MainTabs',
                                    state: {
                                        routes: [
                                            { name: 'PetList' },
                                            { name: 'DeviceManagement' },
                                            { name: 'CSVDownload' },
                                            { name: 'Profile' },
                                        ],
                                        index: 3, // Profile 탭 선택
                                    },
                                },
                            ],
                        });
                    },
                },
            ]);
        } catch (e: any) {
            console.error('프로필 저장 오류:', e);
            Alert.alert('오류', e?.response?.data?.message || e?.message || '프로필 저장에 실패했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" >
                    {/* 카드 */}
                    <View style={styles.card}>
                        <LabeledInput
                            label="기관명"
                            value={form.name}
                            onChangeText={v => set('name', v)}
                            placeholder="예) 크림오프 동물병원"
                        />
                        {/* 기관주소 섹션 */}
                        <View style={styles.addressSection}>
                            <Text style={styles.inputLabel}>기관주소</Text>

                            {/* 우편번호 */}
                            <View style={{ marginBottom: 16 }}>
                                <View style={styles.inputWrap}>
                                    <TextInput
                                        style={styles.input}
                                        value={form.zipCode}
                                        onChangeText={v => set('zipCode', v)}
                                        placeholder="우편번호"
                                        placeholderTextColor={COLORS.hint}
                                        editable={false}
                                        selectTextOnFocus={false}
                                        autoCorrect={false}
                                    />
                                    <View style={styles.rightAction} pointerEvents="box-none">
                                        <TouchableOpacity onPress={openAddressSearch}>
                                            <Text style={styles.actionLink}>주소 찾기</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            {/* 기본주소 */}
                            <View style={{ marginBottom: 16 }}>
                                <View style={styles.inputWrap}>
                                    <TextInput
                                        style={styles.input}
                                        value={form.baseAddress}
                                        onChangeText={v => set('baseAddress', v)}
                                        placeholder="기본주소"
                                        placeholderTextColor={COLORS.hint}
                                        editable={false}
                                        selectTextOnFocus={false}
                                        autoCorrect={false}
                                    />
                                </View>
                            </View>

                            {/* 상세주소 */}
                            <View style={{ marginBottom: 16 }}>
                                <View style={styles.inputWrap}>
                                    <TextInput
                                        style={styles.input}
                                        value={form.detailAddress}
                                        onChangeText={v => set('detailAddress', v)}
                                        placeholder="상세주소 (예: 101호, 2층)"
                                        placeholderTextColor={COLORS.hint}
                                        editable={true}
                                        selectTextOnFocus={true}
                                        autoCorrect={false}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* 전화번호 */}
                        <View style={styles.phoneSection}>
                            <Text style={styles.inputLabel}>담당자 전화번호</Text>
                            <View style={styles.phoneRow}>
                                <View style={[styles.phoneField, { flex: 1, marginRight: 8 }]}>
                                    <View style={styles.phoneInputWrap}>
                                        <TextInput
                                            style={styles.phoneInput}
                                            value={form.phone1}
                                            onChangeText={() => {}}
                                            placeholder="010"
                                            placeholderTextColor={COLORS.hint}
                                            keyboardType="numeric"
                                            editable={false}
                                            selectTextOnFocus={false}
                                            autoCorrect={false}
                                        />
                                    </View>
                                </View>
                                <Text style={styles.phoneDash}>-</Text>
                                <View style={[styles.phoneField, { flex: 1, marginHorizontal: 8 }]}>
                                    <View style={styles.phoneInputWrap}>
                                        <TextInput
                                            style={styles.phoneInput}
                                            value={form.phone2}
                                            onChangeText={v => handlePhoneInput('phone2', v)}
                                            placeholder="1234"
                                            placeholderTextColor={COLORS.hint}
                                            keyboardType="numeric"
                                            maxLength={4}
                                            editable={true}
                                            selectTextOnFocus={true}
                                            autoCorrect={false}
                                        />
                                    </View>
                                </View>
                                <Text style={styles.phoneDash}>-</Text>
                                <View style={[styles.phoneField, { flex: 1, marginLeft: 8 }]}>
                                    <View style={styles.phoneInputWrap}>
                                        <TextInput
                                            style={styles.phoneInput}
                                            value={form.phone3}
                                            onChangeText={v => handlePhoneInput('phone3', v)}
                                            placeholder="5678"
                                            placeholderTextColor={COLORS.hint}
                                            keyboardType="numeric"
                                            maxLength={4}
                                            editable={true}
                                            selectTextOnFocus={true}
                                            autoCorrect={false}
                                        />
                                    </View>
                                </View>
                            </View>
                        </View>

                        <Pressable
                            onPress={onSave}
                            disabled={submitting}
                            style={({ pressed }) => [
                                styles.button,
                                submitting && { opacity: 0.5 },
                                pressed && { transform: [{ scale: 0.99 }] },
                            ]}
                        >
                            <Text style={styles.buttonText}>{submitting ? '처리 중...' : '저장'}</Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* 주소 검색 모달 */}
            <Modal
                visible={showAddressModal}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowAddressModal(false)}>
                            <Text style={styles.modalCloseButton}>닫기</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>주소 검색</Text>
                        <View style={{ width: 40 }} />
                    </View>
                    <DaumPostcode
                        style={{ flex: 1 }}
                        jsOptions={{
                            animation: false,  // 애니메이션 비활성화로 성능 향상
                            hideMapBtn: true,   // 지도 버튼 숨김으로 로딩 시간 단축
                            hideEngBtn: true,   // 영문 버튼 숨김
                            alwaysShowEngAddr: false,
                            submitMode: true    // 제출 모드로 빠른 선택
                        }}
                        onSelected={handleAddressSelect}
                        onError={(error) => {
                            console.error('주소 검색 오류:', error);
                            Alert.alert('오류', '주소 검색 중 오류가 발생했습니다.');
                        }}
                    />
                </View>
            </Modal>
        </View>
    );
}

function LabeledInput(props: {
    label: string;
    value: string;
    onChangeText: (v: string) => void;
    placeholder?: string;
    error?: string;
    hint?: string;
    hintColor?: string;
    secureTextEntry?: boolean;
    rightAction?: React.ReactNode;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    editable?: boolean;
    maxLength?: number;
    noMargin?: boolean;
}) {
    const {
        label, value, onChangeText, placeholder, error, hint, hintColor,
        secureTextEntry, rightAction, autoCapitalize, keyboardType, editable = true, maxLength, noMargin = false
    } = props;
    return (
        <View style={noMargin ? {} : { marginBottom: 16 }}>
            {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
            <View style={styles.inputWrap}>
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.hint}
                    secureTextEntry={secureTextEntry}
                    autoCapitalize={autoCapitalize}
                    keyboardType={keyboardType}
                    editable={editable}
                    selectTextOnFocus={editable}
                    autoCorrect={false}
                    maxLength={maxLength}
                />
                {rightAction ? <View style={styles.rightAction} pointerEvents="box-none">{rightAction}</View> : null}
            </View>
            {!!error && <Text style={styles.errorText}>{error}</Text>}
            {!!hint && !error && <Text style={[styles.hintText, hintColor ? { color: hintColor } : null]}>{hint}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#ffffff" },
    scroll: { padding: 16, paddingBottom: 40 },
    card: {
       borderRadius: 16, padding: 20,
        // shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12,
        // shadowOffset: { width: 0, height: 6 }, elevation: 3,
    },
    inputLabel: { marginBottom: 8, color: COLORS.text, fontWeight: '600' },
    inputWrap: {
        position: 'relative', backgroundColor: '#fff', borderRadius: 10,
        borderWidth: 1, borderColor: '#EFE7E0', paddingHorizontal: 18, paddingVertical: 10,
    },
    input: { height: 44, fontSize: 16, color: COLORS.text, paddingRight: 80, flex: 1 },
    rightAction: { position: 'absolute', right: 14, top: 10, height: 44, justifyContent: 'center', alignItems: 'center' },
    eye: { fontSize: 14, color: COLORS.hint, fontWeight: '600' },
    actionLink: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
    errorText: { marginTop: 6, color: COLORS.error, fontSize: 12 },
    hintText: { marginTop: 6, color: COLORS.hint, fontSize: 12 },
    button: {
        marginTop: 10, backgroundColor: COLORS.primary, borderRadius: 28,
        height: 52, alignItems: 'center', justifyContent: 'center',
        shadowColor: '#F0663F', shadowOpacity: 0.25, shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 }, elevation: 2,
    },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
    helper: { marginTop: 16, textAlign: 'center', color: '#475569', fontSize: 14 },
    // 모달 스타일
    modalContainer: { flex: 1, backgroundColor: '#fff' },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    modalCloseButton: { fontSize: 16, color: COLORS.primary, fontWeight: '600' },
    modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
    // 주소 관련 스타일
    addressSection: { marginBottom: 16 },
    // 전화번호 관련 스타일
    phoneSection: { marginBottom: 16 },
    phoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    phoneField: { flex: 1 },
    phoneDash: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.hint,
        marginHorizontal: 4
    },
    // 고정된 입력 필드 스타일
    fixedInputWrap: {
        backgroundColor: '#F8F9FA',
        borderColor: '#DEE2E6',
    },
    fixedInput: {
        color: COLORS.text,
        fontWeight: '700',
        textAlign: 'center',
        fontSize: 16,
    },
    fixedInputText: {
        color: COLORS.text,
        fontWeight: '700',
        textAlign: 'center',
        fontSize: 16,
        height: 44,
        lineHeight: 44,
    },
    // 전화번호 전용 스타일
    phoneInputWrap: {
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#EFE7E0',
        paddingHorizontal: 12,
        paddingVertical: 8,
        justifyContent: 'center',
    },
    phoneInput: {
        height: 44,
        fontSize: 16,
        color: '#000000',
        fontWeight: 'normal',
        textAlign: 'center',
        padding: 0,
        margin: 0,
    },
});
