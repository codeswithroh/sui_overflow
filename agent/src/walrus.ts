import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config();

export interface WalrusUploadResult {
  blobId: string;
  isMock: boolean;
  timestamp: string;
  sizeBytes: number;
}

export class WalrusPublisher {
  private publisherUrl: string;
  private aggregatorUrl: string;
  private offlineMode: boolean;
  private mockStoragePath: string;

  constructor() {
    this.publisherUrl = process.env.WALRUS_PUBLISHER_URL || 'https://publisher.walrus-testnet.walrus.space';
    this.aggregatorUrl = process.env.WALRUS_AGGREGATOR_URL || 'https://aggregator.walrus-testnet.walrus.space';
    this.offlineMode = process.env.WALRUS_OFFLINE_MODE === 'true';
    
    // Set up mock storage path inside the workspace
    this.mockStoragePath = path.resolve(__dirname, '../../mock_walrus_storage');
    if (!fs.existsSync(this.mockStoragePath)) {
      fs.mkdirSync(this.mockStoragePath, { recursive: true });
    }
  }

  /**
   * Publishes a JSON document representing an AI trade decision to Walrus Protocol.
   * Falls back to offline mock storage if configured or network requests fail.
   */
  async storeBlob(data: any): Promise<WalrusUploadResult> {
    const jsonStr = JSON.stringify(data, null, 2);
    const sizeBytes = Buffer.byteLength(jsonStr, 'utf8');
    const timestamp = new Date().toISOString();

    // Generate a deterministically hashed ID to represent the blob ID in mock scenarios
    const hash = crypto.createHash('sha256').update(jsonStr).digest('hex');
    // Walrus Blob IDs are base64url/base58 or hex, let's create a realistic-looking one
    const mockBlobId = `walrus-mock-${hash.substring(0, 32)}`;

    // 1. Offline Mode execution
    if (this.offlineMode) {
      this.writeToLocalMock(mockBlobId, jsonStr);
      console.log(`[Walrus] 💾 Stored decision blob OFFLINE. Mock Blob ID: ${mockBlobId}`);
      return {
        blobId: mockBlobId,
        isMock: true,
        timestamp,
        sizeBytes
      };
    }

    // 2. Real Walrus network upload attempt
    try {
      console.log(`[Walrus] 🌐 Attempting to publish blob to Walrus gateway: ${this.publisherUrl}`);
      
      const response = await fetch(`${this.publisherUrl}/v1/store?epochs=5`, {
        method: 'PUT',
        body: jsonStr,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP Error response: ${response.status} ${response.statusText}`);
      }

      const result = await response.json() as any;
      
      let realBlobId = '';
      if (result.newlyCreated && result.newlyCreated.blobObject && result.newlyCreated.blobObject.blobId) {
        realBlobId = result.newlyCreated.blobObject.blobId;
      } else if (result.alreadyCertified && result.alreadyCertified.blobId) {
        realBlobId = result.alreadyCertified.blobId;
      } else {
        throw new Error('Unexpected response format from Walrus publisher');
      }

      console.log(`[Walrus] 🚀 Successfully published blob to Walrus Network! Real Blob ID: ${realBlobId}`);
      return {
        blobId: realBlobId,
        isMock: false,
        timestamp,
        sizeBytes
      };
    } catch (error: any) {
      console.warn(`[Walrus] ⚠️ Failed to upload blob to Walrus. Falling back to local simulated storage. Error: ${error.message}`);
      
      // Automatic fallback to local mock storage on failure
      this.writeToLocalMock(mockBlobId, jsonStr);
      return {
        blobId: mockBlobId,
        isMock: true,
        timestamp,
        sizeBytes
      };
    }
  }

  /**
   * Reads a decision blob from Walrus using the aggregator or local mock directory.
   */
  async readBlob(blobId: string): Promise<any> {
    // 1. Check local mock storage first
    const mockFilePath = path.join(this.mockStoragePath, `${blobId}.json`);
    if (fs.existsSync(mockFilePath)) {
      const fileContent = fs.readFileSync(mockFilePath, 'utf8');
      return JSON.parse(fileContent);
    }

    // 2. Attempt fetching from real Walrus aggregator
    try {
      const url = `${this.aggregatorUrl}/v1/${blobId}`;
      console.log(`[Walrus] 🌐 Fetching blob from aggregator: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP Error fetching from aggregator: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(`[Walrus] ❌ Failed to read blob ${blobId}: ${error.message}`);
    }
  }

  /**
   * Helper to write files locally
   */
  private writeToLocalMock(blobId: string, content: string): void {
    const filePath = path.join(this.mockStoragePath, `${blobId}.json`);
    fs.writeFileSync(filePath, content, 'utf8');
  }

  /**
   * Lists all local mock blobs stored. Helpful for displaying the decision stream in UI.
   */
  listLocalBlobs(): { blobId: string; data: any }[] {
    if (!fs.existsSync(this.mockStoragePath)) return [];
    
    const files = fs.readdirSync(this.mockStoragePath);
    return files
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const blobId = f.replace('.json', '');
        const data = JSON.parse(fs.readFileSync(path.join(this.mockStoragePath, f), 'utf8'));
        return { blobId, data };
      })
      .sort((a, b) => new Date(b.data.timestamp).getTime() - new Date(a.data.timestamp).getTime());
  }
}
