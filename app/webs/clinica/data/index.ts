import { Heart, Brain, Eye, Baby, Bone, Shield, Stethoscope, Activity } from "lucide-react"

export const brand = {
  name: "Centro Médico Integral",
  sub: "Salud & Bienestar",
  tagline: "Tu salud, nuestra prioridad",
  email: "citas@centromedicointeg.mx",
  phone: "+52 55 3300 4400",
  whatsapp: "+52 55 3300 4400",
  address: "Insurgentes Sur 1458, Del Valle, CDMX",
  founded: "2008",
  urgencias: "+52 55 3300 4499",
}

export const stats = [
  { value: "+18k", label: "Pacientes atendidos" },
  { value: "17 años", label: "De experiencia" },
  { value: "98%", label: "Satisfacción" },
  { value: "24/7", label: "Urgencias" },
]

export const especialidades = [
  { icon: Heart, name: "Cardiología", desc: "Diagnóstico y tratamiento de enfermedades cardiovasculares. Ecocardiografías, Holter, prueba de esfuerzo y valoración de riesgo.", tags: ["Ecocardiograma", "Holter 24h", "Ergometría"], color: "text-rose-400", bg: "bg-rose-950/15", border: "border-rose-800/30" },
  { icon: Brain, name: "Neurología", desc: "Atención especializada en enfermedades del sistema nervioso: migraña, epilepsia, Parkinson, esclerosis múltiple y neuropatías periféricas.", tags: ["EEG", "EMG", "Neurosonología"], color: "text-violet-400", bg: "bg-violet-950/15", border: "border-violet-800/30" },
  { icon: Eye, name: "Oftalmología", desc: "Evaluación completa de la visión, tratamiento de cataratas, glaucoma y cirugía LASIK. Tecnología de última generación para diagnóstico preciso.", tags: ["LASIK", "Catarata", "Glaucoma"], color: "text-blue-400", bg: "bg-blue-950/15", border: "border-blue-800/30" },
  { icon: Baby, name: "Pediatría", desc: "Medicina preventiva y curativa para recién nacidos, niños y adolescentes. Control de crecimiento, vacunación y seguimiento del desarrollo.", tags: ["Control niño sano", "Vacunas", "TDAH"], color: "text-amber-400", bg: "bg-amber-950/15", border: "border-amber-800/30" },
  { icon: Bone, name: "Ortopedia", desc: "Tratamiento de lesiones musculoesqueléticas: fracturas, artritis, lesiones deportivas y cirugía artroscópica mínimamente invasiva.", tags: ["Artroscopía", "Prótesis", "Fisioterapia"], color: "text-emerald-400", bg: "bg-emerald-950/15", border: "border-emerald-800/30" },
  { icon: Stethoscope, name: "Medicina Interna", desc: "Diagnóstico y manejo integral del paciente adulto: diabetes, hipertensión, dislipidemia, enfermedades autoinmunes y geriatría.", tags: ["Diabetes", "Hipertensión", "Preventiva"], color: "text-teal-400", bg: "bg-teal-950/15", border: "border-teal-800/30" },
  { icon: Shield, name: "Ginecología", desc: "Atención integral de la mujer: control prenatal, planificación familiar, colposcopía, ultrasonido obstétrico y climaterio.", tags: ["Embarazo", "Colposcopía", "PAP"], color: "text-pink-400", bg: "bg-pink-950/15", border: "border-pink-800/30" },
  { icon: Activity, name: "Endocrinología", desc: "Diagnóstico y tratamiento de trastornos hormonales: diabetes tipo 1 y 2, enfermedades de tiroides, obesidad y osteoporosis.", tags: ["Tiroides", "Obesidad", "Osteoporosis"], color: "text-cyan-400", bg: "bg-cyan-950/15", border: "border-cyan-800/30" },
]

export const medicos = [
  { name: "Dra. Patricia Ruiz Nava", specialty: "Cardiología", exp: "20 años · INCMNSZ · Fellowship Houston Methodist", cedula: "Cédula 4821056", avatar: "PR", color: "from-rose-700 to-rose-900", disponible: "Lun, Mié, Vie" },
  { name: "Dr. Eduardo Campos", specialty: "Neurología", exp: "16 años · INNN · Certificado SMN", cedula: "Cédula 5983012", avatar: "EC", color: "from-violet-700 to-violet-900", disponible: "Mar, Jue, Sáb" },
  { name: "Dra. Claudia Vera Soto", specialty: "Pediatría", exp: "14 años · HIMFG · Maestría en Pediatría UAM", cedula: "Cédula 7204891", avatar: "CV", color: "from-amber-700 to-amber-900", disponible: "Lun–Vie" },
  { name: "Dr. Roberto Sánchez", specialty: "Ortopedia", exp: "18 años · INR · Artroscopía avanzada", cedula: "Cédula 3947023", avatar: "RS", color: "from-emerald-700 to-emerald-900", disponible: "Lun, Mié, Vie" },
  { name: "Dra. Ana González Leal", specialty: "Ginecología", exp: "12 años · INPER · Cirugía laparoscópica", cedula: "Cédula 8301274", avatar: "AG", color: "from-pink-700 to-pink-900", disponible: "Mar, Jue" },
  { name: "Dr. Luis Mendez Torres", specialty: "Medicina Interna", exp: "22 años · UNAM · Geriatra certificado", cedula: "Cédula 2183940", avatar: "LM", color: "from-teal-700 to-teal-900", disponible: "Lun–Sáb" },
]

