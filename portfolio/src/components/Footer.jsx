import React from "react";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <p>© {new Date().getFullYear()} Usman Qasim. All rights reserved.</p>
      </div>
    </footer>
  );
}
