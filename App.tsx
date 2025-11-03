import * as React from 'react';
import { Provider } from 'react-redux';
import store, { persistor } from './src/store';
import AppInner from './AppInner';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { TailingDataProvider } from './src/contexts/TailingDataContext';
import { PersistGate } from 'redux-persist/integration/react';

function App() {
  return(
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <NavigationContainer>
          <TailingDataProvider>
            <AppInner />
          </TailingDataProvider>
        </NavigationContainer>
      </PersistGate>
    </Provider>
  )
}
export default App;


