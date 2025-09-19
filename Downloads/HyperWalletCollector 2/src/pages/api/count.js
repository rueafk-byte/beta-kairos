import { getWalletEntryCount } from '../../utils/dataHandler.js';

export const prerender = false;

export async function GET() {
  try {
    const count = await getWalletEntryCount();
    return new Response(
      JSON.stringify({ count }),
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