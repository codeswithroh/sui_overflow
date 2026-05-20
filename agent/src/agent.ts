import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiJsonRpcClient as SuiClient, getJsonRpcFullnodeUrl as getFullnodeUrl } from '@mysten/sui/jsonRpc';
import { AIDecisionEngine, MarketData, AIDecision } from './ai';
import { WalrusPublisher } from './walrus';
import { DeepBookSimulator } from './deepbook';
import * as dotenv from 'dotenv';

dotenv.config();

export class AetherAgent {
  private client: SuiClient;
  private keypair: Ed25519Keypair;
  private aiEngine: AIDecisionEngine;
  private walrusPublisher: WalrusPublisher;
  private deepBookSim: DeepBookSimulator;
  private isRunning: boolean = false;
  private intervalId?: NodeJS.Timeout;

  // Track a simulated vault balance in MIST for robust off-chain demonstrations
  private simulatedVaultBalanceMist: number = 500_000_000_000; // 500 SUI default

  constructor() {
    const rpcUrl = process.env.SUI_RPC_URL || getFullnodeUrl('testnet');
    this.client = new SuiClient({ url: rpcUrl, network: 'testnet' });
    
    // Initialize Agent Keypair
    const secretKeyHex = process.env.AGENT_SECRET_KEY || '0x0000000000000000000000000000000000000000000000000000000000000000';
    // Handle mock keys or standard private keys safely
    if (secretKeyHex.startsWith('0x000000')) {
      // Create a random/mock keypair for offline testing
      this.keypair = new Ed25519Keypair();
      console.log(`[Agent] 🔑 Initialized simulated keypair with address: ${this.keypair.getPublicKey().toSuiAddress()}`);
    } else {
      // In production/live execution, import from hex private key
      try {
        // Strip 0x if present
        const cleanHex = secretKeyHex.startsWith('0x') ? secretKeyHex.slice(2) : secretKeyHex;
        const privateKeyBytes = Uint8Array.from(Buffer.from(cleanHex, 'hex'));
        this.keypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);
        console.log(`[Agent] 🔑 Successfully loaded agent keypair from environment: ${this.keypair.getPublicKey().toSuiAddress()}`);
      } catch (err: any) {
        console.warn(`[Agent] ⚠️ Failed to parse AGENT_SECRET_KEY, instantiating secure fallback keypair: ${err.message}`);
        this.keypair = new Ed25519Keypair();
      }
    }

