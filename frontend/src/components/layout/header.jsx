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

  
    </header>
  );
};

export default Header;
