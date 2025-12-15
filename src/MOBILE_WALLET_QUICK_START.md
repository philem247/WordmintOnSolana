# Mobile Wallet - Quick Start Guide

## 🚀 5-Minute Integration

### 1. Install Dependencies

```bash
npm install bs58
```

### 2. Import Component

```tsx
import { MobileWalletConnect } from './components/mobile-wallet-connect';
```

### 3. Add to Your App

```tsx
<MobileWalletConnect
  onConnected={(publicKey) => {
    console.log('✅ Connected:', publicKey);
    // Your logic here
  }}
  onError={(error) => {
    console.error('❌ Error:', error);
    // Show error toast
  }}
/>
```

### 4. Test

**Desktop:** Should show "Install Phantom" or "Connect Wallet"
**Mobile (in-app):** Should show "Phantom Browser Detected"
**Mobile (external):** Should show "Choose Your Wallet"

---

## 📱 How It Works

### For Users in Wallet Browser
1. Open Phantom app → Browser tab → Visit your site
2. See "Phantom Browser Detected" ✅
3. Tap "Connect Phantom"
4. Approve → Done! 🎉

### For Users in Safari/Chrome
1. Visit your site in Safari
2. See "Choose Your Wallet"
3. Tap "Connect with Phantom"
4. Phantom app opens
5. Approve in Phantom
6. Returns to Safari → Connected! 🎉

---

## 🔑 Key Features

✅ **Auto-detects** in-app browser vs external browser
✅ **Handles** both Phantom and Solflare
✅ **Secure** session-based encryption
✅ **Recovers** from errors gracefully
✅ **Saves** connection for next visit

---

## 🎨 Component States

| State | What User Sees | Action |
|-------|---------------|--------|
| In-App Ready | "Phantom Browser Detected" | Tap connect |
| External | "Choose Your Wallet" | Select wallet |
| Connecting | Loading spinner | Wait for approval |
| Connected | "Wallet Connected!" | Continue to app |
| Error | Error message + retry | Retry connection |

---

## 🔧 Advanced Usage

### Custom Styling

The component uses Tailwind classes. Customize by wrapping in a div:

```tsx
<div className="custom-wallet-wrapper">
  <MobileWalletConnect ... />
</div>
```

### Handle Connection State

```tsx
const [walletAddress, setWalletAddress] = useState<string | null>(null);

<MobileWalletConnect
  onConnected={(publicKey) => {
    setWalletAddress(publicKey);
    localStorage.setItem('wallet', publicKey);
    // Fetch user data
    // Navigate to dashboard
  }}
  onError={(error) => {
    // Show toast notification
    toast.error(error);
  }}
/>
```

### Check for Existing Connection

```tsx
useEffect(() => {
  const savedWallet = localStorage.getItem('wallet');
  if (savedWallet) {
    setWalletAddress(savedWallet);
    // Auto-connect or restore session
  }
}, []);
```

---

## 🧪 Testing Checklist

### Desktop
- [ ] Chrome with Phantom extension installed
- [ ] Chrome without Phantom (should show install)
- [ ] Connect → Approve → See connected state
- [ ] Disconnect → Returns to initial state

### Mobile (In-App Browser)
- [ ] Open Phantom app → Browser tab → Your site
- [ ] See "Phantom Browser Detected"
- [ ] Tap connect → Approve → Connected
- [ ] Refresh page → Still connected

### Mobile (External Browser)
- [ ] Open Safari → Your site
- [ ] See "Choose Your Wallet"
- [ ] Tap Phantom → Phantom app opens
- [ ] Approve → Returns to Safari → Connected

---

## ⚠️ Common Issues

### "Deep link doesn't work"
**Fix:** Make sure Phantom app is installed

### "Returns but not connected"
**Fix:** Clear localStorage and try again

### "Session expired"
**Fix:** Sessions expire after 30 minutes, just reconnect

---

## 📚 Full Documentation

- `/MOBILE_WALLET_IMPLEMENTATION.md` - Complete guide (1000+ lines)
- `/WALLET_CONNECTION_GUIDE.md` - Technical details
- `/utils/mobile-wallet-protocol.ts` - Source code

---

## 🎯 That's It!

You now have production-ready mobile wallet support with:
- ✅ In-app browser detection
- ✅ Deep link fallback
- ✅ Session encryption
- ✅ Error handling
- ✅ Great UX

**Questions?** Check the full documentation or the source code.

**Built for WordMint** 🎮⛓️📱
