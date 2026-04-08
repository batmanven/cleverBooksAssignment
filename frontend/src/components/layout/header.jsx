import { Search, User, Settings } from "lucide-react";

const Header = ({ title }) => {
  return (
    <header
      style={{
        height: "80px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 2rem",
        position: "sticky",
        top: 0,
        zIndex: 90,
        backdropFilter: "blur(8px)",
      }}
    >
      <h2 style={{ fontSize: "1.25rem", fontWeight: "600" }}>{title}</h2>

      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
        <div style={{ position: "relative" }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
            }}
          />
          <input
            type="text"
            placeholder="Search AWB..."
            className="glass"
            style={{
              padding: "0.625rem 1rem 0.625rem 2.5rem",
              borderRadius: "0.75rem",
              border: "1px solid var(--panel-border)",
              outline: "none",
              color: "white",
              fontSize: "0.875rem",
              width: "280px",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            className="glass"
            style={{
              padding: "0.625rem",
              borderRadius: "0.75rem",
              border: "1px solid var(--panel-border)",
              cursor: "pointer",
              color: "white",
            }}
          >
            <Settings size={18} />
          </button>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "0.75rem",
              background:
                "linear-gradient(135deg, var(--primary), var(--accent))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <User size={20} color="white" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
