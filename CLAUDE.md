# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native application called **tailingAppHub** that monitors IoT sensor devices through real-time WebSocket connections. The app displays health monitoring data (heart rate, SpO2, temperature) from multiple IoT devices and manages server file downloads.

## Development Commands

```bash
# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS (requires bundle exec pod install first)
npm run ios

# Run tests
npm test

# Lint code
npm run lint
```

### iOS Development Setup
```bash
# Install Ruby dependencies (first time only)
bundle install

# Install CocoaPods dependencies (after native dependency changes)
bundle exec pod install
```

## Architecture

### Navigation Structure
- **Tab Navigation**: Two main tabs (Monitor, Devices)
- **Monitor Stack**: ServerFileList → TailingDeviceList → TailingDashBoard → TailingDeviceMonitor/TailingData
- **Devices Stack**: DeviceNameManager

### Core Components

#### Data Management
- **TailingDataContext**: Global state management for real-time sensor data via WebSocket
- Uses optimized batching (80ms intervals) to prevent excessive re-renders from high-frequency sensor data
- Maintains last 150 data points per device

#### Key Pages
- **ServerFileList**: Downloads CSV files from HTTP server (192.168.0.42:3060)
- **TailingDeviceList**: Lists available IoT devices
- **TailingDashBoard**: Main monitoring interface with HR/Temperature view toggle
- **TailingDeviceMonitor**: Real-time sensor data visualization
- **DeviceNameManager**: Device configuration management
- **Join/Login**: User authentication (currently bypassed)

### Configuration
- **WebSocket Server**: `ws://192.168.0.28:81` for real-time sensor data
- **HTTP API Server**: `http://192.168.0.42:3060` for file downloads
- **TypeScript**: Configured with React Native preset
- **Testing**: Jest with React Native testing library

### Data Flow
1. WebSocket receives comma-separated sensor data: `deviceId,seq,ir,red,green,hr,spo2,temp,battery`
2. TailingDataContext parses and buffers data
3. Components subscribe to context for real-time updates
4. CSV files downloaded via HTTP API for historical data

### Key Libraries
- **@react-navigation**: Tab and stack navigation
- **react-native-chart-kit**: Data visualization
- **axios**: HTTP requests
- **react-native-fs/react-native-blob-util**: File downloads
- **react-native-share**: File sharing functionality
- **react-native-vector-icons**: Icon library (Ionicons used for UI elements)
- **@react-native-async-storage/async-storage**: Local token/data storage

## Development Notes

### Network Configuration
Update IP addresses in:
- `src/contexts/TailingDataContext.tsx` (WebSocket server)
- `src/constant/contants.ts` (HTTP API server)
- `src/pages/ServerFileList.tsx` (API endpoint)

### Performance Considerations
- WebSocket data batching prevents UI blocking from high-frequency updates
- Device data limited to 150 recent samples to control memory usage
- File downloads use native modules for better performance

### Testing
- Basic Jest configuration with React Native preset
- Test files in `__tests__/` directory
- Use `npm test` to run test suite