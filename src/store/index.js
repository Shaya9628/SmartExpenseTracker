import { configureStore } from '@reduxjs/toolkit';
import transactionReducer from './slices/transactionSlice';

const store = configureStore({
  reducer: {
    transaction: transactionReducer,
  },
});

export default store;
