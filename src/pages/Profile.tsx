import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    KeyboardAvoidingView, Platform, ScrollView, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { removeToken } from '../utils/token';

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

export default function Profile({ navigation }: any) {
    const [userInfo, setUserInfo] = useState({
        email: '',
        orgName: '',
        phone: '',
        joinDate: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadUserInfo();
    }, []);

    const loadUserInfo = async () => {
        try {
            const token = await AsyncStorage.getItem('accessToken');
            if (token) {
                const decodedToken = decodeJWT(token);
                const email = decodedToken?.email || decodedToken?.org_email || 'Unknown';
                
                // 실제로는 API에서 사용자 정보를 가져와야 하지만, 
                // 현재는 토큰에서 추출한 정보를 사용
                setUserInfo({
                    email: email,
                    orgName: '조이동물의료센터', // 실제로는 API에서 가져와야 함
                    phone: '010-1234-5678', // 실제로는 API에서 가져와야 함
                    joinDate: '2024-01-15' // 실제로는 API에서 가져와야 함
                });
            }
        } catch (error) {
            console.error('사용자 정보 로드 실패:', error);
        }
    };

    const onLogout = async () => {
        // try{

        // }catch(error){}
        Alert.alert(
            '로그아웃',
            '정말 로그아웃하시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '로그아웃',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            // AsyncStorage에서 토큰 삭제
                            await removeToken();
                            await AsyncStorage.removeItem('accessToken'); // 기존 accessToken도 삭제
                            
                            console.log('로그아웃 완료');
                            
                            Alert.alert('로그아웃 완료', '다시 로그인해주세요.', [
                                {
                                    text: '확인',
                                    onPress: () => {
                                        // 앱을 완전히 새로고침하는 방법 (로그인과 동일)
                                        if (__DEV__) {
                                            const DevSettings = require('react-native').DevSettings;
                                            DevSettings.reload();
                                        } else {
                                            // 프로덕션에서는 navigation을 통해 앱 상태 변경 알림
                                            // 실제로는 최상위 App 컴포넌트의 상태가 변경되어야 함
                                            // 현재는 앱 재시작으로 해결
                                            navigation.reset({
                                                index: 0,
                                                routes: [{ name: '로그인' }],
                                            });
                                        }
                                    }
                                }
                            ]);
                        } catch (error) {
                            console.error('로그아웃 실패:', error);
                            Alert.alert('오류', '로그아웃 중 오류가 발생했습니다.');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const InfoRow = ({ label, value, icon }: { label: string; value: string; icon: string }) => (
        <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
                <Ionicons name={icon as any} size={20} color={COLORS.primary} />
                <Text style={styles.infoLabel}>{label}</Text>
            </View>
            <Text style={styles.infoValue}>{value}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={styles.keyboardView}>
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    {/* 헤더 */}
                    <View style={styles.header}>
                        <View style={styles.profileIcon}>
                            <Ionicons name="person" size={40} color={COLORS.primary} />
                        </View>
                        <Text style={styles.brand}>내 정보</Text>
                        <Text style={styles.subtitle}>사용자 정보 및 설정</Text>
                    </View>

                    {/* 사용자 정보 카드 */}
                    <View style={styles.card}>
                        <InfoRow label="이메일" value={userInfo.email} icon="mail" />
                        <InfoRow label="기관명" value={userInfo.orgName} icon="business" />
                        <InfoRow label="전화번호" value={userInfo.phone} icon="call" />
                        <InfoRow label="가입일" value={userInfo.joinDate} icon="calendar" />
                    </View>

                    {/* 로그아웃 버튼 */}
                    <TouchableOpacity
                        onPress={onLogout}
                        disabled={loading}
                        style={[
                            styles.logoutButton,
                            loading && { opacity: 0.5 }
                        ]}
                    >
                        <Ionicons name="log-out" size={20} color="#fff" style={styles.buttonIcon} />
                        <Text style={styles.logoutButtonText}>
                            {loading ? '로그아웃 중...' : '로그아웃'}
                        </Text>
                    </TouchableOpacity>

                    {/* 추가 설정 메뉴들 (선택사항) */}
                    <View style={styles.menuContainer}>
                        <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('알림', '준비 중인 기능입니다.')}>
                            <View style={styles.menuLeft}>
                                <Ionicons name="notifications" size={20} color={COLORS.hint} />
                                <Text style={styles.menuText}>알림 설정</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.hint} />
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('알림', '준비 중인 기능입니다.')}>
                            <View style={styles.menuLeft}>
                                <Ionicons name="help-circle" size={20} color={COLORS.hint} />
                                <Text style={styles.menuText}>도움말</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.hint} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('알림', '준비 중인 기능입니다.')}>
                            <View style={styles.menuLeft}>
                                <Ionicons name="information-circle" size={20} color={COLORS.hint} />
                                <Text style={styles.menuText}>앱 정보</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.hint} />
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
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
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
        width: '100%'
    },
    profileIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.cardBg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    brand: { 
        fontSize: 28, 
        fontWeight: '700', 
        color: COLORS.text,
        marginBottom: 4
    },
    subtitle: { 
        fontSize: 14, 
        color: '#475569' 
    },
    card: {
        width: '100%',
        backgroundColor: COLORS.cardBg,
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    infoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    infoLabel: {
        marginLeft: 12,
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    infoValue: {
        fontSize: 16,
        color: COLORS.hint,
        textAlign: 'right',
    },
    logoutButton: {
        backgroundColor: COLORS.error,
        borderRadius: 28,
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        shadowColor: COLORS.error,
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
        elevation: 2,
    },
    buttonIcon: {
        marginRight: 8,
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700'
    },
    menuContainer: {
        backgroundColor: COLORS.cardBg,
        borderRadius: 16,
        padding: 8,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderRadius: 12,
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    menuText: {
        marginLeft: 12,
        fontSize: 16,
        color: COLORS.text,
    },
});