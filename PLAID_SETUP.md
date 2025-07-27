# 🚀 Plaid Setup Guide

Follow these steps to get your financial dashboard connected to your Schwab account via Plaid.

## Step 1: Create Plaid Account (FREE)

1. **Go to Plaid Dashboard**: https://dashboard.plaid.com/
2. **Sign up** with your email (completely free)
3. **Complete verification** - they'll ask for basic business info
4. **Select products** as discussed:
   - ✅ Investments
   - ✅ Transactions  
   - ✅ Assets (optional)
   - ✅ Identity (optional)

## Step 2: Get Your API Keys

1. **Navigate to**: Team Settings > Keys in the Plaid Dashboard
2. **Copy your credentials**:
   - `client_id` (looks like: `507f1f77bcf86cd799439011`)
   - `secret` (looks like: `b76c8e34c7f45893b4d6e8f2a1c9d0e5`)

## Step 3: Configure Environment Variables

1. **Copy the template**:
   ```bash
   cp .env.local.template .env.local
   ```

2. **Edit `.env.local`** and replace the placeholders:
   ```env
   PLAID_CLIENT_ID=your_actual_client_id
   PLAID_SECRET=your_actual_secret_key  
   NEXT_PUBLIC_PLAID_CLIENT_ID=your_actual_client_id
   PLAID_ENV=sandbox
   ```

## Step 4: Test the Application

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open**: http://localhost:3000

3. **Click "Connect with Plaid"**

4. **In Sandbox mode**, you'll see test banks - select "First Platypus Bank" for testing

## Step 5: Connect Your Real Account

1. **Switch to Development mode** in `.env.local`:
   ```env
   PLAID_ENV=development
   ```

2. **Restart the server**: `npm run dev`

3. **Click "Connect with Plaid"** again

4. **Search for "Charles Schwab"** in the institution list

5. **Login with your actual Schwab credentials** (handled securely by Plaid)

6. **Select your investment accounts** to analyze

## 🎉 You're Done!

Your dashboard will now show:
- ✅ Real account balances and positions
- ✅ Complete transaction history  
- ✅ Performance analysis vs S&P 500
- ✅ Real returns after deposits/withdrawals/fees
- ✅ Interactive charts and metrics

## 🔒 Security Notes

- Your Schwab login credentials are never stored
- Plaid uses read-only access with bank-level encryption
- All data processing happens locally in your browser
- API keys are stored securely in environment variables

## 🆘 Troubleshooting

**Can't find Schwab?**
- Make sure you're in "development" mode, not "sandbox"
- Try searching for "Charles Schwab" or just "Schwab"

**Connection fails?**
- Check your API keys are correct
- Ensure you have the Investments product enabled
- Try refreshing and connecting again

**No investment data?**
- Make sure you selected investment accounts (not checking/savings)
- Schwab investment accounts should show up as "brokerage", "ira", or "roth"

Need help? The Plaid Dashboard has great documentation and support!
