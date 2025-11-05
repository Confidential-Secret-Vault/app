  WATCH THE VIDEO HERE: https://m.youtube.com/watch?v=e87QMYu9zEA



PayrollConf

Encrypted Payroll System — a platform leveraging FHEVM to send encrypted payments that can be publicly decrypted and verified.



Project Overview

PayrollConf is an encrypted payroll system written in Solidity. It uses an FHEVM (Fully Homomorphic Encryption on EVM) library to store encrypted payment amounts on-chain while allowing controlled decryption via the FHE primitives. The contract supports single and batch encrypted payments, a simple claim flow, and read APIs to list and inspect payments.

This project is ideal for teams experimenting with confidential payments and public verifiability using on-chain FHE tooling.



Features

Send encrypted payments to recipients (single or batch).

Store payment metadata (sender, timestamp, memo) on-chain.

Allow decryption for sender, recipient, and — as implemented — public decryption.

Query utilities to list payments, unclaimed payments, and retrieve encrypted amounts.

Simple claim mechanism for recipients to acknowledge receipt.



Security & Privacy Considerations

> ⚠️ Critical: the shipped contract calls FHE.allowThis(...), which makes the encrypted amount publicly decryptable by anyone. If you intend amounts to remain private except to recipient and sender, remove the FHE.allowThis(...) call and only use FHE.allow(..., recipient) / FHE.allow(..., sender) appropriately.



Other important notes:

The contract stores non-encrypted metadata (sender address, memo, timestamp) on-chain — this is public by design.

Memos are limited to 100 bytes to reduce gas and discourage large on-chain text.

There is no on-chain currency transfer in this contract — it only stores encrypted amounts and metadata. If you plan to transfer Ether or tokens, implement safe-transfer patterns and consider reentrancy and balance accounting.

Be careful when allowing public decryption in production — this undermines confidentiality.



Contract Summary

Contract: EncryptedPayroll (inherits SepoliaConfig from the FHE library set)

Key Structs & State

struct Payment — holds id, sender, recipient, euint32 encryptedAmount, timestamp, claimed, memo.

mapping(address => mapping(uint256 => Payment)) public payments — payments indexed by recipient and payment id.

mapping(address => uint256) public recipientPaymentCount — number of payments for each recipient.

mapping(address => uint256) public senderPaymentCount — number of payments sent by each sender.

uint256 public totalPayments — global counter.


Events

PaymentSent(address indexed sender, address indexed recipient, uint256 indexed paymentId, uint256 timestamp, string memo)

PaymentClaimed(address indexed recipient, uint256 indexed paymentId, uint256 timestamp)

PaymentRevoked(address indexed sender, uint256 indexed paymentId, uint256 timestamp) (declared but note: revoke implementation not present in example — implement with care if needed)


Public Functions

sendPayment(address recipient, externalEuint32 encryptedAmount, bytes calldata inputProof, string calldata memo)

Imports encrypted amount using FHE.fromExternal(...), stores a Payment, calls FHE.allowThis(...), FHE.allow(..., recipient), and FHE.allow(..., sender), then emits PaymentSent.


batchSendPayments(address[] calldata recipients, externalEuint32[] calldata encryptedAmounts, bytes[] calldata inputProofs, string[] calldata memos)

Processes up to 50 recipients in a single call, mirroring sendPayment logic per-recipient.


claimPayment(uint256 paymentId) — recipient marks a payment claimed.

getPaymentAmount(address recipient, uint256 paymentId) external view returns (bytes32 encryptedAmount) — returns the raw 32-byte representation of the encrypted value via FHE.toBytes32(...).

getPaymentInfo(address recipient, uint256 paymentId) external view returns (address sender, uint256 timestamp, bool claimed, string memory memo) — returns non-encrypted metadata.

getRecipientPayments(address recipient) external view returns (uint256[] memory paymentIds, uint256 unclaimedCount)

getUnclaimedPayments(address recipient) external view returns (uint256[] memory unclaimedIds)

getPaymentCount(address recipient) external view returns (uint256 count)

paymentExists(address recipient, uint256 paymentId) external view returns (bool exists)

getSenderPaymentCount(address sender) external view returns (uint256 count)



Example Usage (ethers.js)

Below are minimal examples showing how to call and read the contract. These examples omit the FHE encryption steps — you must use the FHE toolchain to create externalEuint32 values and inputProof bytes.

// assume `provider` and `signer` from ethers
const contract = new ethers.Contract(address, abi, signer);

// Example: send a pre-encrypted amount (you must produce `encryptedAmount` + `inputProof` via the FHE toolchain)
await contract.sendPayment(
  recipientAddress,
  encryptedAmountExternal,
  inputProofBytes,
  "January Salary"
);

// Read encrypted bytes and display
const encryptedBytes = await contract.getPaymentAmount(recipientAddress, 0);
console.log('encrypted (bytes32):', encryptedBytes);

// Read payment info
const info = await contract.getPaymentInfo(recipientAddress, 0);
console.log(info);

> Note: Interacting with the FHE primitives requires the specific FHEVM tooling and helper libraries (the contract imports @fhevm/solidity/lib/FHE.sol). Follow the FHEVM docs and tooling to produce valid externalEuint32 values and their inputProofs.




Deployment

1. Install dependencies (Hardhat / Foundry / preferred toolchain)


2. Ensure the FHE library and ZamaConfig are available during compilation (the contract imports the FHE package).


3. Compile with solc >=0.8.24 and deploy as usual. If using Hardhat, add required compiler settings and network config.



Gas & optimization

Batch sending will increase gas linearly with recipients; limit batch size (example uses <= 50).

Storing strings and using FHE types may increase gas; test on a testnet (Sepolia or local) first.


Testing

Unit test the happy paths: sendPayment, batchSendPayments, claimPayment, and all getters.

Test edge cases: long memos, zero-address recipients, duplicate IDs, batch length mismatches.

Security tests: ensure FHE.allowThis(...) is intentionally used and documented — add tests that assert whether getPaymentAmount returns the expected bytes when using the FHE decoding off-chain.



Notes on FHE Integration

The contract leverages FHE.fromExternal(...) to import encrypted inputs and FHE.toBytes32(...) to expose encrypted data.

FHE.allow(...) controls who can decrypt; FHE.allowThis(...) makes the ciphertext publicly decryptable.

You must follow the FHEVM project docs to produce valid external ciphertexts and proofs. The contract doesn’t perform on-chain decryption — decryption happens off-chain with the appropriate private FHE keys and tooling.



Contributing

Contributions are welcome:

Open issues describing bugs or feature requests.

PRs for improvements, tests, gas optimizations, and better FHE developer ergonomics.



License

This repository is released under the BSD-3-Clause-Clear license (see SPDX identifier at top of the contract).
