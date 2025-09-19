import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/walletcollector',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database tables
export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    // Create wallets table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS wallets (
        id SERIAL PRIMARY KEY,
        twitter_handle VARCHAR(255) NOT NULL,
        wallet_address VARCHAR(42) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_wallets_twitter_handle ON wallets(twitter_handle);
      CREATE INDEX IF NOT EXISTS idx_wallets_wallet_address ON wallets(wallet_address);
      CREATE INDEX IF NOT EXISTS idx_wallets_created_at ON wallets(created_at);
    `);
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Add a new wallet entry
export async function addWallet(walletData) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO wallets (twitter_handle, wallet_address) 
       VALUES ($1, $2) 
       ON CONFLICT (wallet_address) 
       DO NOTHING
       RETURNING *`,
      [walletData.twitterHandle, walletData.walletAddress]
    );
    
    if (result.rows.length > 0) {
      return {
        success: true,
        message: 'Wallet added successfully',
        data: {
          id: result.rows[0].id,
          twitterHandle: result.rows[0].twitter_handle,
          walletAddress: result.rows[0].wallet_address,
          timestamp: result.rows[0].created_at.toISOString()
        }
      };
    } else {
      return {
        success: false,
        message: 'Wallet address already exists'
      };
    }
  } catch (error) {
    console.error('Error adding wallet:', error);
    return {
      success: false,
      message: 'Failed to add wallet'
    };
  } finally {
    client.release();
  }
}

// Get all wallets
export async function getAllWallets() {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT id, twitter_handle, wallet_address, created_at FROM wallets ORDER BY created_at DESC'
    );
    
    return result.rows.map(row => ({
      id: row.id,
      twitterHandle: row.twitter_handle,
      walletAddress: row.wallet_address,
      timestamp: row.created_at.toISOString()
    }));
  } catch (error) {
    console.error('Error fetching wallets:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Get wallet count
export async function getWalletCount() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT COUNT(*) as count FROM wallets');
    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    console.error('Error fetching wallet count:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Export the pool for potential direct usage
export { pool };