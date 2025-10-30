import * as React from 'react';
import { Provider } from 'react-redux';
import store from './src/store';
import AppInner from './AppInner';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { TailingDataProvider } from './src/contexts/TailingDataContext';

function App() {
  return(
    <Provider store={store}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <NavigationContainer>
        <TailingDataProvider>
          <AppInner />
        </TailingDataProvider>
      </NavigationContainer>
    </Provider>
  )
}
export default App;


