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

        <section className="school-profile-hero">
          <div className="school-profile-copy">
            <p className="eyebrow">{division.name}</p>
            <h1>{school.name}</h1>
            <p className="school-profile-subtitle">
              Shop custom t-shirts for {school.name} and head into the designer when you&apos;re ready.
            </p>
            <div className="school-profile-meta">
              <div>
                <span className="school-profile-label">Region</span>
                <strong>{region.name}</strong>
              </div>
              <div>
                <span className="school-profile-label">Address</span>
                <strong>{school.address}</strong>
              </div>
              <div>
                <span className="school-profile-label">Mascot</span>
                <strong>{school.mascot}</strong>
              </div>
            </div>
          </div>

          <div className="school-profile-art-panel">
            <SchoolProductPreview school={school} />
          </div>
        </section>

        <section className="school-merch-section">
          <div className="section-intro">
            <p className="eyebrow">Collection</p>
            <h2>T-Shirts</h2>
            <p>Open the shirt for this school and start customizing.</p>
          </div>

          <article className="school-merch-card">
            <div className="school-merch-preview">
              <SchoolProductPreview school={school} />
            </div>
            <div className="school-merch-copy">
              <h3>{school.name} T-Shirt</h3>
              <p>Classic school spirit tee with customization available on the next screen.</p>
            </div>
            <div className="school-merch-actions">
              <div className="school-merch-price">${school.price.toFixed(2)}</div>
              <Link className="button-primary" to={`/customize/${school.productId}`}>
                Customize This Shirt
              </Link>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}
