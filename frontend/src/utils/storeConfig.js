import { getBasePath, withBase } from './apiHelpers';

const DEFAULT_STORE_SETTINGS = {
  taxRate: 0.05,
  shipping: {
    flatFee: 4.99,
    freeThreshold: 100,
  },
};

const COLOR_MAP = {
  black: '#111111',
  gold: '#c89b3c',
  silver: '#c7ced8',
  blue: '#2563eb',
  white: '#f8fafc',
  red: '#dc2626',
  navy: '#0f2747',
  green: '#1f7a3d',
  orange: '#f97316',
  maroon: '#7c2d42',
  teal: '#0f9ea8',
  purple: '#6d28d9',
};

let storeConfigCache = null;
let storeConfigPromise = null;

function withSchoolSuffix(name) {
  return /school$/i.test(name) ? name : `${name} School`;
}

function toPalette(colorSummary = '') {
  return colorSummary
    .split(/,|&/g)
    .map((token) => token.trim())
    .filter(Boolean)
    .map((name) => ({
      name,
      hex: COLOR_MAP[name.toLowerCase()] || '#6b7280',
    }));
}

function normalizeStoreConfig(rawConfig) {
  if (Array.isArray(rawConfig)) {
    return {
      storeSettings: DEFAULT_STORE_SETTINGS,
      products: rawConfig,
      schools: [],
    };
  }

  return {
    storeSettings: {
      ...DEFAULT_STORE_SETTINGS,
      ...(rawConfig?.storeSettings || {}),
      shipping: {
        ...DEFAULT_STORE_SETTINGS.shipping,
        ...(rawConfig?.storeSettings?.shipping || {}),
      },
    },
    products: Array.isArray(rawConfig?.products) ? rawConfig.products : [],
    schools: Array.isArray(rawConfig?.schools) ? rawConfig.schools : [],
  };
}

function enrichSchoolEntry(school) {
  const schoolName = withSchoolSuffix(school.schoolName || school.name || '');
  const palette = toPalette(school.colorSummary || school.colors || '');

  return {
    ...school,
    schoolName,
    name: schoolName,
    image: school.image || school.categories?.[0]?.items?.[0]?.image || null,
    palette,
    colors: palette.map((entry) => entry.hex),
    categories: Array.isArray(school.categories) ? school.categories : [],
  };
}

export async function loadStoreConfig() {
  if (storeConfigCache) return storeConfigCache;
  if (storeConfigPromise) return storeConfigPromise;

  storeConfigPromise = (async () => {
    try {
      const response = await fetch(withBase('products.json', getBasePath(import.meta.env.BASE_URL || '/')));
      if (!response.ok) {
        throw new Error(`Failed to load products.json: ${response.status}`);
      }

      const rawConfig = await response.json();
      storeConfigCache = normalizeStoreConfig(rawConfig);
      return storeConfigCache;
    } catch (error) {
      console.warn('Failed to load store config:', error);
      storeConfigCache = normalizeStoreConfig(null);
      return storeConfigCache;
    }
  })();

  return storeConfigPromise;
}

export function getStoreSettings(storeConfig) {
  return normalizeStoreConfig(storeConfig).storeSettings;
}

export function flattenConfiguredProducts(storeConfig) {
  const config = normalizeStoreConfig(storeConfig);
  const directProducts = config.products;
  const schoolProducts = config.schools.flatMap((rawSchool) => {
    const school = enrichSchoolEntry(rawSchool);

    return school.categories.flatMap((category) =>
      (category.items || []).map((item) => ({
        ...item,
        title: item.title || item.name,
        name: item.name || item.title,
        description: item.description || `${item.title || item.name || school.schoolName} item.`,
        schoolSlug: school.schoolSlug,
        schoolName: school.schoolName,
        mascot: school.mascot,
        address: school.address,
        division: school.division,
        divisionName: school.divisionName,
        region: school.region,
        regionName: school.regionName,
        colorSummary: school.colorSummary,
        palette: item.palette || school.palette,
        colors: item.colors || school.colors,
        categoryId: category.id,
        categoryName: category.name,
      }))
    );
  });

  return [...directProducts, ...schoolProducts];
}

export function buildSchoolDirectory(storeConfig) {
  const config = normalizeStoreConfig(storeConfig);
  const divisionMap = new Map();

  config.schools.forEach((rawSchool) => {
    const school = enrichSchoolEntry(rawSchool);
    const divisionSlug = school.division;

    if (!divisionMap.has(divisionSlug)) {
      divisionMap.set(divisionSlug, {
        id: divisionSlug,
        slug: divisionSlug,
        name: school.divisionName || divisionSlug,
        regions: [],
      });
    }

    const division = divisionMap.get(divisionSlug);
    let region = division.regions.find((entry) => entry.id === school.region);

    if (!region) {
      region = {
        id: school.region,
        name: school.regionName || school.region,
        schools: [],
      };
      division.regions.push(region);
    }

    region.schools.push({
      id: school.schoolSlug,
      slug: school.schoolSlug,
      name: school.schoolName,
      mascot: school.mascot || '',
      address: school.address || '',
      image: school.image,
      division: school.division,
      divisionName: school.divisionName,
      region: school.region,
      regionName: school.regionName,
      colorSummary: school.colorSummary || '',
      palette: school.palette,
      colors: school.colors,
      productId: school.categories?.[0]?.items?.find((item) => item.status === 'active')?.id || null,
    });
  });

  return Array.from(divisionMap.values());
}

export function getDivisionBySlug(storeConfig, divisionSlug) {
  return buildSchoolDirectory(storeConfig).find((division) => division.slug === divisionSlug) ?? null;
}

export function getRegionBySlugs(storeConfig, divisionSlug, regionSlug) {
  const division = getDivisionBySlug(storeConfig, divisionSlug);
  return division?.regions.find((region) => region.id === regionSlug) ?? null;
}

export function getSchoolBySlugs(storeConfig, divisionSlug, regionSlug, schoolSlug) {
  const region = getRegionBySlugs(storeConfig, divisionSlug, regionSlug);
  return region?.schools.find((school) => school.slug === schoolSlug) ?? null;
}

export function getSchoolConfigEntry(storeConfig, schoolSlug) {
  const config = normalizeStoreConfig(storeConfig);
  return config.schools.map(enrichSchoolEntry).find((school) => school.schoolSlug === schoolSlug) ?? null;
}
