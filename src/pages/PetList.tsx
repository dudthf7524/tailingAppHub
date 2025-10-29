import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
    RefreshControl, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import api from '../constant/contants';
import { RootState } from '../store/reducer';
import { useSelector } from 'react-redux';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../AppInner';

const COLORS = {
    primary: '#F0663F',
    bg: '#FAF6F2',
    text: '#333333',
    cardBg: '#FFFFFF',
    hint: '#7A7A7A',
    success: '#27AE60',
    error: '#E74C3C',
};

interface Pet {
    id: string;
    name: string;
    species: string;
    breed: string;
    birthDate: string;
    weight: number;
    gender: string;
    description?: string;
    createdAt: string;
}

type Nav = NativeStackNavigationProp<RootStackParamList, 'PetRegistration'>;

export default function PetList() {
    const accessToken = useSelector((state: RootState) => state.user.accessToken);
    const [pets, setPets] = useState<Pet[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation<Nav>();

    const fetchPets = useCallback(async () => {
        if (!accessToken) return;

        try {
            setIsLoading(true);
            const response = await api.get('/pet/list', {
                headers: { authorization: `${accessToken}` },
            });
            
            if (Array.isArray(response.data.data)) {
                setPets(response.data.data);
            }
        } catch (error: any) {
            console.error('펫 목록 로드 실패:', error);
            Alert.alert('오류', '펫 목록을 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    }, [accessToken]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchPets();
        setRefreshing(false);
    }, [fetchPets]);

    // 화면이 포커스될 때마다 데이터 로드
    useFocusEffect(
        useCallback(() => {
            fetchPets();
        }, [fetchPets])
    );

    const getSpeciesIcon = (species: string) => {
        switch (species) {
            case 'dog':
                return 'paw';
            case 'cat':
                return 'logo-octocat';
            case 'other':
                return 'paw';
            default:
                return 'paw';
        }
    };

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

    // 나이 계산 함수 (개월 단위로 계산)
    const calculateAge = (birthDate: string) => {
        try {
            const birth = new Date(birthDate);
            const today = new Date();
            
            // 유효하지 않은 날짜인 경우
            if (isNaN(birth.getTime())) {
                return '알 수 없음';
            }
            
            // 미래 날짜인 경우
            if (birth > today) {
                return '미래 날짜';
            }
            
            const yearDiff = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            const dayDiff = today.getDate() - birth.getDate();
            
            // 총 개월 수 계산
            let totalMonths = yearDiff * 12 + monthDiff;
            
            // 일수가 음수면 한 달 빼기
            if (dayDiff < 0) {
                totalMonths -= 1;
            }
            
            // 1년 미만인 경우 개월 단위로 표시
            if (totalMonths < 12) {
                if (totalMonths === 0) {
                    return '신생아';
                } else if (totalMonths < 1) {
                    return '1개월 미만';
                } else {
                    return `${totalMonths}개월`;
                }
            }
            
            // 1년 이상인 경우 년 단위로 표시
            const years = Math.floor(totalMonths / 12);
            const remainingMonths = totalMonths % 12;
            
            if (remainingMonths === 0) {
                return `${years}세`;
            } else {
                return `${years}세 ${remainingMonths}개월`;
            }
            
        } catch (error) {
            console.error('나이 계산 오류:', error);
            return '알 수 없음';
        }
    };

    const handleDeletePet = async (petId: string, petName: string) => {
        Alert.alert(
            '펫 삭제',
            `${petName}을(를) 삭제하시겠습니까?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/pet/${petId}`, {
                                headers: { authorization: `Bearer ${accessToken}` },
                            });
                            Alert.alert('완료', '펫이 삭제되었습니다.');
                            fetchPets(); // 목록 새로고침
                        } catch (error: any) {
                            console.error('펫 삭제 실패:', error);
                            Alert.alert('오류', '펫 삭제에 실패했습니다.');
                        }
                    }
                }
            ]
        );
    };

    const renderPetItem = ({ item }: { item: Pet }) => (
        <TouchableOpacity style={styles.petItem} activeOpacity={0.8} onPress={() => navigation.navigate('PetDetail' as any, item as any)}>
            <View style={styles.petInfo}>
                <View style={styles.petHeader}>
                    <View style={styles.petIconContainer}>
                        <Ionicons
                            name={getSpeciesIcon(item.species)}
                            size={24}
                            color={COLORS.primary}
                        />
                    </View>
                    <View style={styles.petDetails}>
                        <Text style={styles.petName}>{item.name}</Text>
                        <Text style={styles.petSpecies}>
                            {getSpeciesLabel(item.species)} • {getGenderLabel(item.gender)}
                        </Text>
                    </View>
                    <View style={styles.petActions}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleDeletePet(item.id, item.name)}
                        >
                            <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                        </TouchableOpacity>
                    </View>
                </View>
                
                <View style={styles.petDetailsRow}>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>품종</Text>
                        <Text style={styles.detailValue}>{item.breed || '미입력'}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>나이</Text>
                        <Text style={styles.detailValue}>{calculateAge(item.birthDate)}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>체중</Text>
                        <Text style={styles.detailValue}>{item.weight}kg</Text>
                    </View>
                </View>

                {item.description && (
                    <View style={styles.descriptionContainer}>
                        <Text style={styles.descriptionLabel}>특이사항</Text>
                        <Text style={styles.descriptionText}>{item.description}</Text>
                    </View>
                )}

                <Text style={styles.createdAt}>
                    등록일: {new Date(item.createdAt).toLocaleDateString('ko-KR')}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons name="paw-outline" size={64} color={COLORS.hint} />
            <Text style={styles.emptyTitle}>등록된 펫이 없습니다</Text>
            <Text style={styles.emptySubtitle}>새로운 펫을 등록해보세요</Text>
            <TouchableOpacity
                style={styles.emptyAddButton}
                onPress={() => navigation.navigate('PetRegistration')}
            >
                <Ionicons name="add" size={20} color="#FFF" />
                <Text style={styles.emptyAddButtonText}>펫 등록하기</Text>
            </TouchableOpacity>
        </View>
    );

    if (isLoading && pets.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>펫 목록을 불러오는 중...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        등록된 펫 ({pets.length})
                    </Text>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => navigation.navigate('PetRegistration')}
                    >
                        <Ionicons name="add" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>
                
                {pets.length === 0 ? (
                    renderEmptyState()
                ) : (
                    <FlatList
                        data={pets}
                        renderItem={renderPetItem}
                        keyExtractor={(item) => item.id}
                        style={styles.petList}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={[COLORS.primary]}
                                tintColor={COLORS.primary}
                            />
                        }
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: COLORS.bg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: COLORS.hint,
    },
    section: {
        backgroundColor: COLORS.cardBg,
        margin: 16,
        marginTop: 16,
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
        flex: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
    },
    addButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.primary,
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    petList: {
        flex: 1,
    },
    petItem: {
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#EFE7E0',
    },
    petInfo: {
        flex: 1,
    },
    petHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    petIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    petDetails: {
        flex: 1,
    },
    petName: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },
    petSpecies: {
        fontSize: 14,
        color: COLORS.hint,
    },
    petActions: {
        flexDirection: 'row',
    },
    actionButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#FFF',
        marginLeft: 8,
    },
    petDetailsRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    detailItem: {
        flex: 1,
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 12,
        color: COLORS.hint,
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    descriptionContainer: {
        marginBottom: 12,
    },
    descriptionLabel: {
        fontSize: 12,
        color: COLORS.hint,
        marginBottom: 4,
    },
    descriptionText: {
        fontSize: 14,
        color: COLORS.text,
        lineHeight: 20,
    },
    createdAt: {
        fontSize: 12,
        color: COLORS.hint,
        textAlign: 'right',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: COLORS.hint,
        textAlign: 'center',
    },
    emptyAddButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        marginTop: 20,
        shadowColor: COLORS.primary,
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    emptyAddButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});
