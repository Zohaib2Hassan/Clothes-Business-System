export const PRODUCT_CATEGORIES = [
  'T-Shirts',
  'Shirts',
  'Kurtas',
  'Shalwar Kameez',
  'Jeans',
  'Trousers',
  'Dresses',
  'Jackets',
  'Hoodies & Sweatshirts',
  'Suits & Blazers',
  'Unstitched Fabric',
  'Abayas & Hijabs',
  'Activewear',
  'Sleepwear & Loungewear',
  'Accessories',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
