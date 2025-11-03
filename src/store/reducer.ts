import { combineReducers } from 'redux';

import userSlice from '../slices/user';
import telemetrySlice from '../slices/telemetry';


const rootReducer = combineReducers({
  user: userSlice.reducer,
  telemetry: telemetrySlice.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;