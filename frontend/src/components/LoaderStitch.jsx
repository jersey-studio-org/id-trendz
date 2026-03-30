import React from "react";

export default function LoaderStitch({ message = "We're stitching your jersey… 🪡✨" }) {
  return (
    <div className="loader-stitch">
      <div className="loader-ring">
        <span className="needle" aria-hidden="true">🪡</span>
      </div>
      <p className="loader-text" role="status" aria-live="polite">{message}</p>
    </div>
  );
}

