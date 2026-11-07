import { createContext, useContext } from "react";

export const AuthContext = createContext(null);
export const ToastContext = createContext(null);
export const ConfirmContext = createContext(null);
export const AdminThemeContext = createContext(null);

function use(context, name) {
  const value = useContext(context);
  if (!value) throw new Error(`${name} must be used inside its provider`);
  return value;
}

export const useAuth = () => use(AuthContext, "useAuth");
export const useToast = () => use(ToastContext, "useToast");
export const useConfirm = () => use(ConfirmContext, "useConfirm");
export const useAdminTheme = () => use(AdminThemeContext, "useAdminTheme");
