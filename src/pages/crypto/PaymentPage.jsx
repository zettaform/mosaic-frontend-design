import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Copy, 
  Check, 
  Download, 
  Bitcoin, 
  Shield, 
  Clock, 
  Zap, 
  Globe, 
  Lock,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Timer,
  Wallet,
  CreditCard,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import paymentLinksService from '../../services/paymentLinksService';

// Animated Bitcoin Background
const BitcoinParticles = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-amber-500/5"
          initial={{ 
            x: Math.random() * window.innerWidth,
            y: window.innerHeight + 100,
            rotate: 0,
            scale: 0.5 + Math.random() * 0.5
          }}
          animate={{ 
            y: -100,
            rotate: 360,
            scale: [0.5 + Math.random() * 0.5, 0.8 + Math.random() * 0.4, 0.5 + Math.random() * 0.5]
          }}
          transition={{ 
            duration: 20 + Math.random() * 15,
            repeat: Infinity,
            delay: i * 2.5,
            ease: "linear"
          }}
        >
          <Bitcoin className="w-16 h-16 md:w-24 md:h-24" />
        </motion.div>
      ))}
    </div>
  );
};

// Premium Header Component
const EnterpriseHeader = ({ onBack }) => {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="bg-gradient-to-r from-slate-950/95 via-slate-900/95 to-slate-950/95 backdrop-blur-xl border-b border-amber-500/10">
        {/* Top announcement bar */}
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 py-1.5">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-amber-400">
              <Shield className="w-3.5 h-3.5" />
              <span className="font-medium">256-bit Encryption</span>
            </div>
            <span className="text-slate-600">•</span>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Lock className="w-3.5 h-3.5" />
              <span className="font-medium">Verified Secure</span>
            </div>
            <span className="text-slate-600 hidden sm:block">•</span>
            <div className="hidden sm:flex items-center gap-1.5 text-blue-400">
              <Globe className="w-3.5 h-3.5" />
              <span className="font-medium">Global Network</span>
            </div>
          </div>
        </div>

        {/* Main header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.02 }}
            >
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Bitcoin className="w-6 h-6 text-white" />
                </div>
                <motion.div
                  className="absolute -inset-1 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl opacity-30 blur-sm"
                  animate={{ opacity: [0.2, 0.4, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text text-transparent">
                  BitPay Gateway
                </h1>
                <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">
                  Enterprise Payment Solutions
                </p>
              </div>
            </motion.div>

            {/* Center - Security Badge */}
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-full border border-slate-700/50">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs text-slate-400 font-medium">Secure Connection Active</span>
            </div>

            {/* Back Button */}
            <motion.button
              onClick={onBack}
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 rounded-xl border border-slate-700/50 hover:border-amber-500/30 transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

// Premium Footer Component
const EnterpriseFooter = ({ paymentId }) => {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="relative z-10 mt-16"
    >
      {/* Trust Indicators */}
      <div className="border-t border-slate-800/50 bg-gradient-to-b from-slate-900/50 to-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Trust Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <motion.div 
              whileHover={{ y: -2 }}
              className="flex flex-col items-center text-center p-4 rounded-2xl bg-slate-800/30 border border-slate-700/30"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center mb-3">
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="text-xs font-semibold text-white mb-1">Bank-Level Security</span>
              <span className="text-[10px] text-slate-500">256-bit SSL Encryption</span>
            </motion.div>

            <motion.div 
              whileHover={{ y: -2 }}
              className="flex flex-col items-center text-center p-4 rounded-2xl bg-slate-800/30 border border-slate-700/30"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center mb-3">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-xs font-semibold text-white mb-1">Instant Processing</span>
              <span className="text-[10px] text-slate-500">Real-time Verification</span>
            </motion.div>

            <motion.div 
              whileHover={{ y: -2 }}
              className="flex flex-col items-center text-center p-4 rounded-2xl bg-slate-800/30 border border-slate-700/30"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center mb-3">
                <Globe className="w-6 h-6 text-amber-400" />
              </div>
              <span className="text-xs font-semibold text-white mb-1">Global Network</span>
              <span className="text-[10px] text-slate-500">180+ Countries</span>
            </motion.div>

            <motion.div 
              whileHover={{ y: -2 }}
              className="flex flex-col items-center text-center p-4 rounded-2xl bg-slate-800/30 border border-slate-700/30"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center mb-3">
                <Lock className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-xs font-semibold text-white mb-1">Fully Compliant</span>
              <span className="text-[10px] text-slate-500">Licensed & Regulated</span>
            </motion.div>
          </div>

          {/* Payment ID & Links */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                <Bitcoin className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">BitPay Gateway</p>
                <p className="text-[10px] text-slate-500">Trusted by 500,000+ businesses worldwide</p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-[11px] text-slate-500">
              <a href="#" className="hover:text-amber-400 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-amber-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-amber-400 transition-colors">Support</a>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <span className="text-[10px] text-slate-500">Transaction ID:</span>
              <code className="text-[10px] text-amber-400 font-mono">{paymentId}</code>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center mt-6 pt-4 border-t border-slate-800/30">
            <p className="text-[10px] text-slate-600">
              © {new Date().getFullYear()} BitPay Gateway. All rights reserved. Blockchain-powered secure payments.
            </p>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

// Loading Component
const LoadingSpinner = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex flex-col items-center justify-center py-16"
  >
    <div className="relative">
      <div className="w-16 h-16 border-4 border-slate-700 border-t-amber-500 rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Bitcoin className="w-6 h-6 text-amber-500" />
    </div>
    </div>
    <p className="mt-4 text-sm text-slate-400 font-medium">Loading payment details...</p>
  </motion.div>
);

/**
 * BTC QR Code Component - Kept clean as requested
 */
const BTCQRCode = ({ address, amount, size = 220 }) => {
  const qrRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const bitcoinURI = amount 
    ? `bitcoin:${address}?amount=${amount}` 
    : `bitcoin:${address}`;

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const handleDownloadQR = () => {
    try {
      const svgElement = qrRef.current?.querySelector('svg');
      if (!svgElement) return;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const img = new Image();
      
      canvas.width = size + 40;
      canvas.height = size + 40;

      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      img.onload = () => {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20, size, size);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `bitcoin-qr-${address.substring(0, 8)}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(downloadUrl);
            URL.revokeObjectURL(svgUrl);
            setDownloadSuccess(true);
            setTimeout(() => setDownloadSuccess(false), 2000);
          }
        }, 'image/png');
      };

      img.src = svgUrl;
    } catch (error) {
      console.error('Failed to download QR code:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-3xl border border-slate-700/50 p-6"
    >
      {/* QR Code Container */}
      <motion.div 
        ref={qrRef}
        className="relative mb-5 flex justify-center"
      >
        <div className="bg-white p-5 rounded-2xl shadow-2xl shadow-black/20">
          <QRCodeSVG
            value={bitcoinURI}
            size={size}
            level="M"
            includeMargin={false}
            bgColor="#FFFFFF"
            fgColor="#000000"
          />
          {/* Bitcoin Logo Overlay */}
          <motion.div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <motion.div 
              className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full flex items-center justify-center shadow-xl border-4 border-white"
              animate={{ 
                boxShadow: [
                  "0 0 20px rgba(251, 146, 60, 0.3)",
                  "0 0 40px rgba(251, 146, 60, 0.5)",
                  "0 0 20px rgba(251, 146, 60, 0.3)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Bitcoin className="w-6 h-6 text-white" />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Address Display */}
      <div className="mb-4">
        <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">
          Bitcoin Address
        </label>
        <div className="relative">
          <code className="block w-full p-3 pr-12 bg-slate-900/80 rounded-xl text-xs font-mono text-amber-400/90 break-all border border-slate-700/50">
            {address}
          </code>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopyAddress}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-amber-400 transition-colors bg-slate-800 hover:bg-slate-700 rounded-lg"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </motion.button>
        </div>
        <AnimatePresence>
        {copied && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs text-emerald-400 mt-2 flex items-center gap-1"
          >
              <Check className="w-3 h-3" /> Copied!
          </motion.p>
        )}
        </AnimatePresence>
      </div>

      {/* Download Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleDownloadQR}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-amber-500/20"
      >
        {downloadSuccess ? (
          <><Check className="w-4 h-4" /> Downloaded!</>
        ) : (
          <><Download className="w-4 h-4" /> Download QR as PNG</>
        )}
      </motion.button>
      </motion.div>
  );
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const config = {
    pending: { 
      bg: 'from-amber-500/20 to-yellow-500/20', 
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      icon: Timer,
      label: 'Awaiting Payment'
    },
    paid: { 
      bg: 'from-emerald-500/20 to-green-500/20', 
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      icon: CheckCircle2,
      label: 'Payment Complete'
    },
    expired: { 
      bg: 'from-red-500/20 to-rose-500/20', 
      border: 'border-red-500/30',
      text: 'text-red-400',
      icon: AlertCircle,
      label: 'Expired'
    },
    inactive: { 
      bg: 'from-slate-500/20 to-gray-500/20', 
      border: 'border-slate-500/30',
      text: 'text-slate-400',
      icon: AlertCircle,
      label: 'Inactive'
    }
  };
  
  const c = config[status] || config.pending;
  const Icon = c.icon;
  
  return (
        <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${c.bg} ${c.border} border`}
    >
      <Icon className={`w-4 h-4 ${c.text}`} />
      <span className={`text-sm font-semibold ${c.text}`}>{c.label}</span>
    </motion.div>
  );
};

// Payment Details Card
const PaymentDetailsCard = ({ paymentLink, paymentStatus, checkPaymentStatus, checkingPayment }) => {
  const isPaid = paymentStatus?.status === 'paid';
  const isExpired = new Date(paymentLink.expiresAt) < new Date();
  const isInactive = paymentLink.status !== 'active';

  // Calculate time remaining
  const getTimeRemaining = () => {
    const now = new Date();
    const expires = new Date(paymentLink.expiresAt);
    const diff = expires - now;
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-700/50 overflow-hidden"
    >
      {/* Card Header */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 px-6 py-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Payment Details</h2>
              <p className="text-xs text-slate-500">Secure Bitcoin Transaction</p>
            </div>
          </div>
          <StatusBadge status={paymentStatus?.status || 'pending'} />
        </div>
      </div>

      {/* Card Content */}
      <div className="p-6 space-y-5">
        {/* Amount Section */}
        <div className="bg-gradient-to-r from-amber-500/5 to-orange-500/5 rounded-2xl p-5 border border-amber-500/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Amount Due</span>
            <Wallet className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              {paymentLink.amount}
            </span>
            <span className="text-xl font-bold text-slate-400">{paymentLink.currency || 'BTC'}</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            ≈ ${(parseFloat(paymentLink.amount) * 96000).toLocaleString('en-US', { maximumFractionDigits: 2 })} USD
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Plan */}
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Plan</span>
            <p className="text-sm font-semibold text-white mt-1 truncate">{paymentLink.name || 'Standard'}</p>
          </div>

          {/* Time Remaining */}
          <div className={`rounded-xl p-4 border ${isExpired ? 'bg-red-500/10 border-red-500/20' : 'bg-slate-800/40 border-slate-700/30'}`}>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Time Left</span>
            <p className={`text-sm font-semibold mt-1 ${isExpired ? 'text-red-400' : 'text-white'}`}>
              {getTimeRemaining()}
            </p>
          </div>
        </div>

        {/* Description */}
        {paymentLink.description && (
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</span>
            <p className="text-sm text-slate-300 mt-1">{paymentLink.description}</p>
          </div>
        )}

        {/* Payment Progress */}
        {paymentStatus?.currentBalance !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Progress</span>
              <span className="text-white font-medium">
                {paymentStatus.currentBalance} / {paymentLink.amount} {paymentLink.currency}
              </span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((paymentStatus.currentBalance / paymentLink.amount) * 100, 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        {/* Action Button */}
        {!isPaid && !isExpired && !isInactive && (
      <motion.button
            onClick={checkPaymentStatus}
            disabled={checkingPayment}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white font-semibold rounded-xl transition-all duration-300 border border-slate-600/50 disabled:opacity-50"
      >
            {checkingPayment ? (
          <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Verifying Payment...
          </>
        ) : (
          <>
                <RefreshCw className="w-4 h-4" />
                Check Payment Status
          </>
        )}
      </motion.button>
        )}

        {/* Status Messages */}
        <AnimatePresence>
          {isPaid && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        </div>
                <div>
                  <p className="font-semibold text-emerald-400">Payment Confirmed!</p>
                  <p className="text-xs text-emerald-300/70">Your transaction has been verified on the blockchain.</p>
                </div>
              </div>
            </motion.div>
          )}

          {isExpired && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-red-500/10 to-rose-500/10 border border-red-500/20 rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <div>
                  <p className="font-semibold text-red-400">Payment Link Expired</p>
                  <p className="text-xs text-red-300/70">Please request a new payment link.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Payment Instructions Card
const InstructionsCard = () => {
  const steps = [
    { num: 1, text: "Scan the QR code or copy the Bitcoin address" },
    { num: 2, text: "Send the exact amount shown from your wallet" },
    { num: 3, text: "Wait for blockchain confirmation (10-30 min)" },
    { num: 4, text: "Payment will be detected automatically" }
  ];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-700/30 p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
          <Zap className="w-4 h-4 text-blue-400" />
        </div>
        <h3 className="font-bold text-white text-sm">Quick Instructions</h3>
      </div>

      <div className="space-y-3">
        {steps.map((step, i) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className="flex items-start gap-3"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">
              {step.num}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{step.text}</p>
          </motion.div>
        ))}
      </div>

      {/* Security Notice */}
      <div className="mt-5 pt-4 border-t border-slate-700/30">
        <div className="flex items-start gap-2">
          <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Your payment is protected by blockchain technology. All transactions are encrypted and verified on the Bitcoin network.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

// Main Payment Page Component
const PaymentPage = () => {
  const { linkId } = useParams();
  const navigate = useNavigate();
  const [paymentLink, setPaymentLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');

  useEffect(() => {
    document.title = 'Bitcoin Payment Gateway | Secure Crypto Payments';
  }, []);

  const loadPaymentLink = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await paymentLinksService.getPaymentLink(linkId);
      
      if (response.success) {
        setPaymentLink(response.data);
        
        if (new Date(response.data.expiresAt) < new Date()) {
          setPaymentStatus({ status: 'expired' });
        } else if (response.data.status !== 'active') {
          setPaymentStatus({ status: 'inactive' });
        } else {
          setPaymentStatus({ status: 'pending' });
        }
      } else {
        setError(response.error || 'Payment link not found');
      }
    } catch (error) {
      console.error('Error loading payment link:', error);
      setError('Failed to load payment link: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!paymentLink) return;
    
    try {
      setCheckingPayment(true);
      const response = await paymentLinksService.checkPaymentStatus(linkId);
      
      if (response.success) {
        const { isPaid, currentBalance, expectedAmount } = response.data;
        
        if (isPaid) {
          setPaymentStatus({ 
            status: 'paid',
            currentBalance,
            expectedAmount
          });
          
          if (paymentLink.redirectUrl) {
            setTimeout(() => {
              window.location.href = paymentLink.redirectUrl;
            }, 3000);
          }
        } else {
          setPaymentStatus({ 
            status: 'pending',
            currentBalance,
            expectedAmount
          });
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    } finally {
      setCheckingPayment(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopySuccess('Copied to clipboard!');
    setTimeout(() => setCopySuccess(''), 2000);
  };

  useEffect(() => {
    if (paymentLink && paymentStatus?.status === 'pending') {
      const interval = setInterval(checkPaymentStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [paymentLink, paymentStatus]);

  useEffect(() => {
    loadPaymentLink();
  }, [linkId]);

  const handleBack = () => navigate('/crypto/payment-links-luxury');

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <BitcoinParticles />
        <LoadingSpinner />
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <BitcoinParticles />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto px-6"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Payment Link Not Found</h1>
          <p className="text-slate-400 mb-8">{error}</p>
          <motion.button
            onClick={handleBack}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/20"
          >
            Back to Payment Links
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (!paymentLink) return null;

  return (
    <div 
      className="payment-page-wrapper bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: 9999
      }}
    >
      {/* Background Effects */}
      <BitcoinParticles />
      
      {/* Gradient Orbs */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>

      {/* Header */}
      <EnterpriseHeader onBack={handleBack} />

      {/* Main Content */}
      <main className="relative pt-36 pb-8 px-4 sm:px-6 lg:px-8" style={{ zIndex: 10, display: 'block' }}>
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
          <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-full border border-amber-500/20 mb-4"
            >
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-amber-400">Secure Payment Session Active</span>
            </motion.div>
            
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
              Complete Your Payment
            </h1>
            <p className="text-slate-400 max-w-lg mx-auto">
              Send Bitcoin to the address below. Your payment will be verified automatically on the blockchain.
            </p>
          </motion.div>

          {/* Copy Success Notification */}
          <AnimatePresence>
            {copySuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="fixed top-32 left-1/2 -translate-x-1/2 z-50 bg-emerald-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-xl shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  {copySuccess}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Payment Details */}
            <div className="space-y-6">
              <PaymentDetailsCard 
                paymentLink={paymentLink}
                paymentStatus={paymentStatus}
                checkPaymentStatus={checkPaymentStatus}
                checkingPayment={checkingPayment}
              />
              <InstructionsCard />
              </div>
              
            {/* Right Column - QR Code */}
                    <div>
              {paymentLink.assignedAddress ? (
                  <BTCQRCode 
                    address={paymentLink.assignedAddress} 
                    amount={paymentLink.amount} 
                />
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-3xl border border-slate-700/50 p-8 text-center"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-amber-400" />
                    </div>
                  <h3 className="text-lg font-bold text-white mb-2">No Address Assigned</h3>
                  <p className="text-sm text-slate-400">
                    This payment link doesn't have a Bitcoin address. Please contact support.
                  </p>
                </motion.div>
              )}
                      </div>
                    </div>
                  </div>
      </main>

          {/* Footer */}
      <EnterpriseFooter paymentId={linkId} />
    </div>
  );
};

export default PaymentPage;
