// SignUpScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    View, Text, TextInput, StyleSheet, TouchableOpacity, Pressable,
    KeyboardAvoidingView, Platform, ScrollView, Alert
} from 'react-native';
import api from '../constant/contants';

const COLORS = {
    primary: '#F0663F',
    bg: '#FAF6F2',
    text: '#333333',
    cardBg: '#FFFFFF',
    hint: '#7A7A7A',
    error: '#E74C3C',
    ok: '#27AE60',
};

type Form = {
    orgName: string;
    orgAddress: string;
    username: string;     // 아이디
    email: string;        // 이메일
    password: string;
    password2: string;
    phone: string;
    emailCode: string;    // 인증 코드(6자리)
};

export default function SignUpScreen() {
    const [form, setForm] = useState<Form>({
        orgName: '',
        orgAddress: '',
        username: '',
        email: '',
        password: '',
        password2: '',
        phone: '',
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

    const set = (k: keyof Form, v: string) => {
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

    // 간단 유효성
    const errors = useMemo(() => {
        const e: Partial<Record<keyof Form, string>> = {};
        if (!form.orgName.trim()) e.orgName = '기관명을 입력하세요.';
        if (!form.orgAddress.trim()) e.orgAddress = '기관주소를 입력하세요.';
        if (!/^[a-zA-Z0-9._-]{4,20}$/.test(form.username)) {
            e.username = '아이디는 4~20자 영문/숫자/._-만 가능합니다.';
        }
        if (!emailRegex.test(form.email)) e.email = '올바른 이메일을 입력하세요.';
        if (form.password.length < 8) e.password = '비밀번호는 8자 이상이어야 합니다.';
        if (form.password2 !== form.password) e.password2 = '비밀번호가 일치하지 않습니다.';
        const digits = form.phone.replace(/\D/g, '');
        if (digits.length < 9 || digits.length > 15) e.phone = '전화번호를 정확히 입력하세요.';
        // 이메일 인증 전이면 안내만, 차단은 isValid에서 처리
        return e;
    }, [form]);

    const isValidWithoutEmailVerify = useMemo(
        () => Object.keys(errors).length === 0,
        [errors]
    );

    // const isValid = isValidWithoutEmailVerify && emailVerified;

    const isValid = true;

    // 전화번호 포맷
    const formatPhone = (input: string) => {
        const d = input.replace(/\D/g, '');
        if (d.startsWith('02')) {
            if (d.length <= 2) return d;
            if (d.length <= 5) return `${d.slice(0, 2)}-${d.slice(2)}`;
            if (d.length <= 9) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`;
            return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6, 10)}`;
        }
        if (d.length <= 3) return d;
        if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
        if (d.length <= 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
        return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`;
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
            setCooldown(60);

            // 6자리 랜덤 인증번호 생성
            const randomCode = Math.floor(100000 + Math.random() * 900000).toString();

            // 이메일과 랜덤번호를 서버로 전송
            await api.post('/user/email/send', {
                email: form.email,
                code: randomCode
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
        try {
            // const res = await api.post('/auth/email/verify', {
            //   email: form.email,
            //   code: form.emailCode,
            // });
            // if (res.data.verified) setEmailVerified(true);

            await new Promise(res => setTimeout(res, 500)); // 데모
            setEmailVerified(true);
            Alert.alert('인증 완료', '이메일 인증이 완료되었습니다.');
        } catch (e: any) {
            setEmailVerified(false);
            Alert.alert('오류', e?.message ?? '인증에 실패했습니다.');
        }
    };

    const onSubmit = async () => {
        if (!isValid) {
            Alert.alert('확인', '입력값과 이메일 인증을 확인해주세요.');
            return;
        }
        try {
            setSubmitting(true);
            //   실제 회원가입 API (서버 스키마에 맞게 수정)
            await api.post('/user/join', {
                org_name: form.orgName.trim(),
                org_address: form.orgAddress.trim(),
                org_email: form.email.trim(),
                org_pw: form.password,
                org_phone: form.phone.replace(/\D/g, ''),
                marketingAgreed: false,
                smsAgreed: false,
                emailAgreed: false,
                pushAgreed: false,
            });

            await new Promise(res => setTimeout(res, 700));
            Alert.alert('회원가입 완료', '관리자 승인 후 로그인할 수 있어요.');
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
                            value={form.orgName}
                            onChangeText={v => set('orgName', v)}
                            placeholder="예) 조이동물의료센터"
                            error={errors.orgName}
                        />
                        <LabeledInput
                            label="기관주소"
                            value={form.orgAddress}
                            onChangeText={v => set('orgAddress', v)}
                            placeholder="예) 서울 강남구 테일링로 123"
                            error={errors.orgAddress}
                        />

                        {/* 이메일 + 코드 발송 */}
                        <LabeledInput
                            label="이메일"
                            value={form.email}
                            onChangeText={v => set('email', v)}
                            placeholder="name@hospital.com"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            error={!emailVerified ? errors.email : undefined}
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
                            hintColor={emailVerified ? COLORS.ok : undefined}
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
                            error={errors.password}
                        />
                        <LabeledInput
                            label="비밀번호 확인"
                            value={form.password2}
                            onChangeText={v => set('password2', v)}
                            placeholder="비밀번호 재입력"
                            secureTextEntry={!showPw2}
                            rightAction={
                                <TouchableOpacity onPress={() => setShowPw2(s => !s)}>
                                    <Text style={styles.eye}>{showPw2 ? 'Hide' : 'Show'}</Text>
                                </TouchableOpacity>
                            }
                            error={errors.password2}
                        />
                        <LabeledInput
                            label="담당자 전화번호"
                            value={form.phone}
                            onChangeText={v => set('phone', formatPhone(v))}
                            placeholder="010-1234-5678"
                            keyboardType="phone-pad"
                            error={errors.phone}
                        />

                        <Pressable
                            onPress={onSubmit}
                            disabled={!isValid || submitting}
                            style={({ pressed }) => [
                                styles.button,
                                (!isValid || submitting) && { opacity: 0.5 },
                                pressed && { transform: [{ scale: 0.99 }] },
                            ]}
                        >
                            <Text style={styles.buttonText}>{submitting ? '처리 중...' : 'Sign Up'}</Text>
                        </Pressable>

                        <Text style={styles.helper}>
                            이미 계정이 있나요? <Text style={[styles.helper, { color: COLORS.primary }]}>Sign In</Text>
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
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
}) {
    const {
        label, value, onChangeText, placeholder, error, hint, hintColor,
        secureTextEntry, rightAction, autoCapitalize, keyboardType
    } = props;
    return (
        <View style={{ marginBottom: 16 }}>
            <Text style={styles.inputLabel}>{label}</Text>
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
                    editable={true}
                    selectTextOnFocus={true}
                    autoCorrect={false}
                />
                {rightAction ? <View style={styles.rightAction} pointerEvents="box-none">{rightAction}</View> : null}
            </View>
            {!!error && <Text style={styles.errorText}>{error}</Text>}
            {!!hint && !error && <Text style={[styles.hintText, hintColor ? { color: hintColor } : null]}>{hint}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    scroll: { padding: 24, paddingBottom: 40 },
    header: { alignItems: 'center', marginTop: 24, marginBottom: 16 },
    logoHeart: {
        width: 40, height: 32, borderWidth: 3, borderColor: COLORS.primary,
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
        transform: [{ rotate: '45deg' }], marginBottom: 6,
    },
    brand: { fontSize: 28, fontWeight: '700', color: COLORS.text },
    subtitle: { marginTop: 6, fontSize: 14, color: '#475569' },
    card: {
        marginTop: 16, backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 20,
        shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 }, elevation: 3,
    },
    inputLabel: { marginBottom: 8, color: COLORS.text, fontWeight: '600' },
    inputWrap: {
        position: 'relative', backgroundColor: '#fff', borderRadius: 28,
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
});
