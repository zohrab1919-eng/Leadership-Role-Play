export default function ScoreCard({ label, score, rationale }) {
  const isRed = score <= 2;
  const isAmber = score === 3;
  const isGreen = score >= 4;

  const containerClass = isRed
    ? 'bg-red-50 border-red-200'
    : isAmber
    ? 'bg-orange-50 border-orange-200'
    : 'bg-green-50 border-green-200';

  const scoreClass = isRed ? 'text-red-600' : isAmber ? 'text-orange-500' : 'text-green-600';
  const dotFill = isRed ? 'bg-red-400' : isAmber ? 'bg-orange-400' : 'bg-green-400';

  return (
    <div className={`border-2 rounded-2xl p-5 ${containerClass}`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <p className="font-semibold text-navy text-sm leading-tight">{label}</p>
        <div className="flex gap-1 shrink-0 mt-0.5">
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all ${i <= score ? dotFill : 'bg-navy/10'}`}
            />
          ))}
        </div>
      </div>
      <p className="text-navy/70 text-sm leading-relaxed">{rationale}</p>
      <p className={`font-heading font-bold text-3xl mt-3 ${scoreClass}`}>{score}<span className="text-base font-sans font-normal text-navy/30">/5</span></p>
    </div>
  );
}
