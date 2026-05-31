export const categorias = [
  { slug: 'herramientas-manuales', nombre: 'Herramientas Manuales', icon: '🔨', count: 84, img: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500' },
  { slug: 'herramientas-electricas', nombre: 'Herramientas Eléctricas', icon: '⚡', count: 62, img: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=500' },
  { slug: 'materiales-obra', nombre: 'Materiales de Obra', icon: '🧱', count: 120, img: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=500' },
  { slug: 'pinturas', nombre: 'Pinturas y Barnices', icon: '🎨', count: 48, img: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=500' },
  { slug: 'plomeria', nombre: 'Plomería y Sanitarios', icon: '🪠', count: 56, img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500' },
  { slug: 'electricidad', nombre: 'Electricidad', icon: '💡', count: 40, img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500' },
]

export const productos = [
  { id:'1', nombre:'Taladro Percutor 750W', precio:2890, img:'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400', cat:'herramientas-electricas', marca:'Bosch', stock:true },
  { id:'2', nombre:'Set Llaves Combinadas 12 pzs', precio:890, img:'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400', cat:'herramientas-manuales', marca:'Stanley', stock:true },
  { id:'3', nombre:'Pintura Vinílica Interior 4L', precio:650, img:'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400', cat:'pinturas', marca:'Suvinil', stock:true },
  { id:'4', nombre:'Amoladora Angular 115mm', precio:1590, img:'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400', cat:'herramientas-electricas', marca:'Makita', stock:true },
  { id:'5', nombre:'Cinta Métrica 5m PRO', precio:280, img:'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400', cat:'herramientas-manuales', marca:'Stanley', stock:true },
  { id:'6', nombre:'Cemento Portland 50kg', precio:320, img:'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400', cat:'materiales-obra', marca:'Cemex', stock:false },
]

export const servicios = [
  { titulo: 'Corte a medida', desc: 'Cortamos perfiles, caños y chapas a la medida que necesitás. Sin costo adicional en compras superiores a $500.', icon: '✂️' },
  { titulo: 'Asesoramiento técnico', desc: 'Contamos con técnicos especializados que te ayudan a elegir los materiales correctos para tu proyecto.', icon: '👷' },
  { titulo: 'Entrega a domicilio', desc: 'Entregamos en CDMX y zona metropolitana. Entregas en el día para pedidos antes de las 12:00 hs.', icon: '🚛' },
  { titulo: 'Crédito empresarial', desc: 'Líneas de crédito para empresas constructoras. Condiciones especiales y descuentos por volumen.', icon: '💳' },
  { titulo: 'Presupuesto de obra', desc: 'Elaboramos presupuestos detallados de materiales para tu proyecto. Servicio gratuito.', icon: '📋' },
  { titulo: 'Garantía extendida', desc: 'Garantía de 12 meses en herramientas eléctricas y 6 meses en herramientas manuales.', icon: '🛡️' },
]
