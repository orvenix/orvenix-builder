import { UtensilsCrossed, Wine, Users, Award, Leaf, ChefHat } from "lucide-react"

export const brand = {
  name: "Bella Terra",
  sub: "Ristorante & Bar",
  tagline: "Cocina de autor en el corazón de la ciudad",
  email: "reservas@bellaterra.mx",
  phone: "+52 55 5544 3322",
  whatsapp: "+52 55 5544 3322",
  address: "Av. Presidente Masaryk 123, Polanco, CDMX",
  founded: "2014",
  instagram: "@bellaterracdmx",
  tripadvisor: "4.9 · 1,248 reseñas",
}

export const stats = [
  { value: "4.9★", label: "Calificación promedio" },
  { value: "11 años", label: "Sirviendo a CDMX" },
  { value: "+80k", label: "Comensales felices" },
  { value: "3×", label: "Premios Gault&Millau" },
]

export const menu = [
  {
    category: "Entradas",
    items: [
      { name: "Carpaccio di Manzo", desc: "Res wagyu, parmesano 24 meses, alcaparras, rúcula baby y aceite de trufa blanca", price: "$320", badge: "Chef recomienda" },
      { name: "Burrata Fresca", desc: "Burrata artesanal, tomate heirloom, prosciutto di Parma 18 meses, albahaca y EVOO", price: "$285" },
      { name: "Tartare de Atún", desc: "Atún bluefin, aguacate, caviar Osetra, chips de camote morado y mayonesa de wasabi", price: "$395", badge: "Temporada" },
      { name: "Croquetas de Trufas", desc: "Bechamel de trufa negra, jamón serrano, queso manchego curado y salsa romesco", price: "$210" },
    ],
  },
  {
    category: "Platos Fuertes",
    items: [
      { name: "Risotto al Nero", desc: "Arroz carnaroli, tinta de calamar, vieiras selladas, espuma de Parmigiano y aceite de limón", price: "$480", badge: "Firma" },
      { name: "Costilla Braised 72h", desc: "Costilla de res Black Angus, puré de papa trufado, reducción de Barolo y chimichurri de hierbas", price: "$620" },
      { name: "Pappardelle al Ragù", desc: "Pasta fresca artesanal, ragù de cordero y cerdo, ricotta salata y aceite de oliva siciliano", price: "$390" },
      { name: "Lubina en Costra", desc: "Lubina mediterránea, costra de hierbas finas, brandada de bacalao, espárragos y bisque de marisco", price: "$545", badge: "Estrella" },
    ],
  },
  {
    category: "Postres",
    items: [
      { name: "Tiramisú della Nonna", desc: "Receta familiar desde 1953: mascarpone artesanal, café espresso, savoiardi y cacao Valrhona", price: "$190" },
      { name: "Tortino di Cioccolato", desc: "Coulant de chocolate oscuro 72%, helado de vainilla Tahití y caramelo fleur de sel", price: "$220", badge: "Siempre" },
      { name: "Panna Cotta al Limone", desc: "Panna cotta de limón de Amalfi, coulis de frutos rojos, merengue italiano y bizcochuelo", price: "$175" },
    ],
  },
  {
    category: "Vinos",
    items: [
      { name: "Copa Casa — Blanco", desc: "Vermentino di Sardegna DOC · Fresco, floral, mineral. Maridaje: mariscos, carpaccio", price: "$145" },
      { name: "Copa Casa — Tinto", desc: "Chianti Classico Riserva · Cereza, tabaco, terroso. Maridaje: carnes, pastas con ragù", price: "$185" },
      { name: "Barolo Marchesi", desc: "Barolo DOCG 2018 · Botella · Granadas, especias, cuero. Ideal con costilla Angus", price: "$2,800" },
      { name: "Prosecco Spumante", desc: "Prosecco di Valdobbiadene DOCG · Copa · Burbuja fina, manzana verde, ideal para iniciar", price: "$165" },
    ],
  },
]

export const chef = {
  name: "Chef Armando Reyes",
  title: "Director Gastronómico",
  bio: "Con 22 años de trayectoria en cocinas de tres continentes, Armando Reyes regresó a México con una misión: crear una experiencia gastronómica que honre las raíces italo-mexicanas de su familia. Formado en el Culinary Institute of America y con stages en El Bulli, Osteria Francescana y Pujol.",
  awards: ["Gault&Millau 3 toques (2022, 2023, 2024)", "Restaurante del Año — Culinaria MX 2023", "Chef Revelación — Tiempo Libre 2019"],
  avatar: "AR",
}

