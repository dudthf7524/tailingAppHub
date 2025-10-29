import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { RouteProp, useRoute } from '@react-navigation/native';
import api from '../constant/contants';
import { useSelector } from 'react-redux';
import { RootState } from '../store/reducer';
import { useEffect, useMemo, useState } from 'react';

const COLORS = {
    primary: '#F0663F',
    bg: '#FAF6F2',
    text: '#333333',
    cardBg: '#FFFFFF',
    hint: '#7A7A7A',
    success: '#27AE60',
    error: '#E74C3C',
};

type PetDetailParams = {
    PetDetail: {
        id: string;
        name: string;
        species: string;
        breed: string;
        birthDate: string;
        weight: number;
        gender: string;
        description?: string;
        createdAt: string;
    };
};

export default function PetDetail() {
    const route = useRoute<RouteProp<PetDetailParams, 'PetDetail'>>();
    const accessToken = useSelector((state: RootState) => state.user.accessToken);
    const initialPet = route.params;
    const petId = (initialPet as any)?.id;

    const [pet, setPet] = useState(initialPet as any);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const canFetch = useMemo(() => !!accessToken && !!petId, [accessToken, petId]);

    useEffect(() => {
        const fetchDetail = async () => {
            if (!canFetch) return;
            try {
                setIsLoading(true);
                // GET /pet/detail?id={petId}
                const res = await api.get('/pet/detail', {
                    params: { id: petId },
                    headers: { authorization: `${accessToken}` },
                });
                console.log("✅ res: ", res.data.data);
                console.log("✅ res: ", res.data);

                if (res?.data?.data) {
                    setPet(res.data.data);
                }
            } catch (e) {
                // 네트워크 오류 시 initialPet 유지
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetail();
    }, [canFetch, accessToken, petId]);

    const getSpeciesLabel = (species: string) => {
        switch (species) {
            case 'dog':
                return '개';
            case 'cat':
                return '고양이';
            case 'other':
                return '기타';
            default:
                return '기타';
        }
    };

    const getGenderLabel = (gender: string) => {
        switch (gender) {
            case 'male':
                return '수컷';
            case 'female':
                return '암컷';
            default:
                return '알 수 없음';
        }
    };

    const getNeuteringLabel = (neutering: string) => {
        switch (neutering) {
            case 'sterilized':
                return '중성화함';
            case 'intact':
                return '중성화안함';
            default:
                return '미입력';
        }
    };

    const calculateAge = (birthDate: string) => {
        try {
            const birth = new Date(birthDate);
            const today = new Date();
            if (isNaN(birth.getTime())) return '알 수 없음';
            const yearDiff = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            const dayDiff = today.getDate() - birth.getDate();
            let totalMonths = yearDiff * 12 + monthDiff;
            if (dayDiff < 0) totalMonths -= 1;
            if (totalMonths < 12) {
                if (totalMonths <= 0) return '신생아';
                return `${totalMonths}개월`;
            }
            const years = Math.floor(totalMonths / 12);
            const remainingMonths = totalMonths % 12;
            return remainingMonths === 0 ? `${years}세` : `${years}세 ${remainingMonths}개월`;
        } catch {
            return '알 수 없음';
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.card}>
                    {/* 상단 카드 헤더 - 등록 페이지와 톤 맞춤 */}
                    <View style={styles.headerRow}>
                        <View style={styles.petIconContainer}>
                            <Ionicons name="paw" size={28} color={COLORS.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.title}>{pet?.name || '미입력'}</Text>
                            <Text style={styles.subtitle}>
                                {getSpeciesLabel(pet?.species || '')} • {getGenderLabel(pet?.gender || '')} • {calculateAge(pet?.birthDate || '')}
                            </Text>
                        </View>
                    </View>

                    {/* 구분선 */}
                    <View style={styles.sectionDivider} />

                    {/* 기본 정보 - 입력 대신 박스 표현 */}
                    <Text style={styles.sectionTitle}>{isLoading ? '기본 정보 (불러오는 중...)' : '기본 정보'}</Text>

                    <LabeledBox label="품종" value={pet?.breed || '미입력'} />

                    <View style={styles.row2}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <LabeledBox label="체중(kg)" value={pet?.weight ? String(pet.weight) : '미입력'} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                            <LabeledBox label="성별" value={getGenderLabel(pet?.gender || '')} />
                        </View>
                    </View>

                    <LabeledBox label="중성화" value={getNeuteringLabel(pet?.neutering || '')} />

                    <View style={styles.row2}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <LabeledBox label="생년월일" value={pet?.birthDate ? new Date(pet.birthDate).toLocaleDateString('ko-KR') : '미입력'} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                            <LabeledBox label="등록일" value={pet?.createdAt ? new Date(pet.createdAt).toLocaleDateString('ko-KR') : '미입력'} />
                        </View>
                    </View>

                    {/* 구분선 */}
                    <View style={styles.sectionDivider} />

                    {/* 의료 정보 섹션 */}
                    <View style={{ marginTop: 8 }}>
                        <Text style={styles.sectionTitle}>의료 정보</Text>
                        <LabeledBox label="입원일" value={pet?.admissionDate ? new Date(pet.admissionDate).toLocaleDateString('ko-KR') : '미입력'} />
                        <LabeledBox label="주치의" value={pet?.veterinarian || '미입력'} />
                        <LabeledBox label="진단명" value={pet?.diagnosis || '미입력'} />
                        {pet?.medicalHistory ? (
                            <View style={{ marginTop: 8 }}>
                                <Text style={styles.inputLabel}>과거병력</Text>
                                <View style={[styles.inputWrap, { paddingVertical: 14 }]}>
                                    <Text style={[styles.valueText, { lineHeight: 20 }]}>{pet.medicalHistory}</Text>
                                </View>
                            </View>
                        ) : null}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    scroll: { padding: 16, paddingBottom: 32 },
    card: {
        backgroundColor: COLORS.cardBg,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    petIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    title: { fontSize: 22, fontWeight: '700', color: COLORS.text },
    subtitle: { marginTop: 4, fontSize: 13, color: COLORS.hint },
    sectionDivider: { height: 1, backgroundColor: '#EFE7E0', marginVertical: 20 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginBottom: 16 },
    row2: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    inputLabel: { marginBottom: 8, color: COLORS.text, fontWeight: '600' },
    inputWrap: {
        position: 'relative', backgroundColor: '#fff', borderRadius: 28,
        borderWidth: 1, borderColor: '#EFE7E0', paddingHorizontal: 18, paddingVertical: 10,
    },
    valueText: { fontSize: 16, color: COLORS.text },
});

function LabeledBox({ label, value }: { label: string; value: string }) {
    return (
        <View style={{ marginBottom: 16 }}>
            <Text style={styles.inputLabel}>{label}</Text>
            <View style={styles.inputWrap}>
                <Text style={styles.valueText}>{value}</Text>
            </View>
        </View>
    );
}


