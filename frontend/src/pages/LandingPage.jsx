import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SchoolProductPreview from '../components/SchoolProductPreview';
import { SCHOOL_DIVISIONS } from '../data/schoolCatalog';
import heroImage from '@images/hero/hero-main.png';

const DEFAULT_DIVISION = 'middle';

export default function LandingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedDivisionSlug = searchParams.get('division') || DEFAULT_DIVISION;
  const searchQuery = searchParams.get('search') || '';
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const selectedDivision = useMemo(
    () => SCHOOL_DIVISIONS.find((division) => division.slug === selectedDivisionSlug) ?? SCHOOL_DIVISIONS[1],
    [selectedDivisionSlug],
  );

  const filteredRegions = useMemo(() => {
    if (!selectedDivision) return [];

    return selectedDivision.regions
      .map((region) => {
        const schools = !normalizedQuery
          ? region.schools
          : region.schools.filter((school) => {
              const haystack = [school.name, school.mascot, school.address, region.name].join(' ').toLowerCase();
              return haystack.includes(normalizedQuery);
            });

        return { ...region, schools };
      })
      .filter((region) => region.schools.length > 0);
  }, [normalizedQuery, selectedDivision]);

  const schoolCount = selectedDivision.regions.reduce((total, region) => total + region.schools.length, 0);
  const filteredCount = filteredRegions.reduce((total, region) => total + region.schools.length, 0);

  function updateQuery(nextDivision, nextSearch) {
    const params = new URLSearchParams(searchParams);

    if (nextDivision) {
      params.set('division', nextDivision);
    } else {
      params.delete('division');
    }

    if (typeof nextSearch === 'string' && nextSearch.length > 0) {
      params.set('search', nextSearch);
    } else {
      params.delete('search');
    }

    setSearchParams(params);
  }

  return (
    <div className="school-directory-page">
      <section
        className="directory-hero"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(15,23,42,0.88) 0%, rgba(15,23,42,0.68) 44%, rgba(15,23,42,0.42) 100%), url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="site-container directory-hero-inner">
          <div className="directory-hero-copy">
            <p className="eyebrow">Shop By School</p>
            <h1>Find your school and start designing.</h1>
            <p className="directory-hero-text">
              Browse by school level, narrow by region, and open a school page to shop its t-shirt collection.
            </p>
            <div className="directory-stats">
              <div className="directory-stat">
                <strong>{SCHOOL_DIVISIONS.length}</strong>
                <span>School levels</span>
              </div>
              <div className="directory-stat">
                <strong>{schoolCount}</strong>
                <span>Schools listed</span>
              </div>
              <div className="directory-stat">
                <strong>{selectedDivision.regions.length}</strong>
                <span>Regions</span>
              </div>
            </div>
          </div>

          <div className="directory-hero-panel">
            <div className="directory-filter-card">
              <label className="directory-search-label" htmlFor="school-search">
                Search schools
              </label>
              <input
                id="school-search"
                className="directory-search-input"
                type="text"
                value={searchQuery}
                onChange={(event) => updateQuery(selectedDivision.slug, event.target.value)}
                placeholder="Search by school, mascot, or city"
              />
              <p className="directory-helper-text">{filteredCount} schools in {selectedDivision.name}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="directory-shell">
        <div className="site-container">
          <div className="division-switcher" role="tablist" aria-label="School divisions">
            {SCHOOL_DIVISIONS.map((division) => {
              const isActive = division.slug === selectedDivision.slug;

              return (
                <button
                  key={division.slug}
                  type="button"
                  className={`division-pill ${isActive ? 'active' : ''}`}
                  onClick={() => updateQuery(division.slug, searchQuery)}
                >
                  <span>{division.name}</span>
                  <small>{division.badge}</small>
                </button>
              );
            })}
          </div>

          <div className="division-summary">
            <div>
              <h2>{selectedDivision.name}</h2>
              <p>{selectedDivision.description}</p>
            </div>
            {filteredRegions.length > 0 && (
              <div className="region-jump-links">
                {filteredRegions.map((region) => (
                  <a key={region.id} href={`#${region.id}`}>
                    {region.name}
                  </a>
                ))}
              </div>
            )}
          </div>

          {selectedDivision.regions.length === 0 ? (
            <div className="directory-empty-state">
              <h3>{selectedDivision.name} will appear here.</h3>
              <p>We&apos;ll add that school collection here next.</p>
            </div>
          ) : filteredRegions.length === 0 ? (
            <div className="directory-empty-state">
              <h3>No schools matched that search.</h3>
              <p>Try a school name, mascot, or city.</p>
            </div>
          ) : (
            <div className="region-sections">
              {filteredRegions.map((region) => (
                <section key={region.id} id={region.id} className="region-section">
                  <div className="region-header">
                    <div>
                      <p className="region-kicker">Region</p>
                      <h3>{region.name}</h3>
                    </div>
                    <span>{region.schools.length} schools</span>
                  </div>

                  <div className="school-card-grid">
                    {region.schools.map((school) => (
                      <article key={school.id} className="school-card">
                        <SchoolProductPreview school={school} />
                        <div className="school-card-body">
                          <p className="school-card-type">{selectedDivision.name}</p>
                          <h4>{school.name}</h4>
                          <p className="school-card-meta">{school.mascot} | {school.address}</p>
                        </div>
                        <div className="school-card-actions">
                          <Link
                            className="button-primary"
                            to={`/schools/${selectedDivision.slug}/${region.id}/${school.slug}`}
                          >
                            View School
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