export const seguros = ["GNP", "AXA", "Allianz", "MetLife", "Seguros Monterrey", "Médica Sur", "BUPA", "Chubb", "Mapfre", "Sura"]

export const testimonials = [
  { name: "Sra. Lorena Méndez", handle: "Paciente de Cardiología", avatar: "LM", text: "La Dra. Ruiz detectó un problema cardíaco que otro médico había pasado por alto por 2 años. Su diagnóstico oportuno y el seguimiento cercano me salvaron la vida. Eternamente agradecida con todo el equipo.", specialty: "Cardiología", rating: 5, date: "May 2025" },
  { name: "Ing. Fernando Castillo", handle: "Paciente de Neurología", avatar: "FC", text: "Sufrí de migrañas crónicas durante 8 años. El Dr. Campos identificó el origen y en 3 meses de tratamiento reducimos los episodios de 15 a menos de 2 por mes. Cambió mi calidad de vida completamente.", specialty: "Neurología", rating: 5, date: "Abr 2025" },
  { name: "Familia Ramírez Torres", handle: "Pacientes de Pediatría", avatar: "RT", text: "Llevamos 5 años con la Dra. Vera. Mis tres hijos la adoran. Es increíblemente paciente con ellos, explica todo claramente y siempre está disponible para resolver dudas por WhatsApp.", specialty: "Pediatría", rating: 5, date: "Mar 2025" },
  { name: "Lic. Marisol Fuentes", handle: "Paciente de Ginecología", avatar: "MF", text: "Mi control prenatal fue de principio a fin con la Dra. González. Las instalaciones son impecables, el equipo de ultrasonido de última generación y la atención siempre cálida y profesional.", specialty: "Ginecología", rating: 5, date: "Feb 2025" },
]

export const faqs = [
  { q: "¿Cómo agendar una cita?", a: "Por teléfono, WhatsApp, formulario en línea o directamente en recepción. Para especialidades de alta demanda (Cardiología, Neurología), recomendamos agendar con al menos 5 días de anticipación." },
  { q: "¿Qué seguros aceptan?", a: "Trabajamos con GNP, AXA, Allianz, MetLife, Seguros Monterrey, BUPA, Chubb, Mapfre y Sura. Verificamos tu cobertura antes de la consulta sin costo adicional. También atendemos pacientes particulares." },
  { q: "¿Tienen servicio de urgencias?", a: "Sí. Urgencias disponibles 24/7 los 365 días del año. Línea directa: +52 55 3300 4499. Médico de urgencias siempre en turno con acceso a estudios de laboratorio e imagen inmediatos." },
  { q: "¿Tienen teleconsulta?", a: "Sí. Disponible para seguimiento de pacientes crónicos, segunda opinión y consultas de urgencia menor. La teleconsulta se realiza vía videollamada con acceso a tu expediente electrónico." },
  { q: "¿Cómo obtengo mis resultados de laboratorio?", a: "Los resultados están disponibles en el portal de pacientes en línea dentro de 24 horas para estudios de laboratorio. Estudios de imagen: 48-72 horas con informe radiológico incluido." },
  { q: "¿Cuentan con estacionamiento?", a: "Sí. Estacionamiento propio con capacidad para 80 vehículos incluido para pacientes. El validador de boleto se obtiene en recepción." },
]

export const blogPosts = [
  { id: 1, slug: "diabetes-tipo-2-prevencion", title: "Cómo prevenir la diabetes tipo 2: señales tempranas y cambios de estilo de vida", excerpt: "México tiene una de las tasas más altas de diabetes del mundo. El Dr. Méndez explica qué factores de riesgo vigilar y qué cambios concretos marcan la diferencia antes de que la enfermedad se desarrolle.", category: "Endocrinología", date: "10 May 2025", readTime: "8 min", author: "Dr. Luis Méndez Torres" },
  { id: 2, slug: "hipertension-arterial-guia", title: "Hipertensión: el asesino silencioso que puedes controlar", excerpt: "1 de cada 3 adultos en México tiene hipertensión y la mitad no lo sabe. Guía completa para entender los números, cuándo preocuparse y cómo manejarla con o sin medicamentos.", category: "Cardiología", date: "3 May 2025", readTime: "10 min", author: "Dra. Patricia Ruiz Nava" },
  { id: 3, slug: "vacunas-adultos-cdmx", title: "Vacunas para adultos: cuáles necesitas y dónde ponértelas en CDMX", excerpt: "No solo los niños necesitan vacunas. El esquema de vacunación del adulto incluye refuerzos de tétanos, influenza anual, hepatitis y neumococo. Todo lo que necesitas saber.", category: "Medicina Preventiva", date: "26 Abr 2025", readTime: "6 min", author: "Dra. Claudia Vera Soto" },
  { id: 4, slug: "migrana-tratamiento-2025", title: "Nuevos tratamientos para la migraña: lo que cambió en 2024-2025", excerpt: "Los anticuerpos monoclonales anti-CGRP y los gepants han revolucionado el manejo de la migraña crónica. El Dr. Campos explica quiénes son candidatos y qué pueden esperar.", category: "Neurología", date: "18 Abr 2025", readTime: "9 min", author: "Dr. Eduardo Campos" },
]
