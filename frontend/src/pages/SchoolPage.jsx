import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import ProductImage from '../components/ProductImage';
import SchoolProductPreview from '../components/SchoolProductPreview';
import { getDivisionBySlug, getRegionBySlugs, getSchoolBySlugs, getSchoolConfigEntry, loadStoreConfig } from '../utils/storeConfig';

function buildFallbackCategories(school) {
  return [
    {
      id: 'apparel',
      name: 'Apparel',
      items: [
        {
          id: school.productId,
          title: `${school.name} Jersey`,
          type: 'Jersey',
          status: 'active',
          badge: 'Customizable',
          ctaLabel: 'Customize',
          image: school.image,
          offers: [],
        },
        {
          id: `${school.slug}-caps`,
          title: 'Caps',
          type: 'Coming Soon',
          status: 'coming_soon',
          badge: 'Coming Soon',
          ctaLabel: 'Coming Soon',
          offers: [],
        },
        {
          id: `${school.slug}-hoodies`,
          title: 'Hoodies',
          type: 'Coming Soon',
          status: 'coming_soon',
          badge: 'Coming Soon',
          ctaLabel: 'Coming Soon',
          offers: [],
        },
        {
          id: `${school.slug}-t-shirts`,
          title: 'T-Shirts',
          type: 'Coming Soon',
          status: 'coming_soon',
          badge: 'Coming Soon',
          ctaLabel: 'Coming Soon',
          offers: [],
        },
      ],
    },
  ];
}

function normalizeSchoolCategories(school, configEntry) {
  const categories = configEntry?.categories?.length ? configEntry.categories : buildFallbackCategories(school);

  return categories.map((category) => ({
    ...category,
    items: (category.items || []).map((item) => ({
      badge: item.status === 'active' ? 'Customizable' : 'Coming Soon',
      ctaLabel: item.status === 'active' ? 'Customize' : 'Coming Soon',
      image: item.image ?? (item.status === 'active' ? school.image : null),
      offers: [],
      ...item,
    })),
  }));
}

export default function SchoolPage() {
  const { divisionSlug, regionSlug, schoolSlug } = useParams();
  const [storeConfig, setStoreConfig] = useState(null);
  const division = getDivisionBySlug(storeConfig, divisionSlug);
  const region = getRegionBySlugs(storeConfig, divisionSlug, regionSlug);
  const school = getSchoolBySlugs(storeConfig, divisionSlug, regionSlug, schoolSlug);
  const [categories, setCategories] = useState(() => (school ? buildFallbackCategories(school) : []));

  useEffect(() => {
    let isMounted = true;

    loadStoreConfig().then((config) => {
      if (!isMounted) return;
      setStoreConfig(config);
      const nextSchool = getSchoolBySlugs(config, divisionSlug, regionSlug, schoolSlug);
      if (!nextSchool) return;
      const configEntry = getSchoolConfigEntry(config, nextSchool.slug);
      setCategories(normalizeSchoolCategories(nextSchool, configEntry));
    });

    return () => {
      isMounted = false;
    };
  }, [divisionSlug, regionSlug, schoolSlug]);

  if (storeConfig && (!division || !region || !school)) {
    return <Navigate to="/schools" replace />;
  }

  if (!school) {
    return null;
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
              Shop custom jerseys for {school.name} and head into the designer when you're ready.
            </p>
          </div>

          <div className="school-profile-art-panel">
            <SchoolProductPreview school={school} />
          </div>
        </section>

        {categories.map((category, categoryIndex) => (
          <section
            key={category.id}
            className="school-merch-section animate-fade-up"
            style={{ animationDelay: `${0.12 + categoryIndex * 0.06}s` }}
          >
            <div className="section-intro">
              <p className="eyebrow">Collection</p>
              <h2>{category.name}</h2>
              <p>Select a product to start customizing for {school.name}.</p>
            </div>

            <div className="school-card-grid">
              {category.items.map((item, index) => {
                const isActive = item.status === 'active';
                const imageSrc = item.image || item.images?.[0] || item.thumbnails?.[0] || null;

                return (
                  <article
                    key={item.id}
                    className="school-card animate-card-in"
                    style={{
                      animationDelay: `${0.18 + (index + 1) * 0.06}s`,
                      ...(isActive
                        ? {}
                        : {
                            opacity: 0.6,
                            cursor: 'not-allowed',
                            filter: 'grayscale(0.4)',
                            position: 'relative',
                            overflow: 'hidden',
                          }),
                    }}
                  >
                    {imageSrc ? (
                      <ProductImage src={imageSrc} alt={item.title} />
                    ) : (
                      <div className="school-product-empty">
                        <span>{item.type || category.name}</span>
                      </div>
                    )}
                    <div className="school-card-body">
                      <p className="school-card-type">{item.type || category.name}</p>
                      <h4>{item.title}</h4>
                      <p className="school-card-meta">{item.badge || (isActive ? 'Customizable' : 'Coming Soon')}</p>
                      {Array.isArray(item.offers) && item.offers.length > 0 && (
                        <p className="school-card-meta">{item.offers.map((offer) => offer.label).join(' • ')}</p>
                      )}
                    </div>
                    <div className="school-card-actions" style={isActive ? undefined : { justifyContent: 'flex-end' }}>
                      {isActive ? (
                        <Link className="button-primary" to={`/customize/${item.id}`}>
                          {item.ctaLabel || 'Customize'}
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="button-primary"
                          style={{ opacity: 0.5, cursor: 'not-allowed' }}
                        >
                          {item.ctaLabel || 'Coming Soon'}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
