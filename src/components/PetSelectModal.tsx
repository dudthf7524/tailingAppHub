import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import api from '../constant/contants';
import { RootState } from '../store/reducer';
import { useSelector } from 'react-redux';

const COLORS = {
    primary: '#F0663F',
    bg: '#FAF6F2',
    text: '#333333',
    cardBg: '#FFFFFF',
    hint: '#7A7A7A',
    success: '#27AE60',
    error: '#E74C3C',
    modalOverlay: 'rgba(0, 0, 0, 0.5)',
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

interface PetSelectModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectPet: (pet: Pet) => void;
    deviceId: string;
    deviceName: string;
}

export default function PetSelectModal({
    visible,
    onClose,
    onSelectPet,
    deviceId,
    deviceName,
}: PetSelectModalProps) {
    const accessToken = useSelector((state: RootState) => state.user.accessToken);
    const [pets, setPets] = useState<Pet[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchPets = async () => {
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
    };

    useEffect(() => {
        if (visible) {
            fetchPets();
        }
    }, [visible]);

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

    const handleSelectPet = (pet: Pet) => {
        Alert.alert(
            '펫 선택',
            `${pet.name}을(를) ${deviceName}에 연결하시겠습니까?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '연결',
                    onPress: () => {
                        onSelectPet(pet);
                        onClose();
                    },
                },
            ]
        );
    };

    const renderPetItem = ({ item }: { item: Pet }) => (
        <TouchableOpacity
            style={styles.petItem}
            onPress={() => handleSelectPet(item)}
        >
            <View style={styles.petIconContainer}>
                <Ionicons
                    name={getSpeciesIcon(item.species)}
                    size={24}
                    color={COLORS.primary}
                />
            </View>
            <View style={styles.petInfo}>
                <Text style={styles.petName}>{item.name}</Text>
                <Text style={styles.petDetails}>
                    {getSpeciesLabel(item.species)} • {item.breed || '미입력'}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.hint} />
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons name="paw-outline" size={64} color={COLORS.hint} />
            <Text style={styles.emptyTitle}>등록된 펫이 없습니다</Text>
            <Text style={styles.emptySubtitle}>먼저 펫을 등록해주세요</Text>
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <SafeAreaView style={styles.modalContent}>
                        {/* 헤더 */}
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>펫 선택</Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={onClose}
                            >
                                <Ionicons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        {/* 디바이스 정보 */}
                        <View style={styles.deviceInfo}>
                            <Text style={styles.deviceInfoText}>
                                {deviceName}에 연결할 펫을 선택해주세요
                            </Text>
                        </View>

                        {/* 펫 목록 */}
                        {isLoading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={COLORS.primary} />
                                <Text style={styles.loadingText}>펫 목록을 불러오는 중...</Text>
                            </View>
                        ) : pets.length === 0 ? (
                            renderEmptyState()
                        ) : (
                            <FlatList
                                data={pets}
                                renderItem={renderPetItem}
                                keyExtractor={(item) => item.id}
                                style={styles.petList}
                                showsVerticalScrollIndicator={false}
                            />
                        )}
                    </SafeAreaView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: COLORS.modalOverlay,
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: COLORS.cardBg,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        minHeight: '50%',
    },
    modalContent: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
    },
    closeButton: {
        padding: 4,
    },
    deviceInfo: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#F8F9FA',
    },
    deviceInfoText: {
        fontSize: 14,
        color: COLORS.hint,
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: COLORS.hint,
    },
    petList: {
        flex: 1,
        paddingHorizontal: 20,
    },
    petItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    petIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    petInfo: {
        flex: 1,
    },
    petName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    petDetails: {
        fontSize: 14,
        color: COLORS.hint,
    },
    emptyState: {
        flex: 1,
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
});
