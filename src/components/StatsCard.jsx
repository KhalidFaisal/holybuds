export default function StatsCard({ icon, label, value, accent = 'emerald' }) {
  const accentColors = {
    emerald: 'from-pc-green/20 to-pc-green/5 border-pc-green/30 text-pc-green',
    gold: 'from-pc-gold/20 to-pc-gold/5 border-pc-gold/30 text-pc-gold',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400',
    red: 'from-red-500/20 to-red-500/5 border-red-500/30 text-red-400',
  };

  const colors = accentColors[accent] || accentColors.emerald;

  return (
    <div className={`glass-card bg-gradient-to-br ${colors} p-6`}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{icon}</span>
        <span className="text-pc-muted text-sm font-medium">{label}</span>
      </div>
      <p className="text-3xl font-black text-white">{value}</p>
    </div>
  );
}