    this.aiEngine = new AIDecisionEngine();
    this.walrusPublisher = new WalrusPublisher();
    this.deepBookSim = new DeepBookSimulator();
  }

  /**
   * Generates realistic simulated market data for testing our AI risk model.
   * Modifies SUI price, volatility, and indicators periodically.
   */
  private generateMarketData(): MarketData {
    const prices = [1.25, 1.28, 1.22, 1.15, 1.05, 1.10, 1.18, 1.24, 1.35, 1.42, 1.48];
    // Select price with a slight random walk or based on timestamp
    const index = Math.floor((Date.now() / 10000) % prices.length);
    const basePrice = prices[index];
    // Add tiny random variance (-2% to +2%)
    const suiPrice = basePrice * (1 + (Math.random() * 0.04 - 0.02));
    
    // Volatility simulation (oscillates over time, spiked during price drops)
    const volatility = 0.3 + (Math.sin(Date.now() / 60000) * 0.2) + (suiPrice < 1.15 ? 0.3 : 0);
    
    // Social sentiment index (-1.0 to 1.0, spiked during price rises)
    const socialSentiment = -0.5 + (Math.cos(Date.now() / 45000) * 0.4) + (suiPrice > 1.30 ? 0.6 : 0);
    
    // RSI calculation
    const rsi = 30 + (Math.sin(Date.now() / 30000) * 25) + (suiPrice < 1.10 ? -15 : suiPrice > 1.40 ? 25 : 0);
    
    // MACD momentum
    const macdHistogram = Math.sin(Date.now() / 90000) * 0.15;

    return {
      suiPrice: parseFloat(suiPrice.toFixed(4)),
      volatility: parseFloat(Math.max(0.01, Math.min(0.99, volatility)).toFixed(2)),
      socialSentiment: parseFloat(Math.max(-1.0, Math.min(1.0, socialSentiment)).toFixed(2)),
      rsi: parseFloat(Math.max(5, Math.min(95, rsi)).toFixed(1)),
      macdHistogram: parseFloat(macdHistogram.toFixed(4)),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Executes a single evaluation loop:
   * 1. Fetches current/simulated market indicators.
   * 2. Evaluates portfolio risk using the AI Engine.
   * 3. Publishes the detailed decision record to Walrus.
   * 4. Assembles and logs the Sui Programmable Transaction Block.
   * 5. Performs simulated state updates (modifying TVL/hedged positions).
   */
  async runOnce(): Promise<void> {
    console.log(`\n======================================================`);
    console.log(`🚀 [Aether Agent] Running risk evaluation cycle...`);
    console.log(`======================================================`);

    try {
      // 1. Ingest market parameters
      const marketData = this.generateMarketData();
      console.log(`[Market Ingest] 📊 Volatility: ${(marketData.volatility * 100).toFixed(0)}% | RSI: ${marketData.rsi} | MACD Hist: ${marketData.macdHistogram}`);

      // 2. Feed parameters to AI Decision Engine
      const decision = await this.aiEngine.evaluateRisk(marketData, this.simulatedVaultBalanceMist);
      console.log(`[AI Decision] 🎯 Action: ${decision.action} (Confidence: ${(decision.confidence * 100).toFixed(0)}%)`);
      console.log(`[AI Decision] 📖 Rationale: "${decision.reasoning}"`);

      // 3. Upload decision metadata to Walrus Protocol
      console.log(`[Walrus Upload] 💾 Uploading structured decision metadata to Walrus...`);
      const uploadResult = await this.walrusPublisher.storeBlob(decision);
      
      // 4. If action requires hedging trade, assemble PTB
      if (decision.action !== 'HOLD' && decision.suggestedAmount > 0) {
        console.log(`[PTB Engine] 🔧 Assembling Transaction Block for ${decision.action} of ${decision.suggestedAmount / 1_000_000_000} SUI...`);
        
        const tx = this.deepBookSim.buildHedgeTransaction(
          decision.suggestedAmount,
          uploadResult.blobId,
          this.keypair.getPublicKey().toSuiAddress()
        );

        // Simulate swap dynamics for client ledger representation
        const direction = decision.action === 'HEDGE_BUY' ? 'SELL_SUI' : 'BUY_SUI';
        const swapSim = this.deepBookSim.simulateSwap(decision.suggestedAmount, marketData.suiPrice, direction);
        
        console.log(`[DeepBook Swap] 🔄 Executed Simulated Trade:`);
        console.log(`  ├─ Direction: ${direction}`);
        console.log(`  ├─ Exchange Rate: $${swapSim.rate.toFixed(4)} USDC/SUI`);
        console.log(`  ├─ Output Amount: ${swapSim.simulatedOutputMist.toLocaleString()} units`);
        console.log(`  └─ Gas Fee: ${swapSim.gasSpentMist / 1_000_000_000} SUI`);

        // Adjust local simulated balances
        if (decision.action === 'HEDGE_BUY') {
          this.simulatedVaultBalanceMist -= decision.suggestedAmount;
        } else {
          this.simulatedVaultBalanceMist += swapSim.simulatedOutputMist; // Simulated re-acc
        }
      } else {
        console.log(`[PTB Engine] ⏸️ Portfolio in state HOLD. No transactions assembled.`);
      }

      console.log(`\n[Cycle Complete] 🟢 Successful risk management execution.`);
      console.log(`  └─ Remaining Simulated Vault Balance: ${this.simulatedVaultBalanceMist / 1_000_000_000} SUI`);
      console.log(`======================================================`);

    } catch (err: any) {
      console.error(`[Agent Loop] ❌ Error in evaluation cycle: ${err.message}`);
    }
  }

  /**
   * Starts the autonomous continuous cycle execution loop.
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    
    const intervalMs = parseInt(process.env.AI_DECISION_INTERVAL_MS || '30000');
    console.log(`[Aether Agent] 🟢 Autonomous risk manager started. Cycle interval: ${intervalMs / 1000} seconds.`);
    
    // Execute immediately
    this.runOnce();
    
    // Run periodically
    this.intervalId = setInterval(() => this.runOnce(), intervalMs);
  }

  /**
   * Stops the active autonomous loop.
   */
  stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    console.log(`[Aether Agent] 🛑 Autonomous risk manager stopped.`);
  }

  getSimulatedBalance(): number {
    return this.simulatedVaultBalanceMist;
  }
}

// Support running the agent script directly from CLI
if (require.main === module) {
  const agent = new AetherAgent();
  const args = process.argv.slice(2);
  
  if (args.includes('--once')) {
    agent.runOnce();
  } else {
    agent.start();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      agent.stop();
      process.exit(0);
    });
  }
}
