import { Transaction } from '@mysten/sui/transactions';
import * as dotenv from 'dotenv';

dotenv.config();

export interface SwapResult {
  txBlockBytes: string;
  simulatedOutputMist: number;
  rate: number;
  gasSpentMist: number;
}

export class DeepBookSimulator {
  private packageId: string;
  private vaultStateId: string;
  private proofRegistryId: string;

  constructor() {
    this.packageId = process.env.VAULT_PACKAGE_ID || '0x0';
    this.vaultStateId = process.env.VAULT_STATE_ID || '0x0';
    this.proofRegistryId = process.env.PROOF_REGISTRY_ID || '0x0';
  }

  /**
   * Simulates a DeepBook v3 SUI/USDC swap.
   * Calculates dynamic exchange rates based on current mock prices and slippage rules.
   */
  simulateSwap(inputAmountMist: number, suiPrice: number, direction: 'BUY_SUI' | 'SELL_SUI'): SwapResult {
    const slippage = 0.0015; // 0.15% standard slippage
    let rate = suiPrice;
    let simulatedOutputMist = 0;

    if (direction === 'SELL_SUI') {
      // Selling SUI for stablecoin USDC. Output is stablecoins (in units, assuming standard decimals).
      // Standard MIST is 10^9. Let's assume SUI decimal is 9, USDC is 6.
      // SUI amount * Price * (1 - slippage) = USDC amount
      const inputSui = inputAmountMist / 1_000_000_000;
      const outputUsdc = inputSui * rate * (1 - slippage);
      simulatedOutputMist = Math.floor(outputUsdc * 1_000_000); // 6 decimals for USDC
      rate = suiPrice * (1 - slippage);
    } else {
      // Selling USDC for SUI. Input is USDC (simulated input in MIST for simplicity here)
      // USDC amount / Price * (1 - slippage) = SUI amount
      const inputUsdc = inputAmountMist / 1_000_000;
      const outputSui = (inputUsdc / rate) * (1 - slippage);
      simulatedOutputMist = Math.floor(outputSui * 1_000_000_000); // 9 decimals for SUI
      rate = suiPrice * (1 + slippage);
    }

    return {
      txBlockBytes: '0xmock_compiled_transaction_bytes',
      simulatedOutputMist,
      rate,
      gasSpentMist: 1_250_000 // typical Sui transaction gas fee
    };
  }

  /**
   * Assembles the actual Sui Programmable Transaction Block (PTB) for the AI trading execution.
   * This builds a real `@mysten/sui/transactions` Transaction object that can be signed and submitted on-chain.
   * 
   * Architecture of the PTB:
   * 1. Call aether::vault::extract_trade_funds<SUI>(vault, amount, walrus_blob_id) -> Returns (Coin<SUI>, TradeProof)
   * 2. Call deepbook::swap (or mock execution) to swap Coin<SUI> for Coin<USDC> (simulated in mock payload here)
   * 3. Call aether::vault::return_trade_funds<SUI>(vault, returned_coin) -> returns assets to vault pool
   * 4. Call aether::proof_registry::register_proof(registry, proof) -> Registers the verifiable proof on-chain
   */
  buildHedgeTransaction(
    amountMist: number,
    walrusBlobId: string,
    agentAddress: string,
    coinType: string = '0x2::sui::SUI'
  ): Transaction {
    const tx = new Transaction();
    
    console.log(`[DeepBook PTB] 🛠️ Assembling Programmable Transaction Block for agent trade...`);
    console.log(`[DeepBook PTB] ├─ Vault ID: ${this.vaultStateId}`);
    console.log(`[DeepBook PTB] ├─ Amount MIST: ${amountMist}`);
    console.log(`[DeepBook PTB] └─ Walrus Blob ID: ${walrusBlobId}`);

    // Convert Walrus Blob ID string to ASCII bytes vector for Move input compatibility
    const blobIdBytes = Uint8Array.from(Buffer.from(walrusBlobId, 'utf-8'));

    // Step 1: Extract funds from vault (returns Coin and TradeProof objects)
    const [coinObj, proofObj] = tx.moveCall({
      target: `${this.packageId}::vault::extract_trade_funds`,
      typeArguments: [coinType],
      arguments: [
        tx.object(this.vaultStateId),
        tx.pure.u64(amountMist),
        tx.pure(blobIdBytes), // Pass the blob ID as vector<u8>
      ]
    });

    // In a live devnet execution, you would call DeepBook v3 swap here:
    // const [usdcCoin] = tx.moveCall({
    //   target: `0xdeepbook_package::deepbook::swap_exact_base_for_quote`,
    //   arguments: [ ...coinObj, ... ]
    // });
    
    // Step 2: In our vault architecture, after trade execution, we return remaining or swapped assets back
    tx.moveCall({
      target: `${this.packageId}::vault::return_trade_funds`,
      typeArguments: [coinType],
      arguments: [
        tx.object(this.vaultStateId),
        coinObj
      ]
    });

    // Step 3: Register the TradeProof object in our ProofRegistry shared public ledger
    tx.moveCall({
      target: `${this.packageId}::proof_registry::register_proof`,
      arguments: [
        tx.object(this.proofRegistryId),
        proofObj
      ]
    });

    // Step 4: Transfer the proof object or cleanup (or shared ledger owns it now via registry)
    // The proof registry takes the proof and registers it. Wait! Let's check who owns the TradeProof.
    // In our register_proof Move signature:
    // public fun register_proof(registry: &mut ProofRegistry, proof: &TradeProof, ctx: &mut TxContext)
    // Notice that proof is passed by reference! Meaning the proof object is still owned by the transaction scope.
    // Therefore, we MUST transfer or delete the TradeProof object so it is not left dangling in the PTB!
    // Since the transaction owns it, let's transfer it back to the agent (or owner) or delete it.
    // In vault.move we defined:
    // public fun get_proof_vault_id(proof: &TradeProof)
    // Wait, let's transfer it to the agent address so it becomes an owned object for the agent's record!
    tx.transferObjects([proofObj], agentAddress);

    return tx;
  }
}
