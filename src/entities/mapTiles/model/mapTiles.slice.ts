import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type MapTilesUIState = {
  selectedCategoryId: string | null;
  filter: string;
};

const initialState: MapTilesUIState = {
  selectedCategoryId: null,
  filter: '',
};

const mapTilesUISlice = createSlice({
  name: 'mapTilesUI',
  initialState,
  reducers: {
    setSelectedCategoryId: (s, a: PayloadAction<string | null>) => {
      s.selectedCategoryId = a.payload;
    },
    setFilter: (s, a: PayloadAction<string>) => {
      s.filter = a.payload;
    },
  },
});

export const { setSelectedCategoryId, setFilter } = mapTilesUISlice.actions;
export default mapTilesUISlice.reducer;
