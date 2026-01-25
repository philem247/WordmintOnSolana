# WordMint: Solana-Powered Spell-to-Earn Game

<img width="1608" height="828" alt="WordMint Game Design and 135 more pages - Personal - Microsoft​ Edge 12_16_2025 2_44_57 PM" src="https://github.com/user-attachments/assets/98e893a2-d928-45c3-b68f-0c11bbea1c63" />


**WordMint** is a "Spell-to-Earn" word game built on Solana. It bridges the gap between casual gaming and blockchain ownership by offering a seamless mobile wallet connection experience and tangible rewards for player skill.



### Live Demo - https://wordmint-on-solana-16vh.vercel.app/



## Watch the Demo
[![WordMint Demo](https://img.youtube.com/vi/CHnyTIq5g1g/0.jpg)](https://www.youtube.com/watch?v=CHnyTIq5g1g)



[View our Pitch Deck (PDF)](https://drive.google.com/file/d/1y6huNuoPRTNDVJ-8oJrt2QSB8LBMLgjA/view?usp=sharing)

---

## The Problem

1.  **Mobile Crypto UX is Broken:** Connecting a crypto wallet on mobile web browsers is often clunky, error-prone or requires users to stay trapped inside a wallet's in-app browser.
2.  **Lack of Ownership:** In traditional word games, players spend hours achieving high scores and unlocking items, but they never truly own their achievements or rewards.
3.  **High Barrier to Entry:** Most crypto games require expensive NFTs or complex setups before a user can even play the first level.

## The Solution

**WordMint** solves these issues with a polished, user-friendly experience:

* **Seamless Mobile Wallet Adapter (MWA):** We implemented a custom, secure deep-link protocol that allows users to connect their Phantom or Solflare wallets directly from their favorite mobile browser (Chrome, Safari) without getting stuck.
* **Instant Play:** Users can start playing immediately. Wallet connection is only required to claim rewards, lowering the barrier to entry.
* **On-Chain Rewards:** Achievements and game rewards are distributed as SPL tokens directly to the player's wallet.

---

## Solana Components & Tech Stack

This project leverages the Solana blockchain to provide a fast and secure gaming experience.

### 1. Custom Mobile Wallet Adapter (MWA) Protocol
Unlike standard adapter implementations, we built a robust, custom Deep Link protocol to handle mobile connections securely.
* **Features:** Session-based encryption using `tweetnacl`, Base58/Base64 key exchange, and deep linking to Phantom/Solflare.
* **Code Location:** [`src/utils/mobile-wallet-protocol.ts`](src/utils/mobile-wallet-protocol.ts)

### 2. SPL Token Rewards
Players earn tokens for completing difficulty levels and achieving high scores.
* **Integration:** Uses `@solana/spl-token` to handle token interactions and balance checks.
* **Code Location:** [`src/components/token-reward-screen.tsx`](src/components/token-reward-screen.tsx)

### 3. Solana Web3.js
Core interaction layer for querying the blockchain and managing connection states.
* **Code Location:** [`src/utils/solana-blockchain.ts`](src/utils/solana-blockchain.ts)

### Full Tech Stack:
* **Frontend:** React, Vite, TypeScript, Tailwind CSS
* **Blockchain:** Solana (Devnet), Web3.js, SPL Token
* **Backend/Storage:** Supabase (for leaderboard and user data)
* **Deployment:** Vercel

---

## 📱 How to Demo (Mobile Flow)

1.  **Open the Live URL:** Access the deployed game link on your mobile device (iOS/Android) using Chrome or Safari.
2.  **Tap "Connect Wallet":** Select **Phantom** or **Solflare**.
3.  **Approve Connection:** The app will deep link you to the wallet app. Approve the connection.
4.  **Return to Game:** You will be securely redirected back to the game browser with an active session.
5.  **Play & Earn:** Complete a game session. Upon success, check the "Rewards" tab to see your token balance update.

---

## Project Structure

* `src/components/` - UI Components (Game board, Wallet buttons, Reward screens).
* `src/utils/` - Logic for Solana connection, cryptography, and game rules.
    * `mobile-wallet-protocol.ts` - **Core Logic** for the secure mobile handshake.
    * `solana-blockchain.ts` - Blockchain interaction helper functions.
* `src/styles/` - Global Tailwind CSS styles.

---
