"use client";

import Tree from "@/components/tree";
import supabase from "@/libs/db";
import { ITree } from "@/types/tree";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const [trees, setTrees] = useState<ITree[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Use refs to track state and prevent race conditions
  const fetchingRef = useRef(false);
  const mountedRef = useRef(true);
  const lastFetchTimeRef = useRef(0);
  const authCheckedRef = useRef(false);

  // Memoized fetch function to prevent recreating on every render
  const fetchTrees = useCallback(async (userId: string) => {
    // Prevent multiple simultaneous calls
    if (fetchingRef.current || !mountedRef.current) {
      console.log("Fetch prevented - already in progress or unmounted");
      return;
    }

    // Throttle requests - minimum 2 seconds between calls
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 2000) {
      console.log("Fetch throttled - too soon since last request");
      return;
    }

    try {
      fetchingRef.current = true;
      setLoading(true);
      setError(null);
      lastFetchTimeRef.current = now;

      console.log("Fetching trees for user:", userId);

      const { data, error } = await supabase
        .from("trees")
        .select("*")
        .eq("user_id", userId);

      if (!mountedRef.current) return; // Component unmounted

      if (error) {
        console.error("Error fetching trees:", error);
        setError(error.message || "Failed to fetch trees");
        throw error;
      } else {
        setTrees(data as ITree[]);
        console.log("Trees loaded successfully:", data.length);
      }
    } catch (error: any) {
      if (!mountedRef.current) return;
      console.error("Unexpected error fetching trees:", error);
      setError(error.message || "Network error occurred");
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      fetchingRef.current = false;
    }
  }, []);

  // Simplified auth check
  useEffect(() => {
    if (authCheckedRef.current) return;
    
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!mountedRef.current) return;

        if (error || !session) {
          console.log("No valid session, redirecting to auth");
          router.push("/auth");
          return;
        }

        setUser(session.user);
        setAuthLoading(false);
        authCheckedRef.current = true;

        // Initial fetch
        await fetchTrees(session.user.id);
      } catch (error) {
        console.error("Auth check error:", error);
        if (mountedRef.current) {
          router.push("/auth");
        }
      }
    };

    checkAuth();
  }, [router, fetchTrees]);

  // Separate effect for auth state changes (only listen, don't fetch immediately)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);

        if (!mountedRef.current) return;

        if (event === "SIGNED_OUT" || !session) {
          setUser(null);
          setTrees([]);
          setAuthLoading(false);
          router.push("/auth");
        } else if (event === "SIGNED_IN" && session && !authCheckedRef.current) {
          // Only handle sign in if we haven't checked auth yet
          setUser(session.user);
          setAuthLoading(false);
          authCheckedRef.current = true;
          
          // Delay fetch to prevent race conditions
          setTimeout(() => {
            if (mountedRef.current) {
              fetchTrees(session.user.id);
            }
          }, 500);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router, fetchTrees]);

  // Simplified visibility change handler
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && !fetchingRef.current && authCheckedRef.current) {
        const now = Date.now();
        // Only refresh if more than 5 seconds since last fetch
        if (now - lastFetchTimeRef.current > 5000) {
          fetchTrees(user.id);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [user, fetchTrees]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      fetchingRef.current = false; // Stop any ongoing fetches
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error during logout:", error);
      }
    } catch (error) {
      console.error("Unexpected logout error:", error);
    }
  };

  // Loading screen for auth check
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

  // Show error state
  if (error) {
    return (
      <div
        style={{
          backgroundColor: "#1e1e1e",
          color: "#f1f1f1",
          padding: "2rem",
          borderRadius: "12px",
          textAlign: "center",
          margin: "2rem",
          fontFamily: "Poppins, system-ui, -apple-system, sans-serif",
          border: "1px solid rgba(239, 68, 68, 0.3)",
        }}
      >
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "18px", fontWeight: "600", color: "#ef4444" }}>
          Error Loading Family Tree
        </h3>
        <p style={{ margin: "0 0 1rem 0", opacity: "0.8", fontSize: "14px" }}>
          {error}
        </p>
        <button
          onClick={() => {
            setError(null);
            if (user) fetchTrees(user.id);
          }}
          style={{
            backgroundColor: "#4F46E5",
            color: "#fff",
            border: "none",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Main content
  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <div>
        {trees.length > 0 ? (
          <Tree 
            dataTree={trees[0]} 
            onUpdate={() => {
              if (user && !fetchingRef.current) {
                fetchTrees(user.id);
              }
            }} 
          />
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
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "18px", fontWeight: "600" }}>
              No Family Tree Found
            </h3>
            <p style={{ margin: "0", opacity: "0.8", fontSize: "14px" }}>
              You haven't created a family tree yet. Your tree data will appear here once created.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}