// Фотографии позиций и категорий в public/photos. Позиция без своего фото
// показывает фото своей категории. Авторы и лицензии — в public/photos/CREDITS.md.

const ITEM_PHOTOS: Record<string, string> = {
  "tent-trek-2": "tent-trek-2.jpg",
  "tent-family-4": "tent-family-4.jpg",
  "tent-tarp": "tent-tarp.jpg",
  "tent-storm-3": "tent-storm-3.jpg",
  "sup-allround-10": "sup-allround-10.jpg",
  "sup-touring-12": "sup-touring-12.jpg",
  "sup-kids-8": "sup-kids-8.jpg",
  // На фото ребёнок в спасательном жилете — подходит и жилету.
  "sup-vest": "sup-kids-8.jpg",
  "sup-family-15": "sup-family-15.jpg",
  "sup-paddle": "sup-paddle.jpg",
  "bag-summer": "bag-summer.webp",
  "bag-3season": "bag-3season.jpg",
  "mat-foam": "mat-foam.jpg",
  "mat-inflatable": "mat-inflatable.jpg",
  pillow: "pillow.jpg",
  "pack-60": "pack-60.webp",
  "pack-80": "pack-80.jpg",
  "pack-30": "pack-30.jpg",
  "pack-kids": "pack-kids.jpg",
  "stove-gas": "stove-gas.jpg",
  "stove-multi": "stove-multi.jpg",
  "table-set": "table-set.jpg",
};

export const CATEGORY_PHOTOS: Record<string, string> = {
  tents: "cat-tents.webp",
  sup: "sup-allround-10.jpg",
  sleeping: "bag-summer.webp",
  backpacks: "pack-60.webp",
  cooking: "stove-gas.jpg",
};

export const HERO_PHOTO = "/photos/hero.jpg";

function itemPhotoFile(itemId: string, category?: string): string {
  return ITEM_PHOTOS[itemId] ?? (category && CATEGORY_PHOTOS[category]) ?? CATEGORY_PHOTOS.tents;
}

export function itemPhoto(itemId: string, category?: string): string {
  return `/photos/${itemPhotoFile(itemId, category)}`;
}
