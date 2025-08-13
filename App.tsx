import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Orders from './src/pages/Orders.tsx';
import { useState } from 'react';
import TailingDeviceList from './src/pages/TailingDeviceList.tsx';
import TailingDeviceMonitor from './src/pages/TailingDeviceMonitor.tsx';
import { TailingDataProvider } from './src/contexts/TailingDataContext.tsx';
import TailingDashBoard from './src/pages/TailingDashBoard.tsx';
import TailingData from './src/pages/TailingData.tsx';
import Tailing1TextDisplay from './src/pages/Tailing1TextDisplay.tsx';
import ServerFileList from './src/pages/ServerFileList.tsx';
import DeviceNameManager from './src/pages/DeviceNameManager.tsx';

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
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();
//  <TailingDataProvider>
//     </TailingDataProvider>
function App() {
  const [isLoggedIn, setLoggedIn] = useState(false);
  return (
    <TailingDataProvider>
      <NavigationContainer>
        {isLoggedIn ? (
          <Tab.Navigator>
            <Tab.Screen
              name="Orders"
              component={Orders}
              options={{ title: '오더 목록' }}
            />
          </Tab.Navigator>
        ) : (
          <Stack.Navigator
            screenOptions={{
              contentStyle: { backgroundColor: '#fff' }, // ← 전체 화면 배경
            }}>
            <Stack.Screen
              name="DeviceNameManager"
              component={DeviceNameManager}
              options={{ title: '디바이스 모니터링' }}
            />
            <Stack.Screen
              name="ServerFileList"
              component={ServerFileList}
              options={{ title: '디바이스 모니터링' }}
            />
            <Stack.Screen
              name="TailingDeviceList"
              component={TailingDeviceList}
              options={{ title: '디바이스 목록' }}
            />
            <Stack.Screen
              name="TailingData"
              component={TailingData}
              options={{ title: '데이터' }}
            />
            <Stack.Screen
              name="TailingDashBoard"
              component={TailingDashBoard}
              options={{ title: '모니터링' }}
            />
            <Stack.Screen
              name="TailingDeviceMonitor"
              component={TailingDeviceMonitor}
              options={{ title: '디바이스 모니터링' }}
            />
            <Stack.Screen
              name="Tailing1TextDisplay"
              component={Tailing1TextDisplay}
              options={{ title: '디바이스 모니터링' }}
            />
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </TailingDataProvider>
  );
}

export default App;