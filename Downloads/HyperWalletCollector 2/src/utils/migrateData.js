import fs from 'fs';
import path from 'path';
import { addWallet } from './database.js';

// Migrate data from JSON file to database
async function migrateData() {
  try {
    const dataFilePath = path.join(process.cwd(), 'src', 'data', 'wallets.json');
    
    // Check if the JSON file exists
    if (!fs.existsSync(dataFilePath)) {
      console.log('No existing data file found. Starting with empty database.');
      return;
    }
    
    // Read data from JSON file
    const jsonData = fs.readFileSync(dataFilePath, 'utf8');
    const wallets = JSON.parse(jsonData);
    
    console.log(`Found ${wallets.length} wallets to migrate.`);
    
    // Insert each wallet into the database
    let successCount = 0;
    let duplicateCount = 0;
    
    for (const wallet of wallets) {
      try {
        const result = await addWallet({
          twitterHandle: wallet.twitterHandle,
          walletAddress: wallet.walletAddress
        });
        
        if (result.success) {
          successCount++;
          console.log(`Migrated wallet: ${wallet.twitterHandle}`);
        } else {
          duplicateCount++;
          console.log(`Skipped duplicate wallet: ${wallet.twitterHandle}`);
        }
      } catch (error) {
        console.error(`Failed to migrate wallet ${wallet.twitterHandle}:`, error);
      }
    }
    
    console.log(`Migration completed. Successfully migrated: ${successCount}, Duplicates skipped: ${duplicateCount}`);
  } catch (error) {
    console.error('Error during data migration:', error);
  }
}

// Run the migration
migrateData();