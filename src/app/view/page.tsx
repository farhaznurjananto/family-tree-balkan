"use client";

import React, { Component } from "react";
import FamilyTree from "@/app/view/viewTree";
import supabase from "@/libs/db";
import LegendPanel from "@/components/legend";

export default class App extends Component {
  state = {
    nodes: [],
    treeName: "",
    loading: true,
    error: null,
  };

  async componentDidMount() {
    try {
      const { data, error } = await supabase
        .from("trees")
        .select("name, file") // Fetch both name and file columns
        .limit(1)
        .single();

      if (error) throw error;

      // console.log("fetching data: ", data)

      const fileContent = data?.file;
      const treeName = data?.name || "Family Tree"; // Use fetched name or default

      // If fileContent is a stringified JSON, parse it
      const nodes = typeof fileContent === "string" ? JSON.parse(fileContent) : fileContent;

      // Add minimum 3 second loading time
      setTimeout(() => {
        this.setState({
          nodes,
          treeName,
          loading: false,
        });
      }, 3000);
    } catch (err) {
      console.error("Error loading data:", err);
      // Still show loading for 3 seconds even on error
      setTimeout(() => {
        this.setState({ error: err, loading: false });
      }, 3000);
    }
  }

  renderLoading() {
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
          {/* Animated spinner */}
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

          {/* Loading text with pulse animation */}
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
        </div>
      </>
    );
  }

  renderError() {
    return (
      <div
        style={{
          backgroundColor: "#1A1A1A",
          height: "100vh",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Poppins, system-ui, -apple-system, sans-serif",
          padding: "20px",
        }}
      >
        {/* Error icon */}
        <div
          style={{
            width: "80px",
            height: "80px",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "24px",
            border: "2px solid rgba(239, 68, 68, 0.3)",
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Error title */}
        <h2
          style={{
            color: "#EF4444",
            fontSize: "24px",
            fontWeight: "600",
            margin: "0 0 12px 0",
            textAlign: "center",
          }}
        >
          Oops! Something went wrong
        </h2>

        {/* Error description */}
        <p
          style={{
            color: "#9CA3AF",
            fontSize: "16px",
            textAlign: "center",
            maxWidth: "400px",
            lineHeight: "1.5",
            margin: "0 0 32px 0",
          }}
        >
          We couldn't load your family tree data. Please check your connection and try again.
        </p>

        {/* Retry button */}
        <button
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: "#4F46E5",
            color: "#fff",
            border: "none",
            padding: "12px 24px",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "500",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
          }}
          onMouseOver={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.backgroundColor = "#4338CA";
            target.style.transform = "translateY(-1px)";
            target.style.boxShadow = "0 6px 16px rgba(79, 70, 229, 0.4)";
          }}
          onMouseOut={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.backgroundColor = "#4F46E5";
            target.style.transform = "translateY(0)";
            target.style.boxShadow = "0 4px 12px rgba(79, 70, 229, 0.3)";
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  render() {
    const { nodes, treeName, loading, error } = this.state;

    if (loading) return this.renderLoading();
    if (error) return this.renderError();

    return (
      <div style={{ height: "100vh", width: "100%" }}>
        <LegendPanel />
        <FamilyTree nodes={nodes} treeName={treeName} />
      </div>
    );
  }
}
