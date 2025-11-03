import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type NumericPoint = { timestamp: number; value: number };

export type DeviceSeries = {
  ir: NumericPoint[];
  hr: NumericPoint[];
  spo2: NumericPoint[];
  temp: NumericPoint[];
  battery: NumericPoint[];
  lastValid: {
    hr: number;
    spo2: number;
    temp: number;
    battery: number;
  };
};

export type TelemetryState = {
  // deviceId -> series
  byDeviceId: Record<string, DeviceSeries>;
  // 최대 유지 포인트 수
  maxPoints: number;
};

const initialState: TelemetryState = {
  byDeviceId: {},
  maxPoints: 200, // 필요 시 조정
};

type EnsureDevicePayload = { deviceId: string };

const ensureDevice = (state: TelemetryState, deviceId: string) => {
  if (!state.byDeviceId[deviceId]) {
    state.byDeviceId[deviceId] = {
      ir: [],
      hr: [],
      spo2: [],
      temp: [],
      battery: [],
      lastValid: { hr: 0, spo2: 0, temp: 0, battery: 0 },
    };
  }
  return state.byDeviceId[deviceId];
};

type AppendPointsPayload = {
  deviceId: string;
  key: keyof Omit<DeviceSeries, 'lastValid'>; // 'ir' | 'hr' | 'spo2' | 'temp' | 'battery'
  points: NumericPoint[];
};

type UpsertLastValidPayload = {
  deviceId: string;
  key: keyof DeviceSeries['lastValid']; // 'hr' | 'spo2' | 'temp' | 'battery'
  value: number; // 0이 아닌 유효값
};

export const telemetrySlice = createSlice({
  name: 'telemetry',
  initialState,
  reducers: {
    appendPoints(state, action: PayloadAction<AppendPointsPayload>) {
      const { deviceId, key, points } = action.payload;
      const device = ensureDevice(state, deviceId);
      const merged = [...device[key], ...points];
      device[key] = merged.slice(-state.maxPoints);
    },
    upsertLastValid(state, action: PayloadAction<UpsertLastValidPayload>) {
      const { deviceId, key, value } = action.payload;
      const device = ensureDevice(state, deviceId);
      if (value > 0) {
        device.lastValid[key] = value;
      }
    },
    resetDevice(state, action: PayloadAction<EnsureDevicePayload>) {
      const { deviceId } = action.payload;
      delete state.byDeviceId[deviceId];
    },
    setMaxPoints(state, action: PayloadAction<number>) {
      state.maxPoints = Math.max(10, action.payload);
    },
  },
});

export const { appendPoints, upsertLastValid, resetDevice, setMaxPoints } = telemetrySlice.actions;

export default telemetrySlice;


