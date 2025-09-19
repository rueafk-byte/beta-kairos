import { addWalletEntry } from '../../utils/dataHandler.js';

export const prerender = false;

export async function POST({ request }) {
  try {
    const formData = await request.json();
    
    // Validate required fields
    if (!formData.twitterHandle || !formData.walletAddress) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Twitter handle and wallet address are required' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Basic validation for wallet address (EVM address format)
    const walletRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!walletRegex.test(formData.walletAddress)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Invalid wallet address format' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Add wallet to database
    const result = await addWalletEntry({
      twitterHandle: formData.twitterHandle,
      walletAddress: formData.walletAddress
    });
    
    return new Response(
      JSON.stringify(result),
      { status: result.success ? 200 : 400, headers: { 'Content-Type': 'application/json' } }
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