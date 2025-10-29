import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// action : state로 바꾸는 행위/동작
// dispatch : 그 액션을 실제로 실행하는 함수
// reducer : 액션이 실제로 실행되면 state를 바꾸는 로직 

const initialState = {
    id: '',
    email: '',
    accessToken: '', 
};
const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser(state, action) {
            state.id = action.payload.id;
            state.email = action.payload.email;
            state.accessToken = action.payload.accessToken;
        },
        setAccessToken(state, action) {
            state.accessToken = action.payload
        },
    },
    extraReducers: builder => { },
});

export default userSlice;