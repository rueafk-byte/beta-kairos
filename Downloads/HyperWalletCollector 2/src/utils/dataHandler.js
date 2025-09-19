import fs from 'fs';
import path from 'path';
import { addWallet, getAllWallets, getWalletCount } from './database.js';

const dataFilePath = path.join(process.cwd(), 'src', 'data', 'wallets.json');

// Read data from JSON file
export function readData() {
  try {
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading data:', error);
    return [];
  }
}

// Write data to JSON file
export function writeData(data) {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing data:', error);
    return false;
  }
}

// Add a new wallet entry
export async function addWalletEntry(walletData) {
  return await addWallet(walletData);
}

// Get all wallets
export async function getAllWalletEntries() {
  return await getAllWallets();
}

// Get wallet count
export async function getWalletEntryCount() {
  return await getWalletCount();
}
