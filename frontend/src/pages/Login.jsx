import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { WalletCards } from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (searchParams.get("error") === "auth_failed") {
      const reason = searchParams.get("reason");
      toast.error(
        reason
          ? `Login failed: ${decodeURIComponent(reason)}`
          : "Login failed. Please try again.",
      );
    }
  }, [searchParams]);

  const handleGoogleLogin = () => {
    toast.loading("Redirecting to Google...", { id: "google-auth" });
    window.location.href = `${API_BASE.replace("/api", "")}/api/auth/google`;
  };

  return (
    <div className="min-h-screen bg-[#080810] flex items-center justify-center overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-700 opacity-20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-violet-500 opacity-15 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-xl">
              <WalletCards className="w-5 h-5 text-white" />
            </div>
            <span className="text-white text-2xl font-bold tracking-tight">
              BudgetBuddy
            </span>
          </div>

          <h1 className="text-white text-3xl font-bold mb-2">Welcome back</h1>
          <p className="text-white/40 text-sm mb-10">
            Sign in to manage your finances
          </p>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white/10 hover:bg-white/15 border border-white/10 hover:border-purple-500/50 text-white font-medium py-3.5 rounded-2xl transition-all duration-200 cursor-pointer">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </motion.button>

          <p className="text-white/20 text-xs text-center mt-8">
            By continuing you agree to our Terms & Privacy Policy
          </p>
        </div>
      </motion.div>
    </div>
  );
}
