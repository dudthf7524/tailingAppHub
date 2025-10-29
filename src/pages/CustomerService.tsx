import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const COLORS = {
    primary: '#F0663F',
    bg: '#FAF6F2',
    text: '#333333',
    cardBg: '#FFFFFF',
    hint: '#7A7A7A',
    success: '#27AE60',
    error: '#E74C3C',
};

const CustomerService = ({ navigation }: any) => {
    const handleEmailPress = () => {
        Linking.openURL('mailto:support@tailing.com');
    };

    const handlePhonePress = () => {
        Linking.openURL('tel:1588-0000');
    };

    const menuItems = [
        {
            title: '이메일 문의',
            icon: 'mail-outline',
            description: 'support@tailing.com',
            onPress: handleEmailPress,
        },
        {
            title: '전화 문의',
            icon: 'call-outline',
            description: '1588-0000',
            onPress: handlePhonePress,
        },
        {
            title: '운영시간',
            icon: 'time-outline',
            description: '평일 09:00 ~ 18:00',
        },
        {
            title: '자주 묻는 질문',
            icon: 'help-circle-outline',
            description: 'FAQ',
        },
        {
            title: '공지사항',
            icon: 'notifications-outline',
            description: '최신 공지사항',
        },
        {
            title: '앱 버전',
            icon: 'information-circle-outline',
            description: '1.0.0',
        },
    ];

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.section}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.menuItem,
                                index === menuItems.length - 1 && styles.lastMenuItem
                            ]}
                            onPress={item.onPress}
                        >
                            <View style={styles.menuLeft}>
                                <View style={styles.menuIconContainer}>
                                    <Ionicons name={item.icon} size={22} color={COLORS.primary} />
                                </View>
                                <View style={styles.menuTextContainer}>
                                    <Text style={styles.menuTitle}>{item.title}</Text>
                                    <Text style={styles.menuDescription}>{item.description}</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.hint} />
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.section}>
                    <View style={styles.infoCard}>
                        <Text style={styles.infoTitle}>24시간 기술 지원</Text>
                        <Text style={styles.infoText}>
                            Tail링 앱의 기술적인 문제나 문의사항을 24시간 언제든지 문의하실 수 있습니다.
                        </Text>
                    </View>
                    <View style={styles.infoCard}>
                        <Text style={styles.infoTitle}>빠른 응답 보장</Text>
                        <Text style={styles.infoText}>
                            이메일 문의: 평균 2시간 이내 응답
                            {'\n'}전화 문의: 즉시 응답
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    scrollView: {
        flex: 1,
    },
    section: {
        paddingHorizontal: 16,
         marginBottom: 8,
         marginTop: 8
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.cardBg,
        padding: 16,
        borderRadius: 16,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    lastMenuItem: {
        marginBottom: 0,
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    menuIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F8F9FA',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    menuTextContainer: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    menuDescription: {
        fontSize: 14,
        color: COLORS.hint,
    },
    infoCard: {
        backgroundColor: COLORS.cardBg,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    infoTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: COLORS.hint,
        lineHeight: 20,
    },
});

export default CustomerService;

