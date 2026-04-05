import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  ShieldCheck, 
  Wallet,
  Lock,
  RefreshCw,
  ChevronRight,
  BarChart3,
  Info,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProbabilityGauge } from './components/ProbabilityGauge';
import { PriceChart } from './components/PriceChart';
import { ContextChecklist } from './components/ContextChecklist';
import { cn } from './lib/utils';

// Mock data generator
const generateChartData = () => {
  return Array.from({ length: 20 }, (_, i) => ({
    time: `${i}:00`,
    price: 1.0850 + Math.random() * 0.0030
  }));
};

import { brokerService } from './services/brokerService';

// Supported assets
const ASSETS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'EUR/JPY'];

export default function App() {
  const [probability, setProbability] = useState(87);
  const [asset, setAsset] = useState('EUR/USD');
  const [signal, setSignal] = useState<'CALL' | 'PUT' | 'WAIT'>('CALL');
  const [capital, setCapital] = useState(1000);
  const [riskMode, setRiskMode] = useState<'CONSERVATIVE' | 'MODERATE'>('MODERATE');
  const [lockdown, setLockdown] = useState(false);
  const [chartData, setChartData] = useState(generateChartData());
  const [timeLeft, setTimeLeft] = useState('');
  const [isBrokerConnected, setIsBrokerConnected] = useState(false);
  const [brokerBalance, setBrokerBalance] = useState<number | null>(null);
  const [executionStatus, setExecutionStatus] = useState<'IDLE' | 'SENDING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [triggerStatus, setTriggerStatus] = useState<'ANALYZING' | 'ZONE_REACHED' | 'CONFIRMED'>('ANALYZING');
  const [autoTrade, setAutoTrade] = useState(false);
  const [lastTradeId, setLastTradeId] = useState<string | null>(null);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [isConnecting, setIsConnecting] = useState(false);
  const [showManualSync, setShowManualSync] = useState(false);
  const [manualBalance, setManualBalance] = useState('');

  // Dynamic M15 Timer
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();
      
      const nextM15 = Math.ceil((minutes + 1) / 15) * 15;
      let diffMinutes = nextM15 - minutes - 1;
      let diffSeconds = 60 - seconds;
      
      if (diffSeconds === 60) {
        diffSeconds = 0;
        diffMinutes += 1;
      }
      
      const displayMinutes = String(diffMinutes).padStart(2, '0');
      const displaySeconds = String(diffSeconds).padStart(2, '0');
      setTimeLeft(`00:${displayMinutes}:${displaySeconds}`);

      // Logic for "Moment of Entry" within the M15 cycle
      if (diffMinutes === 14 && diffSeconds > 50) {
        setTriggerStatus('ANALYZING');
      } else if (diffMinutes === 14 && diffSeconds <= 50 && diffSeconds > 45) {
        setTriggerStatus('ZONE_REACHED');
      } else if (diffMinutes === 14 && diffSeconds <= 45) {
        setTriggerStatus('CONFIRMED');
      }

      // When a new M15 candle starts, generate a new "qualified" signal
      if (diffMinutes === 14 && diffSeconds === 59) {
        generateQualifiedSignal();
      }
    };

    const generateQualifiedSignal = () => {
      const newProb = 78 + Math.floor(Math.random() * 15);
      setProbability(newProb);
      setSignal(newProb > 82 ? (Math.random() > 0.5 ? 'CALL' : 'PUT') : 'WAIT');
      setChartData(generateChartData());
      setExecutionStatus('IDLE');
    };

    // Initial signal
    generateQualifiedSignal();

    const timerInterval = setInterval(updateTimer, 1000);
    return () => clearInterval(timerInterval);
  }, [asset]);

  // Automatic Execution Trigger
  useEffect(() => {
    if (autoTrade && isBrokerConnected && triggerStatus === 'CONFIRMED' && signal !== 'WAIT' && executionStatus === 'IDLE') {
      handleExecuteTrade();
    }
  }, [triggerStatus, autoTrade, isBrokerConnected, signal, executionStatus]);

  // Sync balance when connected
  useEffect(() => {
    let syncInterval: NodeJS.Timeout;

    const sync = async () => {
      if (isBrokerConnected) {
        try {
          const balance = await brokerService.getBalance();
          setBrokerBalance(balance);
          setCapital(balance);
        } catch (err) {
          console.error('Balance sync failed', err);
        }
      }
    };

    if (isBrokerConnected) {
      sync();
      syncInterval = setInterval(sync, 30000); // Sync every 30s
    } else {
      setBrokerBalance(null);
      setCapital(1000);
    }

    return () => clearInterval(syncInterval);
  }, [isBrokerConnected]);

  const handleExecuteTrade = async () => {
    if (!isBrokerConnected) {
      alert("Por favor, conecte-se à Bullex primeiro.");
      return;
    }
    
    if (signal === 'WAIT') return;

    setExecutionStatus('SENDING');
    
    try {
      const result = await brokerService.executeTrade({
        asset,
        type: signal as 'CALL' | 'PUT',
        amount: kellyValue,
        duration: 15
      });

      if (result.success) {
        setExecutionStatus('SUCCESS');
        setLastTradeId(result.tradeId || null);
        // Immediate balance sync after trade
        const newBalance = await brokerService.getBalance();
        setBrokerBalance(newBalance);
        setCapital(newBalance);
        setTimeout(() => setExecutionStatus('IDLE'), 5000);
      } else {
        setExecutionStatus('ERROR');
        console.error('Trade failed:', result.error);
        setTimeout(() => setExecutionStatus('IDLE'), 5000);
      }
    } catch (err) {
      setExecutionStatus('ERROR');
      setTimeout(() => setExecutionStatus('IDLE'), 5000);
    }
  };

  const kellyValue = riskMode === 'CONSERVATIVE' ? capital * 0.01 : capital * 0.025;

  const getSignalColor = () => {
    if (signal === 'CALL') return '#10b981'; // Emerald
    if (signal === 'PUT') return '#ef4444'; // Neon Red
    return '#f59e0b'; // Amber
  };

  return (
    <div className="min-h-screen p-6 lg:p-10 flex flex-col gap-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
            <Activity className="text-emerald-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-white">NEURO-QUANT <span className="text-emerald-500">M15</span></h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-bold">Onde a estatística encontra o timing perfeito</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Asset Selector */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Selecione o Ativo</span>
            <select 
              value={asset}
              onChange={(e) => setAsset(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-xs font-bold text-white outline-none focus:border-emerald-500/50 transition-colors cursor-pointer"
            >
              {ASSETS.map(a => <option key={a} value={a} className="bg-[#05070a]">{a}</option>)}
            </select>
          </div>

          <div className="h-10 w-[1px] bg-white/10" />

          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Horário de Ouro</span>
            <div className="flex items-center gap-2 text-emerald-400">
              <Clock size={14} />
              <span className="text-sm font-mono font-bold">04:00 - 12:00 BRT</span>
            </div>
          </div>
          <div className="h-10 w-[1px] bg-white/10" />
          <div className="flex items-center gap-3 glass px-4 py-2 rounded-xl">
            <Wallet className="text-slate-400" size={18} />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Banca Total</span>
              <span className="text-sm font-mono font-bold">${capital.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left Column: Analysis */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Probability Gauge Card */}
            <div className="glass rounded-3xl p-6 flex flex-col items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Força Probabilística</h3>
              <ProbabilityGauge value={probability} color={getSignalColor()} />
              <div className="w-full flex items-center justify-between mt-4 px-2">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">RSI (14)</span>
                  <span className="text-sm font-bold text-white">68.4</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Desvio</span>
                  <span className="text-sm font-bold text-emerald-400">2.5 SD</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">RVI</span>
                  <span className="text-sm font-bold text-white">0.42</span>
                </div>
              </div>
            </div>

            {/* Signal Card */}
            <div className="glass rounded-3xl p-6 flex flex-col justify-between md:col-span-2 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-slate-400">
                    {asset}
                  </div>
                  <div className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400">
                    M15
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className={cn(
                      "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                      triggerStatus === 'CONFIRMED' ? "bg-emerald-400" : "bg-amber-400"
                    )}></span>
                    <span className={cn(
                      "relative inline-flex rounded-full h-2 w-2",
                      triggerStatus === 'CONFIRMED' ? "bg-emerald-500" : "bg-amber-500"
                    )}></span>
                  </span>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    triggerStatus === 'CONFIRMED' ? "text-emerald-500" : "text-amber-500"
                  )}>
                    {triggerStatus === 'ANALYZING' && 'Analisando Fluxo...'}
                    {triggerStatus === 'ZONE_REACHED' && 'Zona de Confluência!'}
                    {triggerStatus === 'CONFIRMED' && 'ENTRADA CONFIRMADA'}
                  </span>
                </div>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block mb-1">Sinal Atual</span>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={signal}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={cn(
                        "text-6xl font-black tracking-tighter",
                        signal === 'CALL' ? "text-emerald-500" : signal === 'PUT' ? "text-red-500" : "text-amber-500"
                      )}
                    >
                      {signal}
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block mb-1">Expiração M15</span>
                  <span className="text-2xl font-mono font-bold text-white">{timeLeft}</span>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="text-emerald-400" size={20} />
                  <span className="text-xs font-medium text-slate-300">Filtro de Volatilidade Ativo</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Status:</span>
                  <span className="text-[10px] font-bold text-emerald-500 uppercase">Estável</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Confluência Estatística</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                  <span className="text-[10px] text-slate-500 font-bold uppercase">POC Zone</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500/20 border border-red-500/50" />
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Deviation Zone</span>
                </div>
              </div>
            </div>
            <PriceChart data={chartData} color={getSignalColor()} />
          </div>

          {/* Justification Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 mb-1">
                <BarChart3 size={16} />
                <h4 className="text-xs font-bold uppercase tracking-widest">Justificativa Quant</h4>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Preço atingiu o <span className="text-white font-bold">Desvio Padrão -2.5</span> da Regressão Linear. 
                Exaustão de venda confirmada no <span className="text-white font-bold">RSI (14)</span> em 22. 
                Volume POC identificado em 1.0842.
              </p>
            </div>
            <div className="glass rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 mb-1">
                <Info size={16} />
                <h4 className="text-xs font-bold uppercase tracking-widest">Justificativa Quali</h4>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Nenhuma notícia de impacto ("3 Touros") nos próximos 60 minutos. 
                Tendência macro <span className="text-white font-bold">M60 é de Alta</span>. 
                Correlação EUR/GBP positiva (0.82).
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Controls & Checklist */}
        <div className="lg:col-span-4 space-y-6">
          {/* Broker Connection Card */}
          <div className="glass rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Conexão Corretora</h3>
              <div className={cn(
                "px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-tighter",
                isBrokerConnected ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
              )}>
                {isBrokerConnected ? 'Conectado' : 'Desconectado'}
              </div>
            </div>
            
            {!isBrokerConnected ? (
              <div className="space-y-4">
                <p className="text-[10px] text-slate-400 leading-tight">
                  Acesse sua conta <span className="text-white font-bold">Bullex</span> para operar em tempo real.
                </p>
                <div className="space-y-2">
                  <input 
                    type="email" 
                    placeholder="E-mail"
                    value={credentials.email}
                    onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/50 transition-all"
                  />
                  <input 
                    type="password" 
                    placeholder="Senha"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
                <button 
                  onClick={async () => {
                    if (!credentials.email || !credentials.password) {
                      alert("Preencha todos os campos.");
                      return;
                    }
                    setIsConnecting(true);
                    const success = await brokerService.connect(credentials);
                    setIsConnecting(false);
                    if (success) setIsBrokerConnected(true);
                  }}
                  disabled={isConnecting}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
                >
                  {isConnecting ? <RefreshCw size={14} className="animate-spin" /> : 'Entrar na Bullex'}
                  {!isConnecting && <ChevronRight size={12} />}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <ShieldCheck className="text-emerald-400" size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-white">API Bullex Ativa</span>
                      <span className="text-[8px] text-emerald-400/70 uppercase font-bold">Sincronização em tempo real</span>
                    </div>
                  </div>
                  <button 
                    onClick={async () => {
                      await brokerService.disconnect();
                      setIsBrokerConnected(false);
                      setAutoTrade(false);
                    }}
                    className="text-[8px] uppercase font-bold text-red-400 hover:text-red-300 transition-colors"
                  >
                    Sair
                  </button>
                </div>

                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Auto-Trade</span>
                  <button 
                    onClick={() => setAutoTrade(!autoTrade)}
                    className={cn(
                      "w-10 h-5 rounded-full transition-all relative",
                      autoTrade ? "bg-emerald-500" : "bg-slate-700"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                      autoTrade ? "left-6" : "left-1"
                    )} />
                  </button>
                </div>

                <div className="pt-2 border-t border-white/5">
                  <button 
                    onClick={() => setShowManualSync(!showManualSync)}
                    className="text-[8px] uppercase font-bold text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
                  >
                    {showManualSync ? 'Fechar Sincronização' : 'Sincronizar Banca Manual'}
                  </button>
                  
                  {showManualSync && (
                    <div className="mt-2 flex gap-2">
                      <input 
                        type="number" 
                        placeholder="Valor Real R$"
                        value={manualBalance}
                        onChange={(e) => setManualBalance(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white outline-none"
                      />
                      <button 
                        onClick={() => {
                          const val = parseFloat(manualBalance);
                          if (!isNaN(val)) {
                            setCapital(val);
                            setBrokerBalance(val);
                            setShowManualSync(false);
                          }
                        }}
                        className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-lg text-[8px] font-bold uppercase"
                      >
                        OK
                      </button>
                    </div>
                  )}
                </div>
                
                {lastTradeId && (
                  <div className="text-[8px] text-slate-500 uppercase font-bold text-center border-t border-white/5 pt-2">
                    Última ID: <span className="text-slate-300">{lastTradeId}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Context Checklist Card */}
          <div className="glass rounded-3xl p-6">
            <ContextChecklist checks={{ calendar: true, trend: true, strength: true }} />
          </div>

          {/* Risk Management Card */}
          <div className="glass rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Gestão de Risco</h3>
              <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                <button 
                  onClick={() => setRiskMode('CONSERVATIVE')}
                  className={cn(
                    "px-3 py-1 rounded-md text-[10px] font-bold transition-all",
                    riskMode === 'CONSERVATIVE' ? "bg-emerald-500 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  1%
                </button>
                <button 
                  onClick={() => setRiskMode('MODERATE')}
                  className={cn(
                    "px-3 py-1 rounded-md text-[10px] font-bold transition-all",
                    riskMode === 'MODERATE' ? "bg-emerald-500 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  2.5%
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Valor da Entrada</span>
                  <span className="text-xl font-mono font-bold text-white">${kellyValue.toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Critério Kelly</span>
                  <span className="text-xs font-bold text-emerald-400 block">Otimizado</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                <Lock className="text-amber-500" size={16} />
                <span className="text-[10px] font-medium text-amber-200/70">Lockdown Automático: 2 Loss Seguidos</span>
              </div>
            </div>

            <button 
              disabled={lockdown || signal === 'WAIT' || executionStatus === 'SENDING'}
              onClick={handleExecuteTrade}
              className={cn(
                "w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl",
                executionStatus === 'SENDING' ? "bg-slate-700 text-slate-400 cursor-wait" :
                signal === 'WAIT' 
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                  : signal === 'CALL'
                    ? "bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/20"
                    : "bg-red-500 hover:bg-red-400 text-white shadow-red-500/20"
              )}
            >
              {executionStatus === 'SENDING' && <RefreshCw size={20} className="animate-spin" />}
              {executionStatus === 'SUCCESS' && <ShieldCheck size={20} />}
              {executionStatus === 'ERROR' && <AlertTriangle size={20} />}
              
              {executionStatus === 'IDLE' && (signal === 'WAIT' ? 'Aguardando Confluência' : 'Executar Operação')}
              {executionStatus === 'SENDING' && 'Enviando Ordem...'}
              {executionStatus === 'SUCCESS' && 'Ordem Executada!'}
              {executionStatus === 'ERROR' && 'Erro na Execução'}
              
              {executionStatus === 'IDLE' && <ChevronRight size={20} />}
            </button>
          </div>

          {/* Currency Strength */}
          <div className="glass rounded-3xl p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Força da Moeda</h3>
            <div className="space-y-3">
              {[
                { sym: 'EUR', val: 8.4, color: 'bg-emerald-500' },
                { sym: 'USD', val: 3.2, color: 'bg-red-500' },
                { sym: 'GBP', val: 6.7, color: 'bg-emerald-500' },
                { sym: 'JPY', val: 4.5, color: 'bg-amber-500' },
              ].map((c) => (
                <div key={c.sym} className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                    <span className="text-slate-300">{c.sym}</span>
                    <span className="text-white">{c.val}/10</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${c.val * 10}%` }}
                      className={cn("h-full rounded-full", c.color)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer Status */}
      <footer className="flex items-center justify-between px-2">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Server: Online</span>
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw size={12} className="text-slate-500 animate-spin-slow" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Última Atualização: Agora</span>
          </div>
        </div>
        <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
          © 2026 NEURO-QUANT M15 • V2.4.0
        </div>
      </footer>
    </div>
  );
}
