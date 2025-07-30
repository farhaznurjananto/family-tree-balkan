"use client";

import Tree from "@/components/tree";
import supabase from "@/libs/db";
import { ITree } from "@/types/tree";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const [trees, setTrees] = useState<ITree[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();

  // Perbaikan untuk race condition
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && !fetchingRef.current) {
        const now = Date.now();
        // Hanya refresh jika sudah lebih dari 3 detik sejak fetch terakhir
        if (now - lastFetchTime > 3000) {
          fetchTrees(user.id);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [user, lastFetchTime]);

  // Auth check dan session management
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          router.push("/auth");
          return;
        }

        if (!session) {
          console.log("No session found, redirecting to auth");
          router.push("/auth");
          return;
        }

        setUser(session.user);
        setAuthLoading(false);

        // Fetch trees setelah auth berhasil
        await fetchTrees(session.user.id);
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/auth");
      }
    };

    checkAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);

      if (event === "SIGNED_OUT" || !session) {
        setUser(null);
        setTrees([]);
        router.push("/auth");
      } else if (event === "SIGNED_IN" && session) {
        setUser(session.user);
        setAuthLoading(false);
        await fetchTrees(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  // Fetch trees berdasarkan user yang login
  const fetchTrees = async (userId: string) => {
    // Prevent multiple simultaneous calls
    if (fetchingRef.current) {
      console.log("Fetch already in progress, skipping...");
      return;
    }

    try {
      fetchingRef.current = true;
      setLoading(true);
      setError(null); // Clear previous errors
      setLastFetchTime(Date.now()); // Track waktu fetch

      console.log("Fetching trees for user:", userId);

      // Add timeout untuk network request
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), 10000));

      const fetchPromise = supabase.from("trees").select("*").eq("user_id", userId);

      const { data, error } = (await Promise.race([fetchPromise, timeoutPromise])) as any;

      if (error) {
        console.error("Error fetching trees:", error);
        setError(error.message || "Failed to fetch trees");
        throw error;
      } else {
        setTrees(data as ITree[]);
        console.log("Trees loaded successfully:", data.length);
      }
    } catch (error: any) {
      console.error("Unexpected error fetching trees:", error);
      setError(error.message || "Network error occurred");
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  // Logout function
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error during logout:", error);
      }
      // Router.push akan dipanggil otomatis oleh onAuthStateChange
    } catch (error) {
      console.error("Unexpected logout error:", error);
    }
  };

  // Loading screen untuk auth check
  if (authLoading) {
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
            Checking authentication...
          </div>
        </div>
      </>
    );
  }

  // Jika tidak ada user (fallback)
  if (!user) {
    return (
      <div
        style={{
          backgroundColor: "#0F0F11",
          height: "100vh",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontFamily: "Poppins, system-ui, -apple-system, sans-serif",
        }}
      >
        Redirecting to login...
      </div>
    );
  }

  // Loading trees data
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
          {/* Logout button */}
          {/* <button
            onClick={handleLogout}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              backgroundColor: "rgba(239, 68, 68, 0.8)",
              color: "#fff",
              border: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.3s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 1)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.8)";
            }}
          >
            Logout
          </button> */}

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
            Loading Family Tree...
          </div>
          <div
            style={{
              fontSize: "14px",
              opacity: "0.7",
              marginTop: "8px",
            }}
          >
            Welcome, {user.email}
          </div>
        </div>
      </>
    );
  }

  // Main content
  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/* Header dengan user info dan logout */}
      {/* <div
        style={{
          position: "fixed",
          top: "0",
          left: "0",
          right: "0",
          zIndex: 1000,
          backgroundColor: "rgba(15, 15, 17, 0.95)",
          backdropFilter: "blur(10px)",
          padding: "12px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div
          style={{
            color: "#fff",
            fontFamily: "Poppins, system-ui, -apple-system, sans-serif",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          Family Tree Dashboard - {user.email}
        </div>
        <button
          onClick={handleLogout}
          style={{
            backgroundColor: "rgba(239, 68, 68, 0.8)",
            color: "#fff",
            border: "none",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            transition: "all 0.3s ease",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 1)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.8)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Logout
        </button>
      </div> */}

      {/* Main content area */}
      <div>
        {trees.length > 0 ? (
          // <Tree dataTree={trees[0]} />
          <Tree dataTree={trees[0]} onUpdate={() => fetchTrees(user.id)} />
        ) : (
          <div
            style={{
              backgroundColor: "#1e1e1e",
              color: "#f1f1f1",
              padding: "2rem",
              borderRadius: "12px",
              textAlign: "center",
              margin: "2rem",
              fontFamily: "Poppins, system-ui, -apple-system, sans-serif",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "18px", fontWeight: "600" }}>No Family Tree Found</h3>
            <p style={{ margin: "0", opacity: "0.8", fontSize: "14px" }}>You haven't created a family tree yet. Your tree data will appear here once created.</p>
          </div>
        )}
      </div>
    </div>
  );
}