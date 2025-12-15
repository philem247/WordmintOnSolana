#!/bin/bash

# WordMint - Solana Mint Authority Setup Script
# This script generates a Solana keypair for token minting on devnet

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  WordMint - Solana Mint Authority Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo "❌ Solana CLI not found!"
    echo ""
    echo "Please install it first:"
    echo "  macOS/Linux: sh -c \"\$(curl -sSfL https://release.solana.com/stable/install)\""
    echo "  Windows: Download from https://github.com/solana-labs/solana/releases"
    echo ""
    exit 1
fi

echo "✓ Solana CLI found: $(solana --version)"
echo ""

# Configure for devnet
echo "📡 Configuring Solana CLI for devnet..."
solana config set --url https://api.devnet.solana.com
echo ""

# Generate keypair
KEYPAIR_PATH="$HOME/wordmint-mint-authority.json"

if [ -f "$KEYPAIR_PATH" ]; then
    echo "⚠️  Keypair already exists at $KEYPAIR_PATH"
    read -p "Overwrite? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing keypair."
        echo ""
    else
        echo "🔑 Generating new keypair..."
        solana-keygen new --outfile "$KEYPAIR_PATH" --force
        echo ""
    fi
else
    echo "🔑 Generating new keypair..."
    solana-keygen new --outfile "$KEYPAIR_PATH"
    echo ""
fi

# Get public key
PUBKEY=$(solana-keygen pubkey "$KEYPAIR_PATH")
echo "✓ Keypair generated!"
echo "  Public Key: $PUBKEY"
echo ""

# Request airdrop
echo "💰 Requesting devnet SOL airdrop..."
if solana airdrop 2 "$PUBKEY" --url https://api.devnet.solana.com; then
    echo "✓ Airdrop successful!"
else
    echo "⚠️  Airdrop failed (devnet faucet may be rate limited)"
    echo "   You can request SOL manually at: https://faucet.solana.com"
fi
echo ""

# Check balance
echo "💵 Checking balance..."
BALANCE=$(solana balance "$PUBKEY" --url https://api.devnet.solana.com)
echo "  Balance: $BALANCE"
echo ""

# Display keypair for Supabase
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  IMPORTANT: Add this to Supabase Secrets"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Secret Name: WORDMINT_MINT_AUTHORITY"
echo ""
echo "Secret Value (copy everything below, including brackets):"
echo "───────────────────────────────────────────────────────"
cat "$KEYPAIR_PATH"
echo ""
echo "───────────────────────────────────────────────────────"
echo ""
echo "📋 The keypair array has been displayed above."
echo "   Copy it and paste into your Supabase secrets."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Next Steps"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Copy the keypair array shown above"
echo "2. In Figma Make, add it to the WORDMINT_MINT_AUTHORITY secret"
echo "3. Refresh your app"
echo "4. Play a game and claim tokens!"
echo ""
echo "✓ Setup complete! Your mint authority is ready."
echo ""
