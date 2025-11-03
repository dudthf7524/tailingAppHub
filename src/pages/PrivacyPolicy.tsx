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
            title: '1. 수집하는 개인정보 항목',
            content: `- 필수항목 : 기관명, 기관 주소, 아이디, 비밀번호, 담당자 이메일, 담당자 연락처

- 동물 등록 정보 (필수): 환자명, 생년월일, 체중, 성별, 종, 품종, 중성화 여부, 진단명

- 선택항목: 입원일자, 주치의, 과거병력`,
        },
        {
            title: '2. 수집 및 이용 목적',
            content: `- Tailing 디바이스 기반 Talktail 솔루션의 안내 및 기능 업데이트

- 기관 맞춤형 마케팅 및 프로모션 정보 제공

- 기술 지원 및 서비스 개선을 위한 통계 분석

- 제품 연구 개발을 위한 비식별화된 데이터 활용`,
        },
        {
            title: '3. 보유 및 이용 기간',
            content: `- 회원 탈퇴 또는 동의 철회 시까지 보유

- 단, 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보유`,
        },
        {
            title: '4. 동의 거부 시 불이익 안내',
            content: `- 동의를 거부하셔도 서비스 이용에는 제한이 없으며, 마케팅 및 프로모션 정보 제공이 제한됩니다.`,
        },
        {
            title: '5. 추가 고지: 상세 개인정보 처리방침',
            content: `1. 수집하는 개인정보 항목

- 회원가입 시 필수: 디바이스 코드, 기관명, 기관 주소, 아이디, 비밀번호, 담당자 이메일, 담당자 연락처

- 반려동물 등록 시 필수: 환자명, 생년월일, 체중, 성별, 종, 품종, 중성화 여부, 진단명

- 선택항목: 입원일자, 주치의, 과거병력

2. 개인정보 수집 및 이용 목적

- 사용자 인증 및 기기 연동을 통한 서비스 제공

- 환자 생체신호 기반 건강 분석 및 리포트 생성

- 기술 지원, 고객 상담, 문제 해결

- 법적 의무 이행 및 통계 활용

3. 보유 및 이용 기간

- 회원 탈퇴 시까지 또는 관련 법령에 따라 보존

4. 제3자 제공

- 법령에 따라 수사기관 등의 요청이 있을 경우에 한해 제공

5. 이용자의 권리

- 열람, 정정, 삭제, 처리정지 요청 가능

- 요청은 talktail@creamoff.co.kr 로 접수

6. 개인정보 보호책임자

- 이름: 권도혁

- 직위: 대표자

- 이메일: talktail@creamoff.co.kr`,
        },
        {
            title: '6. 서비스 약관 안내 (요약)',
            content: `1. 서비스 개요

- Talktail은 Tailing 디바이스를 기반으로 반려동물의 IR, RED, SpO₂, 심박수, 체온 등의 생체 데이터를 측정 및 분석하여 동물병원 및 관련 기관에 건강 리포트를 제공하는 모니터링 솔루션입니다.

2. 서비스 이용 대상

- 동물병원, 수의과 대학, 연구기관 등 등록된 기관 사용자

3. 회원의 의무

- 기관 및 환자 정보를 정확히 입력

- 시스템 무단 접근, 정보 조작, 허위 등록 등 금지

- 법령 및 본 약관 준수

4. 제공 서비스

- 디바이스 연동 데이터 측정 및 분석 리포트

- 환자 건강 이력 관리 기능

- 기관 전용 기술지원, 통계 기능 제공

5. 서비스 이용 제한

- 본 약관 위반 또는 부정 행위 발생 시

- 법령 위반, 계정 도용, 비인가 기기 사용 등

6. 면책 조항

- 천재지변, 네트워크 장애 등 불가항력 사유

- 사용자 과실에 의한 서비스 장애

7. 분쟁 해결

- 본 약관에 따른 분쟁은 원칙적으로 상호 협의로 해결합니다.

- 협의가 이루어지지 않을 경우 대구지방법원 경산시법원을 관할 법원으로 합니다.`,
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
        // borderRadius: 16,
        marginBottom: 12,
        // shadowColor: '#000',
        // shadowOpacity: 0.06,
        // shadowRadius: 8,
        // shadowOffset: { width: 0, height: 2 },
        // elevation: 2,
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

