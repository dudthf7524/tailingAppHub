// SignInScreen.tsx (한글 버전)
import React, { useMemo, useState } from 'react';
import {
    View, Text, TextInput, StyleSheet, TouchableOpacity,
    Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../constant/contants';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { setToken } from '../utils/token';

// JWT 토큰 디코딩 함수
const decodeJWT = (token: string) => {
    try {
        const base64Payload = token.split('.')[1];
        const payload = atob(base64Payload);
        return JSON.parse(payload);
    } catch (error) {
        console.error('JWT 디코딩 실패:', error);
        return null;
    }
};

const COLORS = {
    primary: '#F0663F',
    bg: '#FAF6F2',
    text: '#333333',
    cardBg: '#FFFFFF',
    hint: '#7A7A7A',
    error: '#E74C3C',
};

export default function SignInScreen({ navigation }: any) {
    const [email, setEmail] = useState('');
    const [pw, setPw] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    const errors = useMemo(() => {
        const e: any = {};
        if (!emailRegex.test(email)) e.email = '올바른 이메일을 입력하세요.';
        if (pw.length < 8) e.pw = '비밀번호는 8자 이상이어야 합니다.';
        return e;
    }, [email, pw]);

    const isValid = Object.keys(errors).length === 0;

    const onSignIn = async () => {
        if (!isValid) {
            Alert.alert('확인', '입력값을 다시 확인해주세요.');
            return;
        }
        try {
            setLoading(true);
            console.log("email", email)
            console.log("pw", pw)
            // 실제 로그인 API 호출
            const res = await api.post('/user/login', {
                org_email: email,
                org_pw: pw
            });
            // 서버에서 받은 토큰 추출
            const { token } = res.data.data;

            // AsyncStorage에 토큰 저장 (TokenData 형태로 저장)
            const tokenData = {
                device_code: '',
                org_email: email,
                access_token: token
            };
            await setToken(tokenData);

            // 토큰에서 이메일 정보 추출
            const decodedToken = decodeJWT(token);
            const userEmail = decodedToken?.email || decodedToken?.org_email || decodedToken?.sub || 'Unknown';

            // 콘솔에 토큰 및 이메일 정보 출력
            console.log('=== 로그인 성공 ===');
            console.log('Access Token:', token);
            console.log('토큰에서 추출한 이메일:', userEmail);
            console.log('토큰 전체 페이로드:', decodedToken);
            console.log('==================');

            Alert.alert('로그인 성공', '환영합니다!', [
                {
                    text: '확인',
                    onPress: () => {
                        // 앱을 완전히 새로고침하는 방법
                        // DevSettings로 리로드 (개발환경에서만 사용)
                        // 프로덕션에서는 다른 방법 필요
                        if (__DEV__) {
                            const DevSettings = require('react-native').DevSettings;
                            DevSettings.reload();
                        } else {
                            // 프로덕션에서는 navigation reset
                            navigation.reset({
                                index: 0,
                                routes: [{ name: '로그인' }],
                            });
                        }
                    }
                }
            ]);
        } catch (e: any) {
            console.error('로그인 실패:', e.response?.data || e.message);
            Alert.alert('로그인 실패', e?.response?.data?.message || e?.message || '이메일 또는 비밀번호를 확인하세요.');
        } finally {
            setLoading(false);
        }
    };

    const onForgot = () => {
        Alert.alert('비밀번호 찾기', '관리자에게 문의하거나, 재설정 화면으로 이동하세요.');
    };

    // 저장된 토큰 확인 함수 (디버깅용)
    const checkStoredToken = async () => {
        try {
            const accessToken = await AsyncStorage.getItem('accessToken');
            const refreshToken = await AsyncStorage.getItem('refreshToken');

            console.log('=== 저장된 토큰 확인 ===');
            console.log('Access Token:', accessToken);
            console.log('Refresh Token:', refreshToken);

            if (accessToken) {
                const decodedToken = decodeJWT(accessToken);
                const userEmail = decodedToken?.email || decodedToken?.org_email || decodedToken?.sub || 'Unknown';
                console.log('저장된 토큰에서 추출한 이메일:', userEmail);
                console.log('저장된 토큰 전체 페이로드:', decodedToken);
            }

            console.log('======================');

            const emailInfo = accessToken ? decodeJWT(accessToken)?.email || decodeJWT(accessToken)?.org_email || 'Unknown' : 'None';
            Alert.alert('토큰 확인',
                `Access Token: ${accessToken ? '있음' : '없음'}\nRefresh Token: ${refreshToken ? '있음' : '없음'}\n토큰 내 이메일: ${emailInfo}`
            );
        } catch (error) {
            console.error('토큰 확인 실패:', error);
        }
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={styles.keyboardView}>
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" scrollEnabled={false}>
                    {/* 헤더 */}
                    <View style={styles.header}>
                        <Text style={styles.brand}>Tailing</Text>
                        <Text style={styles.subtitle}>반려동물 의료 모니터링 시스템</Text>
                    </View>

                    {/* 로그인 카드 */}
                    <View style={styles.card}>
                        <LabeledInput
                            label="이메일"
                            value={email}
                            onChangeText={setEmail}
                            placeholder="이메일을 입력하세요"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            error={email.length > 0 ? errors.email : undefined}
                        />
                        <LabeledInput
                            label="비밀번호"
                            value={pw}
                            onChangeText={setPw}
                            placeholder="비밀번호를 입력하세요"
                            secureTextEntry={!showPw}
                            rightAction={
                                <TouchableOpacity onPress={() => setShowPw(s => !s)} style={styles.eyeButton}>
                                    <Ionicons
                                        name={showPw ? "eye" : "eye-off"}
                                        size={20}
                                        color={COLORS.hint}
                                    />
                                </TouchableOpacity>
                            }
                            error={pw.length > 0 ? errors.pw : undefined}
                        />

                        <Pressable
                            onPress={onSignIn}
                            disabled={!isValid || loading}
                            style={({ pressed }) => [
                                styles.button,
                                (!isValid || loading) && { opacity: 0.5 },
                                pressed && { transform: [{ scale: 0.99 }] },
                            ]}
                        >
                            <Text style={styles.buttonText}>{loading ? '로그인 중...' : '로그인'}</Text>
                        </Pressable>

                        <TouchableOpacity onPress={onForgot} style={{ marginTop: 14 }}>
                            <Text style={[styles.linkCenter, { color: COLORS.primary, fontWeight: '700' }]}>
                                비밀번호를 잊으셨나요?
                            </Text>
                        </TouchableOpacity>

                        {/* 디버깅용 토큰 확인 버튼 */}
                        <TouchableOpacity onPress={checkStoredToken} style={{ marginTop: 10 }}>
                            <Text style={[styles.linkCenter, { color: COLORS.hint, fontSize: 12 }]}>
                                저장된 토큰 확인 (디버그용)
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* 하단 안내 */}
                    <Text style={styles.footerText}>
                        아직 계정이 없으신가요?{' '}
                        <Text
                            onPress={() => navigation?.navigate?.('Join')}
                            style={{ color: COLORS.primary, fontWeight: '700' }}
                        >
                            회원가입
                        </Text>
                    </Text>
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
    secureTextEntry?: boolean;
    rightAction?: React.ReactNode;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
}) {
    const { label, value, onChangeText, placeholder, error, secureTextEntry,
        rightAction, autoCapitalize, keyboardType } = props;

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
                />
                {rightAction ? <View style={styles.rightAction}>{rightAction}</View> : null}
            </View>
            {!!error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg
    },
    keyboardView: {
        flex: 1
    },
    scroll: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 40,
        minHeight: '100%'
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
        width: '100%'
    },
    logoHeart: {
        width: 40, height: 32, borderWidth: 3, borderColor: COLORS.primary,
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
        transform: [{ rotate: '45deg' }], marginBottom: 6,
    },
    brand: { fontSize: 28, fontWeight: '700', color: COLORS.text },
    subtitle: { marginTop: 6, fontSize: 14, color: '#475569' },
    card: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: COLORS.cardBg,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
    },
    inputLabel: { marginBottom: 8, color: COLORS.text, fontWeight: '600' },
    inputWrap: {
        position: 'relative', backgroundColor: '#fff', borderRadius: 28,
        borderWidth: 1, borderColor: '#EFE7E0', paddingHorizontal: 18, paddingVertical: 10,
    },
    input: { height: 44, fontSize: 16, color: COLORS.text },
    rightAction: { position: 'absolute', right: 14, top: 10, height: 44, justifyContent: 'center', alignItems: 'center' },
    eyeButton: {
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: { marginTop: 6, color: COLORS.error, fontSize: 12 },
    button: {
        marginTop: 10, backgroundColor: COLORS.primary, borderRadius: 28,
        height: 52, alignItems: 'center', justifyContent: 'center',
        shadowColor: '#F0663F', shadowOpacity: 0.25, shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 }, elevation: 2,
    },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
    linkCenter: { textAlign: 'center', fontSize: 15 },
    footerText: {
        marginTop: 24,
        textAlign: 'center',
        color: '#475569',
        fontSize: 14,
        width: '100%'
    },
});
