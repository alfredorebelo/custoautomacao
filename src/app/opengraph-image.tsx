import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f3efe4",
          color: "#1b2421",
          padding: 64,
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          <div style={{ width: 28, height: 64, background: "#0f5c56", borderRadius: 6 }} />
          <div style={{ width: 28, height: 108, background: "#c9852a", borderRadius: 6 }} />
          <div style={{ width: 28, height: 84, background: "#8d3d2c", borderRadius: 6 }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 72, lineHeight: 1 }}>CustoAutomação</div>
          <div style={{ fontSize: 32, color: "#0f5c56" }}>Tarefas, créditos e execuções, cada um na sua conta.</div>
        </div>
      </div>
    ),
    size,
  );
}
