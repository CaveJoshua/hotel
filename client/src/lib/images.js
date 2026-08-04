export const IMG = {
  hero: '/img/hero.jpg',
  suite: '/img/suite.jpg',
  cottage: '/img/cottage.jpg',
  villa: '/img/villa.jpg',
  garden: '/img/garden.jpg',
  bunk: '/img/bunk.jpg',
  island: '/img/island.jpg',
};
const BY_SLUG = {
  'nipa-cove': IMG.cottage,
  'garden-breeze': IMG.garden,
  'habagat-suite': IMG.suite,
  'sunset-pavilion': IMG.suite,
  'duyan-villa': IMG.villa,
  'backpacker-bunk': IMG.bunk,
};
export const roomImg = (slug) => BY_SLUG[slug] || IMG.hero;