export const team = [
  { name: "Sommelier Jorge Vidal", role: "Jefe de Sommelier", specialty: "Vinos italianos y naturales", exp: "18 años · WSET Level 4 · Ex-Pujol", avatar: "JV", color: "from-wine-700 to-slate-900" },
  { name: "Chef Daniela Mora", role: "Sous Chef", specialty: "Pastas artesanales & Postres", exp: "12 años · Le Cordon Bleu CDMX", avatar: "DM", color: "from-rose-700 to-rose-900" },
  { name: "Maître Sofía León", role: "Directora de Sala", specialty: "Hospitalidad de lujo", exp: "15 años · Hotel Presidente · Rosewood", avatar: "SL", color: "from-slate-700 to-gray-900" },
]

export const services = [
  { icon: UtensilsCrossed, name: "Comedor Principal", desc: "Salón climatizado para 80 comensales con vista al jardín interior. Ambiente íntimo y elegante para parejas, familia y reuniones de negocios.", tags: ["Lunes–Sábado", "13:00–23:00", "Domingos 13:00–18:00"], color: "text-amber-400", bg: "bg-amber-950/15", border: "border-amber-800/30" },
  { icon: Wine, name: "Wine Bar & Terraza", desc: "Selección de más de 180 etiquetas curadas por nuestro sommelier. Terraza al aire libre con calefactores para disfrutar incluso en temporada fría.", tags: ["Martes–Sábado", "18:00–01:00", "Música en vivo viernes"], color: "text-rose-400", bg: "bg-rose-950/15", border: "border-rose-800/30" },
  { icon: ChefHat, name: "Menú Degustación", desc: "7 tiempos con maridaje de vinos seleccionados por el sommelier. Experiencia exclusiva que narra la historia gastronómica del chef en 2 horas.", tags: ["Viernes y Sábado", "Solo con reserva", "Grupos ≤8 personas"], color: "text-violet-400", bg: "bg-violet-950/15", border: "border-violet-800/30" },
  { icon: Users, name: "Eventos Privados", desc: "Salón Verano para hasta 40 personas con menú personalizado. Perfecto para celebraciones, cenas corporativas, despedidas y lanzamientos de marca.", tags: ["Disponibilidad sujeta a agenda", "Menú personalizable", "Open bar disponible"], color: "text-emerald-400", bg: "bg-emerald-950/15", border: "border-emerald-800/30" },
  { icon: Leaf, name: "Cocina de Temporada", desc: "Cada mes rediseñamos parte del menú con ingredientes de temporada y productores locales. Trabajamos con granjas orgánicas del Estado de México y Morelos.", tags: ["Menú mensual cambiante", "50% ingredientes locales", "Sin conservadores"], color: "text-teal-400", bg: "bg-teal-950/15", border: "border-teal-800/30" },
  { icon: Award, name: "Clases de Cocina", desc: "Sábados por la mañana: taller de 3 horas con el Chef Armando. Aprende a hacer pasta fresca, risotto o el iconic Tiramisú de la nonna. Grupos de hasta 10.", tags: ["Sábados 10:00–13:00", "Incluye ingredientes", "Incluye comida + vino"], color: "text-cyan-400", bg: "bg-cyan-950/15", border: "border-cyan-800/30" },
]

export const testimonials = [
  { name: "Familia Gutiérrez Barrera", handle: "Clientes desde 2018", avatar: "GB", text: "La celebración del 50 aniversario de mis papás. El chef preparó un menú personalizado con los platos favoritos de cada uno. El detalle de los nombres en el menú escrito a mano fue perfecto. Gracias por hacer ese momento inolvidable.", service: "Eventos Privados", rating: 5, date: "Abr 2025" },
  { name: "Ing. Rafael Montoya", handle: "Empresario", avatar: "RM", text: "Llevo 6 años cerrando contratos en Bella Terra. La discreción de la sala, la calidad del vino y la atención de Jorge el sommelier hacen que cada reunión de negocios sea perfecta. Mi cliente favorito: el Barolo Marchesi 2018.", service: "Comedor principal", rating: 5, date: "Mar 2025" },
  { name: "Dra. Valentina Cruz", handle: "Crítica gastronómica", avatar: "VC", text: "El risotto al nero es posiblemente el mejor de México. La relación calidad-precio en las entradas es excepcional para Polanco. Sofía, la directora de sala, recuerda tu nombre desde la primera visita. Eso no tiene precio.", service: "Experiencia gastronómica", rating: 5, date: "May 2025" },
  { name: "Taller de Cocina de María José", handle: "Influencer culinaria", avatar: "MJ", text: "Tomé el taller de pasta fresca con el chef Armando. En 3 horas aprendí a hacer 4 tipos de pasta desde cero. La cena al final del taller fue el mejor cierre. ¡Ya me inscribí al siguiente!", service: "Clases de cocina", rating: 5, date: "Feb 2025" },
  { name: "Sr. Antoine Berger", handle: "Huésped del St. Regis", avatar: "AB", text: "Je revisite Mexico régulièrement pour affaires. Bella Terra est ma table préférée en Amérique Latine. Le Tiramisù della Nonna me rappelle Naples. Incroyable.", service: "Comedor principal", rating: 5, date: "Ene 2025" },
  { name: "Pareja Torres-Acosta", handle: "Celebración de aniversario", avatar: "TA", text: "Para nuestro décimo aniversario pedimos el menú degustación de 7 tiempos. Cada platillo tenía una historia. El maridaje de Jorge con el Barolo fue el punto más alto de la noche. Definitivamente el mejor restaurante de Polanco.", service: "Menú Degustación", rating: 5, date: "Jun 2025" },
]

