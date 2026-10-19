import type { CategoryId } from "@/lib/domain/catalog";

export type InventoryItem = {
  id: string;
  title: string;
  category: CategoryId;
  pricePerDay: number;
  deposit: number;
  stock: number;
  popularity: number;
  description: string;
  specs: [string, string][];
};

const GENERAL_RULES = [
  "Выдача и возврат ежедневно с 10:00 до 20:00 на пункте проката.",
  "При выдаче нужен паспорт; залог вносится наличными или картой и возвращается при сдаче.",
  "День возврата не оплачивается, если снаряжение сдано до 20:00.",
];

export const CATEGORY_RULES: Record<CategoryId, string[]> = {
  tents: [
    "Палатку проверяем и ставим при вас — убедитесь в комплектности колышков и дуг.",
    "Возвращайте сухой: сушку мокрой палатки удерживаем из залога (500 ₽).",
  ],
  sup: [
    "Выдаём со спасательным жилетом по запросу; кататься без жилета запрещено.",
    "Проколы и порезы оплачиваются по прайсу ремонта, остальное — из залога.",
  ],
  sleeping: [
    "Спальники выдаются после химчистки; вкладыш обязателен и входит в стоимость.",
  ],
  backpacks: ["Подгонку подвесной системы делаем при выдаче, займёт 5–10 минут."],
  cooking: [
    "Газовые баллоны не входят в аренду и продаются отдельно.",
    "Посуду возвращайте чистой — иначе мойка 300 ₽.",
  ],
};

export function rulesFor(category: CategoryId): string[] {
  return [...CATEGORY_RULES[category], ...GENERAL_RULES];
}

