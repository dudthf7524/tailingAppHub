// SignInScreen.tsx (한글 버전)
import React, { useMemo, useState } from 'react';
import {
    View, Text, TextInput, StyleSheet, TouchableOpacity,
    Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../constant/contants';
import Ionicons from 'react-native-vector-icons/Ionicons';
import userSlice from '../slices/user';
import { useAppDispatch } from '../store';
import EncryptedStorage from 'react-native-encrypted-storage';

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
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const dispatch = useAppDispatch();

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    const errors = useMemo(() => {
        const e: any = {};
        if (!emailRegex.test(email)) e.email = '올바른 이메일을 입력하세요.';
        if (password.length < 8) e.pw = '비밀번호는 8자 이상이어야 합니다.';
        return e;
    }, [email, password]);

    const isValid = Object.keys(errors).length === 0;

    const onSignIn = async () => {
        if (!isValid) {
            Alert.alert('확인', '입력값을 다시 확인해주세요.');
            return;
        }
        try {
            setLoading(true);
            console.log("email", email)
            console.log("password", password)
            // 실제 로그인 API 호출
            const response = await api.post('/user/login', {
                email: email,
                password: password
            });
            console.log(response)

            if (response.status === 401) {
                Alert.alert('로그인 실패', response.data.message);
            } else if (response.status === 402) {
                Alert.alert('로그인 실패', response.data.message);
            } else if (response.status === 200) {

                dispatch(
                    userSlice.actions.setUser({
                        email: response.data.data.email,
                        accessToken: response.data.data.accessToken,
                    }),
                );

                await EncryptedStorage.setItem(
                    'refreshToken',
                    response.data.data.refreshToken,
                );

                Alert.alert('로그인 성공', '환영합니다!');
            }
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
                        <Text style={styles.brand}>Talktail</Text>
                        <Text style={styles.subtitle}>환축모니터링 솔루션</Text>
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
                            value={password}
                            onChangeText={setPassword}
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
                            error={password.length > 0 ? errors.password : undefined}
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

                        {/* <TouchableOpacity onPress={onForgot} style={{ marginTop: 14 }}>
                            <Text style={[styles.linkCenter, { color: COLORS.primary, fontWeight: '700' }]}>
                                비밀번호를 잊으셨나요?
                            </Text>
                        </TouchableOpacity> */}

                        {/* 디버깅용 토큰 확인 버튼 */}
                        {/* <TouchableOpacity onPress={checkStoredToken} style={{ marginTop: 10 }}>
                            <Text style={[styles.linkCenter, { color: COLORS.hint, fontSize: 12 }]}>
                                저장된 토큰 확인 (디버그용)
                            </Text>
                        </TouchableOpacity> */}
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
        backgroundColor: COLORS.cardBg
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
 
    brand: { fontSize: 28, fontWeight: '700', color: COLORS.text },
    subtitle: { marginTop: 6, fontSize: 14, color: '#475569' },
    card: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: COLORS.cardBg,
        borderRadius: 16,
        padding: 20,
    },
    inputLabel: { marginBottom: 8, color: COLORS.text, fontWeight: '600' },
    inputWrap: {
        position: 'relative', backgroundColor: '#fff', borderRadius: 10,
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
