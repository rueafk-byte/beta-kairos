import { initializeDatabase } from './database.js';

// Initialize the database
async function init() {
  try {
    await initializeDatabase();
    console.log('Database initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

// Run the initialization
init();