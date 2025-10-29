import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, Alert
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
    success: '#27AE60',
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

    return (
        <View style={styles.container}>
            {/* 통합 메뉴 섹션 */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>홍길동</Text>
                    <TouchableOpacity
                        onPress={onLogout}
                        disabled={loading}
                    >
                        <Text style={[
                            styles.logoutText,
                            loading && { opacity: 0.5 }
                        ]}>
                            {loading ? '로그아웃 중...' : '로그아웃'}
                        </Text>
                    </TouchableOpacity>
                </View>
                
                <View style={styles.menuContainer}>
                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuLeft}>
                            <View style={styles.menuIconContainer}>
                                <Ionicons name="person-outline" size={20} color={COLORS.primary} />
                            </View>
                            <Text style={styles.menuText}>프로필 수정</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={COLORS.hint} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuLeft}>
                            <View style={styles.menuIconContainer}>
                                <Ionicons name="key-outline" size={20} color={COLORS.primary} />
                            </View>
                            <Text style={styles.menuText}>비밀번호 변경</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={COLORS.hint} />
                    </TouchableOpacity>

                    {/* <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuLeft}>
                            <View style={styles.menuIconContainer}>
                                <Ionicons name="notifications-outline" size={20} color={COLORS.primary} />
                            </View>
                            <Text style={styles.menuText}>알림 설정</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={COLORS.hint} />
                    </TouchableOpacity> */}
                    
                    <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('PrivacyPolicy')}
                    >
                        <View style={styles.menuLeft}>
                            <View style={styles.menuIconContainer}>
                                <Ionicons name="shield-outline" size={20} color={COLORS.primary} />
                            </View>
                            <Text style={styles.menuText}>개인정보 처리방침</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={COLORS.hint} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('CustomerService')}
                    >
                        <View style={styles.menuLeft}>
                            <View style={styles.menuIconContainer}>
                                <Ionicons name="help-circle-outline" size={20} color={COLORS.primary} />
                            </View>
                            <Text style={styles.menuText}>고객센터</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={COLORS.hint} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    section: {
        backgroundColor: COLORS.cardBg,
        margin: 16,
        marginTop: 16,
        marginBottom: 16,
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
        flex: 1,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.error,
    },
    menuContainer: {
        flex: 1,
        justifyContent: 'space-evenly',
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flex: 1,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    menuIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F8F9FA',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    menuText: {
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '500',
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});