import { getAllWalletEntries, getWalletEntryCount } from '../../../utils/dataHandler.js';
import { ADMIN_PASSWORD } from '../admin-password.js';

export const prerender = false;

export async function GET({ request }) {
  try {
    // Check for authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Unauthorized: Missing authorization header' 
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (token !== ADMIN_PASSWORD) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Unauthorized: Invalid password' 
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const wallets = await getAllWalletEntries();
    const count = await getWalletEntryCount();
    
    return new Response(
      JSON.stringify({ 
        success: true,
        count: count,
        wallets 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Internal server error' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}