export const faqs = [
  { q: "¿Necesito reservación?", a: "Recomendamos reservar con al menos 48 horas de anticipación, especialmente para viernes y sábados. El comedor principal y la terraza pueden estar llenos sin aviso. El Menú Degustación requiere reserva con mínimo 72 horas de anticipación." },
  { q: "¿Tienen opciones vegetarianas o veganas?", a: "Sí. Ofrecemos versiones vegetarianas de la mayoría de los platos y podemos crear un menú degustación vegetariano completo con 48 horas de aviso. Indicarlo al hacer la reserva." },
  { q: "¿Tienen estacionamiento?", a: "Sí. Servicio de valet parking incluido para comensales. También hay estacionamiento público en Masaryk a media cuadra. El taxi y Uber son la opción más práctica para quienes disfrutan del maridaje." },
  { q: "¿Cuál es el código de vestimenta?", a: "Casual elegante. No permitimos shorts, chanclas ni camisetas sin mangas en el comedor principal. La terraza y el wine bar son más relajados pero pedimos siempre presentación cuidada." },
  { q: "¿Pueden acomodar grupos grandes?", a: "Para grupos de más de 8 personas sugerimos el Salón Verano privado. Incluye menú personalizable, decoración a tu elección y coordinador de evento dedicado. Consultar disponibilidad con anticipación." },
  { q: "¿Aceptan todas las formas de pago?", a: "Aceptamos efectivo, todas las tarjetas de crédito/débito y transferencia SPEI. No aplicamos recargo por tarjeta. El IVA ya está incluido en los precios del menú." },
]

export const blogPosts = [
  { id: 1, slug: "risotto-perfecto", title: "Los 5 secretos del risotto perfecto según el Chef Armando", excerpt: "Temperatura del caldo, el mantecado final, el reposo correcto. Te revelamos las técnicas que hacen del nuestro el risotto más reconocido de Polanco.", category: "Técnica", date: "12 May 2025", readTime: "7 min", author: "Chef Armando Reyes" },
  { id: 2, slug: "barolo-guia", title: "Guía de Barolo: qué buscar en la etiqueta y cómo maridarlo", excerpt: "El 'rey de los vinos italianos' puede intimidar. Nuestro sommelier Jorge explica cómo elegir, cuándo abrirlo y con qué platillos acompañarlo.", category: "Vinos", date: "5 May 2025", readTime: "9 min", author: "Jorge Vidal, Sommelier" },
  { id: 3, slug: "ingredientes-temporada-mayo", title: "Ingredientes de temporada mayo 2025: lo que está llegando a nuestra cocina", excerpt: "Chayotes de Xochimilco, trucha arco iris de Hidalgo y higos de Atlixco. Así construimos el menú de mayo con productores locales.", category: "Temporada", date: "28 Abr 2025", readTime: "5 min", author: "Chef Daniela Mora" },
  { id: 4, slug: "taller-pasta-fresca", title: "Lo que aprendes en nuestro taller de pasta fresca (y lo que nunca imaginaste)", excerpt: "Más allá de la técnica: la historia de la pasta italiana, los tipos de harina y por qué la hidratación lo cambia todo. Reporte del taller de abril.", category: "Clases", date: "20 Abr 2025", readTime: "6 min", author: "Chef Armando Reyes" },
  { id: 5, slug: "mejores-postres-cdmx", title: "Los postres que han enamorado a la crítica gastronómica de CDMX", excerpt: "Del Tiramisù della Nonna al Tortino di Cioccolato: la historia detrás de cada postre que ha sido protagonista en reseñas y menciones.", category: "Postres", date: "10 Abr 2025", readTime: "8 min", author: "Chef Daniela Mora" },
  { id: 6, slug: "evento-privado-como-elegir", title: "Cómo elegir el restaurante ideal para tu evento corporativo", excerpt: "Ubicación, privacidad, menú personalizable, servicio AV y estacionamiento. La checklist que usan los coordinadores de eventos profesionales.", category: "Eventos", date: "1 Abr 2025", readTime: "6 min", author: "Sofía León" },
]