export const INVENTORY: InventoryItem[] = [
  // Палатки
  { id: "tent-trek-2", title: "Палатка «Трек 2»", category: "tents", pricePerDay: 650, deposit: 5000, stock: 4, popularity: 98,
    description: "Лёгкая двухместная палатка для походов выходного дня. Ставится за 5 минут, два входа и тамбура.",
    specs: [["Вместимость", "2 человека"], ["Вес", "2,4 кг"], ["Водостойкость тента", "3000 мм"], ["Слои", "2"]] },
  { id: "tent-family-4", title: "Палатка «Семейная 4»", category: "tents", pricePerDay: 1100, deposit: 9000, stock: 2, popularity: 90,
    description: "Просторная кемпинговая палатка с двумя спальнями и высоким тамбуром для стоянки у машины.",
    specs: [["Вместимость", "4 человека"], ["Вес", "7,8 кг"], ["Водостойкость тента", "4000 мм"], ["Высота", "195 см"]] },
  { id: "tent-ultra-1", title: "Палатка «Ультралайт 1»", category: "tents", pricePerDay: 700, deposit: 7000, stock: 3, popularity: 61,
    description: "Одноместная палатка для тех, кто считает граммы. Собирается на треккинговых палках.",
    specs: [["Вместимость", "1 человек"], ["Вес", "0,9 кг"], ["Водостойкость тента", "2000 мм"], ["Слои", "1,5"]] },
  { id: "tent-storm-3", title: "Палатка «Шторм 3»", category: "tents", pricePerDay: 1300, deposit: 12000, stock: 1, popularity: 54,
    description: "Экспедиционная палатка для ветреных стоянок, гор и межсезонья.",
    specs: [["Вместимость", "3 человека"], ["Вес", "4,6 кг"], ["Водостойкость тента", "8000 мм"], ["Ветроустойчивость", "до 25 м/с"]] },
  { id: "tent-camp-6", title: "Шатёр «Лагерь 6»", category: "tents", pricePerDay: 1600, deposit: 14000, stock: 2, popularity: 47,
    description: "Шатёр-кухня с москитными стенками для большой компании.",
    specs: [["Площадь", "9 м²"], ["Вес", "11 кг"], ["Высота", "220 см"], ["Стенки", "сетка + шторки"]] },
  { id: "tent-tarp", title: "Тент 3×4 м", category: "tents", pricePerDay: 300, deposit: 2000, stock: 6, popularity: 70,
    description: "Универсальный тент от дождя и солнца, с оттяжками и колышками.",
    specs: [["Размер", "3×4 м"], ["Вес", "1,1 кг"], ["Водостойкость", "3000 мм"]] },

  // Сапборды
  { id: "sup-allround-10", title: "Сапборд Allround 10'6\"", category: "sup", pricePerDay: 1500, deposit: 15000, stock: 5, popularity: 99,
    description: "Устойчивая универсальная доска для первых прогулок по озеру и реке. Весло, насос и лиш в комплекте.",
    specs: [["Длина", "320 см"], ["Ширина", "84 см"], ["Грузоподъёмность", "130 кг"], ["Комплект", "весло, насос, лиш, рюкзак"]] },
  { id: "sup-touring-12", title: "Сапборд Touring 12'6\"", category: "sup", pricePerDay: 1900, deposit: 20000, stock: 3, popularity: 76,
    description: "Длинная туринговая доска для сплавов и многодневных маршрутов, держит курс и груз.",
    specs: [["Длина", "381 см"], ["Ширина", "76 см"], ["Грузоподъёмность", "150 кг"], ["Крепления", "2 багажные сетки"]] },
  { id: "sup-kids-8", title: "Детский сапборд 8'", category: "sup", pricePerDay: 900, deposit: 8000, stock: 2, popularity: 43,
    description: "Компактная доска для детей от 7 лет, с укороченным веслом.",
    specs: [["Длина", "244 см"], ["Ширина", "71 см"], ["Грузоподъёмность", "60 кг"]] },
  { id: "sup-family-15", title: "Сапборд Family 15'", category: "sup", pricePerDay: 2500, deposit: 25000, stock: 1, popularity: 52,
    description: "Большая доска для двух-трёх гребцов или взрослого с ребёнком и собакой.",
    specs: [["Длина", "457 см"], ["Ширина", "91 см"], ["Грузоподъёмность", "250 кг"]] },
  { id: "sup-paddle", title: "Весло карбоновое", category: "sup", pricePerDay: 350, deposit: 4000, stock: 6, popularity: 40,
    description: "Разборное карбоновое весло для тех, кто хочет грести легче.",
    specs: [["Длина", "170–220 см"], ["Вес", "680 г"], ["Секции", "3"]] },
  { id: "sup-vest", title: "Спасательный жилет", category: "sup", pricePerDay: 200, deposit: 1500, stock: 10, popularity: 66,
    description: "Страховочный жилет с карманом и свистком.",
    specs: [["Размеры", "S–XXL"], ["Плавучесть", "50 Н"]] },

  // Спальники и коврики
  { id: "bag-summer", title: "Спальник летний +10°", category: "sleeping", pricePerDay: 300, deposit: 2500, stock: 8, popularity: 80,
    description: "Лёгкий спальник-одеяло для тёплых ночей, раскрывается в плед.",
    specs: [["Комфорт", "+10 °C"], ["Вес", "1 кг"], ["Длина", "220 см"]] },
  { id: "bag-3season", title: "Спальник трёхсезонный 0°", category: "sleeping", pricePerDay: 450, deposit: 4000, stock: 6, popularity: 73,
    description: "Спальник-кокон для весны и осени, с капюшоном и тёплым воротником.",
    specs: [["Комфорт", "0 °C"], ["Экстрим", "−8 °C"], ["Вес", "1,6 кг"]] },
  { id: "bag-winter", title: "Спальник зимний −15°", category: "sleeping", pricePerDay: 700, deposit: 7000, stock: 2, popularity: 35,
    description: "Пуховый спальник для зимних ночёвок и высокогорья.",
    specs: [["Комфорт", "−15 °C"], ["Наполнитель", "гусиный пух 700 cuin"], ["Вес", "1,9 кг"]] },
  { id: "mat-foam", title: "Коврик-пенка", category: "sleeping", pricePerDay: 100, deposit: 500, stock: 12, popularity: 62,
    description: "Неубиваемый коврик из пенополиэтилена.",
    specs: [["Размер", "180×60 см"], ["Толщина", "10 мм"], ["Вес", "300 г"]] },
  { id: "mat-inflatable", title: "Коврик самонадувающийся", category: "sleeping", pricePerDay: 250, deposit: 2500, stock: 6, popularity: 58,
    description: "Тёплый и мягкий коврик, надувается сам за пару минут.",
    specs: [["Размер", "183×51 см"], ["Толщина", "38 мм"], ["R-value", "3,4"]] },
  { id: "pillow", title: "Подушка надувная", category: "sleeping", pricePerDay: 80, deposit: 400, stock: 10, popularity: 30,
    description: "Компактная подушка, в сложенном виде размером с кулак.",
    specs: [["Вес", "90 г"], ["Размер", "38×25 см"]] },

  // Рюкзаки
  { id: "pack-60", title: "Рюкзак 60 л", category: "backpacks", pricePerDay: 450, deposit: 4000, stock: 5, popularity: 77,
    description: "Походный рюкзак с регулируемой спиной для маршрутов до недели.",
    specs: [["Объём", "60 л"], ["Вес", "1,8 кг"], ["Рост", "160–190 см"]] },
  { id: "pack-80", title: "Рюкзак 80 л", category: "backpacks", pricePerDay: 550, deposit: 5000, stock: 4, popularity: 64,
    description: "Большой рюкзак для длинных и зимних походов с тяжёлым снаряжением.",
    specs: [["Объём", "80 л"], ["Вес", "2,3 кг"], ["Рост", "165–195 см"]] },
  { id: "pack-30", title: "Рюкзак штурмовой 30 л", category: "backpacks", pricePerDay: 250, deposit: 2000, stock: 6, popularity: 50,
    description: "Лёгкий рюкзак для радиалок и однодневных прогулок.",
    specs: [["Объём", "30 л"], ["Вес", "0,8 кг"]] },
  { id: "pack-kids", title: "Детский рюкзак 25 л", category: "backpacks", pricePerDay: 200, deposit: 1500, stock: 3, popularity: 28,
    description: "Рюкзак с анатомической спинкой для детей 8–12 лет.",
    specs: [["Объём", "25 л"], ["Вес", "0,7 кг"]] },
  { id: "dry-bag-40", title: "Гермомешок 40 л", category: "backpacks", pricePerDay: 150, deposit: 1000, stock: 8, popularity: 55,
    description: "Защищает вещи от воды на сплаве и на сапе.",
    specs: [["Объём", "40 л"], ["Материал", "ПВХ 500D"]] },
  { id: "poles", title: "Треккинговые палки (пара)", category: "backpacks", pricePerDay: 150, deposit: 1500, stock: 8, popularity: 45,
    description: "Телескопические алюминиевые палки с быстрыми замками.",
    specs: [["Длина", "65–135 см"], ["Вес пары", "520 г"]] },

  // Кухня и лагерь
  { id: "stove-gas", title: "Газовая горелка", category: "cooking", pricePerDay: 250, deposit: 2500, stock: 6, popularity: 72,
    description: "Компактная горелка с пьезоподжигом под резьбовой баллон.",
    specs: [["Мощность", "2,6 кВт"], ["Вес", "190 г"]] },
  { id: "stove-multi", title: "Мультитопливная горелка", category: "cooking", pricePerDay: 450, deposit: 6000, stock: 2, popularity: 33,
    description: "Работает на газе, бензине и керосине — для экспедиций и холода.",
    specs: [["Мощность", "3 кВт"], ["Топливо", "газ / бензин / керосин"]] },
  { id: "cookset-2", title: "Набор посуды на двоих", category: "cooking", pricePerDay: 200, deposit: 1500, stock: 5, popularity: 49,
    description: "Две кастрюли, сковорода-крышка, кружки и половник в одном чехле.",
    specs: [["Объём", "1,2 + 0,8 л"], ["Материал", "анодированный алюминий"]] },
  { id: "cookset-4", title: "Набор посуды на четверых", category: "cooking", pricePerDay: 300, deposit: 2500, stock: 3, popularity: 44,
    description: "Котелки, сковорода, миски и кружки на компанию.",
    specs: [["Объём", "2,5 + 1,8 л"], ["Персон", "4"]] },
  { id: "cooler-30", title: "Изотермический контейнер 30 л", category: "cooking", pricePerDay: 300, deposit: 2500, stock: 4, popularity: 57,
    description: "Держит холод до двух суток с аккумуляторами холода (в комплекте).",
    specs: [["Объём", "30 л"], ["Время холода", "до 48 ч"]] },
  { id: "table-set", title: "Складной стол и 4 стула", category: "cooking", pricePerDay: 500, deposit: 4000, stock: 2, popularity: 60,
    description: "Лагерная мебель для стоянки у машины.",
    specs: [["Стол", "120×70 см"], ["Нагрузка на стул", "до 110 кг"]] },
];

export function findItem(id: string): InventoryItem | undefined {
  return INVENTORY.find((i) => i.id === id);
}
