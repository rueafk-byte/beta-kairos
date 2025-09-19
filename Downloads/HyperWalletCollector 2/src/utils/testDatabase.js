import { addWallet, getAllWallets, getWalletCount } from './database.js';

// Test the database functions
async function testDatabase() {
  try {
    console.log('Testing database functions...');
    
    // Test adding a wallet
    console.log('Adding test wallet...');
    const result = await addWallet({
      twitterHandle: '@testuser_db',
      walletAddress: '0x1234567890123456789012345678901234567892'
    });
    
    console.log('Add result:', result);
    
    // Test getting wallet count
    console.log('Getting wallet count...');
    const count = await getWalletCount();
    console.log('Wallet count:', count);
    
    // Test getting all wallets
    console.log('Getting all wallets...');
    const wallets = await getAllWallets();
    console.log('Wallets:', wallets.length, 'entries found');
    
    console.log('Database test completed successfully!');
  } catch (error) {
    console.error('Database test failed:', error);
  }
}

// Run the test
testDatabase();