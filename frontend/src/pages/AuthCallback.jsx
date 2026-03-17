import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function AuthCallback() {
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      loginWithToken(token)
        .then(() => {
          toast.dismiss("google-auth");
          toast.success("Login successful");
          navigate("/dashboard", { replace: true });
        })
        .catch(() => {
          toast.dismiss("google-auth");
          toast.error("Login failed. Please try again.");
          navigate("/login?error=auth_failed", { replace: true });
        });
    } else {
      toast.dismiss("google-auth");
      toast.error("Login failed. Missing auth token.");
      navigate("/login?error=auth_failed", { replace: true });
    }
  }, [loginWithToken, navigate]);

  return (
    <div className="min-h-screen bg-[#080810] flex items-center justify-center">
      <div className="text-purple-400 text-lg animate-pulse">
        Signing you in…
      </div>
    </div>
  );
}
