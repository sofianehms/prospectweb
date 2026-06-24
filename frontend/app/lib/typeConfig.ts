export interface TypeInfo {
  label: string
  icon: string
  color: string
}

export const TYPE_CONFIG: Record<string, TypeInfo> = {
  restaurant:         { label: 'Restaurant',           icon: '🍽️', color: 'bg-orange-100' },
  cafe:               { label: 'Café',                 icon: '☕',  color: 'bg-yellow-100' },
  bar:                { label: 'Bar / Pub',            icon: '🍺',  color: 'bg-amber-100' },
  bakery:             { label: 'Boulangerie',          icon: '🥐',  color: 'bg-amber-100' },
  hair_salon:         { label: 'Coiffeur',             icon: '✂️',  color: 'bg-purple-100' },
  beauty_salon:       { label: 'Institut beauté',      icon: '💅',  color: 'bg-rose-100' },
  clothing_store:     { label: 'Boutique',             icon: '👗',  color: 'bg-pink-100' },
  pharmacy:           { label: 'Pharmacie',            icon: '💊',  color: 'bg-green-100' },
  florist:            { label: 'Fleuriste',            icon: '💐',  color: 'bg-pink-100' },
  car_repair:         { label: 'Garagiste',            icon: '🔧',  color: 'bg-slate-100' },
  hotel:              { label: 'Hôtel',                icon: '🏨',  color: 'bg-blue-100' },
  real_estate_agency: { label: 'Immobilier',           icon: '🏠',  color: 'bg-teal-100' },
  gym:                { label: 'Sport / Fitness',      icon: '💪',  color: 'bg-indigo-100' },
  supermarket:        { label: 'Supermarché',          icon: '🛒',  color: 'bg-lime-100' },
  convenience_store:  { label: 'Épicerie',             icon: '🛒',  color: 'bg-lime-100' },
  book_store:         { label: 'Librairie',            icon: '📚',  color: 'bg-indigo-100' },
  jewelry_store:      { label: 'Bijouterie',           icon: '💍',  color: 'bg-yellow-100' },
  pet_store:          { label: 'Animalerie',           icon: '🐾',  color: 'bg-emerald-100' },
  travel_agency:      { label: 'Agence de voyage',     icon: '✈️',  color: 'bg-sky-100' },
  dentist:            { label: 'Dentiste',             icon: '🦷',  color: 'bg-cyan-100' },
  doctor:             { label: 'Médecin',              icon: '🩺',  color: 'bg-cyan-100' },
  electrician:        { label: 'Électricien',          icon: '⚡',  color: 'bg-yellow-100' },
  plumber:            { label: 'Plombier',             icon: '🔧',  color: 'bg-blue-100' },
}

export function typeLabel(type: string): string {
  return TYPE_CONFIG[type]?.label ?? type.replace(/_/g, ' ')
}

export function typeIcon(type: string): string {
  return TYPE_CONFIG[type]?.icon ?? '🏪'
}

export function typeColor(type: string): string {
  return TYPE_CONFIG[type]?.color ?? 'bg-gray-100'
}
