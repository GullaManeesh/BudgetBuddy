import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RedirectIfAuth({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080810] flex items-center justify-center text-purple-400">
        Loading...
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
