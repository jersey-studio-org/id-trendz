import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SchoolProductPreview from '../components/SchoolProductPreview';
import heroImage from '@images/hero/hero-main.png';
import { buildSchoolDirectory, loadStoreConfig } from '../utils/storeConfig';

export default function LandingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [divisions, setDivisions] = useState([]);
  const searchQuery = searchParams.get('search') || '';
  const normalizedQuery = searchQuery.trim().toLowerCase();

  useEffect(() => {
    let isMounted = true;
    document.body.dataset.page = 'directory';

    loadStoreConfig().then((config) => {
      if (isMounted) {
        setDivisions(buildSchoolDirectory(config));
      }
    });

    return () => {
      isMounted = false;

      if (document.body.dataset.page === 'directory') {
        delete document.body.dataset.page;
      }
    };
  }, []);

  const filteredRegions = useMemo(() => {
    const allRegions = divisions.flatMap((division) =>
      division.regions.map((region) => ({ ...region, divisionSlug: division.slug }))
    );

    return allRegions
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
  }, [divisions, normalizedQuery]);

  function updateQuery(nextSearch) {
    const params = new URLSearchParams(searchParams);

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
          <div className="directory-hero-copy animate-fade-up">
            <p className="eyebrow">Shop By School</p>
            <h1>Find your school and start designing.</h1>
            <p className="directory-hero-text">
              Find your school and shop authentic custom jerseys from our directory.
            </p>
          </div>

          <div className="directory-hero-panel animate-fade-up" style={{ animationDelay: '0.18s' }}>
            <div className="directory-filter-card">
              <label className="directory-search-label" htmlFor="school-search">
                Search schools
              </label>
              <input
                id="school-search"
                className="directory-search-input"
                type="text"
                value={searchQuery}
                onChange={(event) => updateQuery(event.target.value)}
                placeholder="Search by school, mascot, or city"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="directory-shell">
        <div className="site-container">
          {filteredRegions.length === 0 ? (
            <div className="directory-empty-state">
              <h3>No schools matched that search.</h3>
              <p>Try a school name, mascot, or city.</p>
            </div>
          ) : (
            <div className="region-sections" style={{ paddingTop: '32px' }}>
              {filteredRegions.map((region, regionIndex) => (
                <section key={`${region.divisionSlug}-${region.id}`} id={region.id} className="region-section">
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
                          <h4>{school.name}</h4>
                        </div>
                        <div className="school-card-actions">
                          <Link
                            className="button-primary"
                            to={`/schools/${region.divisionSlug}/${region.id}/${school.slug}`}
                          >
                            View Store
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
