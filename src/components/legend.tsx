import React, { useState } from "react";

const legends = [
  { color: "#EAA64D", text: "Pria", type: "square" },
  { color: "#90D1CA", text: "Wanita", type: "square" },
  { color: "#C2A2F8", text: "Menikah", type: "line" },
  { color: "#FFC5BF", text: "Cerai", type: "line" },
  { color: "#60EDF7", text: "Anak Kandung", type: "line" },
  { color: "#FFF986", text: "Anak Angkat", type: "line" },
  { color: "#9ca3af", lineColor: "#45484f", text: "Meninggal Dunia", type: "border-dotted" },
];

export default function LegendPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "fixed", top: "80px", right: "20px", zIndex: 10000 }}>
      {/* Kalau panel tertutup → tampilkan tombol kecil */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "8px",
            border: "none",
            background: "#333333",
            color: "#fff",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
          }}
        >
          ‹
        </button>
      )}

      {/* Panel Legend */}
      {open && (
        <div
          style={{
            background: "rgba(20,20,20,0.95)",
            color: "#fff",
            borderRadius: "12px",
            padding: "16px",
            minWidth: "260px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
            fontFamily: "sans-serif",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "600" }}>LEGENDA</h3>
            <button
              onClick={() => setOpen(false)}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                border: "none",
                background: "#333",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              ›
            </button>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #444", marginBottom: "12px" }} />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px 16px",
            }}
          >
            {legends.map((item, idx) => (
              // <div key={idx} style={{ display: "flex", alignItems: "center" }}>
              //   <span
              //     style={{
              //       width: "18px",
              //       height: "18px",
              //       borderRadius: "6px",
              //       background: item.color,
              //       marginRight: "8px",
              //       display: "inline-block",
              //     }}
              //   />
              //   <span style={{ fontSize: "13px" }}>{item.text}</span>
              // </div>
              <div key={idx} style={{ display: "flex", alignItems: "center"}}>
                {item.type === "square" && (
                  <span
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "6px",
                      background: item.color,
                      marginRight: "8px",
                      display: "inline-block",
                    }}
                  />
                )}
                {/* <span style={{ fontSize: "13px" }}>{item.text}</span> */}
                {item.type === "line" && (
                  <span
                    style={{
                      width: "18px",
                      height: "2px",
                      background: item.color,
                      marginRight: "8px",
                      display: "inline-block",
                    }}
                  />
                )}
                {item.type === "border-dotted" && (
                  <span
                    style={{
                      width: "18px",
                      height: "18px",
                      border: `2px dotted ${item.lineColor}`,
                      background: item.color,
                      borderRadius: "6px",
                      marginRight: "8px",
                      display: "inline-block",
                    }}
                  />
                )}
                <span style={{ fontSize: "13px" }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
