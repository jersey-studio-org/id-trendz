// change: Design system footer placeholder; revert: remove file
export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="site-container">
        <p>&copy; {new Date().getFullYear()} IDTrendz. All rights reserved.</p>
      </div>
    </footer>
  );
}

