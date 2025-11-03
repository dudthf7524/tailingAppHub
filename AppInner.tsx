import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BLEConnection from "./src/pages/BLEConnection";
import HubList from "./src/pages/HubList";
import PetList from "./src/pages/PetList";
import Profile from "./src/pages/Profile";
import ProfileEdit from "./src/pages/ProfileEdit";
import PetRegistration from "./src/pages/PetRegistration";
import PetDetail from "./src/pages/PetDetail";
import PetEdit from "./src/pages/PetEdit";
import TailingDeviceList from "./src/pages/DeviceList";
import TailingDashBoard from "./src/pages/TailingDashBoard";
import CustomerService from "./src/pages/CustomerService";
import PrivacyPolicy from "./src/pages/PrivacyPolicy";
import CSVDownload from "./src/pages/CSVDownload";
import UserDetail from "./src/pages/UserDetail";
import HubNameEdit from "./src/pages/HubNameEdit";
import DeviceNameEdit from "./src/pages/DeviceNameEdit";
import Login from "./src/pages/Login";
import Join from "./src/pages/Join";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useSelector } from "react-redux";
import { useAppDispatch } from "./src/store";
import { RootState } from "./src/store/reducer";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import EncryptedStorage from "react-native-encrypted-storage";
import userSlice from "./src/slices/user";
import api from "./src/constant/contants";
import { Alert, View, Text, ActivityIndicator, StyleSheet, Animated, TouchableOpacity } from "react-native";
import BootSplash from "react-native-bootsplash";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

// 스플래시 스크린 컴포넌트
// function SplashScreen() {
//     return (
//         <View style={styles.splashContainer}>
//             <View style={styles.splashContent}>
//                 <Ionicons name="paw" size={64} color="#F0663F" />
//                 <Text style={styles.splashTitle}>Tailing</Text>
//                 <Text style={styles.splashSubtitle}>동물 건강 관리</Text>
//             </View>
//         </View>
//     );
// }

