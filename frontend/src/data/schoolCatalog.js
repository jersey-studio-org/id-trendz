import schoolsData from './schools.json';

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
  purple: '#6d28d9'
};

const US_TSHIRT_SIZES = ['YS', 'YM', 'YL', 'YXL', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toPalette(colorSummary) {
  return colorSummary
    .split(/,|&/g)
    .map((token) => token.trim())
    .filter(Boolean)
    .map((name) => ({
      name,
      hex: COLOR_MAP[name.toLowerCase()] || '#6b7280'
    }));
}

function withSchoolSuffix(name) {
  return /school$/i.test(name) ? name : `${name} School`;
}

function enrichSchool(divisionSlug, rawSchool) {
  const baseName = rawSchool.name;
  const name = withSchoolSuffix(baseName);
  const slug = rawSchool.slug || slugify(baseName);
  const palette = toPalette(rawSchool.colors);

  return {
    ...rawSchool,
    name,
    baseName,
    id: rawSchool.id || slug,
    slug,
    division: divisionSlug,
    price: rawSchool.price ?? 49.99,
    colorSummary: rawSchool.colors,
    palette,
    colors: palette.map((entry) => entry.hex),
    image: rawSchool.image || null,
    productId: rawSchool.productId || `${slug}-tshirt`,
    productTitle: rawSchool.productTitle || `${name} Jersey`,
    description: rawSchool.description || `${name} jersey.`
  };
}

export const SCHOOL_DIVISIONS = schoolsData.divisions.map((division) => ({
  ...division,
  regions: division.regions.map((region) => ({
    ...region,
    schools: region.schools.map((school) => enrichSchool(division.slug, school))
  }))
}));

export const SCHOOL_PRODUCTS = SCHOOL_DIVISIONS.flatMap((division) =>
  division.regions.flatMap((region) =>
    region.schools.map((school) => ({
      id: school.productId,
      title: school.productTitle,
      name: school.productTitle,
      description: school.description,
      price: school.price,
      colors: school.colors,
      palette: school.palette,
      schoolName: school.name,
      mascot: school.mascot,
      address: school.address,
      division: division.slug,
      divisionName: division.name,
      region: region.id,
      regionName: region.name,
      sizes: US_TSHIRT_SIZES,
      variants: [
        { id: 'standard', label: 'Standard Tee', price: school.price },
        { id: 'performance', label: 'Performance Tee', price: school.price + 8 }
      ],
      schoolSlug: school.slug,
      thumbnails: school.image ? [school.image] : [],
      images: school.image ? [school.image] : [],
      image: school.image || null
    }))
  )
);

export function getDivisionBySlug(divisionSlug) {
  return SCHOOL_DIVISIONS.find((division) => division.slug === divisionSlug) ?? null;
}

export function getRegionBySlugs(divisionSlug, regionSlug) {
  const division = getDivisionBySlug(divisionSlug);
  return division?.regions.find((region) => region.id === regionSlug) ?? null;
}

export function getSchoolBySlugs(divisionSlug, regionSlug, schoolSlug) {
  const region = getRegionBySlugs(divisionSlug, regionSlug);
  return region?.schools.find((school) => school.slug === schoolSlug) ?? null;
}

export function getSchoolProductById(productId) {
  return SCHOOL_PRODUCTS.find((product) => product.id === productId) ?? null;
}

export function buildSchoolProduct(divisionSlug, regionSlug, schoolSlug) {
  const division = getDivisionBySlug(divisionSlug);
  const region = getRegionBySlugs(divisionSlug, regionSlug);
  const school = getSchoolBySlugs(divisionSlug, regionSlug, schoolSlug);

  if (!division || !region || !school) {
    return null;
  }

  return {
    id: school.productId,
    title: school.productTitle,
    name: school.productTitle,
    description: school.description,
    price: school.price,
    colors: school.colors,
    palette: school.palette,
    schoolName: school.name,
    mascot: school.mascot,
    address: school.address,
    division: division.slug,
    divisionName: division.name,
    region: region.id,
    regionName: region.name,
    sizes: US_TSHIRT_SIZES,
    variants: [
      { id: 'standard', label: 'Standard Tee', price: school.price },
      { id: 'performance', label: 'Performance Tee', price: school.price + 8 }
    ],
    schoolSlug: school.slug,
    thumbnails: school.image ? [school.image] : [],
    images: school.image ? [school.image] : [],
    image: school.image || null
  };
}
