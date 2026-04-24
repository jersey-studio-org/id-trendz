import { Link, Navigate, useParams } from 'react-router-dom';
import SchoolProductPreview from '../components/SchoolProductPreview';
import { getDivisionBySlug, getRegionBySlugs, getSchoolBySlugs } from '../data/schoolCatalog';

export default function SchoolPage() {
  const { divisionSlug, regionSlug, schoolSlug } = useParams();
  const division = getDivisionBySlug(divisionSlug);
  const region = getRegionBySlugs(divisionSlug, regionSlug);
  const school = getSchoolBySlugs(divisionSlug, regionSlug, schoolSlug);

  if (!division || !region || !school) {
    return <Navigate to="/schools" replace />;
  }

  return (
    <div className="school-profile-page">
      <div className="site-container">
        <nav className="school-breadcrumbs" aria-label="Breadcrumb">
          <Link to="/schools">Schools</Link>
          <span>/</span>
          <Link to={`/schools?division=${division.slug}`}>{division.name}</Link>
          <span>/</span>
          <Link to={`/schools?division=${division.slug}#${region.id}`}>{region.name}</Link>
          <span>/</span>
          <span>{school.name}</span>
        </nav>

        <section className="school-profile-hero animate-fade-up">
          <div className="school-profile-copy">
            <h1>{school.name}</h1>
            <p className="school-profile-subtitle">
              Shop custom jerseys for {school.name} and head into the designer when you&apos;re ready.
            </p>
          </div>

          <div className="school-profile-art-panel">
            <SchoolProductPreview school={school} />
          </div>
        </section>

        <section className="school-merch-section animate-fade-up" style={{ animationDelay: '0.12s' }}>
          <div className="section-intro">
            <p className="eyebrow">Collection</p>
            <h2>Apparel</h2>
            <p>Select a product to start customizing for {school.name}.</p>
          </div>

          <div className="school-card-grid">
            {/* ── Active Jersey Product ── */}
            <article className="school-card animate-card-in" style={{ animationDelay: '0.18s' }}>
              <SchoolProductPreview school={school} />
              <div className="school-card-body">
                <p className="school-card-type">Jersey</p>
                <h4>{school.name}</h4>
                <p className="school-card-meta">Customizable</p>
              </div>
              <div className="school-card-actions">
                <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>${school.price.toFixed(2)}</div>
                <Link className="button-primary" to={`/customize/${school.productId}`}>
                  Customize
                </Link>
              </div>
            </article>

            {/* ── Coming Soon Products ── */}
            {[
              { label: 'Caps', icon: '🧢' },
              { label: 'Hoodies', icon: '🧥' },
              { label: 'T-Shirts', icon: '👕' },
            ].map(({ label, icon }, index) => (
              <article
                key={label}
                className="school-card animate-card-in"
                style={{
                  animationDelay: `${0.18 + (index + 1) * 0.06}s`,
                  opacity: 0.6,
                  cursor: 'not-allowed',
                  filter: 'grayscale(0.4)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '140px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '56px',
                    background: 'var(--bg-secondary, #f3f4f6)',
                  }}
                >
                  {icon}
                </div>
                <div className="school-card-body">
                  <p className="school-card-type">Coming Soon</p>
                  <h4>{label}</h4>
                </div>
                <div className="school-card-actions" style={{ justifyContent: 'flex-end' }}>
                  <button
                    disabled
                    className="button-primary"
                    style={{ opacity: 0.5, cursor: 'not-allowed' }}
                  >
                    Coming Soon
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
