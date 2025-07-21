import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getTransactions as fetchTransactions } from '../../db/queries';

const initialState = {
  transactions: [],
  categories: [],
  banks: [],
  isLoading: false,
  error: null,
};

export const fetchAllTransactions = createAsyncThunk(
  'transactions/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchTransactions();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    addTransaction(state, action) {
      state.transactions.push(action.payload);
    },
    setCategories(state, action) {
      state.categories = action.payload;
    },
    setBanks(state, action) {
      state.banks = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllTransactions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllTransactions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions = action.payload;
      })
      .addCase(fetchAllTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setTransactions,
  addTransaction,
  setCategories,
  setBanks,
  setLoading,
  setError,
} = transactionSlice.actions;

export default transactionSlice.reducer;