function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: '#F0663F',
                tabBarInactiveTintColor: '#9ca3af',
                headerTitleAlign: 'center',

            }}>
            <Tab.Screen
                name="BLEConnection"
                component={BLEConnection}
                options={{
                    title: '허브 설정',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="settings" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="HubList"
                component={HubList}
                options={{
                    title: '허브 목록',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="hardware-chip" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="PetList"
                component={PetList}
                options={{
                    title: '환자 리스트',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="paw" size={size} color={color} />
                    ),
                }}
            />
            {/* <Tab.Screen
                name="CSVDownload"
                component={CSVDownload}
                options={{
                    title: 'CSV 다운로드',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="download-outline" size={size} color={color} />
                    ),
                }}
            /> */}
            <Tab.Screen
                name="Profile"
                component={Profile}
                options={{
                    title: '더보기',
                    // headerTitleAlign: 'left',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="ellipsis-horizontal" size={size} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

export type LoggedInParamList = {
    Orders: undefined;
};

interface Data {
    hrData: number | null;
    spo2Data: number | null;
    tempData: number | null;
}
export type RootStackParamList = {
    MainTabs: undefined;
    TailingDeviceList: { hubAddress?: string; hubName?: string } | undefined;
    TailingDeviceMonitor: undefined;
    TailingDashBoard: { deviceId: string; deviceName: string };
    TailingData: { screen: string; data: Data } | undefined;
    Tailing1TextDisplay: undefined;
    ServerFileList: undefined
    DeviceNameManager: undefined
    Profile: undefined;
    ProfileEdit: undefined;
    Login: undefined;
    Join: undefined;
    로그인: undefined;
    BLEConnection: undefined;
    PetRegistration: undefined;
    PetList: { deviceId?: string; deviceName?: string } | undefined;
    PetDetail: any;
    PetEdit: { pet: any };
    CustomerService: undefined;
    PrivacyPolicy: undefined;
    CSVDownload: undefined;
    UserDetail: undefined;
    HubNameEdit: undefined;
    DeviceNameEdit: undefined;
};

function AppInner() {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthLoading, setAuthLoading] = useState(true);
    const isLoggedIn = useSelector((state: RootState) => !!state.user.accessToken);
    console.log("isLoggedIn", isLoggedIn);
    const dispatch = useAppDispatch()
    console.log("함수실행중");
    useEffect(() => {
        console.log("실행됨")
        api.interceptors.response.use(
            response => {
                console.log(response);
                return response;
            },
            async error => {
                console.log("실행됨")
                const { config, response: { status } } = error;
                console.log(error)
                if (status === 419) {
                    if (error.response.data.code === 'expired') {
                        const originalRequest = config;
                        const refreshToken = await EncryptedStorage.getItem('refreshToken');
                        console.log("refreshToken", refreshToken);
                        if (!refreshToken) return;
                        const { data } = await api.post(`/auth/refreshToken`,
                            {},
                            {
                                headers: { authorization: `${refreshToken}` },
                            }
                        );

                        console.log("data", data);

                        // 토큰 재발급
                        dispatch(userSlice.actions.setAccessToken(data.data.accessToken));
                        // 원래 요청
                        originalRequest.headers.authorization = `${data.data.accessToken}`;
                        return axios(originalRequest);
                    }
                }
                // 419에러 외에는 기존읜 catch(error)로
                return Promise.reject(error);
            },
        );

        // return () => {
        //     axios.interceptors.response.eject(interceptor);
        //   };
    }, [dispatch]);

    useEffect(() => {
        const prepare = async () => {
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2초로 증가
        };
        prepare().finally(async () => {
            await BootSplash.hide({ fade: true });
        });
    }, []);

    useEffect(() => {
        const startTime = Date.now();
        const MIN_SPLASH_DURATION = 3000; // 최소 3초

        const getTokenAndRefresh = async () => {
            try {
                const refreshToken = await EncryptedStorage.getItem('refreshToken');
                // if (!refreshToken) {
                //     // 최소 3초 보장 후 BootSplash 숨기기
                //     const elapsed = Date.now() - startTime;
                //     const remaining = Math.max(0, MIN_SPLASH_DURATION - elapsed);
                //     setTimeout(async () => {
                //         await BootSplash.hide({ fade: true });
                //         setAuthLoading(false);
                //     }, remaining);
                //     return;
                // }

                const response = await api.post(`/auth/refreshToken`, {},
                    {
                        headers: { authorization: `${refreshToken}` },
                    }
                );

                dispatch(
                    userSlice.actions.setUser({
                        id: response.data.data.user_code || '',
                        email: response.data.data.email || '',
                        accessToken: response.data.data.accessToken,
                    })
                );
            } catch (error) {
                console.warn('Refresh token expired or invalid:', error);
                await EncryptedStorage.removeItem('refreshToken'); // 만료된 토큰 삭제
            } finally {
                // 최소 3초 보장 후 BootSplash 숨기기
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, MIN_SPLASH_DURATION - elapsed);
                // setTimeout(async () => {
                //     await BootSplash.hide({ fade: true });
                //     setAuthLoading(false);
                // }, remaining);
            }
        };

        getTokenAndRefresh();
    }, [dispatch]);

    // 인증 확인 중일 때는 스플래시 스크린 표시 (bootsplash가 숨겨지기 전까지)
    // if (isAuthLoading) {
    //     return <SplashScreen />;
    // }

    return (
        <Stack.Navigator>
            {isLoggedIn ? (
                <>
                    <Stack.Screen
                        name="MainTabs"
                        component={MainTabs}
                        options={{ headerShown: false }} />
                    <Stack.Screen
                        name="PetRegistration"
                        component={PetRegistration}
                        options={{
                            title: '환자 등록',
                            headerBackTitle: "환자 목록",
                            headerTitleAlign: 'center',
                            headerShadowVisible: false,
                            headerBackTitleVisible: false,
                        }}
                    />
                    <Stack.Screen
                        name="PetList"
                        component={PetList}
                        options={{
                            title: '환자 선택',
                            headerShown: true,
                            headerBackTitle: '디바이스 목록'
                        }}
                    />
                    <Stack.Screen
                        name="PetDetail"
                        component={PetDetail}
                        options={{
                            title: '환자 상세',
                            headerBackTitle: "환자 목록",
                            headerTitleAlign: 'center',
                            headerShadowVisible: false,
                            headerBackTitleVisible: false,
                        }}
                    />
                    <Stack.Screen
                        name="PetEdit"
                        component={PetEdit}
                        options={{
                            title: '환자 수정',
                            headerBackTitle: "환자 목록",
                            headerTitleAlign: 'center',
                            headerShadowVisible: false,
                            headerBackTitleVisible: false,
                        }}
                    />
                    <Stack.Screen
                        name="TailingDeviceList"
                        component={TailingDeviceList}
                        options={{
                            title: '디바이스 목록',
                            headerShown: true,
                            headerTitleAlign: 'center',
                            headerBackTitle: '등록된 허브'
                        }}
                    />
                    <Stack.Screen
                        name="TailingDashBoard"
                        component={TailingDashBoard}
                        options={{
                            title: '대시보드',
                            headerTitleAlign: 'center',
                            headerBackTitle: '디바이스 목록',
                            headerShadowVisible: false,
                            headerBackTitleVisible: false,
                        }}
                    />
                    <Stack.Screen
                        name="CustomerService"
                        component={CustomerService}
                        options={{
                            title: '고객센터',
                            headerBackTitle: '내 정보',
                            headerTitleAlign: 'center',
                            headerShadowVisible: false,
                            headerBackTitleVisible: false,
                        }}
                    />
                    <Stack.Screen
                        name="PrivacyPolicy"
                        component={PrivacyPolicy}
                        options={{
                            title: '개인정보 처리방침',
                            headerTitleAlign: 'center',
                            headerShadowVisible: false,
                            headerBackTitleVisible: false,
                            headerBackTitle: '내 정보'
                        }}
                    />
                    <Stack.Screen
                        name="ProfileEdit"
                        component={ProfileEdit}
                        options={{
                            title: '프로필 수정',
                            headerShown: true,
                            headerBackTitle: '내 정보'
                        }}
                    />
                    <Stack.Screen
                        name="UserDetail"
                        component={UserDetail}
                        options={{
                            title: '나의 정보',
                            headerTitleAlign: 'center',
                            headerShadowVisible: false,
                            headerBackTitleVisible: false,
                            headerBackTitle: '더보기'
                        }}
                    />
                    <Stack.Screen
                        name="HubNameEdit"
                        component={HubNameEdit}
                        options={{
                            title: '허브 이름 변경',
                            headerTitleAlign: 'center',
                            headerShadowVisible: false,
                            headerBackTitleVisible: false,
                            headerBackTitle: '더보기'
                        }}
                    />
                    <Stack.Screen
                        name="DeviceNameEdit"
                        component={DeviceNameEdit}
                        options={{
                            title: '디바이스 이름 변경',
                            headerTitleAlign: 'center',
                            headerShadowVisible: false,
                            headerBackTitleVisible: false,
                            headerBackTitle: '더보기'
                        }}
                    />
                </>
            ) : (
                // 로그인 전 - 로그인/회원가입 스택
                <>
                    <Stack.Screen
                        name="로그인"
                        component={Login}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="Join"
                        component={Join}
                        options={{
                            title: '회원가입',
                            headerBackTitleVisible: false,
                            headerTitleAlign: 'center',
                            headerShadowVisible: false,
                        }}

                    />
                </>
            )}
        </Stack.Navigator>
    );
}

const styles = StyleSheet.create({
    splashContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    splashContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    splashTitle: {
        fontSize: 36,
        fontWeight: '700',
        color: '#F0663F',
        marginTop: 16,
        letterSpacing: 1,
    },
    splashSubtitle: {
        fontSize: 14,
        color: '#7A7A7A',
        marginTop: 8,
        fontWeight: '500',
    },
});

export default AppInner;