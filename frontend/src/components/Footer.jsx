// change: Design system footer placeholder; revert: remove file
export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="site-container">
        <p>&copy; {new Date().getFullYear()} Jersey Studio. All rights reserved.</p>
      </div>
    </footer>
  );
}

