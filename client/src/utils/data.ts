// ---- Shift hours ----
export const MORNING_HOURS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
];
export const NIGHT_HOURS = [
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00',
  '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
];

// ---- Production Team 1 Products ----
export const TEAM1_PRODUCTS = [
  '1kg Tube',
  '2kg Tube',
  '10kg Tube',
  '10kg Cube - HM',
  '10kg Crushed',
  '25kg Crushed',
  'Cup Ice',
  'Ice Cup Lemon',
];

// ---- Cutting Team 2 Products (Luxury Ice) ----
export const TEAM2_PRODUCTS = [
  'Ice Cube (Small)',
  'Ice Cube (Big)',
  'Ice Ball 65mm',
  'Ice Ball 55mm',
  'Ice Ball 45mm',
  'Ice Ball with Fruits',
  'Ice Ball with Stickers',
  'Ice Ball Gold',
  'Dubai Ice',
  'Full Moon Ice',
];

// ---- Production Team 1 Materials ----
export interface MaterialCategory {
  name: string;
  items: string[];
}

export const TEAM1_MATERIALS: MaterialCategory[] = [
  {
    name: 'PLASTICS',
    items: [
      '1 KG ROLL',
      '2 KG ROLL',
      '2 KG CRUSH ROLL',
      '10 KG TUBE - PLASTIC',
      '10 KG HOSHISHAKI BAG - PLASTIC',
      '10 KG CRUSHED ICE BAG - PLASTIC',
      'PLAIN BAG - PLASTIC',
      'PLASTIC ROLL (PLAIN)',
    ],
  },
  {
    name: 'CUPS',
    items: ['PLAIN CUP', 'LEMON CUP', 'CUP LID (COVER)', 'CUP HOLDER'],
  },
  {
    name: 'BOXES & TAPE',
    items: [
      'BOX (PLAIN)',
      'BOX (LEMON)',
      '20 KG STYROFOAM BOX',
      '10 KG STYROFOAM BOX',
      '5 KG STYROFOAM BOX',
      'TAPE - NATURAL ICE',
      'TAPE - NORMAL',
    ],
  },
];

// ---- Cutting Team 2 Materials (Luxury Ice) ----
export const TEAM2_MATERIALS: MaterialCategory[] = [
  {
    name: 'PLASTICS',
    items: [
      'ICE BLOCK 5X5X6 - PLASTIC COVER',
      'ICE BLOCK 20X20 - PLASTIC COVER',
      'LONG CUBE 4X4X12 - PLASTIC COVER',
      'LONG CUBE 4X4X15 - PLASTIC COVER',
      'FULLMOON ICE - PLASTIC',
      'DUBAI ICE - PLASTIC',
    ],
  },
  {
    name: 'TRAYS',
    items: [
      '45 MM - TRAY 12PCS (BALL)',
      '55 MM - TRAY 6PCS',
      '55 MM - TRAY 20PCS',
      '65 MM - TRAY 6PCS',
    ],
  },
  {
    name: 'STICKERS',
    items: [
      'LEMON STICKER',
      'STRAWBERRY STICKER',
      'ORANGE STICKER',
      'MINT STICKER',
      'BALL ICE STICKER',
      'BALL ICE STICKER - 24PCS',
      'LARGE CUBE 5X5X6 - TRAY 6PCS',
      'LARGE CUBE 5X5X6 - TRAY 24PCS',
      'LONG CUBE 4X4X10 - TRAY 3PCS',
      'LONG CUBE 4X4X10 - TRAY 12PCS',
      'LARGE CUBE STICKER - 6PCS',
      'LARGE CUBE STICKER - 24PCS',
      'LONG CUBE STICKER - 3PCS',
      'LONG CUBE STICKER - 12PCS',
    ],
  },
  {
    name: 'BOXES (SILVER)',
    items: [
      'BALL ICE - BOX 20PCS (SILVER)',
      'LARGE CUBE - BOX 6PCS (SILVER)',
      'LARGE CUBE - BOX 20PCS (SILVER)',
    ],
  },
  {
    name: 'BOXES (GOLD)',
    items: [
      'BALL ICE - BOX 6PCS (GOLD)',
      'BALL ICE - BOX 20PCS (GOLD)',
    ],
  },
  {
    name: 'ACCESSORIES',
    items: [
      'GOLD TONG',
      'SILVER TONG',
      'ENVELOPE',
      'TAPE - ARCTIC ICE',
      'TAPE - NATURAL ICE',
      'TAPE - NORMAL',
    ],
  },
];
