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

export const roomGallery = (slug) => {
  const primary = roomImg(slug);
  return [
    primary,
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
  ];
};
