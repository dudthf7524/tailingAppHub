import AsyncStorage from '@react-native-async-storage/async-storage';

interface TokenData {
  device_code: string;
  org_email: string;
  access_token?: string;
  refresh_token?: string;
}

export const getToken = async (): Promise<TokenData | null> => {
  try {
    const tokenData = await AsyncStorage.getItem('token');
    return tokenData ? JSON.parse(tokenData) : null;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

export const setToken = async (tokenData: TokenData): Promise<void> => {
  try {
    await AsyncStorage.setItem('token', JSON.stringify(tokenData));
  } catch (error) {
    console.error('Error setting token:', error);
  }
};

export const removeToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('token');
  } catch (error) {
    console.error('Error removing token:', error);
  }
}; 