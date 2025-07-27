"use client";

import { useState, useEffect } from "react";
import supabase from "@/libs/db";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        console.log("User already logged in, redirecting to admin");
        router.push("/admin");
      } else {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);

      if (event === "SIGNED_IN" && session) {
        router.push("/admin");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (isLogin) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
      } else if (data.session) {
        console.log("Login successful, session created");
        // Router.push akan dipanggil otomatis oleh onAuthStateChange
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      const user = data.user;
      if (!user) {
        setMessage("Registrasi berhasil, silakan cek email untuk verifikasi.");
        return;
      }

      // Masukkan data ke tabel profiles
      const { error: profileError } = await supabase.from("profiles").insert({
        id: user.id,
        username,
      });

      if (profileError) {
        setMessage(`Gagal insert profile: ${profileError.message}`);
        return;
      }

      // Buat data kosong di tabel trees
      const { error: treeError } = await supabase.from("trees").insert({
        user_id: user.id,
        name: "",
        description: "",
        file: JSON.stringify({}),
      });

      if (treeError) {
        setMessage(`Gagal buat data pohon: ${treeError.message}`);
        return;
      }

      setMessage("Registrasi berhasil! Silakan login.");
      setIsLogin(true);
    }
  };

  if (loading) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
          
          @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
              0%, 100% { opacity: 0.9; }
              50% { opacity: 0.5; }
          }
          
          .spinner {
              animation: spin 1s linear infinite;
          }
          
          .pulse-text {
              animation: pulse 2s ease-in-out infinite;
          }
        `}</style>
        <div
          style={{
            backgroundColor: "#0F0F11",
            height: "100vh",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontFamily: "Poppins, system-ui, -apple-system, sans-serif",
            position: "relative",
          }}
        >

          <div
            className="spinner"
            style={{
              width: "60px",
              height: "60px",
              border: "3px solid rgba(255, 255, 255, 0.1)",
              borderTop: "3px solid #4F46E5",
              borderRadius: "50%",
              marginBottom: "24px",
            }}
          ></div>
          <div
            className="pulse-text"
            style={{
              fontSize: "18px",
              fontWeight: "500",
              opacity: "0.9",
            }}
          >
            Loading...
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h1>{isLogin ? "Login" : "Register"}</h1>

        <label htmlFor="email">Email:</label>
        <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label htmlFor="password">Password:</label>
        <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

        {!isLogin && (
          <>
            <label htmlFor="username">Username:</label>
            <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </>
        )}

        {message && <p className="message">{message}</p>}

        <button type="submit">{isLogin ? "Login" : "Register"}</button>

        <p className="toggle">
          {isLogin ? "Belum punya akun?" : "Sudah punya akun?"} <span onClick={() => setIsLogin(!isLogin)}>{isLogin ? "Daftar" : "Login"}</span>
        </p>
      </form>
    </div>
  );
}
