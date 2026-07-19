export function getEffectColorClass(effect) {
  switch (effect?.toUpperCase()) {
    case 'SLEEP':
      return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
    case 'FOCUS':
      return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    case 'ENERGY':
      return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
    case 'RELAX':
      return 'bg-teal-500/10 text-teal-400 border border-teal-500/20';
    case 'CREATIVE':
      return 'bg-pink-500/10 text-pink-400 border border-pink-500/20';
    case 'EUPHORIC':
      return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
    default:
      return 'bg-pc-gold/10 text-pc-gold border border-pc-gold/20';
  }
}
