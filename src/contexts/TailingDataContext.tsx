// import React, { createContext, useContext, useState, useEffect } from 'react';

// export type SensorData = {
//   timestamp: number;
//   cnt: number;
//   ir: number;
//   red: number;
//   green: number;
//   spo2: number;
//   hr: number;
//   temp: number;
//   battery: number;
// };

// type TailingContextType = {
//   tailingData: Record<string, SensorData[]>;
// };

// const TailingDataContext = createContext<TailingContextType>({
//   tailingData: {
//     tailing1: [],
//     tailing2: [],
//     tailing3: [],
//     tailing4: [],
//     tailing5: [],
//   },
// });

// export const useTailingData = () => useContext(TailingDataContext);

// export const TailingDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   // const [tailingData, setTailingData] = useState<Record<string, SensorData[]>>({
//   //   tailing1: [],
//   //   tailing2: [],
//   //   tailing3: [],
//   //   tailing4: [],
//   //   tailing5: [],
//   // });

//   const [tailingData, setTailingData] = useState<Record<string, SensorData[]>>({});

//   // console.log("tailingData", tailingData)

//   useEffect(() => {
//     const socket = new WebSocket("ws://192.168.0.28:81");
//     socket.onopen = () => {
//       console.log("✅ 허브와 WebSocket 연결됨");
//       socket.send("앱에서 인사!");
//     };

//     socket.onmessage = (event) => {
      
//       console.log(event.data)
//       const parts = event.data.split(',');
//       const deviceId = parts[0];
//       // console.log(parts)
//       if (parts.length !== 9) return;

//       const [, seq, val1, val2, val3, val4, val5, val6, val7] = parts;

//       // if (!['tailing1', 'tailing2', 'tailing3', 'tailing4', 'tailing5'].includes(deviceId)) return;

//       const parsed: SensorData = {
//         timestamp: Date.now(),
//         cnt: Number(seq),
//         ir: Number(val1),
//         red: Number(val2),
//         green: Number(val3),
//         hr: Number(val4),
//         spo2: Number(val5),
//         temp: Number(val6),
//         battery: Number(val7),
//       };

//       setTailingData(prev => {
//         const updated = [...(prev[deviceId] || []), parsed];
//         // console.log(updated)
//         return {
//           ...prev,
//           [deviceId]: updated.slice(-150), // 마지막 150개만 유지
//         };
//       });
//     };

//     socket.onerror = (e) => console.error("❌ WebSocket 에러", e.message);
//     socket.onclose = () => console.log("🔌 WebSocket 종료");

//     return () => socket.close();
//   }, []);

//   return (
//     <TailingDataContext.Provider value={{ tailingData }}>
//       {children}
//     </TailingDataContext.Provider>
//   );
// };


import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

export type SensorData = {
  timestamp: number; cnt: number; ir: number; red: number; green: number;
  spo2: number; hr: number; temp: number; battery: number;
};

type TailingContextType = { tailingData: Record<string, SensorData[]>; };

const TailingDataContext = createContext<TailingContextType>({ tailingData: {} as any });
export const useTailingData = () => useContext(TailingDataContext);

export const TailingDataProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [tailingData, setTailingData] = useState<Record<string, SensorData[]>>({});
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
        const merged = [ ...(prev[id] || []), ...buf[id] ];
        next[id] = merged.slice(-150);               // 마지막 150개만 유지
      }
      return next;
    });
  };

  useEffect(() => {
    // 🔹 소켓은 1회만 생성
    // const ws = new WebSocket('ws://192.168.0.100:81');
        const ws = new WebSocket('ws://192.168.0.28:81');

    wsRef.current = ws;

    const onOpen = () => {
      console.log('✅ 허브와 WebSocket 연결됨');
      ws.send('앱에서 인사!');
    };

    const onMessage = (event: WebSocketMessageEvent) => {
      console.log("event.data", event.data)
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
    };

    const onError = (e: any) => console.error('❌ WebSocket 에러', e?.message ?? e);
    const onClose = () => console.log('🔌 WebSocket 종료');

    ws.addEventListener('open', onOpen);
    ws.addEventListener('message', onMessage);
    ws.addEventListener('error', onError);
    ws.addEventListener('close', onClose);

    // 🔹 언마운트/리렌더 시 정리
    return () => {
      try { ws.removeEventListener('open', onOpen);
            ws.removeEventListener('message', onMessage);
            ws.removeEventListener('error', onError);
            ws.removeEventListener('close', onClose);
            ws.close(); } catch {}
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
    <TailingDataContext.Provider value={{ tailingData }}>
      {children}
    </TailingDataContext.Provider>
  );
};
