"use client";

import { useState } from "react";
import supabase from "@/libs/db";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(error.message);
      } else {
        router.push("/admin");
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
      setIsLogin(true); // switch ke form login setelah sukses
    }
  };

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
