import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

export type SensorData = {
  timestamp: number; cnt: number; ir: number; red: number; green: number;
  spo2: number; hr: number; temp: number; battery: number;
};

export type HubData = {
  hub: {
    [hubId: string]: {
      devices: {
        [deviceId: string]: {
          data: SensorData;
        };
      };
    };
  };
};

type TailingContextType = {
  hubData: HubData | null;
  connectedHubs: Set<string>;
  rawWebSocketData: any; // 웹소켓에서 받은 원본 데이터
};

const TailingDataContext = createContext<TailingContextType>({
  hubData: null,
  connectedHubs: new Set(),
  rawWebSocketData: null
});
export const useTailingData = () => useContext(TailingDataContext);

export const TailingDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hubData, setHubData] = useState<HubData | null>(null);
  const [connectedHubs, setConnectedHubs] = useState<Set<string>>(new Set());
  const [rawWebSocketData, setRawWebSocketData] = useState<any>(null); // 원본 데이터 저장
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // 🔹 소켓은 1회만 생성
    // const ws = new WebSocket('ws://192.168.0.100:81');
    // const ws = new WebSocket('ws://192.168.0.42:81');
    // const ws = new WebSocket('ws://192.168.0.42:3080/ws');
    const ws = new WebSocket('ws://192.168.150.168:3080/ws');
    // const ws = new WebSocket('ws://49.50.132.197:3080/ws');

    wsRef.current = ws;

    const onOpen = () => {
      console.log('✅ 허브와 WebSocket 연결됨');
      ws.send('앱에서 인사!');
    };

    const onMessage = (event: WebSocketMessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log("data", data);

        // 원본 데이터를 그대로 저장
        setRawWebSocketData(data);

        // 새로운 데이터 형식: { deviceAddress: "df:55:8f:05:61:55", deviceData: [...] }
        if (data.deviceAddress && Array.isArray(data.deviceData)) {
          const deviceAddress = data.deviceAddress;
          const deviceDataArray = data.deviceData;

          console.log(`📡 디바이스 ${deviceAddress}로부터 ${deviceDataArray.length}개 데이터 수신`);
        }
        // 구 형식 데이터 처리 (hub 프로퍼티가 있는지)
        else if (data.hub) {
          setHubData(data);

          // 연결된 허브 ID들을 추출
          const hubIds = Object.keys(data.hub);
          setConnectedHubs(prev => {
            // 내용이 같으면 같은 Set 객체 반환 (리렌더링 방지)
            const prevArray = Array.from(prev).sort();
            const newArray = hubIds.sort();
            if (prevArray.length === newArray.length &&
              prevArray.every((id, idx) => id === newArray[idx])) {
              return prev;
            }
            return new Set(hubIds);
          });
        }
      } catch (error) {
        console.error("웹소켓 데이터 파싱 오류:", error);
      }
    };

    const onError = (e: any) => console.error('❌ WebSocket 에러', e?.message ?? e);
    const onClose = () => console.log('🔌 WebSocket 종료');

    ws.addEventListener('open', onOpen);
    ws.addEventListener('message', onMessage);
    ws.addEventListener('error', onError);
    ws.addEventListener('close', onClose);

    // 🔹 언마운트/리렌더 시 정리
    return () => {
      try {
        ws.removeEventListener('open', onOpen);
        ws.removeEventListener('message', onMessage);
        ws.removeEventListener('error', onError);
        ws.removeEventListener('close', onClose);
        ws.close();
      } catch { }
      wsRef.current = null;
    };
  }, []); // ✅ 의존성 빈 배열: 다시 등록되지 않게!

  // (선택) 포그라운드 복귀 시 누락분 동기화/재연결 트리거
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active' && wsRef.current == null) {
        // 필요하면 재연결 로직 추가
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <TailingDataContext.Provider value={{ hubData, connectedHubs, rawWebSocketData }}>
      {children}
    </TailingDataContext.Provider>
  );
};
