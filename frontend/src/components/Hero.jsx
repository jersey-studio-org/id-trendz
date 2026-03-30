// change: unified hero image — revert: git restore frontend/src/components/Hero.jsx
import { Link } from 'react-router-dom';
import heroImage from '@images/hero/hero-main.png';
import heroPlaceholder from '@images/hero/hero-placeholder.png';

export default function Hero() {
  const heroBgImage = heroImage || heroPlaceholder;
  const heroAlt = "Hero image showcasing custom jerseys";

  return (
    <section className="hero">
      <div 
        className="hero-bg" 
        role="img" 
        aria-label={heroAlt}
        style={{
          backgroundImage: `url(${heroBgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      ></div>
      <div className="site-container">
        <div className="hero-content">
          <h1 className="hero-headline">Design Your Perfect Jersey</h1>
          <p className="hero-subtext">
            Create custom jerseys with personalized names, numbers, and colors. 
            Choose from our premium collection and make it yours.
          </p>
          <div className="hero-ctas">
            <Link to="/#products" className="btn-primary">
              Shop Jerseys
            </Link>
            <Link to="/customize" className="btn-secondary">
              Start Customizing
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

