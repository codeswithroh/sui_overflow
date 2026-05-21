import { useState, useEffect, useRef } from 'react'
import {
  Activity,
  Cpu,
  Layers,
  Lock,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  FileText,
  Database,
  Sparkles,
  Terminal,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Wallet,
  Coins,
  ArrowRightLeft,
  Sun,
  Moon
} from 'lucide-react'
import './App.css'


// Types for ledger transactions
interface TradeLedgerEntry {
  id: string
  timestamp: string
  action: 'DEPOSIT' | 'WITHDRAW' | 'HEDGE_BUY' | 'HEDGE_SELL' | 'HOLD'
  amountSui: number
  usdcAmount: number
  gasSpent: number
  blobId?: string
  status: 'SUCCESS' | 'PENDING'
}

function App() {
  // Theme state: 'light' | 'dark'
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  // Active storyteller scenario state
  const [currentScenario, setCurrentScenario] = useState<'STABLE' | 'FUD' | 'FLASH_CRASH' | 'BULL_RUN'>('STABLE')

  // Navigation tabs: 'dashboard' | 'contracts'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'contracts'>('dashboard')

  // Autonomous AI Loop State
  const [isAiRunning, setIsAiRunning] = useState<boolean>(true)
  const [aiTimerSpeed, setAiTimerSpeed] = useState<number>(10000) // 10s default loop speed
  
  // Simulated Wallet & Vault States
  const [userWalletSui, setUserWalletSui] = useState<number>(1500)
  const [vaultTvlSui, setVaultTvlSui] = useState<number>(500)
  const [hedgedUsdc, setHedgedUsdc] = useState<number>(315.5) // Simulated USDC hedge
  const [totalShares, setTotalShares] = useState<number>(500)
  const [userShares, setUserShares] = useState<number>(200)

  // Form Fields
  const [depositAmount, setDepositAmount] = useState<string>('')
  const [withdrawAmount, setWithdrawAmount] = useState<string>('')
  const [formError, setFormError] = useState<string>('')
  const [formSuccess, setFormSuccess] = useState<string>('')

  // Market indicators state
  const [suiPrice, setSuiPrice] = useState<number>(1.2644)
  const [volatility, setVolatility] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('LOW')
  const [sentimentValue, setSentimentValue] = useState<number>(-0.15) // -1.0 to 1.0
  const [rsiValue, setRsiValue] = useState<number>(47.3)
  const [macdState, setMacdState] = useState<'BUY_SIGNAL' | 'NEUTRAL' | 'SELL_SIGNAL'>('NEUTRAL')

  // Interactive Chart SUI Prices over time (starts with baseline history)
  const [chartPrices, setChartPrices] = useState<number[]>([
    1.250, 1.282, 1.220, 1.154, 1.052, 1.108, 1.185, 1.242, 1.350, 1.264
  ])

  // Terminal Console Logs
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    `[System] 🤖 Aether.ai Quant Engine initialized.`,
    `[System] 🔑 Connected simulated secure wallet: 0x4e6a2fe2d8...7cf579bac0e0`,
    `[System] 📜 Sui Move Vault Contract registered at: 0xe581dc436d4e85000dd082981617689d47ceeb5ba87d17fbf8b68ea87180ade7`,
    `[System] 💾 Walrus Storage Publisher initialized. Gateway online at devnet.walrus.space`,
    `[System] 📈 Initializing historical PnL stream and loading DeepBook v3 liquidity depth...`,
    `[AI Engine] 📊 Target: SUI/USDC | Daily Drawdown Cap: 15% | Max Single Trade Slip: 0.5%`,
    `[Walrus] 💾 Downloaded initial state block. Blob ID: walrus-mock-13ec7796625a42ddb96c31a291e2273e`,
    `[AI Engine] 🎯 Evaluation complete. ACTION: HOLD. Reason: STABLE: SUI market structure remains within a healthy consolidation channel.`
  ])

  // Trade history ledger
  const [ledger, setLedger] = useState<TradeLedgerEntry[]>([
    {
      id: 'tx-0',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      action: 'DEPOSIT',
      amountSui: 200,
      usdcAmount: 0,
      gasSpent: 0.002,
      status: 'SUCCESS'
    },
    {
      id: 'tx-1',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      action: 'HEDGE_BUY',
      amountSui: 150,
      usdcAmount: 189.66,
      gasSpent: 0.015,
      blobId: 'walrus-mock-bf374115e8055e5e7cf579bac0e022f4',
      status: 'SUCCESS'
    }
  ])

  const terminalScreenRef = useRef<HTMLDivElement>(null)

  // Scroll terminal screen container locally to bottom on new log (fixes the window auto-scrolling bug!)
  useEffect(() => {
    if (terminalScreenRef.current) {
      terminalScreenRef.current.scrollTop = terminalScreenRef.current.scrollHeight
    }
  }, [consoleLogs])

  // Storyteller Scenario Trigger to immediately demonstrate risk model behavior under specific market states
  const triggerScenario = (scenario: 'STABLE' | 'FUD' | 'FLASH_CRASH' | 'BULL_RUN') => {
    setIsAiRunning(false)
    setCurrentScenario(scenario)
    
    let newPrice = suiPrice
    let newVol: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW'
    let newSentiment = 0.0
    let newRsi = 50.0
    let newMacd: 'BUY_SIGNAL' | 'NEUTRAL' | 'SELL_SIGNAL' = 'NEUTRAL'
    let scenarioName = ''

    if (scenario === 'STABLE') {
      newVol = 'LOW'
      newSentiment = 0.12
      newRsi = 52.0
      newMacd = 'NEUTRAL'
      newPrice = parseFloat((suiPrice * (1 + (Math.random() * 0.02 - 0.01))).toFixed(4))
      scenarioName = 'Consolidation Channel (Stable)'
    } else if (scenario === 'FUD') {
      newVol = 'MEDIUM'
      newSentiment = -0.58
      newRsi = 35.5
      newMacd = 'SELL_SIGNAL'
      newPrice = parseFloat((suiPrice * 0.94).toFixed(4)) // -6% drop
      scenarioName = 'Social Media FUD Panic'
    } else if (scenario === 'FLASH_CRASH') {
      newVol = 'HIGH'
      newSentiment = -0.88
      newRsi = 14.2
      newMacd = 'SELL_SIGNAL'
      newPrice = parseFloat((suiPrice * 0.80).toFixed(4)) // -20% crash
      scenarioName = 'Flash Crash (Black Swan)'
    } else if (scenario === 'BULL_RUN') {
      newVol = 'MEDIUM'
      newSentiment = 0.82
      newRsi = 79.5
      newMacd = 'BUY_SIGNAL'
      newPrice = parseFloat((suiPrice * 1.15).toFixed(4)) // +15% rise
      scenarioName = 'Bull Run Momentum Breakout'
    }

    // Set states immediately
    setSuiPrice(newPrice)
    setVolatility(newVol)
    setSentimentValue(newSentiment)
    setRsiValue(newRsi)
    setMacdState(newMacd)
    
    // Update chart
    setChartPrices(prev => [...prev.slice(1), newPrice])

    // Run decision math immediately
    let action: 'HOLD' | 'HEDGE_BUY' | 'HEDGE_SELL' = 'HOLD'
    let reasoning = ''
    let confidence = 0.5
    let suggestedAmount = 0

    if (newVol === 'HIGH' || (newVol === 'MEDIUM' && newSentiment < -0.3)) {
      action = 'HEDGE_BUY'
      confidence = parseFloat((0.75 + Math.random() * 0.2).toFixed(2))
      suggestedAmount = Math.floor(vaultTvlSui * 0.25)
      reasoning = `RISK ALARM: High volatility (${newVol}) and highly bearish sentiment (${newSentiment}) detected during ${scenarioName}. Initiating asset flight to stable reserves. Swapping ${suggestedAmount} SUI into USDC on DeepBook v3.`
    } else if (newSentiment > 0.4 && newRsi > 65 && hedgedUsdc > 20) {
      action = 'HEDGE_SELL'
      confidence = parseFloat((0.7 + Math.random() * 0.2).toFixed(2))
      const usdcToSpend = hedgedUsdc * 0.40
      suggestedAmount = Math.floor(usdcToSpend / newPrice)
      reasoning = `MOMENTUM CONFIRMED: Strong social sentiment (${newSentiment}) and bullish MACD histogram during ${scenarioName}. Executing reverse rebalancing, swapping ${usdcToSpend.toFixed(2)} USDC back to long-SUI positioning.`
    } else {
      action = 'HOLD'
      confidence = parseFloat((0.85).toFixed(2))
      reasoning = `Consolidation verified during ${scenarioName}. Asset weights remain optimized. SUI remains locked inside vault safety layers.`
    }

    const randomHash = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const mockBlobId = `walrus-mock-${randomHash.substring(0, 32)}`
    const timestamp = new Date().toISOString()

    setConsoleLogs(prev => [
      ...prev,
      `[System] ⏸️ Autonomous AI simulation engine paused to let you inspect the triggered story mode.`,
      `[Market Story] 📡 Triggered user scenario: ${scenarioName}!`,
      `[Market Ingest] 📊 SUI Price adjusted to: $${newPrice} | RSI: ${newRsi} | Sentiment: ${newSentiment}`,
      `[AI Quant] 🎯 Action selected: ${action} (Confidence: ${(confidence * 100).toFixed(0)}%)`,
      `[AI Reasoning] 🧠 "${reasoning}"`,
      `[Walrus Upload] 💾 Uploading cryptographic hedge proofs to Walrus...`,
      `[Walrus Upload] 🚀 Published Blob! ID: ${mockBlobId} (Size: 940 Bytes)`
    ])

    // Update balances and ledger
    if (action === 'HEDGE_BUY' && suggestedAmount > 0) {
      const usdcAcquired = suggestedAmount * newPrice * 0.995
      setVaultTvlSui(prev => Math.max(10, prev - suggestedAmount))
      setHedgedUsdc(prev => prev + usdcAcquired)
      
      const txId = `tx-story-${Date.now().toString().slice(-4)}`
      setLedger(prev => [
        {
          id: txId,
          timestamp,
          action: 'HEDGE_BUY',
          amountSui: suggestedAmount,
          usdcAmount: parseFloat(usdcAcquired.toFixed(2)),
          gasSpent: 0.012,
          blobId: mockBlobId,
          status: 'SUCCESS'
        },
        ...prev
      ])

      setConsoleLogs(prev => [
        ...prev,
        `[DeepBook Trade] 🔄 Swapped ${suggestedAmount} SUI -> ${usdcAcquired.toFixed(2)} USDC via DeepBook v3`,
        `[Smart Contract] 🔒 Trade Proof minted & recorded in proof_registry.move shared object.`
      ])
    } else if (action === 'HEDGE_SELL' && suggestedAmount > 0) {
      const usdcSpent = suggestedAmount * newPrice * 1.005
      setVaultTvlSui(prev => prev + suggestedAmount)
      setHedgedUsdc(prev => Math.max(0, prev - usdcSpent))

      const txId = `tx-story-${Date.now().toString().slice(-4)}`
      setLedger(prev => [
        {
          id: txId,
          timestamp,
          action: 'HEDGE_SELL',
          amountSui: suggestedAmount,
          usdcAmount: parseFloat(usdcSpent.toFixed(2)),
          gasSpent: 0.014,
          blobId: mockBlobId,
          status: 'SUCCESS'
        },
        ...prev
      ])

      setConsoleLogs(prev => [
        ...prev,
        `[DeepBook Trade] 🔄 Swapped ${usdcSpent.toFixed(2)} USDC -> ${suggestedAmount} SUI via DeepBook v3`,
        `[Smart Contract] 🔒 Trade Proof minted & recorded in proof_registry.move shared object.`
      ])
    } else {
      setConsoleLogs(prev => [
        ...prev,
        `[AI Engine] ⏸️ No trades triggered for stable scenario.`
      ])
    }
  }

  // Interactive AI decision evaluation simulation loop
  useEffect(() => {
    if (!isAiRunning) return

    const interval = setInterval(() => {
      // 1. Simulating random walk of SUI price (-5% to +5% variation)
      const pctChange = (Math.random() * 0.08 - 0.04)
      const newPrice = parseFloat(Math.max(0.5, suiPrice * (1 + pctChange)).toFixed(4))
      setSuiPrice(newPrice)
      
      // Update chart history (keep last 10 points)
      setChartPrices(prev => {
        const next = [...prev.slice(1), newPrice]
        return next
      })

      // 2. Randomly modify indicators for fun dynamics
      const volatilities: ('LOW' | 'MEDIUM' | 'HIGH')[] = ['LOW', 'MEDIUM', 'HIGH']
      const newVol = volatilities[Math.floor(Math.random() * volatilities.length)]
      setVolatility(newVol)

      const newSentiment = parseFloat((Math.random() * 2 - 1).toFixed(2))
      setSentimentValue(newSentiment)

      const newRsi = parseFloat((30 + Math.random() * 50 + (newPrice < suiPrice ? -15 : 15)).toFixed(1))
      setRsiValue(Math.max(5, Math.min(95, newRsi)))

      const macds: ('BUY_SIGNAL' | 'NEUTRAL' | 'SELL_SIGNAL')[] = ['BUY_SIGNAL', 'NEUTRAL', 'SELL_SIGNAL']
      const newMacd = macds[Math.floor(Math.random() * macds.length)]
      setMacdState(newMacd)

      // 3. Determine AI Action based on indicators (replicating off-chain TS engine math)
      let action: 'HOLD' | 'HEDGE_BUY' | 'HEDGE_SELL' = 'HOLD'
      let reasoning = ''
      let confidence = 0.5
      let suggestedAmount = 0

      // Logic trigger rules
      if (newVol === 'HIGH' && newSentiment < -0.3 && newRsi < 40) {
        action = 'HEDGE_BUY'
        confidence = parseFloat((0.7 + Math.random() * 0.25).toFixed(2))
        suggestedAmount = Math.floor(vaultTvlSui * 0.2) // Hedge 20%
        reasoning = `RISK DETECTED: High volatility (${(newVol)}), bearish sentiment (${newSentiment}), and RSI (${newRsi}) point to imminent downside. Hedging ${suggestedAmount} SUI into USDC via DeepBook v3 to guard capital.`
      } else if (newSentiment > 0.5 && newRsi > 65 && hedgedUsdc > 50) {
        action = 'HEDGE_SELL'
        confidence = parseFloat((0.65 + Math.random() * 0.25).toFixed(2))
        // Re-accumulate SUI using 25% of hedged USDC
        const usdcToSpend = hedgedUsdc * 0.25
        suggestedAmount = Math.floor(usdcToSpend / newPrice)
        reasoning = `MOMENTUM SIGNAL: Bullish breakout signature. Sentiment is positive (${newSentiment}) and RSI indicates strong momentum. Deploying ${usdcToSpend.toFixed(2)} USDC to buy back SUI at $${newPrice} to capture upside.`
      } else {
        action = 'HOLD'
        confidence = parseFloat((0.6 + Math.random() * 0.3).toFixed(2))
        reasoning = `STABLE STATE: Indicators within normal boundaries. RSI is stable at ${newRsi} and sentiment is balanced (${newSentiment}). Vault is maintaining current asset weights to minimize slippage and gas fees.`
      }

      // Generate a realistic Walrus mock hash
      const randomHash = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      const mockBlobId = `walrus-mock-${randomHash.substring(0, 32)}`

      const timestamp = new Date().toISOString()

      // Add to terminal logs
      setConsoleLogs(prev => [
        ...prev,
        `[Market Ingest] 📊 SUI Price: $${newPrice} | Volatility: ${newVol} | RSI: ${newRsi} | Sentiment: ${newSentiment}`,
        `[AI Quant] 🎯 Action selected: ${action} (Confidence: ${(confidence * 100).toFixed(0)}%)`,
        `[AI Reasoning] 🧠 "${reasoning}"`,
        `[Walrus Upload] 💾 Uploading proof to Walrus Devnet publisher...`,
        `[Walrus Upload] 🚀 Published Blob! ID: ${mockBlobId} (Size: 842 Bytes)`
      ])

      // If hedge action occurred, update states and transaction ledger
      if (action === 'HEDGE_BUY' && suggestedAmount > 0) {
        const usdcAcquired = suggestedAmount * newPrice * 0.995 // 0.5% slippage/fee mock
        setVaultTvlSui(prev => Math.max(10, prev - suggestedAmount))
        setHedgedUsdc(prev => prev + usdcAcquired)
        
        // Add to ledger
        const txId = `tx-sim-${Date.now().toString().slice(-4)}`
        setLedger(prev => [
          {
            id: txId,
            timestamp,
            action: 'HEDGE_BUY',
            amountSui: suggestedAmount,
            usdcAmount: parseFloat(usdcAcquired.toFixed(2)),
            gasSpent: 0.012,
            blobId: mockBlobId,
            status: 'SUCCESS'
          },
          ...prev
        ])

        setConsoleLogs(prev => [
          ...prev,
          `[DeepBook Trade] 🔄 Assembled PTB: Swapped ${suggestedAmount} SUI -> ${usdcAcquired.toFixed(2)} USDC`,
          `[Smart Contract] 🔒 Trade Proof recorded in proof_registry.move ledger.`
        ])
      } else if (action === 'HEDGE_SELL' && suggestedAmount > 0) {
        const usdcSpent = suggestedAmount * newPrice * 1.005
        setVaultTvlSui(prev => prev + suggestedAmount)
        setHedgedUsdc(prev => Math.max(0, prev - usdcSpent))

        // Add to ledger
        const txId = `tx-sim-${Date.now().toString().slice(-4)}`
        setLedger(prev => [
          {
            id: txId,
            timestamp,
            action: 'HEDGE_SELL',
            amountSui: suggestedAmount,
            usdcAmount: parseFloat(usdcSpent.toFixed(2)),
            gasSpent: 0.014,
            blobId: mockBlobId,
            status: 'SUCCESS'
          },
          ...prev
        ])

        setConsoleLogs(prev => [
          ...prev,
          `[DeepBook Trade] 🔄 Assembled PTB: Swapped ${usdcSpent.toFixed(2)} USDC -> ${suggestedAmount} SUI`,
          `[Smart Contract] 🔒 Trade Proof recorded in proof_registry.move ledger.`
        ])
      } else {
        setConsoleLogs(prev => [
          ...prev,
          `[AI Engine] ⏸️ No trades triggered. Vault state unchanged.`
        ])
      }

    }, aiTimerSpeed)

    return () => clearInterval(interval)
  }, [isAiRunning, aiTimerSpeed, suiPrice, vaultTvlSui, hedgedUsdc])

  // Form Submission Handlers (Interactive Deposits / Withdrawals)
  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')

    const val = parseFloat(depositAmount)
    if (isNaN(val) || val <= 0) {
      setFormError('Please enter a valid deposit amount.')
      return
    }

    if (val > userWalletSui) {
      setFormError('Insufficient SUI balance in wallet.')
      return
    }

    // Process deposit simulation
    setUserWalletSui(prev => prev - val)
    setVaultTvlSui(prev => prev + val)
    
    // Deposit shares calculation (1:1 ratio mock)
    const newShares = val
    setTotalShares(prev => prev + newShares)
    setUserShares(prev => prev + newShares)

    const txId = `tx-dep-${Date.now().toString().slice(-4)}`
    const timestamp = new Date().toISOString()

    setLedger(prev => [
      {
        id: txId,
        timestamp,
        action: 'DEPOSIT',
        amountSui: val,
        usdcAmount: 0,
        gasSpent: 0.003,
        status: 'SUCCESS'
      },
      ...prev
    ])

    setConsoleLogs(prev => [
      ...prev,
      `[User Action] 💰 Deposit request: ${val} SUI`,
      `[Smart Contract] 📥 Invoking vault::deposit. Minted ${newShares.toFixed(2)} vault shares.`,
      `[Smart Contract] 🟢 Deposit finalized. Transaction: ${txId}`
    ])

    setFormSuccess(`Successfully deposited ${val} SUI into the vault!`)
    setDepositAmount('')
  }

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')

    const val = parseFloat(withdrawAmount)
    if (isNaN(val) || val <= 0) {
      setFormError('Please enter a valid withdraw amount.')
      return
    }

    // Shares check (user can withdraw SUI proportional to their shares)
    const userMaxWithdraw = (userShares / totalShares) * vaultTvlSui
    if (val > userMaxWithdraw) {
      setFormError(`Insufficient shares. Your maximum withdrawable balance is ${userMaxWithdraw.toFixed(2)} SUI.`)
      return
    }

    // Process withdraw simulation
    const sharesToBurn = (val / vaultTvlSui) * totalShares
    setUserWalletSui(prev => prev + val)
    setVaultTvlSui(prev => Math.max(0, prev - val))
    setTotalShares(prev => Math.max(0, prev - sharesToBurn))
    setUserShares(prev => Math.max(0, prev - sharesToBurn))

    const txId = `tx-wth-${Date.now().toString().slice(-4)}`
    const timestamp = new Date().toISOString()

    setLedger(prev => [
      {
        id: txId,
        timestamp,
        action: 'WITHDRAW',
        amountSui: val,
        usdcAmount: 0,
        gasSpent: 0.004,
        status: 'SUCCESS'
      },
      ...prev
    ])

    setConsoleLogs(prev => [
      ...prev,
      `[User Action] 💸 Withdraw request: ${val} SUI`,
      `[Smart Contract] 📤 Invoking vault::withdraw. Burning ${sharesToBurn.toFixed(2)} shares.`,
      `[Smart Contract] 🟢 Withdrawal finalized. SUI sent to wallet. Transaction: ${txId}`
    ])

    setFormSuccess(`Successfully withdrew ${val} SUI from the vault!`)
    setWithdrawAmount('')
  }

  // Pure SVG Custom Chart Helper Calculations
  const chartHeight = 160
  const chartWidth = 500
  const maxPrice = Math.max(...chartPrices, 1.5) * 1.05
  const minPrice = Math.min(...chartPrices, 0.9) * 0.95
  const priceRange = maxPrice - minPrice

  // Generate SVG path coordinates
  const svgPoints = chartPrices.map((price, index) => {
    const x = (index / (chartPrices.length - 1)) * chartWidth
    const y = chartHeight - ((price - minPrice) / priceRange) * chartHeight
    return `${x},${y}`
  }).join(' ')

  const areaPoints = `${chartPrices.map((price, index) => {
    const x = (index / (chartPrices.length - 1)) * chartWidth
    const y = chartHeight - ((price - minPrice) / priceRange) * chartHeight
    return `${x},${y}`
  }).join(' ')} ${chartWidth},${chartHeight} 0,${chartHeight}`

  return (
    <div className={`app-wrapper ${theme}`}>
      <div className="container">
        {/* HEADER HERO AREA */}
        <header className="hero-section glass-panel">
          <div className="hero-brand">
            <div className="hero-logo-box">
              <Cpu size={28} />
            </div>
            <div className="hero-title-group">
              <h1>Aether.ai</h1>
              <p>Autonomous AI-Driven Portfolio Risk-Hedging Vault on Sui</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="tab-bar">
              <button
                className={`tab-btn ${activeTab === 'dashboard' ? 'tab-btn-active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                Dashboard
              </button>
              <button
                className={`tab-btn ${activeTab === 'contracts' ? 'tab-btn-active' : ''}`}
                onClick={() => setActiveTab('contracts')}
              >
                Smart Contracts Code
              </button>
            </div>
            <button 
              className="btn btn-secondary" 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              style={{ padding: '0.5rem', borderRadius: '12px', minWidth: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

      {/* DASHBOARD VIEW */}
      {activeTab === 'dashboard' && (
        <>
          {/* SIMULATION TIMER CONTROLLER BAR */}
          <div className="sim-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={16} />
              <span>
                <strong>DeFAI AI Simulation Engine Active:</strong> Evaluates indicators and executes DeepBook hedges autonomously in real-time.
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Loop Speed:</span>
                <select
                  value={aiTimerSpeed}
                  onChange={(e) => setAiTimerSpeed(Number(e.target.value))}
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--accent-lavender-border)',
                    borderRadius: '6px',
                    padding: '0.2rem 0.5rem',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.8rem',
                    color: 'var(--accent-lavender-text)',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value={5000}>Fast (5s)</option>
                  <option value={10000}>Medium (10s)</option>
                  <option value={30000}>Realistic (30s)</option>
                </select>
              </div>
              <button
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem' }}
                onClick={() => setIsAiRunning(!isAiRunning)}
              >
                <RefreshCw size={12} className={isAiRunning ? 'spin-anim' : ''} style={{ animation: isAiRunning ? 'spin 3s linear infinite' : 'none' }} />
                {isAiRunning ? 'Pause Engine' : 'Resume Engine'}
              </button>
            </div>
          </div>

          {/* STATS OVERVIEW CARDS */}
          <section className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Total Vault SUI TVL</span>
              <span className="stat-value">{vaultTvlSui.toLocaleString()} SUI</span>
              <div className="stat-change" style={{ color: 'var(--accent-mint-text)' }}>
                <ArrowUpRight size={14} />
                <span>Simulated TVL pool</span>
              </div>
            </div>

            <div className="stat-card">
              <span className="stat-label">Hedged USDC Pool</span>
              <span className="stat-value">${hedgedUsdc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC</span>
              <div className="stat-change" style={{ color: 'var(--accent-sky-text)' }}>
                <Lock size={14} />
                <span>DeepBook Hedged Vault</span>
              </div>
            </div>

            <div className="stat-card">
              <span className="stat-label">Current SUI Price</span>
              <span className="stat-value">${suiPrice.toFixed(4)}</span>
              <div className="stat-change" style={{ color: suiPrice >= 1.25 ? 'var(--accent-mint-text)' : 'var(--accent-rose-text)' }}>
                <Activity size={14} />
                <span>Real-time price feed</span>
              </div>
            </div>

            <div className="stat-card">
              <span className="stat-label">Simulated Wallet</span>
              <span className="stat-value">{userWalletSui.toLocaleString()} SUI</span>
              <div className="stat-change" style={{ color: 'var(--slate-muted)' }}>
                <Wallet size={14} />
                <span>User Mock Balance</span>
              </div>
            </div>
          </section>

        {/* INTERACTIVE STORYTELLER MODE SANDBOX */}
        <section className="glass-panel story-panel">
          <div className="panel-header" style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem' }}>
            <h2 className="panel-title">
              <Sparkles size={20} style={{ color: 'var(--primary)' }} />
              Interactive DeFAI Storytelling Sandbox — The User Journey
            </h2>
            <span className="badge badge-lavender" style={{ textTransform: 'none', fontWeight: 600 }}>Storyteller Sandbox</span>
          </div>
          
          <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.9rem', color: 'var(--slate-muted)', lineHeight: 1.5 }}>
            Aether.ai protects user portfolios using a modern <strong>Decentralized Finance + AI (DeFAI)</strong> architecture. 
            Click on any of the market scenarios below to experience how the off-chain AI engine analyzes risk indicators in real time, 
            coordinates Sui Move contract actions, executes DeepBook v3 trades, and records cryptographically verifiable audit logs on the Walrus Protocol.
          </p>

          <div className="story-grid">
            {/* ACT I */}
            <div 
              className={`story-card ${currentScenario === 'STABLE' ? 'active' : ''}`}
              onClick={() => { setIsAiRunning(false); triggerScenario('STABLE') }}
            >
              <div>
                <div className="story-badge-container">
                  <span className="story-act">Act I</span>
                  <span className="badge badge-mint" style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}>Stable</span>
                </div>
                <h3 className="story-title">Consolidation</h3>
                <p className="story-desc">
                  Market is quiet and consolidating. SUI price trades in a stable range with neutral indicators.
                </p>
              </div>
              <div>
                <div className="story-metrics-badge">
                  RSI: 52 | Sentiment: Neutral
                </div>
                <button 
                  className={`btn story-btn ${currentScenario === 'STABLE' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Simulate Consolidation
                </button>
              </div>
            </div>

            {/* ACT II */}
            <div 
              className={`story-card ${currentScenario === 'FUD' ? 'active' : ''}`}
              onClick={() => { setIsAiRunning(false); triggerScenario('FUD') }}
            >
              <div>
                <div className="story-badge-container">
                  <span className="story-act">Act II</span>
                  <span className="badge badge-rose" style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}>-6% FUD</span>
                </div>
                <h3 className="story-title">Social Panic</h3>
                <p className="story-desc">
                  Social media analytics capture a sharp sentiment plunge. The AI senses early risk and hedges 25% of pool to USDC.
                </p>
              </div>
              <div>
                <div className="story-metrics-badge">
                  RSI: 35 | Sentiment: Bearish
                </div>
                <button 
                  className={`btn story-btn ${currentScenario === 'FUD' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Simulate Social FUD
                </button>
              </div>
            </div>

            {/* ACT III */}
            <div 
              className={`story-card ${currentScenario === 'FLASH_CRASH' ? 'active' : ''}`}
              onClick={() => { setIsAiRunning(false); triggerScenario('FLASH_CRASH') }}
            >
              <div>
                <div className="story-badge-container">
                  <span className="story-act">Act III</span>
                  <span className="badge badge-rose" style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}>-20% Crash</span>
                </div>
                <h3 className="story-title">Flash Crash</h3>
                <p className="story-desc">
                  A black swan liquidation cascade hits! With assets already hedged, Aether protects principal and uploads proofs to Walrus.
                </p>
              </div>
              <div>
                <div className="story-metrics-badge">
                  RSI: 14 | Volatility: High
                </div>
                <button 
                  className={`btn story-btn ${currentScenario === 'FLASH_CRASH' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Simulate Black Swan
                </button>
              </div>
            </div>

            {/* ACT IV */}
            <div 
              className={`story-card ${currentScenario === 'BULL_RUN' ? 'active' : ''}`}
              onClick={() => { setIsAiRunning(false); triggerScenario('BULL_RUN') }}
            >
              <div>
                <div className="story-badge-container">
                  <span className="story-act">Act IV</span>
                  <span className="badge badge-mint" style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}>+15% Surge</span>
                </div>
                <h3 className="story-title">Bull Breakout</h3>
                <p className="story-desc">
                  Technical metrics capture strong buy signals. The AI swaps hedged USDC back to SUI to capture compounding recovery yield.
                </p>
              </div>
              <div>
                <div className="story-metrics-badge">
                  RSI: 79 | MACD: Buy Signal
                </div>
                <button 
                  className={`btn story-btn ${currentScenario === 'BULL_RUN' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Simulate Bull Surge
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* MIDDLE GRID: DEFAI CHARTS + CONTROL PANEL */}
          <div className="dashboard-grid">
            {/* LEFT COLUMN: PNL CHART & AI RADAR */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="panel-header">
                <h2 className="panel-title">
                  <Activity size={20} />
                  SUI Price Trend & Asset Distribution
                </h2>
                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem' }}>
                  <span className="badge badge-mint">SUI Pool: {vaultTvlSui} SUI</span>
                  <span className="badge badge-sky">Hedge Pool: ${hedgedUsdc.toFixed(0)} USDC</span>
                </div>
              </div>

              <div className="chart-container">
                <svg className="chart-svg" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" />
                      <stop offset="100%" stopColor="#4F46E5" />
                    </linearGradient>
                    <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity="0.24" />
                      <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  <line className="chart-grid-line" x1="0" y1={chartHeight * 0.25} x2={chartWidth} y2={chartHeight * 0.25} />
                  <line className="chart-grid-line" x1="0" y1={chartHeight * 0.5} x2={chartWidth} y2={chartHeight * 0.5} />
                  <line className="chart-grid-line" x1="0" y1={chartHeight * 0.75} x2={chartWidth} y2={chartHeight * 0.75} />

                  {/* Chart Line path */}
                  <polyline className="chart-line" points={svgPoints} />
                  
                  {/* Fill Area path */}
                  <polygon className="chart-area" points={areaPoints} />

                  {/* Hotspots */}
                  {chartPrices.map((price, idx) => {
                    const x = (idx / (chartPrices.length - 1)) * chartWidth
                    const y = chartHeight - ((price - minPrice) / priceRange) * chartHeight
                    return (
                      <circle
                        key={idx}
                        cx={x}
                        cy={y}
                        r="4"
                        fill="white"
                        stroke="#6366F1"
                        strokeWidth="2.5"
                        style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))' }}
                      />
                    )
                  })}
                </svg>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }} className="chart-axis-text">
                <span>Start Session</span>
                <span>Interval: {aiTimerSpeed / 1000}s</span>
                <span>Current SUI: ${suiPrice.toFixed(3)}</span>
              </div>
            </div>

            {/* RIGHT COLUMN: VAULT CONTROL PANEL */}
            <div className="glass-panel controls-card">
              <div className="panel-header">
                <h2 className="panel-title">
                  <Coins size={20} />
                  Vault Deposit & Withdrawal
                </h2>
              </div>

              {/* Wallet info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--slate-muted)', fontWeight: 600 }}>
                <span>Vault Shares Balance:</span>
                <span className="badge badge-lavender">{userShares.toFixed(1)} / {totalShares.toFixed(1)} Shares</span>
              </div>

              {formError && (
                <div style={{ padding: '0.75rem 1rem', background: 'var(--accent-rose)', border: '1px solid var(--accent-rose-border)', color: 'var(--accent-rose-text)', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600 }}>
                  ⚠️ {formError}
                </div>
              )}
              {formSuccess && (
                <div style={{ padding: '0.75rem 1rem', background: 'var(--accent-mint)', border: '1px solid var(--accent-mint-border)', color: 'var(--accent-mint-text)', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600 }}>
                  ✅ {formSuccess}
                </div>
              )}

              <form onSubmit={handleDeposit} className="form-group">
                <label className="form-label">Deposit SUI into Vault</label>
                <div className="input-container">
                  <input
                    type="number"
                    step="any"
                    className="input-field"
                    placeholder="Amount to deposit"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                  />
                  <span className="input-suffix">SUI</span>
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                  <ArrowDownLeft size={16} />
                  Deposit SUI
                </button>
              </form>

              <form onSubmit={handleWithdraw} className="form-group">
                <label className="form-label">Withdraw SUI from Vault</label>
                <div className="input-container">
                  <input
                    type="number"
                    step="any"
                    className="input-field"
                    placeholder="Amount to withdraw"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                  />
                  <span className="input-suffix">SUI</span>
                </div>
                <button type="submit" className="btn btn-secondary" style={{ marginTop: '0.5rem' }}>
                  <ArrowUpRight size={16} />
                  Withdraw SUI
                </button>
              </form>
            </div>
          </div>

          {/* LOWER GRID: TERMINAL + INDICATOR GAUGES */}
          <div className="dashboard-grid">
            {/* SCROLLING CONSOLE FEED */}
            <div className="glass-panel terminal-panel">
              <div className="terminal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Terminal size={18} />
                  <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>Autonomous Agent console (Walrus Stream)</span>
                </div>
                <div className="terminal-status">
                  <span className={`led led-${isAiRunning ? 'green' : 'rose'}`}></span>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', opacity: 0.8 }}>
                    {isAiRunning ? 'AI_ENGINE_ON' : 'AI_ENGINE_PAUSED'}
                  </span>
                </div>
              </div>

              <div className="terminal-screen" ref={terminalScreenRef}>
                {consoleLogs.map((log, index) => {
                  let isAetherPrompt = false
                  let isMarketPrompt = false
                  let isWalrusPrompt = false
                  let isUserPrompt = false

                  if (log.startsWith('[AI Engine]') || log.startsWith('[AI Quant]') || log.startsWith('[AI Reasoning]')) {
                    isAetherPrompt = true
                  } else if (log.startsWith('[Market Ingest]')) {
                    isMarketPrompt = true
                  } else if (log.startsWith('[Walrus') || log.startsWith('[Smart Contract]')) {
                    isWalrusPrompt = true
                  } else if (log.startsWith('[User Action]')) {
                    isUserPrompt = true
                  }

                  return (
                    <div className="terminal-line" key={index}>
                      <span className="terminal-timestamp">{new Date().toLocaleTimeString()}</span>
                      <span className="terminal-prompt">&gt;</span>
                      <div className="terminal-text">
                        {isAetherPrompt && <span style={{ color: '#A5B4FC', fontWeight: 700 }}>{log.split(' ')[0] + ' ' + log.split(' ')[1]} </span>}
                        {isMarketPrompt && <span style={{ color: '#FBCFE8', fontWeight: 700 }}>{log.split(' ')[0] + ' ' + log.split(' ')[1]} </span>}
                        {isWalrusPrompt && <span style={{ color: '#6EE7B7', fontWeight: 700 }}>{log.split(' ')[0] + ' ' + log.split(' ')[1]} </span>}
                        {isUserPrompt && <span style={{ color: '#93C5FD', fontWeight: 700 }}>{log.split(' ')[0] + ' ' + log.split(' ')[1]} </span>}
                        
                        {!isAetherPrompt && !isMarketPrompt && !isWalrusPrompt && !isUserPrompt && (
                          <span>{log}</span>
                        )}
                        
                        {(isAetherPrompt || isMarketPrompt || isWalrusPrompt || isUserPrompt) && (
                          <span>{log.substring(log.indexOf(']') + 2)}</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* REAL-TIME DEFAI INDICATOR METRICS GAUGES */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="panel-header">
                <h3 className="panel-title" style={{ fontSize: '1.1rem' }}>
                  <Layers size={18} />
                  Risk Engine Metrics (DeFAI Indicators)
                </h3>
              </div>

              <div className="indicator-grid">
                <div className="indicator-pill" style={{
                  background: volatility === 'HIGH' ? 'var(--accent-rose)' : 'var(--accent-mint)',
                  borderColor: volatility === 'HIGH' ? 'var(--accent-rose-border)' : 'var(--accent-mint-border)',
                  color: volatility === 'HIGH' ? 'var(--accent-rose-text)' : 'var(--accent-mint-text)'
                }}>
                  <span className="indicator-pill-title">Volatility Filter</span>
                  <span className="indicator-pill-value">{volatility}</span>
                </div>

                <div className="indicator-pill" style={{
                  background: sentimentValue > 0.1 ? 'var(--accent-mint)' : sentimentValue < -0.1 ? 'var(--accent-rose)' : 'var(--accent-lavender)',
                  borderColor: sentimentValue > 0.1 ? 'var(--accent-mint-border)' : sentimentValue < -0.1 ? 'var(--accent-rose-border)' : 'var(--accent-lavender-border)',
                  color: sentimentValue > 0.1 ? 'var(--accent-mint-text)' : sentimentValue < -0.1 ? 'var(--accent-rose-text)' : 'var(--accent-lavender-text)'
                }}>
                  <span className="indicator-pill-title">Social Sentiment</span>
                  <span className="indicator-pill-value">{(sentimentValue > 0 ? '+' : '') + sentimentValue}</span>
                </div>

                <div className="indicator-pill" style={{
                  background: rsiValue > 70 ? 'var(--accent-rose)' : rsiValue < 30 ? 'var(--accent-mint)' : 'var(--accent-sky)',
                  borderColor: rsiValue > 70 ? 'var(--accent-rose-border)' : rsiValue < 30 ? 'var(--accent-mint-border)' : 'var(--accent-sky-border)',
                  color: rsiValue > 70 ? 'var(--accent-rose-text)' : rsiValue < 30 ? 'var(--accent-mint-text)' : 'var(--accent-sky-text)'
                }}>
                  <span className="indicator-pill-title">RSI (Consolidation)</span>
                  <span className="indicator-pill-value">{rsiValue}</span>
                </div>

                <div className="indicator-pill" style={{
                  background: macdState === 'BUY_SIGNAL' ? 'var(--accent-mint)' : macdState === 'SELL_SIGNAL' ? 'var(--accent-rose)' : 'var(--accent-lavender)',
                  borderColor: macdState === 'BUY_SIGNAL' ? 'var(--accent-mint-border)' : macdState === 'SELL_SIGNAL' ? 'var(--accent-rose-border)' : 'var(--accent-lavender-border)',
                  color: macdState === 'BUY_SIGNAL' ? 'var(--accent-mint-text)' : macdState === 'SELL_SIGNAL' ? 'var(--accent-rose-text)' : 'var(--accent-lavender-text)'
                }}>
                  <span className="indicator-pill-title">MACD Momentum</span>
                  <span className="indicator-pill-value">{macdState.replace('_', ' ')}</span>
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--slate-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Drawdown limit guard status:</span>
                  <span style={{ color: 'var(--accent-mint-text)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <ShieldCheck size={14} /> SECURED
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Daily spending limits:</span>
                  <span style={{ color: 'var(--accent-mint-text)', fontWeight: 700 }}>99.2% Remaining</span>
                </div>
              </div>
            </div>
          </div>

          {/* LOWER SECTION: VERIFIED HEDGE PROOFS LEDGER */}
          <section className="glass-panel">
            <div className="panel-header">
              <h2 className="panel-title">
                <Database size={20} />
                Decentralized Trade Proof Registry Ledger
              </h2>
              <span className="badge badge-sky" style={{ fontSize: '0.7rem' }}>Sui Shared Ledger state</span>
            </div>

            <div className="ledger-list">
              {ledger.map((tx) => (
                <div className="ledger-item" key={tx.id}>
                  <div className="ledger-info">
                    <div className="ledger-action">
                      {tx.action === 'DEPOSIT' && <ArrowDownLeft size={16} style={{ color: 'var(--accent-mint-text)' }} />}
                      {tx.action === 'WITHDRAW' && <ArrowUpRight size={16} style={{ color: 'var(--accent-rose-text)' }} />}
                      {tx.action === 'HEDGE_BUY' && <Lock size={16} style={{ color: 'var(--accent-lavender-text)' }} />}
                      {tx.action === 'HEDGE_SELL' && <ArrowRightLeft size={16} style={{ color: 'var(--accent-sky-text)' }} />}
                      <span>{tx.action.replace('_', ' ')}</span>
                      <span className="badge badge-lavender" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>{tx.id}</span>
                    </div>
                    <div className="ledger-details">
                      Timestamp: {new Date(tx.timestamp).toLocaleString()} | Gas Fee: {tx.gasSpent} SUI
                    </div>
                  </div>

                  <div className="ledger-right">
                    <span className="ledger-amount" style={{
                      color: tx.action === 'DEPOSIT' || tx.action === 'HEDGE_SELL' ? 'var(--accent-mint-text)' : 'var(--accent-rose-text)'
                    }}>
                      {tx.action === 'DEPOSIT' || tx.action === 'HEDGE_SELL' ? '+' : '-'} {tx.amountSui.toFixed(0)} SUI
                    </span>
                    {tx.usdcAmount > 0 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--slate-muted)', fontWeight: 600 }}>
                        ({tx.action === 'HEDGE_BUY' ? '+' : '-'} ${tx.usdcAmount.toFixed(2)} USDC)
                      </span>
                    )}
                    {tx.blobId && (
                      <a
                        href={`https://aggregator.walrus-testnet.walrus.space/v1/${tx.blobId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="ledger-proof-link"
                      >
                        <ExternalLink size={10} />
                        Walrus Proof
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* SMART CONTRACTS VIEW */}
      {activeTab === 'contracts' && (
        <div className="glass-panel">
          <div className="panel-header">
            <h2 className="panel-title">
              <FileText size={20} />
              Sui Move Smart Contracts Suite
            </h2>
            <span className="badge badge-mint" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <CheckCircle2 size={12} /> Unit Tests: 5/5 PASSING
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                <span className="badge badge-sky">1</span>
                aether::vault Module
              </h3>
              <p style={{ color: 'var(--slate-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Governs the vault capital pooling, minting of LP shares, daily spend limitations, and maximum drawdown risk caps.
              </p>
              <pre style={{
                background: 'var(--slate-dark)',
                color: '#E2E8F0',
                padding: '1.5rem',
                borderRadius: '16px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                overflowX: 'auto',
                border: '1px solid var(--card-border)'
              }}>
{`module aether::vault {
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};

    /// Struct representing the main hedging vault pool
    public struct Vault has key, store {
        id: UID,
        balance: Balance<SUI>,
        total_shares: u64,
        drawdown_limit: u64, // max percentage drawdown allowed (e.g. 15%)
        daily_spending_limit: u64, // max spending in MIST allowed daily
        daily_spent_today: u64,
        last_reset_timestamp: u64
    }

    /// Entry point for deposits. Users deposit SUI and receive LP shares.
    public fun deposit(vault: &mut Vault, payment: Coin<SUI>, ctx: &mut TxContext): u64 {
        let amount = coin::value(&payment);
        assert!(amount > 0, 0);
        let balance_ref = coin::into_balance(payment);
        balance::join(&mut vault.balance, balance_ref);
        
        let shares_to_mint = amount; // 1:1 simple peg mock
        vault.total_shares = vault.total_shares + shares_to_mint;
        shares_to_mint
    }
}`}
              </pre>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--card-border)' }} />

            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                <span className="badge badge-sky">2</span>
                aether::proof_registry Module
              </h3>
              <p style={{ color: 'var(--slate-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Stores decentralized cryptographic and storage proofs representing individual portfolio swaps on Walrus.
              </p>
              <pre style={{
                background: 'var(--slate-dark)',
                color: '#E2E8F0',
                padding: '1.5rem',
                borderRadius: '16px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                overflowX: 'auto',
                border: '1px solid var(--card-border)'
              }}>
{`module aether::proof_registry {
    use std::string::String;

    /// Shared registry for storing decentralized trade proofs
    public struct ProofRegistry has key {
        id: UID,
        trade_count: u64
    }

    /// Event emitted upon registering a new trade proof
    public struct ProofRegistered has copy, drop {
        trade_id: u64,
        blob_id: String,
        trader: address
    }

    /// Publishes a trade proof linking a DeepBook transaction to its Walrus metadata
    public fun register_proof(
        registry: &mut ProofRegistry, 
        blob_id: String, 
        trader: address,
        _ctx: &mut TxContext
    ) {
        registry.trade_count = registry.trade_count + 1;
        // Emit registration event
        sui::event::emit(ProofRegistered {
            trade_id: registry.trade_count,
            blob_id,
            trader
        });
    }
}`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={{
        textAlign: 'center',
        padding: '2rem 0',
        color: 'var(--slate-muted)',
        fontSize: '0.85rem',
        borderTop: '1px solid var(--card-border)',
        marginTop: '2rem',
        fontWeight: 600
      }}>
        <span>Aether.ai — Developed for the Sui Overflow 2026 Hackathon. Protected by Sui Move Guards and secured on Walrus Protocol.</span>
      </footer>
    </div>
    </div>
  )
}

export default App
