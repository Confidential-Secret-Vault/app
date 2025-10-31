import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  Loader2,
  Send,
  Eye,
  DollarSign,
  Users,
  RefreshCw,
  Wallet,
  Shield,
  AlertCircle,
  Clock,
  CheckCircle,
} from "lucide-react";
import { createEncryptedInput, decryptValue } from "../lib/fhevm";

// Contract Configuration
const PAYROLL_CONTRACT_ADDRESS = "0xC86762bC822254eA7c1D9156f17B7010131967E2";
const PAYROLL_CONTRACT_ABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "paymentId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "PaymentClaimed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "paymentId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "PaymentRevoked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "paymentId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "memo",
        type: "string",
      },
    ],
    name: "PaymentSent",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "recipients",
        type: "address[]",
      },
      {
        internalType: "externalEuint32[]",
        name: "encryptedAmounts",
        type: "bytes32[]",
      },
      {
        internalType: "bytes[]",
        name: "inputProofs",
        type: "bytes[]",
      },
      {
        internalType: "string[]",
        name: "memos",
        type: "string[]",
      },
    ],
    name: "batchSendPayments",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "paymentId",
        type: "uint256",
      },
    ],
    name: "claimPayment",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "paymentId",
        type: "uint256",
      },
    ],
    name: "getPaymentAmount",
    outputs: [
      {
        internalType: "bytes32",
        name: "encryptedAmount",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
    ],
    name: "getPaymentCount",
    outputs: [
      {
        internalType: "uint256",
        name: "count",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "paymentId",
        type: "uint256",
      },
    ],
    name: "getPaymentInfo",
    outputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "claimed",
        type: "bool",
      },
      {
        internalType: "string",
        name: "memo",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
    ],
    name: "getRecipientPayments",
    outputs: [
      {
        internalType: "uint256[]",
        name: "paymentIds",
        type: "uint256[]",
      },
      {
        internalType: "uint256",
        name: "unclaimedCount",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "getSenderPaymentCount",
    outputs: [
      {
        internalType: "uint256",
        name: "count",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
    ],
    name: "getUnclaimedPayments",
    outputs: [
      {
        internalType: "uint256[]",
        name: "unclaimedIds",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "paymentId",
        type: "uint256",
      },
    ],
    name: "paymentExists",
    outputs: [
      {
        internalType: "bool",
        name: "exists",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "payments",
    outputs: [
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "euint32",
        name: "encryptedAmount",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "claimed",
        type: "bool",
      },
      {
        internalType: "string",
        name: "memo",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "protocolId",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "recipientPaymentCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "externalEuint32",
        name: "encryptedAmount",
        type: "bytes32",
      },
      {
        internalType: "bytes",
        name: "inputProof",
        type: "bytes",
      },
      {
        internalType: "string",
        name: "memo",
        type: "string",
      },
    ],
    name: "sendPayment",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "senderPaymentCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalPayments",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export default function EncryptedPayrollUI({ account, isConnected }) {
  const [activeTab, setActiveTab] = useState("send");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  // Contract state
  const [totalPayments, setTotalPayments] = useState(0);
  const [myReceivedPayments, setMyReceivedPayments] = useState([]);
  const [mySentPayments, setSentPaymentsCount] = useState(0);

  // Loading states
  const [isSending, setIsSending] = useState(false);
  const [isBatchSending, setIsBatchSending] = useState(false);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(null);
  const [isClaiming, setIsClaiming] = useState(null);

  // Form states - Single Send
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");

  // Form states - Batch Send
  const [batchRecipients, setBatchRecipients] = useState([
    { address: "", amount: "", memo: "" },
  ]);

  // View Payment
  const [viewRecipient, setViewRecipient] = useState("");
  const [viewPaymentId, setViewPaymentId] = useState("");
  const [viewedPayment, setViewedPayment] = useState(null);

  const showMessage = (msg, type = "info") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 5000);
  };

  const tabs = [
    { id: "send", label: "Send Payment", icon: Send },
    { id: "batch", label: "Batch Send", icon: Users },
    { id: "received", label: "My Payments", icon: DollarSign },
    { id: "view", label: "View Payment", icon: Eye },
  ];

  // Load Contract Data
  const loadContractData = useCallback(async () => {
    if (!isConnected) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        PAYROLL_CONTRACT_ADDRESS,
        PAYROLL_CONTRACT_ABI,
        signer
      );

      const [total, sent] = await Promise.all([
        contract.totalPayments(),
        contract.senderPaymentCount(account),
      ]);

      setTotalPayments(Number(total));
      setSentPaymentsCount(Number(sent));
    } catch (error) {
      console.error("Error loading contract data:", error);
      showMessage("❌ Error loading contract data", "error");
    }
  }, [isConnected, account]);

  // Load My Received Payments
  const loadMyPayments = async () => {
    if (!isConnected) return;
    setIsLoadingPayments(true);
    showMessage("📥 Loading your payments...", "info");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        PAYROLL_CONTRACT_ADDRESS,
        PAYROLL_CONTRACT_ABI,
        signer
      );

      // Get all payment IDs for the current user
      const [paymentIds] = await contract.getRecipientPayments(account);
      console.log("Payment IDs:", paymentIds);

      const result = [];
      for (let id of paymentIds) {
        try {
          const [sender, timestamp, claimed, memo] =
            await contract.getPaymentInfo(account, Number(id));

          result.push({
            id: Number(id),
            sender,
            timestamp: Number(timestamp),
            claimed,
            memo,
            decryptedAmount: null,
          });
        } catch (error) {
          console.error(`Error loading payment ${id}:`, error);
        }
      }

      console.log("Loaded payments:", result);
      setMyReceivedPayments(result);
      showMessage(
        result.length > 0
          ? `✅ Loaded ${result.length} payment${result.length > 1 ? "s" : ""}`
          : "📭 No payments received yet",
        "success"
      );
    } catch (error) {
      console.error("Error loading payments:", error);
      showMessage("❌ Failed to load payments: " + error.message, "error");
    } finally {
      setIsLoadingPayments(false);
    }
  };

  // Send Single Payment
  const sendPayment = async () => {
    if (!recipient || !amount || !memo) {
      showMessage("⚠️ Please fill in all fields", "warning");
      return;
    }

    // Validate recipient address
    if (!ethers.isAddress(recipient)) {
      showMessage("⚠️ Invalid recipient address", "warning");
      return;
    }

    if (recipient.toLowerCase() === account.toLowerCase()) {
      showMessage("⚠️ Cannot send payment to yourself", "warning");
      return;
    }

    setIsSending(true);
    showMessage("🔐 Encrypting and sending payment...", "info");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        PAYROLL_CONTRACT_ADDRESS,
        PAYROLL_CONTRACT_ABI,
        signer
      );

      // Create encrypted input
      const encrypted = await createEncryptedInput(
        PAYROLL_CONTRACT_ADDRESS,
        account,
        parseInt(amount)
      );

      // Send transaction
      const tx = await contract.sendPayment(
        recipient,
        encrypted.encryptedData,
        encrypted.proof,
        memo
      );

      showMessage(
        "⏳ Transaction submitted, waiting for confirmation...",
        "info"
      );
      await tx.wait();

      showMessage(`✅ Payment sent successfully! Tx: ${tx.hash}`, "success");
      setRecipient("");
      setAmount("");
      setMemo("");

      // Reload data
      await loadContractData();
    } catch (error) {
      console.error("Error sending payment:", error);
      showMessage("❌ Failed to send payment: " + error.message, "error");
    } finally {
      setIsSending(false);
    }
  };

  // Batch Send Payments
  const batchSendPayments = async () => {
    const validRecipients = batchRecipients.filter(
      (r) => r.address && r.amount && r.memo
    );

    if (validRecipients.length === 0) {
      showMessage("⚠️ Please add at least one valid recipient", "warning");
      return;
    }

    // Validate all addresses
    for (let r of validRecipients) {
      if (!ethers.isAddress(r.address)) {
        showMessage(`⚠️ Invalid address: ${r.address}`, "warning");
        return;
      }
      if (r.address.toLowerCase() === account.toLowerCase()) {
        showMessage("⚠️ Cannot send payment to yourself", "warning");
        return;
      }
    }

    setIsBatchSending(true);
    showMessage(
      `🔐 Encrypting and sending ${validRecipients.length} payments...`,
      "info"
    );

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        PAYROLL_CONTRACT_ADDRESS,
        PAYROLL_CONTRACT_ABI,
        signer
      );

      // Prepare arrays
      const addresses = [];
      const encryptedAmounts = [];
      const proofs = [];
      const memos = [];

      // Encrypt each amount
      for (let r of validRecipients) {
        const encrypted = await createEncryptedInput(
          PAYROLL_CONTRACT_ADDRESS,
          account,
          parseInt(r.amount)
        );

        addresses.push(r.address);
        encryptedAmounts.push(encrypted.encryptedData);
        proofs.push(encrypted.proof);
        memos.push(r.memo);
      }

      // Send batch transaction
      const tx = await contract.batchSendPayments(
        addresses,
        encryptedAmounts,
        proofs,
        memos
      );

      showMessage(
        "⏳ Transaction submitted, waiting for confirmation...",
        "info"
      );
      await tx.wait();

      showMessage(
        `✅ Batch sent ${validRecipients.length} payments successfully! Tx: ${tx.hash}`,
        "success"
      );
      setBatchRecipients([{ address: "", amount: "", memo: "" }]);

      // Reload data
      await loadContractData();
    } catch (error) {
      console.error("Error batch sending:", error);
      showMessage("❌ Failed to batch send: " + error.message, "error");
    } finally {
      setIsBatchSending(false);
    }
  };

  // Add Batch Recipient
  const addBatchRecipient = () => {
    if (batchRecipients.length >= 50) {
      showMessage("⚠️ Maximum 50 recipients allowed", "warning");
      return;
    }
    setBatchRecipients([
      ...batchRecipients,
      { address: "", amount: "", memo: "" },
    ]);
  };

  // Remove Batch Recipient
  const removeBatchRecipient = (index) => {
    if (batchRecipients.length === 1) return;
    setBatchRecipients(batchRecipients.filter((_, i) => i !== index));
  };

  // Update Batch Recipient
  const updateBatchRecipient = (index, field, value) => {
    const updated = [...batchRecipients];
    updated[index][field] = value;
    setBatchRecipients(updated);
  };

  // View Payment Details
  const viewPaymentDetails = async () => {
    if (!viewRecipient || viewPaymentId === "") {
      showMessage(
        "⚠️ Please enter recipient address and payment ID",
        "warning"
      );
      return;
    }

    if (!ethers.isAddress(viewRecipient)) {
      showMessage("⚠️ Invalid recipient address", "warning");
      return;
    }

    showMessage("🔍 Fetching payment details...", "info");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        PAYROLL_CONTRACT_ADDRESS,
        PAYROLL_CONTRACT_ABI,
        signer
      );

      // Check if payment exists
      const exists = await contract.paymentExists(
        viewRecipient,
        parseInt(viewPaymentId)
      );

      if (!exists) {
        showMessage(
          `❌ Payment #${viewPaymentId} does not exist for this recipient`,
          "error"
        );
        setViewedPayment(null);
        return;
      }

      // Get payment info
      const [sender, timestamp, claimed, memo] = await contract.getPaymentInfo(
        viewRecipient,
        parseInt(viewPaymentId)
      );

      setViewedPayment({
        id: parseInt(viewPaymentId),
        sender,
        timestamp: Number(timestamp),
        claimed,
        memo,
        decryptedAmount: null,
      });

      showMessage("✅ Payment details retrieved", "success");
    } catch (error) {
      console.error("Error viewing payment:", error);
      showMessage("❌ Failed to view payment: " + error.message, "error");
      setViewedPayment(null);
    }
  };

  // Decrypt Payment Amount from List
  const decryptPayment = async (paymentId) => {
    setIsDecrypting(paymentId);
    showMessage(`🔓 Decrypting payment #${paymentId}...`, "info");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        PAYROLL_CONTRACT_ADDRESS,
        PAYROLL_CONTRACT_ABI,
        signer
      );

      // Get encrypted amount
      const encryptedData = await contract.getPaymentAmount(account, paymentId);

      // Decrypt using FHEVM
      const decrypted = await decryptValue(
        encryptedData,
        PAYROLL_CONTRACT_ADDRESS,
        signer
      );

      setMyReceivedPayments((prev) =>
        prev.map((p) =>
          p.id === paymentId ? { ...p, decryptedAmount: decrypted } : p
        )
      );
      showMessage(`✅ Payment #${paymentId} decrypted`, "success");
    } catch (error) {
      console.error("Error decrypting:", error);
      showMessage("❌ Failed to decrypt payment: " + error.message, "error");
    } finally {
      setIsDecrypting(null);
    }
  };

  // Decrypt Viewed Payment
  const decryptViewedPayment = async () => {
    if (!viewedPayment) return;

    setIsDecrypting("viewed");
    showMessage("🔓 Decrypting payment...", "info");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        PAYROLL_CONTRACT_ADDRESS,
        PAYROLL_CONTRACT_ABI,
        signer
      );

      // Get encrypted amount
      const encryptedData = await contract.getPaymentAmount(
        viewRecipient,
        viewedPayment.id
      );

      // Decrypt using FHEVM
      const decrypted = await decryptValue(
        encryptedData,
        PAYROLL_CONTRACT_ADDRESS,
        signer
      );

      setViewedPayment((prev) => ({ ...prev, decryptedAmount: decrypted }));
      showMessage("✅ Payment decrypted", "success");
    } catch (error) {
      console.error("Error decrypting:", error);
      showMessage("❌ Failed to decrypt payment: " + error.message, "error");
    } finally {
      setIsDecrypting(null);
    }
  };

  // Claim Payment
  const claimPayment = async (paymentId) => {
    setIsClaiming(paymentId);
    showMessage("✅ Claiming payment...", "info");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        PAYROLL_CONTRACT_ADDRESS,
        PAYROLL_CONTRACT_ABI,
        signer
      );

      const tx = await contract.claimPayment(paymentId);

      showMessage(
        "⏳ Transaction submitted, waiting for confirmation...",
        "info"
      );
      await tx.wait();

      setMyReceivedPayments((prev) =>
        prev.map((p) => (p.id === paymentId ? { ...p, claimed: true } : p))
      );
      showMessage(
        `✅ Payment #${paymentId} claimed! Tx: ${tx.hash}`,
        "success"
      );
    } catch (error) {
      console.error("Error claiming:", error);
      showMessage("❌ Failed to claim payment: " + error.message, "error");
    } finally {
      setIsClaiming(null);
    }
  };

  useEffect(() => {
    if (isConnected) {
      loadContractData();
      loadMyPayments();
    }
  }, [isConnected, loadContractData]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <DollarSign className="w-12 h-12 text-black" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Encrypted Payroll</h1>
          <p className="text-zinc-400 mb-8">FHE-Powered Payment System</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-400 to-emerald-500 text-black">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-green-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Encrypted Payroll</h1>
                <p className="text-sm opacity-80">FHE-Powered Payment System</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-80">Connected</p>
              <p className="font-mono text-sm font-semibold">
                {account.slice(0, 6)}...{account.slice(-4)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-xs text-zinc-500 mb-1">Total Payments</p>
              <p className="text-2xl font-bold text-green-400">
                {totalPayments}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-zinc-500 mb-1">Payments Sent</p>
              <p className="text-2xl font-bold text-green-400">
                {mySentPayments}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-zinc-500 mb-1">Received</p>
              <p className="text-2xl font-bold text-green-400">
                {myReceivedPayments.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`${
            messageType === "success"
              ? "bg-green-500/20 border-green-500"
              : messageType === "error"
              ? "bg-red-500/20 border-red-500"
              : messageType === "warning"
              ? "bg-yellow-500/20 border-yellow-400"
              : "bg-blue-500/20 border-blue-500"
          } border-b`}
        >
          <div className="max-w-7xl mx-auto px-6 py-3">
            <p className="text-sm text-center">{message}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setViewedPayment(null);
                }}
                className={`p-4 rounded-lg border-2 transition-all font-semibold ${
                  activeTab === tab.id
                    ? "bg-green-400 text-black border-green-400"
                    : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <Icon className="w-5 h-5 mx-auto mb-2" />
                <p className="text-xs">{tab.label}</p>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            {/* Send Payment */}
            {activeTab === "send" && (
              <div className="bg-zinc-900 border-2 border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-green-400 rounded-lg flex items-center justify-center">
                    <Send className="w-6 h-6 text-black" />
                  </div>
                  <h2 className="text-2xl font-bold">Send Encrypted Payment</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-400 mb-2">
                      Recipient Address
                    </label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      className="w-full p-4 bg-black border-2 border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:border-green-400 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-zinc-400 mb-2">
                      Amount (will be encrypted)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 1000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full p-4 bg-black border-2 border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:border-green-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-zinc-400 mb-2">
                      Memo (max 100 characters)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., January Salary"
                      maxLength={100}
                      value={memo}
                      onChange={(e) => setMemo(e.target.value)}
                      className="w-full p-4 bg-black border-2 border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:border-green-400 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={sendPayment}
                    disabled={isSending}
                    className="w-full py-4 bg-green-400 text-black rounded-lg font-bold hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Payment
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Batch Send */}
            {activeTab === "batch" && (
              <div className="bg-zinc-900 border-2 border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-green-400 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-black" />
                  </div>
                  <h2 className="text-2xl font-bold">Batch Send Payments</h2>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {batchRecipients.map((recipient, index) => (
                    <div
                      key={index}
                      className="bg-black border-2 border-zinc-800 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-green-400">
                          Recipient #{index + 1}
                        </span>
                        {batchRecipients.length > 1 && (
                          <button
                            onClick={() => removeBatchRecipient(index)}
                            className="text-red-400 hover:text-red-300 text-xs font-semibold"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Address (0x...)"
                          value={recipient.address}
                          onChange={(e) =>
                            updateBatchRecipient(
                              index,
                              "address",
                              e.target.value
                            )
                          }
                          className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded text-white placeholder-zinc-600 focus:border-green-400 focus:outline-none font-mono text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Amount"
                          value={recipient.amount}
                          onChange={(e) =>
                            updateBatchRecipient(
                              index,
                              "amount",
                              e.target.value
                            )
                          }
                          className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded text-white placeholder-zinc-600 focus:border-green-400 focus:outline-none text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Memo"
                          maxLength={100}
                          value={recipient.memo}
                          onChange={(e) =>
                            updateBatchRecipient(index, "memo", e.target.value)
                          }
                          className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded text-white placeholder-zinc-600 focus:border-green-400 focus:outline-none text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={addBatchRecipient}
                    disabled={batchRecipients.length >= 50}
                    className="flex-1 py-3 bg-zinc-800 text-white rounded-lg font-semibold hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    + Add Recipient
                  </button>
                  <button
                    onClick={batchSendPayments}
                    disabled={isBatchSending}
                    className="flex-1 py-3 bg-green-400 text-black rounded-lg font-bold hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {isBatchSending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Batch Send
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-zinc-500 text-center mt-3">
                  Max 50 recipients • All amounts will be encrypted
                </p>
              </div>
            )}

            {/* My Payments */}
            {activeTab === "received" && (
              <div className="bg-zinc-900 border-2 border-zinc-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-400 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-black" />
                    </div>
                    <h2 className="text-2xl font-bold">My Received Payments</h2>
                  </div>
                  <button
                    onClick={loadMyPayments}
                    disabled={isLoadingPayments}
                    className="px-4 py-2 bg-green-400 text-black rounded-lg font-semibold hover:bg-green-500 disabled:opacity-50 flex items-center gap-2"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${
                        isLoadingPayments ? "animate-spin" : ""
                      }`}
                    />
                    Refresh
                  </button>
                </div>

                {isLoadingPayments ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-400" />
                    <p className="text-zinc-400">Loading payments...</p>
                  </div>
                ) : myReceivedPayments.length > 0 ? (
                  <div className="space-y-4">
                    {myReceivedPayments.map((payment) => (
                      <div
                        key={payment.id}
                        className="bg-black border-2 border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-all"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-bold text-lg flex items-center gap-2">
                              <Wallet className="w-4 h-4 text-green-400" />
                              {payment.memo}
                            </h3>
                            <p className="text-xs text-zinc-500 mt-1">
                              From: {payment.sender} • ID: {payment.id}
                            </p>
                            <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              {new Date(
                                payment.timestamp * 1000
                              ).toLocaleString()}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 border rounded-full text-xs font-semibold ${
                              payment.claimed
                                ? "bg-green-400/10 border-green-400/30 text-green-400"
                                : "bg-yellow-400/10 border-yellow-400/30 text-yellow-400"
                            }`}
                          >
                            {payment.claimed ? "Claimed" : "Unclaimed"}
                          </span>
                        </div>

                        {payment.decryptedAmount !== null ? (
                          <div className="mb-3 p-4 bg-green-400/10 border border-green-400/30 rounded-lg">
                            <p className="text-xs text-zinc-400 mb-2">
                              Decrypted Amount:
                            </p>
                            <p className="text-3xl font-bold text-green-400 font-mono">
                              {payment.decryptedAmount}
                            </p>
                          </div>
                        ) : (
                          <div className="mb-3 p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                            <p className="text-sm text-zinc-500 text-center">
                              🔐 Click decrypt to reveal amount
                            </p>
                          </div>
                        )}

                        <div className="flex gap-3">
                          <button
                            onClick={() => decryptPayment(payment.id)}
                            disabled={isDecrypting === payment.id}
                            className="flex-1 py-3 bg-green-400 text-black rounded-lg font-semibold hover:bg-green-500 disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {isDecrypting === payment.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Decrypting...
                              </>
                            ) : payment.decryptedAmount !== null ? (
                              <>
                                <Eye className="w-4 h-4" />
                                Decrypted
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4" />
                                Decrypt
                              </>
                            )}
                          </button>
                          {!payment.claimed && (
                            <button
                              onClick={() => claimPayment(payment.id)}
                              disabled={isClaiming === payment.id}
                              className="px-6 py-3 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {isClaiming === payment.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  Claim
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <DollarSign className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
                    <p className="text-zinc-400 mb-2">
                      No payments received yet
                    </p>
                    <p className="text-sm text-zinc-600">
                      Payments sent to you will appear here
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* View Payment */}
            {activeTab === "view" && (
              <div className="bg-zinc-900 border-2 border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-green-400 rounded-lg flex items-center justify-center">
                    <Eye className="w-6 h-6 text-black" />
                  </div>
                  <h2 className="text-2xl font-bold">View Any Payment</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-400 mb-2">
                      Recipient Address
                    </label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={viewRecipient}
                      onChange={(e) => setViewRecipient(e.target.value)}
                      className="w-full p-4 bg-black border-2 border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:border-green-400 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-zinc-400 mb-2">
                      Payment ID
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 0"
                      value={viewPaymentId}
                      onChange={(e) => setViewPaymentId(e.target.value)}
                      className="w-full p-4 bg-black border-2 border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:border-green-400 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={viewPaymentDetails}
                    className="w-full py-4 bg-green-400 text-black rounded-lg font-bold hover:bg-green-500 transition-all flex items-center justify-center gap-2"
                  >
                    <Eye className="w-5 h-5" />
                    View Payment
                  </button>

                  {viewedPayment && (
                    <div className="mt-6 bg-black border-2 border-zinc-800 rounded-lg p-5">
                      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-green-400" />
                        {viewedPayment.memo}
                      </h3>
                      <div className="space-y-3 text-sm mb-4">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Sender:</span>
                          <span className="text-white font-mono">
                            {viewedPayment.sender}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Payment ID:</span>
                          <span className="text-white font-mono">
                            {viewPaymentId}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Sent:</span>
                          <span className="text-white">
                            {new Date(
                              viewedPayment.timestamp * 1000
                            ).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Status:</span>
                          <span
                            className={`px-2 py-1 border rounded text-xs ${
                              viewedPayment.claimed
                                ? "bg-green-400/20 border-green-400/30 text-green-400"
                                : "bg-yellow-400/20 border-yellow-400/30 text-yellow-400"
                            }`}
                          >
                            {viewedPayment.claimed ? "Claimed" : "Unclaimed"}
                          </span>
                        </div>
                      </div>

                      {viewedPayment.decryptedAmount !== null ? (
                        <div className="p-4 bg-green-400/10 border border-green-400/30 rounded-lg mb-3">
                          <p className="text-xs text-zinc-400 mb-2">
                            Decrypted Amount:
                          </p>
                          <p className="text-3xl font-bold text-green-400 font-mono">
                            {viewedPayment.decryptedAmount}
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg mb-3">
                          <p className="text-sm text-zinc-500 text-center">
                            🔐 Click decrypt to reveal amount (publicly
                            viewable)
                          </p>
                        </div>
                      )}

                      <button
                        onClick={decryptViewedPayment}
                        disabled={isDecrypting === "viewed"}
                        className="w-full py-3 bg-green-400 text-black rounded-lg font-semibold hover:bg-green-500 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isDecrypting === "viewed" ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Decrypting...
                          </>
                        ) : viewedPayment.decryptedAmount !== null ? (
                          <>
                            <Eye className="w-4 h-4" />
                            Decrypted
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4" />
                            Decrypt (Public)
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contract Info */}
            <div className="bg-zinc-900 border-2 border-zinc-800 rounded-xl p-5">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-green-400">
                <Shield className="w-5 h-5" />
                Contract Info
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-zinc-500 text-xs mb-1">Address</p>
                  <p className="font-mono text-xs break-all text-green-400">
                    {PAYROLL_CONTRACT_ADDRESS}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs mb-1">Network</p>
                  <p className="text-white">Zama Sepolia</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs mb-1">Encryption</p>
                  <p className="text-white">FHE (euint32)</p>
                </div>
              </div>
            </div>

            {/* Available Functions */}
            <div className="bg-zinc-900 border-2 border-zinc-800 rounded-xl p-5">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-green-400">
                <DollarSign className="w-5 h-5" />
                Available Functions
              </h3>
              <div className="space-y-2 text-sm">
                {[
                  "sendPayment()",
                  "batchSendPayments()",
                  "claimPayment()",
                  "getPaymentAmount()",
                  "getPaymentInfo()",
                  "getRecipientPayments()",
                  "getUnclaimedPayments()",
                  "paymentExists()",
                  "getPaymentCount()",
                  "getSenderPaymentCount()",
                ].map((func) => (
                  <div key={func} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                    <span className="text-zinc-400 font-mono text-xs">
                      {func}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-zinc-900 border-2 border-zinc-800 rounded-xl p-5">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-green-400">
                <AlertCircle className="w-5 h-5" />
                How It Works
              </h3>
              <div className="space-y-3 text-sm text-zinc-400">
                <div className="flex gap-3">
                  <span className="text-green-400 font-bold">1.</span>
                  <p>Amounts are encrypted using FHE before sending on-chain</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-green-400 font-bold">2.</span>
                  <p>Recipients receive payment notifications</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-green-400 font-bold">3.</span>
                  <p>
                    Anyone can decrypt amounts publicly (transparent payroll)
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="text-green-400 font-bold">4.</span>
                  <p>Recipients claim to acknowledge receipt</p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-2 border-green-500/30 rounded-xl p-5">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                Features
              </h3>
              <div className="space-y-2 text-sm text-zinc-300">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Encrypted amount storage</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Public decryption by anyone</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Batch payment support</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Payment claiming system</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Custom memo notes</span>
                </div>
              </div>
            </div>

            {/* Security Note */}
            <div className="bg-yellow-500/10 border-2 border-yellow-500/30 rounded-xl p-5">
              <h3 className="font-bold mb-3 flex items-center gap-2 text-yellow-400">
                <AlertCircle className="w-5 h-5" />
                Public Decryption
              </h3>
              <p className="text-xs text-zinc-400">
                This system allows anyone to decrypt payment amounts publicly.
                Perfect for transparent payroll systems where amounts should be
                viewable by all parties.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-800 bg-zinc-900 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center text-zinc-600 text-sm">
          <p className="mb-2">
            Powered by Zama fhEVM • Fully Homomorphic Encryption
          </p>
          <p className="font-mono text-xs">{PAYROLL_CONTRACT_ADDRESS}</p>
          <p className="text-xs mt-3 text-zinc-500">
            Testnet Demo • Never send real funds on testnets
          </p>
        </div>
      </div>
    </div>
  );
}
