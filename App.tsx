// import * as React from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { useState } from 'react';
// import TailingDeviceList from './src/pages/DeviceList.tsx';
// import { TailingDataProvider } from './src/contexts/TailingDataContext.tsx';
// import { BLEProvider } from './src/contexts/BleContext.tsx';
// import TailingDashBoard from './src/pages/TailingDashBoard.tsx';
// import Join from './src/pages/Join.tsx';
// import Login from './src/pages/Login.tsx';
// import Profile from './src/pages/Profile.tsx';
// import BLEConnection from './src/pages/BLEConnection.tsx';
// import HubList from './src/pages/HubList.tsx';
// import PetRegistration from './src/pages/PetRegistration.tsx';
// import PetList from './src/pages/PetList.tsx';
// import PetDetail from './src/pages/PetDetail.tsx';
// import CustomerService from './src/pages/CustomerService.tsx';
// import PrivacyPolicy from './src/pages/PrivacyPolicy.tsx';
// import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
// import { Provider, useSelector } from 'react-redux';
// import store from './src/store/index.ts';
// import { RootState } from './src/store/reducer.ts';
// import { useAppDispatch } from './src/store/index.ts';
// import Ionicons from 'react-native-vector-icons/Ionicons';

// export type LoggedInParamList = {
//   Orders: undefined;
// };

// interface Data {
//   hrData: number | null;
//   spo2Data: number | null;
//   tempData: number | null;
// }
// export type RootStackParamList = {
//   MainTabs: undefined;
//   TailingDeviceList: { hubId?: string; hubName?: string } | undefined;
//   TailingDeviceMonitor: undefined;
//   TailingDashBoard: { deviceId: string; deviceName: string };
//   TailingData: { screen: string; data: Data } | undefined;
//   Tailing1TextDisplay: undefined;
//   ServerFileList: undefined
//   DeviceNameManager: undefined
//   Profile: undefined;
//   Login: undefined;
//   Join: undefined;
//   로그인: undefined;
//   BLEConnection: undefined;
//   PetRegistration: undefined;
//   PetList: { deviceId?: string; deviceName?: string } | undefined;
//   PetDetail: any;
//   CustomerService: undefined;
//   PrivacyPolicy: undefined;
// };

// const Tab = createBottomTabNavigator();
// const Stack = createNativeStackNavigator<RootStackParamList>();

// // 메인 탭 네비게이터 컴포넌트
// function MainTabs() {
//   return (
//     <Tab.Navigator
//       screenOptions={{
//         tabBarActiveTintColor: '#F0663F',
//         tabBarInactiveTintColor: '#9ca3af',
//       }}>
//       <Tab.Screen
//         name="BLEConnection"
//         component={BLEConnection}
//         options={{
//           title: '허브 설정',
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="settings" size={size} color={color} />
//           ),
//         }}
//       />
//       <Tab.Screen
//         name="HubList"
//         component={HubList}
//         options={{
//           title: '허브 목록',
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="hardware-chip" size={size} color={color} />
//           ),
//         }}
//       />
//       <Tab.Screen
//         name="PetList"
//         component={PetList}
//         options={{
//           title: '펫 목록',
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="paw" size={size} color={color} />
//           ),
//         }}
//       />
//       <Tab.Screen
//         name="Profile"
//         component={Profile}
//         options={{
//           title: '내 정보',
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="person" size={size} color={color} />
//           ),
//         }}
//       />
//     </Tab.Navigator>
//   );
// }

// function AppContent() {
//   const [isLoading, setIsLoading] = useState(true);
//   const isLoggedIn = useSelector((state: RootState) => !!state.user.accessToken);
//   const dispatch = useAppDispatch();

//   return (
//     <SafeAreaProvider>
//       <BLEProvider>
//         <TailingDataProvider>
//           <NavigationContainer>
//             {isLoggedIn ? (
//               // 로그인 완료 - 메인 탭 화면
//               <Stack.Navigator screenOptions={{ headerShown: false }}>
//                 <Stack.Screen name="MainTabs" component={MainTabs} />
//                 <Stack.Screen
//                   name="PetRegistration"
//                   component={PetRegistration}
//                   options={{
//                     title: '펫 등록',
//                     headerShown: true,
//                     headerBackTitle: '펫 목록'
//                   }}
//                 />
//                 <Stack.Screen
//                   name="PetList"
//                   component={PetList}
//                   options={{
//                     title: '펫 선택',
//                     headerShown: true,
//                     headerBackTitle: '디바이스 목록'
//                   }}
//                 />
//                 <Stack.Screen
//                   name="PetDetail"
//                   component={PetDetail}
//                   options={{
//                     title: '펫 상세',
//                     headerShown: true,
//                     headerBackTitle: '펫 목록'
//                   }}
//                 />
//                 <Stack.Screen
//                   name="TailingDeviceList"
//                   component={TailingDeviceList}
//                   options={{
//                     title: '디바이스 목록',
//                     headerShown: true,
//                     headerBackTitle: '등록된 허브'
//                   }}
//                 />
//                 <Stack.Screen
//                   name="TailingDashBoard"
//                   component={TailingDashBoard}
//                   options={{
//                     title: '대시보드',
//                     headerShown: true,
//                     headerBackTitle: '디바이스 목록'
//                   }}
//                 />
//                 <Stack.Screen
//                   name="CustomerService"
//                   component={CustomerService}
//                   options={{
//                     title: '고객센터',
//                     headerShown: true,
//                     headerBackTitle: '내 정보'
//                   }}
//                 />
//                 <Stack.Screen
//                   name="PrivacyPolicy"
//                   component={PrivacyPolicy}
//                   options={{
//                     title: '개인정보 처리방침',
//                     headerShown: true,
//                     headerBackTitle: '내 정보'
//                   }}
//                 />
//               </Stack.Navigator>
//             ) : (
//               // 로그인 전 - 로그인/회원가입 스택
//               <Stack.Navigator>
//                 <Stack.Screen
//                   name="로그인"
//                   component={Login}
//                   options={{ headerShown: false }}
//                 />
//                 <Stack.Screen
//                   name="Join"
//                   component={Join}
//                   options={{ title: '회원가입' }}
//                 />
//               </Stack.Navigator>
//             )}
//           </NavigationContainer>
//         </TailingDataProvider>
//       </BLEProvider>
//     </SafeAreaProvider>
//   );
// }

// function App() {
//   return (
//     <Provider store={store}>
//       <AppContent />
//     </Provider>
//   );
// }

// export default App;


import * as React from 'react';
import { Provider } from 'react-redux';
import store from './src/store';
import AppInner from './AppInner';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

function App() {
  return(
    <Provider store={store}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <NavigationContainer>
        <AppInner />
      </NavigationContainer>
    </Provider>
  )
}
export default App;


