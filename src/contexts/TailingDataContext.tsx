import React, { createContext, useContext, useState, useEffect } from 'react';

export type SensorData = {
  timestamp: number;
  cnt: number;
  ir: number;
  red: number;
  green: number;
  spo2: number;
  hr: number;
  temp: number;
  battery: number;
};

type TailingContextType = {
  tailingData: Record<string, SensorData[]>;
};

const TailingDataContext = createContext<TailingContextType>({
  tailingData: {
    tailing1: [],
    tailing2: [],
    tailing3: [],
    tailing4: [],
    tailing5: [],
  },
});

export const useTailingData = () => useContext(TailingDataContext);

export const TailingDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tailingData, setTailingData] = useState<Record<string, SensorData[]>>({
    tailing1: [],
    tailing2: [],
    tailing3: [],
    tailing4: [],
    tailing5: [],
  });

  useEffect(() => {
    const socket = new WebSocket("ws://192.168.0.28:81");

    socket.onopen = () => {
      console.log("✅ 허브와 WebSocket 연결됨");
      socket.send("앱에서 인사!");
    };

    socket.onmessage = (event) => {
      console.log(event.data)
      const parts = event.data.split(',');
      console.log(parts)
      if (parts.length !== 9) return;

      const [deviceId, seq, val1, val2, val3, val4, val5, val6, val7] = parts;

      // if (!['tailing1', 'tailing2', 'tailing3', 'tailing4', 'tailing5'].includes(deviceId)) return;

      const parsed: SensorData = {
        timestamp: Date.now(),
        cnt: Number(seq),
        ir: Number(val1),
        red: Number(val2),
        green: Number(val3),
        hr: Number(val4),
        spo2: Number(val5),
        temp: Number(val6),
        battery: Number(val7),
      };

      setTailingData(prev => {
        const updated = [...(prev[deviceId] || []), parsed];
        console.log(updated)
        return {
          ...prev,
          [deviceId]: updated.slice(-150), // 마지막 50개만 유지
        };
      });
    };

    socket.onerror = (e) => console.error("❌ WebSocket 에러", e.message);
    socket.onclose = () => console.log("🔌 WebSocket 종료");

    return () => socket.close();
  }, []);

  return (
    <TailingDataContext.Provider value={{ tailingData }}>
      {children}
    </TailingDataContext.Provider>
  );
};