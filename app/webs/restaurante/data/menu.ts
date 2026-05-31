export const menuCategories = [
  {
    id: "entradas",
    label: "Entradas",
    emoji: "🥗",
    items: [
      { name: "Carpaccio de Res", desc: "Res angus, alcaparras, rúcula y parmesano curado 24 meses", price: 185, tag: "Chef" },
      { name: "Burrata Mediterránea", desc: "Burrata fresca, tomates cherry rostizados, aceite de trufa blanca", price: 165, tag: null },
      { name: "Tártaro de Atún", desc: "Atún bluefin, aguacate, salsa ponzu, sésamo negro", price: 195, tag: "Nuevo" },
      { name: "Sopa de Cebolla Gratinada", desc: "Caldo de res 12 horas, cebolla caramelizada, baguette artesanal", price: 120, tag: null },
      { name: "Ostiones al Natural", desc: "3 ostiones Pacific, mignonette de echalote, limón amarillo", price: 210, tag: "Mar" },
    ],
  },
  {
    id: "principales",
    label: "Principales",
    emoji: "🥩",
    items: [
      { name: "Costilla Braseada 72h", desc: "Costilla wagyu, puré de papa negra, salsa bordelesa y romero", price: 545, tag: "Estrella" },
      { name: "Filete Wellington", desc: "Filete Black Angus, duxelle de hongos, hojaldre artesanal", price: 595, tag: "Chef" },
      { name: "Pesca del Día", desc: "Fileteado al momento, mantequilla de hierbas, espárragos y papa confitada", price: 385, tag: "Mar" },
      { name: "Risotto de Hongos Silvestres", desc: "Arborio, porcini, shiitake, trufa negra, queso fontina", price: 295, tag: null },
      { name: "Pollo de Corral Rostizado", desc: "Medio pollo, chimichurri de hierbas frescas, ensalada de temporada", price: 265, tag: null },
      { name: "Rack de Cordero", desc: "Cordero neozelandés, costra de hierbas, jus de menta, puré de chícharo", price: 485, tag: "Nuevo" },
    ],
  },
  {
    id: "postres",
    label: "Postres",
    emoji: "🍮",
    items: [
      { name: "Soufflé de Chocolate Belga", desc: "Chocolate 72%, helado de vainilla bourbon, tiempo de espera 12 min", price: 145, tag: "Must" },
      { name: "Crème Brûlée de Lavanda", desc: "Vainilla de Madagascar, lavanda, azúcar quemado al momento", price: 115, tag: null },
      { name: "Tarta Tatín de Manzana", desc: "Manzana granny smith, caramelo salado, helado de canela", price: 125, tag: null },
      { name: "Tabla de Quesos Artesanales", desc: "Selección de 5 quesos, mermelada de higos, nueces garapiñadas", price: 185, tag: "Para 2" },
    ],
  },
  {
    id: "vinos",
    label: "Vinos",
    emoji: "🍷",
    items: [
      { name: "Valle de Uco Malbec Reserva", desc: "Achaval Ferrer · Mendoza 2021 · Copa / Botella", price: 145, tag: "90pts" },
      { name: "Rioja Gran Reserva", desc: "Marqués de Riscal · España 2018 · Copa / Botella", price: 165, tag: null },
      { name: "Chablis Premier Cru", desc: "William Fèvre · Borgoña 2022 · Copa / Botella", price: 195, tag: "Blanco" },
      { name: "Champagne Brut NV", desc: "Moët & Chandon · Copa / Media / Botella", price: 225, tag: "Celebración" },
      { name: "Vino Natural Orange", desc: "La Sorga · Languedoc · Uva Gewurztraminer sin sulfitos", price: 155, tag: "Natural" },
    ],
  },
]

export const stats = [
  { value: "18", label: "Años de excelencia" },
  { value: "4.9★", label: "Rating Google" },
  { value: "120k+", label: "Comensales felices" },
  { value: "3", label: "Premios Gault&Millau" },
]
