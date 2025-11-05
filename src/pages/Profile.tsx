import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, Alert
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import { RootState } from '../store/reducer';
import { useAppDispatch } from '../store';
import api from '../constant/contants';
import EncryptedStorage from 'react-native-encrypted-storage';
import userSlice from '../slices/user';
import { useFocusEffect } from '@react-navigation/native';

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
    const dispatch = useAppDispatch();
    const accessToken = useSelector((state: RootState) => state.user.accessToken);
    const [userInfo, setUserInfo] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useFocusEffect(
        React.useCallback(() => {
            loadUserInfo();
        }, [])
    );

    const loadUserInfo = async () => {
        try {
            setLoading(true);
            const response = await api.get('/user/information', {
                headers: { authorization: `${accessToken}` },
            });
            console.log("response : ", response)
            if (response.data) {
                setUserInfo(response.data.data);
            }
        } catch (error) {
            console.error('사용자 정보 로드 실패:', error);
            Alert.alert('오류', '사용자 정보를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
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
                            // await removeToken();
                            // await AsyncStorage.removeItem('accessToken'); // 기존 accessToken도 삭제
                            await EncryptedStorage.removeItem('refreshToken');
                            dispatch(userSlice.actions.setUser({ id: '', email: '', accessToken: '' }));

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
        <ScrollView style={styles.container}>
            {/* 내 정보 섹션 */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>내 정보</Text>

                {/* 이메일 박스 */}
                <TouchableOpacity
                    style={styles.emailBox}
                    onPress={() => navigation.navigate('UserDetail', { userInfo })}
                >
                    <View style={styles.emailContent}>
                        <Ionicons name="person-circle-outline" size={40} color={COLORS.hint} />
                        <View style={styles.emailTextContainer}>
                            <Text style={styles.emailText}>
                                {userInfo?.email}
                            </Text>
                            <Text style={styles.emailSubText}>내 정보 보기</Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.hint} />
                </TouchableOpacity>
            </View>

            {/* 메뉴 섹션 */}
            <View style={styles.section}>
                <View style={styles.menuContainer}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('HubNameEdit')}
                    >
                        <View style={styles.menuLeft}>
                            <View style={styles.menuIconContainer}>
                                <Ionicons name="hardware-chip-outline" size={20} color={COLORS.primary} />
                            </View>
                            <Text style={styles.menuText}>허브 이름 변경</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={COLORS.hint} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('DeviceNameEdit')}
                    >
                        <View style={styles.menuLeft}>
                            <View style={styles.menuIconContainer}>
                                <Ionicons name="watch-outline" size={20} color={COLORS.primary} />
                            </View>
                            <Text style={styles.menuText}>디바이스 이름 변경</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={COLORS.hint} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('DevicePetConnection')}
                    >
                        <View style={styles.menuLeft}>
                            <View style={styles.menuIconContainer}>
                                <Ionicons name="link-outline" size={20} color={COLORS.primary} />
                            </View>
                            <Text style={styles.menuText}>디바이스 펫 연결 변경</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={COLORS.hint} />
                    </TouchableOpacity>

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
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    section: {
        backgroundColor: COLORS.cardBg,
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 16,
    },
    emailBox: {
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    emailContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    emailTextContainer: {
        marginLeft: 12,
        flex: 1,
    },
    emailText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    emailSubText: {
        fontSize: 14,
        color: COLORS.hint,
    },
    menuContainer: {
        gap: 0,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
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
});