# @thresho/core

Shared logic for Threshold Wallet across Web, Desktop, and Mobile.

Includes:
- Wallet operations (balances, transactions, history) via `stellar-sdk`
- Threshold calculations and approval verification
- Utility helpers (formatting, validation)
- Notification event bus
- Optional Soroban rules hooks (pseudocode/example only)

This package stores no private keys. Signing is handled by the client wallet (Freighter/SEP-7/etc.).
