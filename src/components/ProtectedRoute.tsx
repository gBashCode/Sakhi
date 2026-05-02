import { Navigate, Outlet } from "react-router-dom";
import { useStore } from "@/lib/store";

export function ProtectedRoute() {
  const loggedIn = useStore((s) => s.loggedIn);
  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

export function AdminProtectedRoute() {
  const adminLoggedIn = useStore((s) => s.adminLoggedIn);
  if (!adminLoggedIn) {
    return <Navigate to="/admin/login" replace />;
  }
  return <Outlet />;
}
