import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function AuthCallback() {
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const withTimeout = (promise, ms) =>
      Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Auth request timed out")), ms),
        ),
      ]);

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      withTimeout(loginWithToken(token), 15000)
        .then(() => {
          if (cancelled) return;
          toast.dismiss("google-auth");
          toast.success("Login successful");
          navigate("/dashboard", { replace: true });
        })
        .catch((error) => {
          if (cancelled) return;
          const reason =
            error?.response?.data?.message || error?.message || "auth_failed";
          toast.dismiss("google-auth");
          toast.error(`Login failed: ${reason}`);
          navigate(
            `/login?error=auth_failed&reason=${encodeURIComponent(reason)}`,
            { replace: true },
          );
        });
    } else {
      toast.dismiss("google-auth");
      toast.error("Login failed. Missing auth token.");
      navigate("/login?error=auth_failed&reason=missing_token", {
        replace: true,
      });
    }

    return () => {
      cancelled = true;
    };
  }, [loginWithToken, navigate]);

  return (
    <div className="min-h-screen bg-[#080810] flex items-center justify-center">
      <div className="text-purple-400 text-lg animate-pulse">
        Signing you in…
      </div>
    </div>
  );
}
