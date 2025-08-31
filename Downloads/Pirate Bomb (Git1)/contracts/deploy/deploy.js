const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const { Token, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');

// Configuration
const DEVNET_URL = 'https://api.devnet.solana.com';
const connection = new Connection(DEVNET_URL, 'confirmed');

// Load keypair
const keypairPath = path.join(require('os').homedir(), '.config/solana/id.json');
const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));

console.log('🏴‍☠️ Deploying Pirate Bomb Web3 Smart Contracts to Devnet');
console.log('==================================================');
console.log(`Deployer: ${keypair.publicKey.toString()}`);
console.log(`Network: ${DEVNET_URL}`);
console.log('');

async function deployContracts() {
    try {
        // Check SOL balance
        const balance = await connection.getBalance(keypair.publicKey);
        const solBalance = balance / 1e9;
        console.log(`💰 SOL Balance: ${solBalance.toFixed(4)} SOL`);
        
        if (solBalance < 2) {
            console.log('⚠️  Low SOL balance. Requesting airdrop...');
            const airdropSignature = await connection.requestAirdrop(keypair.publicKey, 2 * 1e9);
            await connection.confirmTransaction(airdropSignature);
            console.log('✅ Airdrop received!');
        }

        // Deploy $PIRATE Token
        console.log('\n🚀 Deploying $PIRATE Token...');
        const pirateToken = await Token.createMint(
            connection,
            keypair,
            keypair.publicKey,
            null,
            9,
            TOKEN_PROGRAM_ID
        );
        console.log(`✅ $PIRATE Token deployed: ${pirateToken.toBase58()}`);

        // Deploy $ADMIRAL Token
        console.log('\n🚀 Deploying $ADMIRAL Token...');
        const admiralToken = await Token.createMint(
            connection,
            keypair,
            keypair.publicKey,
            null,
            9,
            TOKEN_PROGRAM_ID
        );
        console.log(`✅ $ADMIRAL Token deployed: ${admiralToken.toBase58()}`);

        // Create token accounts
        console.log('\n🏦 Creating token accounts...');
        const pirateAccount = await pirateToken.createAccount(keypair.publicKey);
        const admiralAccount = await admiralToken.createAccount(keypair.publicKey);
        console.log(`✅ $PIRATE Account: ${pirateAccount.toBase58()}`);
        console.log(`✅ $ADMIRAL Account: ${admiralAccount.toBase58()}`);

        // Mint initial supply
        console.log('\n💰 Minting initial token supply...');
        await pirateToken.mintTo(pirateAccount, keypair, [], 1000000000); // 1 billion $PIRATE
        await admiralToken.mintTo(admiralAccount, keypair, [], 10000000); // 10 million $ADMIRAL
        console.log('✅ Initial token supply minted!');

        // Save deployment info
        const deploymentInfo = {
            network: 'devnet',
            deployer: keypair.publicKey.toString(),
            deployedAt: new Date().toISOString(),
            tokens: {
                pirate: {
                    mint: pirateToken.toBase58(),
                    account: pirateAccount.toBase58(),
                    supply: '1000000000',
                    symbol: 'PIRATE'
                },
                admiral: {
                    mint: admiralToken.toBase58(),
                    account: admiralAccount.toBase58(),
                    supply: '10000000',
                    symbol: 'ADMIRAL'
                }
            }
        };

        fs.writeFileSync('deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
        console.log('\n📄 Deployment info saved to deployment-info.json');

        console.log('\n🎉 Deployment completed successfully!');
        console.log('==================================================');
        console.log('📋 Contract Addresses:');
        console.log(`$PIRATE Token: ${pirateToken.toBase58()}`);
        console.log(`$ADMIRAL Token: ${admiralToken.toBase58()}`);
        console.log(`$PIRATE Account: ${pirateAccount.toBase58()}`);
        console.log(`$ADMIRAL Account: ${admiralAccount.toBase58()}`);
        console.log('');
        console.log('🔗 View on Solana Explorer:');
        console.log(`https://explorer.solana.com/address/${pirateToken.toBase58()}?cluster=devnet`);
        console.log(`https://explorer.solana.com/address/${admiralToken.toBase58()}?cluster=devnet`);

    } catch (error) {
        console.error('❌ Deployment failed:', error);
        process.exit(1);
    }
}

// Run deployment
deployContracts();
