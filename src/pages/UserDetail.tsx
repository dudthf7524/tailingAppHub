import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, Pressable
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import EncryptedStorage from 'react-native-encrypted-storage';
import { useAppDispatch } from '../store';
import { useSelector } from 'react-redux';
import { RootState } from '../store/reducer';
import userSlice from '../slices/user';
import api from '../constant/contants';

const COLORS = {
    primary: '#F0663F',
    bg: '#FAF6F2',
    text: '#333333',
    cardBg: '#FFFFFF',
    hint: '#7A7A7A',
    success: '#27AE60',
    error: '#E74C3C',
};

export default function UserDetail({ navigation, route }: any) {
    const dispatch = useAppDispatch();
    const accessToken = useSelector((state: RootState) => state.user.accessToken);
    const receivedUserInfo = route.params?.userInfo;
    const [userInfo, setUserInfo] = useState({
        name: '',
        email: '',
        orgName: '',
        phone: '',
        postcode: '',
        address: '',
        detailAddress: '',
        createdAt: '',
        updatedAt: '',
    });
    const [loading, setLoading] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    const [passwordSubmitting, setPasswordSubmitting] = useState(false);

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}:${seconds}`;
    };

    useEffect(() => {
        if (receivedUserInfo) {
            setUserInfo({
                name: receivedUserInfo.name || '사용자',
                email: receivedUserInfo.email || receivedUserInfo.org_email || '',
                orgName: receivedUserInfo.orgName || receivedUserInfo.name || '',
                phone: receivedUserInfo.phone || '',
                postcode: receivedUserInfo.postcode || '',
                address: receivedUserInfo.address || '',
                detailAddress: receivedUserInfo.detail_address || '',
                createdAt: receivedUserInfo.createdAt || '',
                updatedAt: receivedUserInfo.updatedAt || '',
            });
        }
    }, [receivedUserInfo]);

    const onChangePassword = async () => {
        // 유효성 검사
        if (!passwordForm.currentPassword.trim()) {
            Alert.alert('확인', '현재 비밀번호를 입력하세요.');
            return;
        }
        if (!passwordForm.newPassword.trim()) {
            Alert.alert('확인', '새 비밀번호를 입력하세요.');
            return;
        }
        if (passwordForm.newPassword.length < 8) {
            Alert.alert('확인', '새 비밀번호는 8자 이상이어야 합니다.');
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            Alert.alert('확인', '새 비밀번호가 일치하지 않습니다.');
            return;
        }

        try {
            setPasswordSubmitting(true);
            const result = await api.post('/user/change/password', {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            }, {
                headers: { authorization: `${accessToken}` },
            });

            if (result.status === 401) {
                Alert.alert('변경 실패', result.data.message, [
                    {
                        text: '확인',
                        onPress: () => {
                            setShowPasswordModal(false);
                            setPasswordForm({
                                currentPassword: '',
                                newPassword: '',
                                confirmPassword: '',
                            });
                        },
                    },
                ]);
            }

            Alert.alert('변경 완료', '비밀번호가 변경되었습니다. 다시 로그인해주세요.', [
                {
                    text: '확인',
                    onPress: async () => {
                        setShowPasswordModal(false);
                        setPasswordForm({
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: '',
                        });

                        // 자동 로그아웃 처리
                        try {
                            await EncryptedStorage.removeItem('refreshToken');
                            dispatch(userSlice.actions.setUser({ id: '', email: '', accessToken: '' }));

                            if (__DEV__) {
                                const DevSettings = require('react-native').DevSettings;
                                DevSettings.reload();
                            } else {
                                navigation.reset({
                                    index: 0,
                                    routes: [{ name: '로그인' }],
                                });
                            }
                        } catch (error) {
                            console.error('로그아웃 처리 실패:', error);
                        }
                    },
                },
            ]);
        } catch (e: any) {
            console.error('비밀번호 변경 오류:', e);
            Alert.alert('오류', e?.response?.data?.message || e?.message || '비밀번호 변경에 실패했습니다.');
        } finally {
            setPasswordSubmitting(false);
        }
    };

    const onLogout = async () => {
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
                            await EncryptedStorage.removeItem('refreshToken');
                            dispatch(userSlice.actions.setUser({ id: '', email: '', accessToken: '' }));

                            console.log('로그아웃 완료');

                            Alert.alert('로그아웃 완료', '다시 로그인해주세요.', [
                                {
                                    text: '확인',
                                    onPress: () => {
                                        if (__DEV__) {
                                            const DevSettings = require('react-native').DevSettings;
                                            DevSettings.reload();
                                        } else {
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
            {/* 사용자 정보 섹션 */}
            <View style={styles.section}>
                {/* 이름 헤더 - 수정 버튼 포함 */}
                <View style={styles.headerRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.infoLabel}>이름</Text>
                        <Text style={styles.infoValue}>{userInfo.name}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => navigation.navigate('ProfileEdit', { userInfo })}
                    >
                        <Ionicons name="create-outline" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>이메일</Text>
                    <Text style={styles.infoValue}>{userInfo.email}</Text>
                </View>

                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>기관명</Text>
                    <Text style={styles.infoValue}>{userInfo.orgName}</Text>
                </View>

                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>휴대전화</Text>
                    <Text style={styles.infoValue}>{userInfo.phone}</Text>
                </View>

                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>우편번호</Text>
                    <Text style={styles.infoValue}>{userInfo.postcode}</Text>
                </View>

                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>주소</Text>
                    <Text style={styles.infoValue}>{userInfo.address}</Text>
                </View>

                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>상세주소</Text>
                    <Text style={styles.infoValue}>{userInfo.detailAddress}</Text>
                </View>

                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>가입일</Text>
                    <Text style={styles.infoValue}>{formatDate(userInfo.createdAt)}</Text>
                </View>

                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>최종수정일</Text>
                    <Text style={styles.infoValue}>{formatDate(userInfo.updatedAt)}</Text>
                </View>
            </View>

            {/* 비밀번호 변경 버튼 */}
            <View style={styles.section}>
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => setShowPasswordModal(true)}
                >
                    <View style={styles.menuLeft}>
                        <View style={styles.menuIconContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color={COLORS.text} />
                        </View>
                        <Text style={styles.menuText}>비밀번호 변경</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.hint} />
                </TouchableOpacity>
            </View>

            {/* 로그아웃 버튼 */}
            <View style={styles.section}>
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={onLogout}
                    disabled={loading}
                >
                    <View style={styles.menuLeft}>
                        <View style={styles.menuIconContainer}>
                            <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
                        </View>
                        <Text style={[styles.menuText, { color: COLORS.error }]}>
                            {loading ? '로그아웃 중...' : '로그아웃'}
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.hint} />
                </TouchableOpacity>
            </View>

            {/* 비밀번호 변경 모달 */}
            <Modal
                visible={showPasswordModal}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <KeyboardAvoidingView
                    behavior={Platform.select({ ios: 'padding', android: undefined })}
                    style={{ flex: 1 }}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => {
                                setShowPasswordModal(false);
                                setPasswordForm({
                                    currentPassword: '',
                                    newPassword: '',
                                    confirmPassword: '',
                                });
                            }}>
                                <Text style={styles.modalCloseButton}>닫기</Text>
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>비밀번호 변경</Text>
                            <View style={{ width: 40 }} />
                        </View>
                        <ScrollView
                            contentContainerStyle={styles.modalScrollContent}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View style={styles.modalCard}>
                                {/* 현재 비밀번호 */}
                                <View style={{ marginBottom: 16 }}>
                                    <Text style={styles.inputLabel}>현재 비밀번호</Text>
                                    <View style={styles.inputWrap}>
                                        <TextInput
                                            style={styles.input}
                                            value={passwordForm.currentPassword}
                                            onChangeText={(v) => setPasswordForm(prev => ({ ...prev, currentPassword: v }))}
                                            placeholder="현재 비밀번호를 입력하세요"
                                            placeholderTextColor={COLORS.hint}
                                            secureTextEntry={!showCurrentPw}
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                        />
                                        <View style={styles.rightAction} pointerEvents="box-none">
                                            <TouchableOpacity onPress={() => setShowCurrentPw(s => !s)}>
                                                <Text style={styles.eye}>{showCurrentPw ? 'Hide' : 'Show'}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>

                                {/* 새 비밀번호 */}
                                <View style={{ marginBottom: 16 }}>
                                    <Text style={styles.inputLabel}>새 비밀번호</Text>
                                    <View style={styles.inputWrap}>
                                        <TextInput
                                            style={styles.input}
                                            value={passwordForm.newPassword}
                                            onChangeText={(v) => setPasswordForm(prev => ({ ...prev, newPassword: v }))}
                                            placeholder="8자 이상"
                                            placeholderTextColor={COLORS.hint}
                                            secureTextEntry={!showNewPw}
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                        />
                                        <View style={styles.rightAction} pointerEvents="box-none">
                                            <TouchableOpacity onPress={() => setShowNewPw(s => !s)}>
                                                <Text style={styles.eye}>{showNewPw ? 'Hide' : 'Show'}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>

                                {/* 새 비밀번호 확인 */}
                                <View style={{ marginBottom: 16 }}>
                                    <Text style={styles.inputLabel}>새 비밀번호 확인</Text>
                                    <View style={styles.inputWrap}>
                                        <TextInput
                                            style={styles.input}
                                            value={passwordForm.confirmPassword}
                                            onChangeText={(v) => setPasswordForm(prev => ({ ...prev, confirmPassword: v }))}
                                            placeholder="비밀번호 재입력"
                                            placeholderTextColor={COLORS.hint}
                                            secureTextEntry={!showConfirmPw}
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                        />
                                        <View style={styles.rightAction} pointerEvents="box-none">
                                            <TouchableOpacity onPress={() => setShowConfirmPw(s => !s)}>
                                                <Text style={styles.eye}>{showConfirmPw ? 'Hide' : 'Show'}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>

                                <Pressable
                                    onPress={onChangePassword}
                                    disabled={passwordSubmitting}
                                    style={({ pressed }) => [
                                        styles.modalButton,
                                        passwordSubmitting && { opacity: 0.5 },
                                        pressed && { transform: [{ scale: 0.99 }] },
                                    ]}
                                >
                                    <Text style={styles.modalButtonText}>
                                        {passwordSubmitting ? '처리 중...' : '변경하기'}
                                    </Text>
                                </Pressable>
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
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
        borderRadius: 12,
    },
    infoItem: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    infoLabel: {
        fontSize: 14,
        color: COLORS.hint,
        marginBottom: 8,
    },
    infoValue: {
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '500',
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
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
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    editButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    // 모달 스타일
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    modalCloseButton: {
        fontSize: 16,
        color: COLORS.primary,
        fontWeight: '600',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    modalScrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    modalCard: {
        borderRadius: 16,
        padding: 20,
    },
    inputLabel: {
        marginBottom: 8,
        color: COLORS.text,
        fontWeight: '600',
        fontSize: 14,
    },
    inputWrap: {
        position: 'relative',
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#EFE7E0',
        paddingHorizontal: 18,
        paddingVertical: 10,
    },
    input: {
        height: 44,
        fontSize: 16,
        color: COLORS.text,
        paddingRight: 80,
        flex: 1,
    },
    rightAction: {
        position: 'absolute',
        right: 14,
        top: 10,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    eye: {
        fontSize: 14,
        color: COLORS.hint,
        fontWeight: '600',
    },
    modalButton: {
        marginTop: 10,
        backgroundColor: COLORS.primary,
        borderRadius: 28,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#F0663F',
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
        elevation: 2,
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
});
