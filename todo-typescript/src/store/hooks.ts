import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";
import type { RootState, AppDispatch } from "./store";

// Plain useDispatch/useSelector ki jagah in dono ko use karo,
// taake TypeScript ko state aur dispatch ki type khud pata chal jaye
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
