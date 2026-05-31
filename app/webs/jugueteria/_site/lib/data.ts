export const categorias = [
  { slug: '0-3', nombre: '0 a 3 años', emoji: '👶', color: 'bg-pink-100 text-pink-700', count: 42, desc: 'Juguetes sensoriales y de estimulación temprana' },
  { slug: '4-8', nombre: '4 a 8 años', emoji: '🎨', color: 'bg-blue-100 text-blue-700', count: 68, desc: 'Creatividad, aprendizaje y exploración' },
  { slug: '9-mas', nombre: '9+ años', emoji: '🚀', color: 'bg-purple-100 text-purple-700', count: 55, desc: 'Desafíos mentales y aventuras épicas' },
  { slug: 'peluches', nombre: 'Peluches', emoji: '🧸', color: 'bg-amber-100 text-amber-700', count: 38, desc: 'El mejor compañero para cada niño' },
  { slug: 'educativos', nombre: 'Educativos', emoji: '🔬', color: 'bg-green-100 text-green-700', count: 47, desc: 'Aprende jugando con ciencia y matemáticas' },
  { slug: 'juegos-mesa', nombre: 'Juegos de mesa', emoji: '🎲', color: 'bg-orange-100 text-orange-700', count: 34, desc: 'Diversión en familia para todas las edades' },
]

export const juguetes = [
  { id:'1', nombre:'Kit de Ciencia Explosiva', precio:890, img:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500', edadMin:8, edadMax:14, cat:'educativos', badge:'Nuevo', rating:4.9, reviews:234 },
  { id:'2', nombre:'Peluche Oso Gigante 60cm', precio:650, img:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500', edadMin:0, edadMax:99, cat:'peluches', badge:'Popular', rating:4.8, reviews:189 },
  { id:'3', nombre:'Tren de Madera Premium', precio:1290, img:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500', edadMin:2, edadMax:6, cat:'0-3', badge:'Recomendado', rating:4.7, reviews:156 },
  { id:'4', nombre:'Lego Architecture 500 pzs', precio:1890, img:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500', edadMin:10, edadMax:99, cat:'9-mas', badge:null, rating:4.9, reviews:312 },
  { id:'5', nombre:'Arte Creativo: Pinturas Mágicas', precio:490, img:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500', edadMin:4, edadMax:10, cat:'4-8', badge:'Oferta', rating:4.6, reviews:98 },
  { id:'6', nombre:'Catan Junior — Juego de Mesa', precio:980, img:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500', edadMin:6, edadMax:99, cat:'juegos-mesa', badge:null, rating:4.8, reviews:203 },
  { id:'7', nombre:'Robots Programables Principiantes', precio:2490, img:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500', edadMin:8, edadMax:14, cat:'educativos', badge:'Nuevo', rating:4.9, reviews:67 },
  { id:'8', nombre:'Cochecitos RC 4x4 Turbo', precio:1590, img:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500', edadMin:6, edadMax:12, cat:'4-8', badge:'Popular', rating:4.7, reviews:445 },
]

export const badgeColors: Record<string, string> = {
  'Nuevo': 'bg-green-500 text-white',
  'Popular': 'bg-blue-600 text-white',
  'Recomendado': 'bg-purple-500 text-white',
  'Oferta': 'bg-red-500 text-white',
}
