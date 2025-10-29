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
  tailingData: Record<string, SensorData[]>; 
  hubData: HubData | null;
  connectedHubs: Set<string>;
};

const TailingDataContext = createContext<TailingContextType>({ 
  tailingData: {} as any, 
  hubData: null,
  connectedHubs: new Set()
});
export const useTailingData = () => useContext(TailingDataContext);

export const TailingDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tailingData, setTailingData] = useState<Record<string, SensorData[]>>({});
  const [hubData, setHubData] = useState<HubData | null>(null);
  const [connectedHubs, setConnectedHubs] = useState<Set<string>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);

  // 🔹 초당 수십 번 들어오는 샘플을 즉시 setState하지 말고, 메모리 버퍼에 쌓았다가 주기적으로 한번에 반영
  const bufferRef = useRef<Record<string, SensorData[]>>({});
  const flushTimerRef = useRef<NodeJS.Timeout | null>(null);

  const flush = () => {
    const buf = bufferRef.current;
    bufferRef.current = {};                          // 비우고
    const keys = Object.keys(buf);
    if (keys.length === 0) return;

    setTailingData(prev => {
      const next = { ...prev };
      for (const id of keys) {
        const merged = [...(prev[id] || []), ...buf[id]];
        next[id] = merged.slice(-150);               // 마지막 150개만 유지
      }
      return next;
    });
  };

  useEffect(() => {
    // 🔹 소켓은 1회만 생성
    // const ws = new WebSocket('ws://192.168.0.100:81');
    // const ws = new WebSocket('ws://192.168.0.42:81');
    const ws = new WebSocket('ws://192.168.0.42:3080/ws');

    wsRef.current = ws;

    const onOpen = () => {
      console.log('✅ 허브와 WebSocket 연결됨');
      ws.send('앱에서 인사!');
    };

    const onMessage = (event: WebSocketMessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log("data", data);
        // 새로운 데이터 구조인지 확인 (hubs 프로퍼티가 있는지)
        if (data.hub) {
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
          
          // 각 디바이스의 데이터를 tailingData에 저장
          const newTailingData: Record<string, SensorData[]> = {};
          Object.values(data.hub).forEach((hub: any) => {
            Object.entries(hub.devices).forEach(([deviceId, deviceData]: [string, any]) => {
              if (deviceData.data) {
                newTailingData[deviceId] = [deviceData.data];
              }
            });
          });
          
          if (Object.keys(newTailingData).length > 0) {
            setTailingData(newTailingData);
          }
        } else {
          // 기존 CSV 형식 데이터 처리 (하위 호환성)
          const parts = String(event.data).split(',');
          if (parts.length !== 9) return;

          const [deviceId, seq, v1, v2, v3, v4, v5, v6, v7] = parts;
          const parsed: SensorData = {
            timestamp: Date.now(),
            cnt: Number(seq),
            ir: Number(v1), red: Number(v2), green: Number(v3),
            hr: Number(v4), spo2: Number(v5), temp: Number(v6), battery: Number(v7),
          };

          // 🔹 버퍼에만 쌓기
          const buf = bufferRef.current;
          (buf[deviceId] ||= []).push(parsed);

          // 🔹 50~100ms마다 배치 반영 (너무 자주 setState 하지 않도록)
          if (!flushTimerRef.current) {
            flushTimerRef.current = setTimeout(() => {
              flushTimerRef.current = null;
              flush();
            }, 80); // 필요에 따라 조절
          }
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
      if (flushTimerRef.current) { clearTimeout(flushTimerRef.current); flushTimerRef.current = null; }
      bufferRef.current = {};
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
    <TailingDataContext.Provider value={{ tailingData, hubData, connectedHubs }}>
      {children}
    </TailingDataContext.Provider>
  );
};
