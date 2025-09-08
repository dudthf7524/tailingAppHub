import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Orders from './src/pages/Orders.tsx';
import { useState } from 'react';
import TailingDeviceList from './src/pages/TailingDeviceList.tsx';
import TailingDeviceMonitor from './src/pages/TailingDeviceMonitor.tsx';
import { TailingDataProvider } from './src/contexts/TailingDataContext.tsx';
import { BLEProvider } from './src/contexts/BleContext.tsx';
import TailingDashBoard from './src/pages/TailingDashBoard.tsx';
import TailingData from './src/pages/TailingData.tsx';
import Tailing1TextDisplay from './src/pages/Tailing1TextDisplay.tsx';
import ServerFileList from './src/pages/ServerFileList.tsx';
import DeviceNameManager from './src/pages/DeviceNameManager.tsx';
import Join from './src/pages/Join.tsx';
import Login from './src/pages/Login.tsx';
import Profile from './src/pages/Profile.tsx';
import BLEConnection from './src/pages/BLEConnection.tsx';
import { useEffect } from 'react';
import { getToken } from './src/utils/token.ts';
import { AppState } from 'react-native';

export type LoggedInParamList = {
  Orders: undefined;
};

interface Data {
  hrData: number | null;
  spo2Data: number | null;
  tempData: number | null;
}
export type RootStackParamList = {
  TailingDeviceList: undefined;
  TailingDeviceMonitor: undefined;
  TailingDashBoard: { deviceId: string; deviceName: string };
  TailingData: { screen: string; data: Data } | undefined;
  Tailing1TextDisplay: undefined;
  ServerFileList: undefined
  DeviceNameManager: undefined
  Profile: undefined;
  Login: undefined;
  Join: undefined;
  로그인: undefined;
  BLEConnection: undefined;
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();
//  <TailingDataProvider>
//     </TailingDataProvider>
function App() {
  const [isLoggedIn, setLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const checkLoginStatus = async () => {
    try {
      const token = await getToken();
      console.log('checkLoginStatus - token:', token);
      setLoggedIn(!!token);
    } catch (error) {
      console.error('토큰 확인 실패:', error);
      setLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkLoginStatus();
    
    // 앱이 포어그라운드로 돌아올 때마다 로그인 상태 확인
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        checkLoginStatus();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  if (isLoading) {
    // 스플래시 or 로딩 화면
    return null;
  }
  return (
    <BLEProvider>
      <TailingDataProvider>
        <NavigationContainer>
        {isLoggedIn ? (
          <Tab.Navigator
            screenOptions={{
              tabBarIcon: () => null,
              tabBarActiveTintColor: '#000',
              tabBarInactiveTintColor: '#9ca3af',
             
              // contentStyle: { backgroundColor: '#fff' }, // ← 전체 화면 배경

            }}>
            {/* <Tab.Screen
              name="DeviceNameManager"
              component={DeviceNameManager}
              options={{ title: '디바이스 모니터링' }}
            />
            <Tab.Screen
              name="ServerFileList"
              component={ServerFileList}
              options={{ title: '디바이스 모니터링' }}
            />
            <Tab.Screen
              name="TailingDeviceList"
              component={TailingDeviceList}
              options={{ title: '디바이스 목록' }}
            /> */}
            {/* <Tab.Screen
              name="TailingData"
              component={TailingData}
              options={{ title: '데이터' }}
            /> */}
            {/* <Tab.Screen
              name="TailingDashBoard"
              component={TailingDashBoard}
              options={{ title: '모니터링' }}
            /> */}
            {/* <Tab.Screen
              name="TailingDeviceMonitor"
              component={TailingDeviceMonitor}
              options={{ title: '디바이스 모니터링' }}
            /> */}
            {/* <Tab.Screen
              name="Tailing1TextDisplay"
              component={Tailing1TextDisplay}
              options={{ title: '디바이스 모니터링' }}
            /> */}
            <Tab.Screen
              name="BLEConnection"
              component={BLEConnection}
              options={{ title: 'BLE 연결' }}
            />
            <Tab.Screen
              name="Profile"
              component={Profile}
              options={{ title: '내 정보' }}
            />
          </Tab.Navigator>

        ) : (
          <Stack.Navigator>
            <Stack.Screen
              name="로그인"
              component={Login}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Join"
              component={Join}
              options={{ title: '회원가입' }}
            />
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </TailingDataProvider>
    </BLEProvider>
  );
}

export default App;



// App.tsx
// import * as React from 'react';
// import { useState } from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';

// import Orders from './src/pages/Orders';
// import TailingDeviceList from './src/pages/TailingDeviceList';
// import TailingDeviceMonitor from './src/pages/TailingDeviceMonitor';
// import { TailingDataProvider } from './src/contexts/TailingDataContext';
// import TailingDashBoard from './src/pages/TailingDashBoard';
// import TailingData from './src/pages/TailingData';
// import Tailing1TextDisplay from './src/pages/Tailing1TextDisplay';
// import ServerFileList from './src/pages/ServerFileList';
// import DeviceNameManager from './src/pages/DeviceNameManager';
// import Join from './src/pages/Join';
// import Login from './src/pages/Login';

// // ─────────────────────────────
// // 타입 정의
// // ─────────────────────────────

// // 각 스택의 파라미터
// export type MonitorStackParamList = {
//   ServerFileList: undefined;
//   TailingDeviceList: undefined;
//   TailingDashBoard: { deviceId: string; deviceName: string };
//   TailingDeviceMonitor: undefined;
//   Tailing1TextDisplay: undefined;
//   TailingData: { screen: string; data: { hrData: number | null; spo2Data: number | null; tempData: number | null } };
//   Join: undefined;
//   Login: undefined;
// };

// export type DevicesStackParamList = {
//   DeviceNameManager: undefined;
// };

// // 탭 파라미터
// export type RootTabParamList = {
//   Monitor: undefined; // 서버파일/모니터링 흐름
//   Devices: undefined; // 기기 이름 관리
// };

// // ─────────────────────────────
// // 스택 생성
// // ─────────────────────────────
// const MonitorStack = createNativeStackNavigator<MonitorStackParamList>();
// const DevicesStack = createNativeStackNavigator<DevicesStackParamList>();
// const Tab = createBottomTabNavigator<RootTabParamList>();

// // 모니터링용 스택 (ServerFileList 탭 안에서 이동)
// function MonitorStackScreen() {
//   return (
//     <MonitorStack.Navigator
//       screenOptions={{ contentStyle: { backgroundColor: '#fff' } }}
//     >
//       <MonitorStack.Screen
//         name="Login"
//         component={Login}
//         options={{ title: '로그인' }}
//       />
//       <MonitorStack.Screen
//         name="Join"
//         component={Join}
//         options={{ title: '회원가입' }}
//       />
//       <MonitorStack.Screen
//         name="ServerFileList"
//         component={ServerFileList}
//         options={{ title: '서버 파일' }}
//       />
//       <MonitorStack.Screen
//         name="TailingDeviceList"
//         component={TailingDeviceList}
//         options={{ title: '디바이스 목록' }}
//       />
//       <MonitorStack.Screen
//         name="TailingDashBoard"
//         component={TailingDashBoard}
//         options={{ title: '모니터링' }}
//       />
//       <MonitorStack.Screen
//         name="TailingDeviceMonitor"
//         component={TailingDeviceMonitor}
//         options={{ title: '디바이스 모니터링' }}
//       />
//       <MonitorStack.Screen
//         name="Tailing1TextDisplay"
//         component={Tailing1TextDisplay}
//         options={{ title: '텍스트 표시' }}
//       />
//       <MonitorStack.Screen
//         name="TailingData"
//         component={TailingData}
//         options={{ title: '데이터' }}
//       />
//     </MonitorStack.Navigator>
//   );
// }

// // 기기이름관리용 스택 (DeviceNameManager 탭 안에서 이동 확장 가능)
// function DevicesStackScreen() {
//   return (
//     <DevicesStack.Navigator
//       screenOptions={{ contentStyle: { backgroundColor: '#fff' } }}
//     >
//       <DevicesStack.Screen
//         name="DeviceNameManager"
//         component={DeviceNameManager}
//         options={{ title: '기기 이름 관리' }}
//       />
//     </DevicesStack.Navigator>
//   );
// }

// // ─────────────────────────────
// // 최상위: 탭 내비게이터
// // ─────────────────────────────
// function App() {
//   const [isLoggedIn] = useState(false);

//   return (
//     <TailingDataProvider>
//       <NavigationContainer>
//         {isLoggedIn ? (
//           // (필요하면 로그인 후 탭을 보여주고, 아니면 아래 탭을 그대로 사용)
//           <Tab.Navigator>
//             <Tab.Screen name="Monitor" component={MonitorStackScreen} options={{ headerShown: false }} />
//             <Tab.Screen name="Devices" component={DevicesStackScreen} options={{ headerShown: false }} />
//           </Tab.Navigator>
//         ) : (
//           // 로그인 구분 없이 탭 사용하려면 위와 동일하게 탭만 두세요
//           <Tab.Navigator>
//             <Tab.Screen name="Monitor" component={MonitorStackScreen} options={{ headerShown: false }} />
//             <Tab.Screen name="Devices" component={DevicesStackScreen} options={{ headerShown: false }} />
//           </Tab.Navigator>
//         )}
//       </NavigationContainer>
//     </TailingDataProvider>
//   );
// }

// export default App;
