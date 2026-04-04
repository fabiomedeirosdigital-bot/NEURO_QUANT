import React from 'react';
import { CheckCircle2, AlertTriangle, Info, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

interface ContextChecklistProps {
  checks: {
    calendar: boolean;
    trend: boolean;
    strength: boolean;
  };
}

export const ContextChecklist: React.FC<ContextChecklistProps> = ({ checks }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Context Checklist</h3>
      
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-xl transition-colors",
        checks.calendar ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
      )}>
        {checks.calendar ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
        <div className="flex flex-col">
          <span className="text-sm font-semibold">Calendário Econômico</span>
          <span className="text-[10px] opacity-70">Sem notícias de alto impacto (3 Touros)</span>
        </div>
      </div>

      <div className={cn(
        "flex items-center gap-3 p-3 rounded-xl transition-colors",
        checks.trend ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-400"
      )}>
        <TrendingUp size={18} />
        <div className="flex flex-col">
          <span className="text-sm font-semibold">Ciclo de Tendência</span>
          <span className="text-[10px] opacity-70">Tendência Macro M60 Alinhada</span>
        </div>
      </div>

      <div className={cn(
        "flex items-center gap-3 p-3 rounded-xl transition-colors",
        checks.strength ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
      )}>
        <Zap size={18} />
        <div className="flex flex-col">
          <span className="text-sm font-semibold">Força da Moeda</span>
          <span className="text-[10px] opacity-70">EUR (Forte) vs USD (Fraco)</span>
        </div>
      </div>
    </div>
  );
};
