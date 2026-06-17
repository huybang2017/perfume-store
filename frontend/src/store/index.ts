import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import authReducer from './slices/authSlice';
import { baseApi } from './api/baseApi';
import './api/authApi';
import './api/productApi';
import './api/cartApi';
import './api/orderApi';
import './api/paymentApi';
import './api/voucherApi';
import './api/dashboardApi';
import './api/inventoryApi';
import './api/categoryApi';
import './api/brandApi';
import './api/userApi';
import './api/settingApi';
import './api/chatApi';
import './api/reviewApi';
import './api/notificationApi';
import './api/uploadApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
