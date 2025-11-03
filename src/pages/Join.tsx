// SignUpScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    View, Text, TextInput, StyleSheet, TouchableOpacity, Pressable,
    KeyboardAvoidingView, Platform, ScrollView, Alert, Modal
} from 'react-native';
import DaumPostcode from '@actbase/react-daum-postcode';
import api from '../constant/contants';
import { useNavigation } from '@react-navigation/native';

const COLORS = {
    primary: '#F0663F',
    bg: '#FAF6F2',
    text: '#333333',
    cardBg: '#FFFFFF',
    hint: '#7A7A7A',
    success: '#27AE60',
    error: '#E74C3C',
};

type User = {
    email: string;
    name: string;
    zipCode: string;
    baseAddress: string;
    detailAddress: string;
    password: string;
    verifyPassword: string;
    phone1: string;
    phone2: string;
    phone3: string;
    emailCode: string;
};

export default function SignUpScreen() {
    const navigation = useNavigation<any>();
    const [form, setForm] = useState<User>({
        email: '',
        name: '',
        zipCode: '',
        baseAddress: '',
        detailAddress: '',
        password: '',
        verifyPassword: '',
        phone1: '010',
        phone2: '',
        phone3: '',
        emailCode: '',
    });

    const [showPw, setShowPw] = useState(false);
    const [showPw2, setShowPw2] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // 이메일 인증 상태
    const [emailSending, setEmailSending] = useState(false);
    const [emailVerified, setEmailVerified] = useState(false);
    const [cooldown, setCooldown] = useState(0); // 재전송 쿨다운(초)
    const cooldownRef = useRef<NodeJS.Timeout | null>(null);
    const [emailSendCode, setEmailSendCode] = useState("");

    // 주소 검색 모달 상태
    const [showAddressModal, setShowAddressModal] = useState(false);

    const set = (k: keyof User, v: string) => {
        if (k === 'email') {
            // 이메일이 바뀌면 인증 초기화
            setEmailVerified(false);
            setForm(prev => ({ ...prev, [k]: v, emailCode: '' }));
            return;
        }
        if (k === 'emailCode') {
            // 숫자 6자리 제한
            const only = v.replace(/\D/g, '').slice(0, 6);
            setForm(prev => ({ ...prev, emailCode: only }));
            return;
        }
        setForm(prev => ({ ...prev, [k]: v }));
    };

    const emailRegex =
        /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    // 유효성 검사는 onSubmit에서 Alert로 처리

    // 전화번호 입력 핸들러
    const handlePhoneInput = (field: 'phone2' | 'phone3', value: string) => {
        const digits = value.replace(/\D/g, '');
        console.log(`🔢 전화번호 입력: ${field} = "${digits}" (원본: "${value}")`);
        setForm(prev => {
            const newForm = { ...prev, [field]: digits };
            console.log(`📱 폼 업데이트 후: phone2="${newForm.phone2}", phone3="${newForm.phone3}"`);
            console.log(`📱 전체 폼 상태:`, newForm);
            return newForm;
        });
    };

    // 쿨다운 타이머
    useEffect(() => {
        if (cooldown <= 0) {
            if (cooldownRef.current) {
                clearInterval(cooldownRef.current);
                cooldownRef.current = null;
            }
            return;
        }
        if (!cooldownRef.current) {
            cooldownRef.current = setInterval(() => {
                setCooldown(prev => (prev > 0 ? prev - 1 : 0));
            }, 1000);
        }
        return () => {
            if (cooldownRef.current) {
                clearInterval(cooldownRef.current);
                cooldownRef.current = null;
            }
        };
    }, [cooldown]);

    // 이메일 코드 요청
    const sendEmailCode = async () => {
        if (!emailRegex.test(form.email)) {
            Alert.alert('확인', '올바른 이메일을 입력하세요.');
            return;
        }
        try {
            setEmailSending(true);
            setEmailVerified(false);
            setCooldown(180);

            // 6자리 랜덤 인증번호 생성
            const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
            setEmailSendCode(randomCode);
            // 이메일과 랜덤번호를 서버로 전송
            await api.post('/user/email/send', {
                email: form.email,
                emailCode: randomCode
            });

            Alert.alert('발송 완료', '인증 코드가 이메일로 전송되었습니다.');
        } catch (e: any) {
            setCooldown(0);
            Alert.alert('오류', e?.message ?? '코드 발송에 실패했습니다.');
        } finally {
            setEmailSending(false);
        }
    };

    // 이메일 코드 검증
    const verifyEmailCode = async () => {
        if (form.emailCode.length !== 6) {
            Alert.alert('확인', '6자리 인증 코드를 입력하세요.');
            return;
        }
        if (form.emailCode === emailSendCode) {
            setEmailVerified(true);
            Alert.alert('인증 완료', '이메일 인증이 완료되었습니다.');
        } else {
            setEmailVerified(false);
            Alert.alert('인증 실패', '인증에 실패했습니다.');
        }
    };

    // 주소 검색 완료 처리
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

    // 주소 검색 모달 열기
    const openAddressSearch = () => {
        setShowAddressModal(true);
    };

    const onSubmit = async () => {
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

        // 이메일 유효성 검사
        if (!emailRegex.test(form.email)) {
            Alert.alert('확인', '올바른 이메일을 입력하세요.');
            return;
        }

        // 비밀번호 유효성 검사
        if (form.password.length < 8) {
            Alert.alert('확인', '비밀번호는 8자 이상이어야 합니다.');
            return;
        }
        if (form.verifyPassword !== form.password) {
            Alert.alert('확인', '비밀번호가 일치하지 않습니다.');
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

        // 이메일 인증 검사
        if (!emailVerified) {
            Alert.alert('확인', '이메일 인증을 완료해주세요.');
            return;
        }
        try {
            setSubmitting(true);
            const fullAddress = `${form.baseAddress} ${form.detailAddress}`.trim();
            const fullPhone = form.phone1 + "-" + form.phone2 + "-" + form.phone3;
            console.log("fullPhone", fullPhone);
            console.log("fullAddress", fullAddress);
            await api.post('/user/join', {
                email: form.email.trim(),
                name: form.name.trim(),
                zipCode: form.zipCode.trim(),
                baseAddress: form.baseAddress.trim(),
                detailAddress: form.detailAddress.trim(),
                address: fullAddress, // 전체 주소도 함께 전송
                password: form.password,
                phone: fullPhone, // 전체 전화번호도 함께 전송
            });
            // 회원가입 성공 시 알림 후 로그인 페이지로 이동
            Alert.alert('회원가입 완료', '로그인 페이지로 이동합니다.', [
                {
                    text: '확인',
                    onPress: () => navigation.reset({ index: 0, routes: [{ name: '로그인' }] }),
                },
            ]);

        } catch (e: any) {
            Alert.alert('오류', e?.message ?? '회원가입에 실패했습니다.');
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

                        {/* 이메일 + 코드 발송 */}
                        <LabeledInput
                            label="이메일"
                            value={form.email}
                            onChangeText={v => set('email', v)}
                            placeholder="name@hospital.com"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            rightAction={
                                <TouchableOpacity
                                    onPress={sendEmailCode}
                                    disabled={emailSending || cooldown > 0}
                                >
                                    <Text style={[styles.actionLink, (emailSending || cooldown > 0) && { opacity: 0.5 }]}>
                                        {cooldown > 0 ? `재전송(${cooldown}s)` : '코드 발송'}
                                    </Text>
                                </TouchableOpacity>
                            }
                        />
                        <LabeledInput
                            label="이메일 인증코드"
                            value={form.emailCode}
                            onChangeText={v => set('emailCode', v)}
                            placeholder="6자리 숫자"
                            keyboardType="numeric"
                            rightAction={
                                <TouchableOpacity onPress={verifyEmailCode} disabled={emailVerified || form.emailCode.length !== 6}>
                                    <Text style={[styles.actionLink, (emailVerified || form.emailCode.length !== 6) && { opacity: 0.5 }]}>
                                        {emailVerified ? '인증완료' : '인증하기'}
                                    </Text>
                                </TouchableOpacity>
                            }
                            hint={emailVerified ? '이메일 인증이 완료되었습니다.' : undefined}
                            hintColor={emailVerified ? COLORS.success : undefined}
                        />

                        <LabeledInput
                            label="비밀번호"
                            value={form.password}
                            onChangeText={v => set('password', v)}
                            placeholder="8자 이상"
                            secureTextEntry={!showPw}
                            rightAction={
                                <TouchableOpacity onPress={() => setShowPw(s => !s)}>
                                    <Text style={styles.eye}>{showPw ? 'Hide' : 'Show'}</Text>
                                </TouchableOpacity>
                            }
                        />
                        <LabeledInput
                            label="비밀번호 확인"
                            value={form.verifyPassword}
                            onChangeText={v => set('verifyPassword', v)}
                            placeholder="비밀번호 재입력"
                            secureTextEntry={!showPw2}
                            rightAction={
                                <TouchableOpacity onPress={() => setShowPw2(s => !s)}>
                                    <Text style={styles.eye}>{showPw2 ? 'Hide' : 'Show'}</Text>
                                </TouchableOpacity>
                            }
                        />
                        {/* 전화번호 */}
                        <View style={styles.phoneSection}>
                            <Text style={styles.inputLabel}>담당자 전화번호</Text>
                            <View style={styles.phoneRow}>
                                <View style={[styles.phoneField, { flex: 1, marginRight: 8 }]}>
                                    <View style={styles.phoneInputWrap}>
                                        <TextInput
                                            style={styles.phoneInput}
                                            value="010"
                                            onChangeText={() => { }}
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
                            onPress={onSubmit}
                            disabled={submitting}
                            style={({ pressed }) => [
                                styles.button,
                                submitting && { opacity: 0.5 },
                                pressed && { transform: [{ scale: 0.99 }] },
                            ]}
                        >
                            <Text style={styles.buttonText}>{submitting ? '처리 중...' : '회원가입'}</Text>
                        </Pressable>

                        {/* <Text style={styles.helper}>
                            이미 계정이 있나요? <Text style={[styles.helper, { color: COLORS.primary }]}>Sign In</Text>
                        </Text> */}
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
