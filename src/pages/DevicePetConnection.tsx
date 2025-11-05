import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
    RefreshControl, ActivityIndicator, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import api from '../constant/contants';
import { RootState } from '../store/reducer';
import { useSelector } from 'react-redux';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

const COLORS = {
    primary: '#F0663F',
    bg: '#FAF6F2',
    text: '#333333',
    cardBg: '#FFFFFF',
    hint: '#7A7A7A',
    success: '#27AE60',
    error: '#E74C3C',
};

interface Device {
    id: string;
    address: string;
    device_name: string;
    hubAddress?: string;
}

interface Pet {
    id: string;
    name: string;
    species: string;
    breed: string;
    device_address?: string | null; // Pet 모델에 device_address 필드가 있다면
}

// DevicePetConnection 인터페이스 제거 - API 응답 데이터를 그대로 사용

export default function DevicePetConnection() {
    const navigation = useNavigation();
    const accessToken = useSelector((state: RootState) => state.user.accessToken);
    const [connectedDevices, setConnectedDevices] = useState<any[]>([]); // 연결된 디바이스-환자 데이터 (원본 그대로)
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
console.log("connectedDevices:", connectedDevices);
    // 환자 선택 모달 상태
    const [petSelectModalVisible, setPetSelectModalVisible] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const [pets, setPets] = useState<Pet[]>([]);
    const [isLoadingPets, setIsLoadingPets] = useState(false);

    // 디바이스-환자 연결 상태 가져오기
    // API: /pet/connect/device
    // 조인 결과: d.address, d.name, p.name, p.id
    const fetchDevicePetConnections = async () => {
        if (!accessToken) return;
        
        try {
            const response = await api.get('/pet/connect/device', {
                headers: { authorization: `${accessToken}` },
            });
            
            console.log("device-pet connections response:", response);
            console.log("device-pet connections response.data:", response.data);
            
            // 응답 구조: { data: [ { address, device_name, Pet: { pet_id, pet_name, breed } } ] }
            if (response.data && Array.isArray(response.data.data || response.data)) {
                const dataArray = response.data.data || response.data;
                // 연결된 디바이스-환자 데이터를 그대로 저장 (매핑 없이)
                setConnectedDevices(dataArray);
            }
        } catch (error: any) {
            console.error('디바이스-환자 연결 상태 확인 실패:', error);
            // 에러가 발생해도 계속 진행 (연결되지 않은 디바이스도 표시하기 위해)
        }
    };

    // 환자 목록 가져오기
    const fetchPets = async () => {
        if (!accessToken) {
            return;
        }
        
        try {
            setIsLoadingPets(true);
            const response = await api.get('/pet/connect/device/list', {
                headers: { authorization: `${accessToken}` },
            });
            
            if (Array.isArray(response.data.data)) {
                // API 반환값을 그대로 setPets에 담기
                setPets(response.data.data);
            }
        } catch (error: any) {
            console.error('환자 목록 로드 실패:', error);
            Alert.alert('오류', '환자 목록을 불러오는데 실패했습니다.');
        } finally {
            setIsLoadingPets(false);
        }
    };

    const loadData = async () => {
        setIsLoading(true);
        await fetchDevicePetConnections();
        setIsLoading(false);
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [accessToken])
    );

    // 환자 변경 버튼 클릭
    const handleChangePet = (device: Device) => {
        // 모달이 이미 열려있으면 selectedDevice만 변경하고 펫 목록만 다시 가져오기
        setSelectedDevice(device);
            fetchPets();
            setPetSelectModalVisible(true);
        // if (petSelectModalVisible) {
        //     setSelectedDevice(device);
        //     fetchPets();
        // } else {
        //     // 모달이 닫혀있으면 바로 열기
        //     setSelectedDevice(device);
        //     setPetSelectModalVisible(true);
        //     // 펫 목록 가져오기
        //     setTimeout(() => {
        //         fetchPets();
        //     }, 200);
        // }
    };

    // 모달 닫기
    const handleCloseModal = () => {
        setPetSelectModalVisible(false);
        // 상태 초기화는 모달이 완전히 닫힌 후에
        // setTimeout(() => {
        //     setSelectedDevice(null);
        // }, 300);
    };

    // 환자 선택 처리
    const handleSelectPet = async (pet: Pet) => {
        if (!selectedDevice) return;
        
        // 모달을 임시로 닫지 않고 유지하면서 알림창 표시
        // 확인 알림창 표시
        Alert.alert(
            '환자 연결 변경',
            `${selectedDevice.device_name}에 ${pet.name}을(를) 연결하시겠습니까?`,
            [
                {
                    text: '취소',
                    style: 'cancel',
                    // 취소 시 모달 유지 (아무것도 하지 않음)
                },
                {
                    text: '변경',
                    onPress: async () => {
                        try {
                            await api.post('/pet/edit/device/address', {
                                address: selectedDevice.address,
                                pet_id: pet.id,
                            }, {
                                headers: { authorization: `${accessToken}` },
                            });

                            // 모달 먼저 닫기
                            setPetSelectModalVisible(false);
                            setSelectedDevice(null);
                            
                            // 연결 상태 새로고침
                            await fetchDevicePetConnections();
                            
                            // 완료 알림은 모달이 닫힌 후에 표시
                            setTimeout(() => {
                                Alert.alert('완료', `${pet.name}이(가) ${selectedDevice?.device_name}에 연결되었습니다.`);
                            }, 300);
                        } catch (error: any) {
                            console.error('환자 연결 실패:', error);
                            Alert.alert('오류', error?.response?.data?.message || '환자 연결에 실패했습니다.');
                        }
                    }
                }
            ],
            { cancelable: true }
        );
    };


    const getSpeciesIcon = (species: string) => {
        switch (species) {
            case 'dog':
                return 'paw';
            case 'cat':
                return 'paw';
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

    const renderConnectedDeviceItem = ({ item }: { item: any }) => {
        // connectedDevices의 각 항목: { address, device_name, Pet: { pet_id, pet_name, breed } }
        const connectedPet = item.Pet;

        return (
            <View style={styles.deviceItem}>
                <View style={styles.deviceHeader}>
                    <View style={styles.deviceIconContainer}>
                        <Ionicons name="watch" size={24} color={COLORS.primary} />
                    </View>
                    <View style={styles.deviceInfo}>
                        <Text style={styles.deviceName}>{item.device_name}</Text>
                        <Text style={styles.deviceAddress}>{item.address}</Text>
                    </View>
                </View>

                {connectedPet ? (
                    <View style={styles.petInfoSection}>
                        <View style={styles.petInfoRow}>
                            <Ionicons 
                                name={getSpeciesIcon(connectedPet.species)} 
                                size={20} 
                                color={COLORS.success} 
                            />
                            <Text style={styles.petName}>{connectedPet.pet_name}</Text>
                            {connectedPet.breed && (
                                <Text style={styles.petBreed}>({connectedPet.breed})</Text>
                            )}
                            {connectedPet.species && (
                                <Text style={styles.petSpecies}>{getSpeciesLabel(connectedPet.species)}</Text>
                            )}
                        </View>
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.changeButton]}
                                onPress={() => handleChangePet({ address: item.address, device_name: item.device_name } as Device)}
                            >
                                <Text style={styles.changeButtonText}>변경</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : null}
            </View>
        );
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['bottom']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>디바이스 목록을 불러오는 중...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <View style={styles.section}>
               
                {connectedDevices.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="watch-outline" size={64} color={COLORS.hint} />
                        <Text style={styles.emptyText}>연결된 디바이스가 없습니다</Text>
                    </View>
                ) : (
                    <FlatList
                        data={connectedDevices}
                        renderItem={renderConnectedDeviceItem}
                        keyExtractor={(item: any) => item.address}
                        style={styles.deviceList}
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

            {/* 환자 선택 모달 */}
            <Modal
                visible={petSelectModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={handleCloseModal}
            >
                <SafeAreaView style={styles.modalContainer} edges={['top']}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>환자 선택</Text>
                        <TouchableOpacity
                            onPress={handleCloseModal}
                        >
                            <Text style={styles.modalCloseButton}>닫기</Text>
                        </TouchableOpacity>
                    </View>

                    {isLoadingPets ? (
                        <View style={styles.modalLoadingContainer}>
                            <ActivityIndicator size="large" color={COLORS.primary} />
                        </View>
                    ) : pets.length === 0 ? (
                        <View style={styles.modalEmptyContainer}>
                            <Ionicons name="paw-outline" size={64} color={COLORS.hint} />
                            <Text style={styles.modalEmptyText}>디바이스와 연결되지 않은 펫이 없습니다.</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={pets}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.petItem}
                                    onPress={() => handleSelectPet(item)}
                                >
                                    <View style={styles.petItemLeft}>
                                        <Ionicons name="paw" size={24} color={COLORS.primary} />
                                        <View style={styles.petItemInfo}>
                                            <Text style={styles.petItemName}>{item.name}</Text>
                                            <Text style={styles.petItemDetails}>
                                                {getSpeciesLabel(item.species)} • {item.breed || '품종 미입력'}
                                            </Text>
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={COLORS.hint} />
                                </TouchableOpacity>
                            )}
                            keyExtractor={(item) => item.id}
                            style={styles.petList}
                        />
                    )}
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    loadingContainer: {
        flex: 1,
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
        flex: 1,
    },
    header: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
    },
    deviceList: {
        flex: 1,
    },
    deviceItem: {
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#EFE7E0',
    },
    deviceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    deviceIconContainer: {
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
    deviceInfo: {
        flex: 1,
    },
    deviceName: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },
    deviceAddress: {
        fontSize: 12,
        color: COLORS.hint,
    },
    petInfoSection: {
        borderTopWidth: 1,
        borderTopColor: '#EFE7E0',
        paddingTop: 12,
    },
    petInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    petName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginLeft: 8,
    },
    petBreed: {
        fontSize: 14,
        color: COLORS.hint,
        marginLeft: 4,
    },
    petSpecies: {
        fontSize: 12,
        color: COLORS.hint,
        marginLeft: 8,
        backgroundColor: '#F0F0F0',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    changeButton: {
        backgroundColor: COLORS.primary,
    },
    changeButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    disconnectButton: {
        backgroundColor: '#F0F0F0',
    },
    disconnectButtonText: {
        color: COLORS.error,
        fontSize: 14,
        fontWeight: '600',
    },
    noPetSection: {
        borderTopWidth: 1,
        borderTopColor: '#EFE7E0',
        paddingTop: 12,
        alignItems: 'center',
    },
    noPetText: {
        fontSize: 14,
        color: COLORS.hint,
        marginBottom: 12,
    },
    connectButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    connectButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.hint,
        marginTop: 16,
    },
    // 모달 스타일
    modalContainer: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
        backgroundColor: COLORS.cardBg,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    modalCloseButton: {
        fontSize: 16,
        color: COLORS.primary,
        fontWeight: '600',
    },
    modalLoadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalEmptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    modalEmptyText: {
        fontSize: 16,
        color: COLORS.hint,
        marginTop: 16,
    },
    petList: {
        flex: 1,
    },
    petItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.cardBg,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    petItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    petItemInfo: {
        marginLeft: 12,
        flex: 1,
    },
    petItemName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    petItemDetails: {
        fontSize: 14,
        color: COLORS.hint,
    },
});


