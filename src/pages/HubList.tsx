import { AxiosError } from "axios";
import { useCallback, useEffect, useState } from "react";
import { Text, View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { RootState } from '../store/reducer';
import { useSelector } from "react-redux";
import api from "../constant/contants";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTailingData } from '../contexts/TailingDataContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

const COLORS = {
    primary: '#F0663F',
    bg: '#FAF6F2',
    text: '#333333',
    cardBg: '#FFFFFF',
    hint: '#7A7A7A',
    success: '#27AE60',
};

interface Hub {
    id: string;
    address: string;
    name?: string;
    createdAt?: string;
}

type Nav = NativeStackNavigationProp<RootStackParamList, 'TailingDeviceList'>;

export default function HubList() {
    const accessToken = useSelector((state: RootState) => state.user.accessToken);
    const id = useSelector((state: RootState) => state.user.id);
    const [hub, setHub] = useState<Hub[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { connectedHubs } = useTailingData();
    const navigation = useNavigation<Nav>();

    console.log("HubList 컴포넌트 렌더링됨");
    console.log("accessToken : ", accessToken);
    console.log("id : ", id);

    const fetchData = useCallback(async () => {
        console.log("fetchData 호출됨");

        if (!accessToken) {
            console.log("accessToken이 없어서 API 요청을 건너뜁니다.");
            return;
        }

        try {
            setIsLoading(true);
            console.log("API 요청 시작...");
            console.log("accessToken", accessToken)
            const response = await api.get(`/hub/list/`, {
                headers: { authorization: `${accessToken}` },
            });
            console.log("API 응답 코드 : ", response.status);
            console.log("API 응답 데이터 : ", response.data.data);
            setHub(response.data.data);
            // API 응답을 hub에 담기
            // setHub(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            const err = error as AxiosError;
            console.error('데이터 로드 실패:', err.response?.data || err.message);
        } finally {
            setIsLoading(false);
        }
    }, [accessToken]);
    
    console.log("hub", hub);
    console.log("connectedHubs", connectedHubs);

    // 허브가 연결되어 있는지 확인하는 함수
    const isHubConnected = (hubAddress: string) => {
        return connectedHubs.has(hubAddress);
    };

    // 연결중인 허브 클릭 시 디바이스 목록으로 이동
    const handleHubPress = (hubItem: Hub) => {
        if (isHubConnected(hubItem.address)) {
            navigation.navigate('TailingDeviceList', { hubId: hubItem.id, hubName: hubItem.name || '허브' });
        }
    };

    // 화면이 포커스될 때마다 데이터 로드
    useFocusEffect(
        useCallback(() => {
            console.log("useFocusEffect 실행됨");
            fetchData();
        }, [fetchData])
    );

    // 컴포넌트 마운트 시에도 데이터 로드
    useEffect(() => {
        console.log("useEffect 실행됨");
        fetchData();
    }, [fetchData])

    const renderHubItem = ({ item }: { item: Hub }) => {
        const isConnected = isHubConnected(item.address);
        
        return (
            <TouchableOpacity 
                style={[
                    styles.deviceItem,
                    isConnected && styles.deviceItemConnected
                ]}
                onPress={() => handleHubPress(item)}
                disabled={!isConnected}
            >
                <View style={styles.deviceInfo}>
                    <View style={styles.deviceHeader}>
                        <Ionicons
                            name="hardware-chip"
                            size={24}
                            color={isConnected ? COLORS.success : COLORS.hint}
                        />
                        <Text style={styles.deviceName}>{item.name || '허브'}</Text>
                        <View style={[
                            styles.connectedBadge, 
                            { backgroundColor: isConnected ? COLORS.success : '#E74C3C' }
                        ]}>
                            <Text style={styles.connectedText}>
                                {isConnected ? '연결중' : '미연결'}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.deviceId}>주소: {item.address}</Text>
                    {item.createdAt && (
                        <Text style={styles.rssi}>
                            등록일: {new Date(item.createdAt).toLocaleDateString('ko-KR')}
                        </Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    등록된 장치 ({hub.length})
                </Text>
                {hub.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="hardware-chip-outline" size={48} color={COLORS.hint} />
                        <Text style={styles.emptyText}>등록된 장치가 없습니다</Text>
                    </View>
                ) : (
                    <FlatList
                        data={hub}
                        renderItem={renderHubItem}
                        keyExtractor={(item) => item.id}
                        style={styles.deviceList}
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
    section: {
        backgroundColor: COLORS.cardBg,
        margin: 16,
        marginTop: 16,
        padding: 20,
        // borderRadius: 16,
        // shadowColor: '#000',
        // shadowOpacity: 0.06,
        // shadowRadius: 12,
        // shadowOffset: { width: 0, height: 6 },
        // elevation: 3,
        flex: 1,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
    },
    deviceList: {
        marginTop: 12,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        marginTop: 12,
        color: COLORS.hint,
        fontSize: 14,
        textAlign: 'center',
    },
    deviceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#EFE7E0',
    },
    deviceItemConnected: {
        backgroundColor: '#F0F9FF',
        borderColor: COLORS.success,
        borderWidth: 2,
    },
    deviceInfo: {
        flex: 1,
    },
    deviceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    deviceName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginLeft: 8,
        flex: 1,
    },
    connectedBadge: {
        backgroundColor: COLORS.success,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    connectedText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },
    deviceId: {
        fontSize: 12,
        color: COLORS.hint,
        marginBottom: 2,
        marginLeft: 32,
    },
    rssi: {
        fontSize: 12,
        color: COLORS.hint,
        marginLeft: 32,
    },
});



