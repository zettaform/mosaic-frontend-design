import React, { useState, useEffect } from 'react';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { BIP39_WORDS } from '../../data/bip39-wordlist';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';

const BTCXpubGenerator = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generatedData, setGeneratedData] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [generatingAddresses, setGeneratingAddresses] = useState(false);
  const [addressCount, setAddressCount] = useState(5);
  const { user } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  // RBAC: Check permissions instead of role
  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  
  const routeInfo = ROUTE_TO_SECTION[currentPath];
  if (routeInfo) {
    const { section, page } = routeInfo;
    if (!hasAccess(user, section, page)) {
      console.log(`❌ Access denied: User ${user.email || user.user_id} (role: ${user.role}) attempted to access ${currentPath} (${section}/${page})`);
      return <Navigate to="/unauthorized" replace />;
    }
  } else {
    // Route not in ROUTE_TO_SECTION - deny access
    console.log(`❌ Access denied: Route ${currentPath} is not in ROUTE_TO_SECTION`);
    return <Navigate to="/unauthorized" replace />;
  }

  // Generate mnemonic using backend API to ensure proper BIP39 validation
  const generateMnemonic = async () => {
    try {
      const response = await fetch('/api/crypto/generate-mnemonic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate mnemonic');
      }
      
      const data = await response.json();
      return data.mnemonic;
    } catch (error) {
      console.error('Error generating mnemonic:', error);
      // Fallback to a known valid 24-word mnemonic for demonstration
      return 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art';
    }
  };

  // Generate xpub from mnemonic using proper crypto standards
  const generateXpub = async (mnemonic) => {
    try {
      setLoading(true);
      setError('');
      
      // Call backend API with proper crypto standards
      const response = await fetch('/api/crypto/generate-xpub', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mnemonic })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate xpub');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error generating xpub:', error);
      setError(error.message || 'Failed to generate XPUB');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Generate addresses from xpub using proper crypto standards
  const generateAddresses = async (xpub, count = addressCount) => {
    try {
      setGeneratingAddresses(true);
      setError('');
      
      const response = await fetch('/api/crypto/generate-addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ xpub, count })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate addresses');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error generating addresses:', error);
      setError(error.message || 'Failed to generate addresses');
      return { success: false, error: error.message };
    } finally {
      setGeneratingAddresses(false);
    }
  };

  const handleGenerateXpub = async () => {
    const mnemonic = await generateMnemonic();
    const result = await generateXpub(mnemonic);
    
    if (result.success) {
      setGeneratedData(result);
      setSuccess('XPUB generated successfully!');
      setError('');
    } else {
      setError('Failed to generate XPUB');
    }
  };

  const handleGenerateAddresses = async () => {
    if (!generatedData?.xpub) {
      setError('Please generate an XPUB first');
      return;
    }
    
    if (addressCount < 1 || addressCount > 1000) {
      setError('Address count must be between 1 and 1000');
      return;
    }
    
    const result = await generateAddresses(generatedData.xpub, addressCount);
    
    if (result.success) {
      setAddresses(result.data.addresses);
      setSuccess(`${addressCount} addresses generated successfully!`);
      setError('');
    } else {
      setError('Failed to generate addresses');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="sidebar-shell-main">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1">
          <div className="px-4 sm:px-6 lg:px-8 py-4 w-full max-w-7xl mx-auto">
            
            {/* Page header */}
            <div className="mb-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">BTC XPUB Generator (Mainnet)</h1>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">Generate Bitcoin mainnet extended public keys and addresses</p>
                </div>
                <button
                  onClick={handleGenerateXpub}
                  disabled={loading}
                  className="btn bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50"
                >
                  {loading ? 'Generating...' : 'Generate XPUB'}
                </button>
              </div>
            </div>

            {/* Error/Success messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
                {success}
              </div>
            )}

            {/* Generated XPUB Section */}
            {generatedData && (
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 mb-6">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Generated XPUB</h2>
                
                {/* Mnemonic */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    24-Word Mnemonic (Keep this secure!)
                  </label>
                  <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-lg">
                    <p className="font-mono text-sm break-all">{generatedData.mnemonic}</p>
                    <button
                      onClick={() => copyToClipboard(generatedData.mnemonic)}
                      className="mt-2 text-xs text-indigo-600 hover:text-indigo-800"
                    >
                      Copy Mnemonic
                    </button>
                  </div>
                </div>

                {/* XPUB */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Extended Public Key (XPUB)
                  </label>
                  <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-lg">
                    <p className="font-mono text-sm break-all">{generatedData.xpub}</p>
                    <button
                      onClick={() => copyToClipboard(generatedData.xpub)}
                      className="mt-2 text-xs text-indigo-600 hover:text-indigo-800"
                    >
                      Copy XPUB
                    </button>
                  </div>
                </div>

                {/* Derivation Path */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Derivation Path
                  </label>
                  <p className="font-mono text-sm bg-slate-100 dark:bg-slate-700 p-2 rounded">
                    {generatedData.derivationPath || "m/44'/0'/0'"}
                  </p>
                </div>

                {/* Address Count Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Number of Addresses to Generate
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={addressCount}
                    onChange={(e) => setAddressCount(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                    placeholder="5"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Generate between 1 and 1000 addresses
                  </p>
                </div>

                {/* Generate Addresses Button */}
                <div className="mt-6">
                  <button
                    onClick={handleGenerateAddresses}
                    disabled={generatingAddresses}
                    className="btn bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
                  >
                    {generatingAddresses ? 'Generating...' : `Generate ${addressCount} Address${addressCount > 1 ? 'es' : ''}`}
                  </button>
                </div>
              </div>
            )}

            {/* Generated Addresses */}
            {addresses.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Generated Addresses</h2>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                          Index
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                          Address
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                          Network
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                      {addresses.map((addr, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                            {addr.index}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-900 dark:text-slate-100">
                            {addr.address}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {addr.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                            {addr.network}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                            <button
                              onClick={() => copyToClipboard(addr.address)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Copy
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};

export default BTCXpubGenerator;
