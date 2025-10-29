import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
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

const PrivacyPolicy = ({ navigation }: any) => {
    const sections = [
        {
            title: '1. 개인정보의 처리 목적',
            content: `Tail링("https://www.tailing.com" 이하 "Tail링")은 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.

① 홈페이지 회원 가입 및 관리
회원 가입 의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지 등을 목적으로 개인정보를 처리합니다.

② 민원사무 처리
민원인의 신원 확인, 민원사항 확인, 사실조사를 위한 연락·통지, 처리결과 통보 목적으로 개인정보를 처리합니다.`,
        },
        {
            title: '2. 개인정보의 처리 및 보유기간',
            content: `① Tail링은 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.

② 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다.

- 회원 가입 및 관리: 회원 가입일로부터 회원 탈퇴 시까지`,
        },
        {
            title: '3. 정보주체의 권리·의무 및 행사방법',
            content: `정보주체는 다음과 같은 권리를 행사할 수 있습니다.
- 개인정보 열람 요구
- 개인정보 정정 및 삭제 요구
- 개인정보 처리 정지 요구`,
        },
        {
            title: '4. 처리하는 개인정보 항목',
            content: `Tail링은 다음의 개인정보 항목을 처리하고 있습니다.

① 홈페이지 회원 가입 및 관리
- 필수항목: 이메일, 비밀번호, 이름
- 선택항목: 전화번호

② 디바이스 관련
- 필수항목: 디바이스 MAC 주소, 펫 정보
- 선택항목: 디바이스 별칭`,
        },
        {
            title: '5. 개인정보의 파기',
            content: `① Tail링은 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.

② 개인정보 파기의 절차 및 방법은 다음과 같습니다.
- 파기절차: 불필요한 개인정보 및 개인정보파일은 내부 방침 및 기타 관련 법령에 따라 파기
- 파기방법: 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용

③ 전자적 파일 형태의 개인정보는 기록을 재생할 수 없는 기술적 방법을 사용합니다.`,
        },
        {
            title: '6. 개인정보의 안전성 확보 조치',
            content: `Tail링은 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.
- 관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육 등
- 기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화
- 물리적 조치: 전산실, 자료보관실 등의 접근통제`,
        },
        {
            title: '7. 개인정보 보호책임자',
            content: `① Tail링은 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.

개인정보 보호책임자
- 성명: 홍길동
- 직책: 대표
- 연락처: privacy@tailing.com`,
        },
        {
            title: '8. 개인정보 처리방침 변경',
            content: `이 개인정보처리방침은 2024년 1월 1일부터 적용됩니다.`,
        },
    ];

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.contentContainer}>
                    {sections.map((section, index) => (
                        <View key={index} style={styles.section}>
                            <Text style={styles.sectionTitle}>{section.title}</Text>
                            <Text style={styles.sectionContent}>{section.content}</Text>
                        </View>
                    ))}
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
    contentContainer: {
        padding: 16,
    },
    section: {
        backgroundColor: COLORS.cardBg,
        padding: 20,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 12,
        lineHeight: 24,
    },
    sectionContent: {
        fontSize: 14,
        color: COLORS.text,
        lineHeight: 22,
    },
});

export default PrivacyPolicy;

