import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import { azureOAuthStorage } from '../services/azureOAuthService';
import backendAuthService from '../services/backendAuthService';

function OAuth() {
  const [searchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tokens, setTokens] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authState, setAuthState] = useState('idle'); // 'idle', 'authenticating', 'success', 'error'
  const [azureTokens, setAzureTokens] = useState([]);
  const [showAzureTokens, setShowAzureTokens] = useState(false);
  const [azureLoading, setAzureLoading] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [nickname, setNickname] = useState('');
  const [deletingToken, setDeletingToken] = useState(null);

  // Auth0 configuration - using the values from your setup
  const auth0Domain = "dev-vklpus13r1rvw174.us.auth0.com";
  const clientId = "PvB1intKVmIB5szvCbCjloBy5GxTvxld";
  const redirectUri = `${window.location.origin}/oauth`;

  useEffect(() => {
    // Check if we have authorization code in URL parameters
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      setError(`Authentication error: ${errorDescription || error}`);
      setAuthState('error');
      return;
    }

    if (code && authState === 'idle') {
      // Check if we've already processed this authorization code
      const processedCode = localStorage.getItem('oauth_processed_code');
      if (processedCode === code) {
        console.log('🔄 Authorization code already processed, skipping...');
        return;
      }

      // Mark this code as being processed
      localStorage.setItem('oauth_processed_code', code);

      // We have an authorization code and haven't started authentication yet
      setAuthState('authenticating');
      exchangeCodeForTokens(code);
    }
  }, [searchParams, authState]);

  const exchangeCodeForTokens = async (code) => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Exchange authorization code for tokens with Auth0
      console.log('🔄 Exchanging authorization code for tokens...');
      const response = await fetch(`https://${auth0Domain}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: clientId,
          client_secret: 'Y59-8UwW2wrk2tPoGVECbxP_wpX0pUIUx51X13ilwteibmd_eUcn3OZUUMlT2gWs',
          code: code,
          redirect_uri: redirectUri,
          // Note: offline_access scope in authorization request should provide refresh_token
          // If refresh_token is still not returned, check Auth0 Application settings
          // to ensure "Refresh Token" grant type is enabled
        }),
      });

      const tokens = await response.json();

      if (!response.ok) {
        throw new Error(tokens.error_description || tokens.error || 'Failed to exchange code for tokens');
      }

      console.log('✅ Tokens received from Auth0');
      console.log('📋 Token response details:', {
        has_access_token: !!tokens.access_token,
        has_refresh_token: !!tokens.refresh_token,
        has_id_token: !!tokens.id_token,
        scope: tokens.scope,
        expires_in: tokens.expires_in,
        token_type: tokens.token_type
      });

      // If no refresh_token in response, try to get it from ID token or user info
      if (!tokens.refresh_token) {
        console.warn('⚠️  No refresh_token in Auth0 response');
        console.warn('   This is common with Auth0 social connections.');
        console.warn('   The refresh token may be stored in Auth0 user identity metadata.');
        console.warn('   You may need to use Auth0 Management API to retrieve it.');
        
        // Try to extract user ID from ID token to fetch refresh token later
        if (tokens.id_token) {
          try {
            // Decode ID token (just the payload, not verifying signature)
            const idTokenParts = tokens.id_token.split('.');
            if (idTokenParts.length >= 2) {
              const payload = JSON.parse(atob(idTokenParts[1]));
              console.log('📋 ID Token payload:', {
                sub: payload.sub,
                email: payload.email,
                has_user_id: !!payload.sub
              });
              // Store user ID for later retrieval
              tokens.auth0_user_id = payload.sub;
            }
          } catch (e) {
            console.warn('   Could not decode ID token:', e.message);
          }
        }
      }

      // Step 2: Send tokens to backend API for storage in Azure Tables
      console.log('📤 Sending tokens to backend for storage...');
      const backendResponse = await fetch('/api/oauth/store-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantEmail: 'admin@example.com', // In production, get from user context
          tokenIdentifier: localStorage.getItem('oauth_nickname') || 'default_token', // Use nickname from localStorage
          tokens: tokens
        }),
      });

      const backendResult = await backendResponse.json();

      if (!backendResponse.ok) {
        throw new Error(backendResult.error || 'Failed to store tokens in backend');
      }

      // Create/login app user after OAuth success.
      let decoded = {};
      if (tokens.id_token) {
        try {
          const parts = tokens.id_token.split('.');
          if (parts.length >= 2) {
            decoded = JSON.parse(atob(parts[1]));
          }
        } catch (decodeError) {
          console.warn('Failed to decode id_token for signup:', decodeError.message);
        }
      }

      const googleSignup = await backendAuthService.completeGoogleSignup({
        idToken: tokens.id_token,
        email: decoded?.email || '',
        name: decoded?.name || '',
      });
      if (!googleSignup.success) {
        throw new Error(googleSignup.error || 'Failed to create user from OAuth authentication');
      }

      console.log('✅ Tokens successfully stored in Azure Tables via backend');
      setAuthState('success');

      // Store minimal info in localStorage for UI state (not the actual tokens)
      const tokenId = localStorage.getItem('oauth_nickname') || 'default_token';
      localStorage.setItem('oauth_status', JSON.stringify({
        authenticated: true,
        storedAt: new Date().toISOString(),
        tenantEmail: 'admin@example.com',
        tokenIdentifier: tokenId
      }));

      // Clear the nickname from localStorage after use
      localStorage.removeItem('oauth_nickname');

      // Clear the processed code flag since we succeeded
      localStorage.removeItem('oauth_processed_code');

      // Redirect to clean URL (remove authorization code from URL to prevent re-processing)
      console.log('🔄 Redirecting to clean URL...');
      window.history.replaceState({}, document.title, '/oauth');

      await loadAzureTokens();
      // Full page navigation so AuthContext picks up the new session token
      window.location.replace('/ecommerce/users');

    } catch (err) {
      console.error('❌ OAuth flow error:', err);

      // Clear the processed code flag on error so it can be retried
      localStorage.removeItem('oauth_processed_code');

      // Don't set error state if we already succeeded (redirect cleared the URL)
      if (authState !== 'success') {
        setError(err.message);
        setAuthState('error');
      }
    } finally {
      setLoading(false);
    }
  };


  const clearTokens = async () => {
    setTokens(null);
    setAuthState('idle');
    localStorage.removeItem('oauth_status');

    // Get the current token identifier from localStorage
    const storedStatus = localStorage.getItem('oauth_status');
    let tokenIdentifier = 'token1'; // fallback

    if (storedStatus) {
      try {
        const status = JSON.parse(storedStatus);
        tokenIdentifier = status.tokenIdentifier || 'token1';
      } catch (err) {
        console.error('Error parsing stored status:', err);
      }
    }

    // Clear tokens from backend Azure Tables
    try {
      console.log(`🗑️ Clearing token "${tokenIdentifier}" from backend...`);
      const response = await fetch(`/api/oauth/tokens/admin@example.com/${tokenIdentifier}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('✅ Token cleared from Azure Tables via backend');
        await loadAzureTokens(); // Refresh the list
      } else {
        console.error('❌ Failed to clear token from backend:', result.error);
      }
    } catch (error) {
      console.error('❌ Backend clear error:', error);
    }
  };

  const loadAzureTokens = async () => {
    setAzureLoading(true);
    try {
      // Fetch tokens from backend API instead of direct client access
      const response = await fetch('/api/oauth/tokens/admin@example.com');
      const result = await response.json();

      if (response.ok && result.success) {
        // Transform backend data to match frontend format
        const tokens = result.data.tokens.map(token => ({
          tenantEmail: result.data.tenantEmail,
          tokenIdentifier: token.tokenIdentifier,
          token_type: token.tokenType,
          scope: token.scope,
          expires_at: token.expiresAt,
          created_at: token.createdAt,
          updated_at: token.updatedAt,
          isExpired: token.isExpired
        }));
        setAzureTokens(tokens);
      } else {
        console.error('❌ Failed to load Azure tokens from backend:', result.error);
        setAzureTokens([]);
      }
    } catch (error) {
      console.error('❌ Failed to load Azure tokens:', error);
      setAzureTokens([]);
    } finally {
      setAzureLoading(false);
    }
  };

  const clearAllAzureTokens = async () => {
    if (window.confirm('Are you sure you want to clear all tokens for admin@example.com from the Azure table? This cannot be undone.')) {
      try {
        const response = await fetch('/api/oauth/tokens/admin@example.com', {
          method: 'DELETE',
        });
        const result = await response.json();

        if (response.ok && result.success) {
          setAzureTokens([]);
          alert('All tokens cleared from Azure table');
        } else {
          alert('Failed to clear tokens: ' + (result.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('❌ Failed to clear all Azure tokens:', error);
        alert('Failed to clear tokens: ' + error.message);
      }
    }
  };

  const deleteToken = async (tokenIdentifier) => {
    if (window.confirm(`Are you sure you want to delete the token "${tokenIdentifier}"? This cannot be undone.`)) {
      setDeletingToken(tokenIdentifier);
      try {
        const response = await fetch(`/api/oauth/tokens/admin@example.com/${tokenIdentifier}`, {
          method: 'DELETE',
        });
        const result = await response.json();

        if (response.ok && result.success) {
          // Refresh the tokens list
          await loadAzureTokens();
          alert(`Token "${tokenIdentifier}" deleted successfully`);
        } else {
          alert('Failed to delete token: ' + (result.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('❌ Failed to delete token:', error);
        alert('Failed to delete token: ' + error.message);
      } finally {
        setDeletingToken(null);
      }
    }
  };

  const initiateAuth = () => {
    setShowNicknameModal(true);
  };

  const proceedWithAuth = () => {
    if (!nickname.trim()) {
      alert('Please enter a nickname for this account');
      return;
    }

    // Store the nickname in localStorage so it can be retrieved after OAuth redirect
    localStorage.setItem('oauth_nickname', nickname.trim());
    setShowNicknameModal(false);

    const scope = encodeURIComponent('openid profile email https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly offline_access');
    const state = encodeURIComponent('USER_ID_' + Date.now()); // Generate a unique state

    const url = `https://${auth0Domain}/authorize?` +
      `client_id=${clientId}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${scope}` +
      `&connection=google-oauth2` +
      `&state=${state}` +
      `&prompt=consent` +
      `&access_type=offline`;

    window.location.href = url;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const formatToken = (token) => {
    if (!token) return '';
    // Truncate long tokens for display
    return token.length > 50 ? `${token.substring(0, 50)}...` : token;
  };

  // Load authentication status from localStorage on component mount
  useEffect(() => {
    const storedStatus = localStorage.getItem('oauth_status');
    if (storedStatus) {
      try {
        const status = JSON.parse(storedStatus);
        if (status.authenticated) {
          setAuthState('success');
        }
      } catch (err) {
        console.error('Error parsing stored status:', err);
        localStorage.removeItem('oauth_status');
      }
    }
  }, []);

  // Load Azure tokens on component mount
  useEffect(() => {
    loadAzureTokens();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Content area */}
      <div className="sidebar-shell-main">
        {/* Site header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Nickname Modal */}
        {showNicknameModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Enter Account Nickname</h3>
              <p className="text-slate-600 mb-4">
                Please provide a nickname for this OAuth account. This will be used to identify the token in Azure Tables.
              </p>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g., Work Account, Personal Gmail"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    proceedWithAuth();
                  }
                }}
              />
              <div className="flex space-x-3">
                <button
                  onClick={proceedWithAuth}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Continue with OAuth
                </button>
                <button
                  onClick={() => {
                    setShowNicknameModal(false);
                    setNickname('');
                  }}
                  className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
            {/* Page header */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl text-slate-800 font-bold">
                OAuth Authentication & Azure Tables
              </h1>
              <p className="text-slate-600 mt-2">
                Authenticate with Google via Auth0, store tokens in Azure Tables, and view your OAuth data
              </p>
            </div>

            {/* Main content */}
            <div className="bg-white shadow-lg rounded-sm border border-slate-200 p-6">
              {/* Authentication Section */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">
                  Authentication
                </h2>

                {authState === 'idle' && (
                  <div className="text-center py-8">
                    <button
                      onClick={initiateAuth}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center mx-auto"
                    >
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Authenticate with Google
                    </button>
                    <p className="text-slate-600 mt-4">
                      Click to start the OAuth flow with Google via Auth0
                    </p>
                  </div>
                )}

                {authState === 'authenticating' && (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-slate-600">Exchanging authorization code for tokens...</span>
                    </div>
                  </div>
                )}

                {authState === 'success' && (
                  <div className="text-center py-4">
                    <div className="inline-flex items-center text-green-600 mb-4">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Authentication & Storage Successful!</span>
                    </div>
                    <p className="text-slate-600 mb-4">
                      Your OAuth tokens have been securely stored in Azure Tables via the backend API.
                    </p>
                    <button
                      onClick={clearTokens}
                      className="bg-slate-600 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
                    >
                      Clear Authentication
                    </button>
                  </div>
                )}

                {authState === 'error' && (
                  <div className="text-center py-4">
                    <div className="inline-flex items-center text-red-600 mb-4">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Authentication Failed</span>
                    </div>
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                      onClick={() => {
                        setAuthState('idle');
                        setError(null);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>

              {/* Note about token storage */}
              {authState === 'success' && (
                <div className="border-t border-slate-200 pt-8">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h3 className="font-medium text-blue-800 mb-1">Secure Token Storage</h3>
                        <p className="text-blue-700 text-sm">
                          OAuth tokens are securely stored in Azure Tables via the backend API and are not displayed on the frontend for security reasons.
                          Use the Azure Tables section below to view stored token metadata.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Azure Tables Section */}
            <div className="bg-white shadow-lg rounded-sm border border-slate-200 p-6 mt-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-slate-800">
                    Azure Tables Storage
                  </h2>
                  <p className="text-slate-600 mt-1">
                    OAuth tokens stored in Azure Tables via backend API (secure - tokens not displayed on frontend)
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowAzureTokens(!showAzureTokens)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
                  >
                    {showAzureTokens ? 'Hide' : 'Show'} Azure Tokens
                  </button>
                  <button
                    onClick={clearAllAzureTokens}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {showAzureTokens && (
                <div>
                  {azureLoading ? (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-slate-600">Loading Azure tokens...</span>
                      </div>
                    </div>
                  ) : azureTokens.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center text-slate-500">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span>No tokens stored in Azure Tables</span>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Tenant Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Token ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Token Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Scope
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Expires
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Status
                            </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Created
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          {azureTokens.map((token, index) => (
                            <tr key={index} className="hover:bg-slate-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                {token.tenantEmail}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                {token.tokenIdentifier}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                {token.token_type || 'Bearer'}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                                {token.scope || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                {token.expires_at ? new Date(token.expires_at).toLocaleString() : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {token.isExpired ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    Expired
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Valid
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                {token.created_at ? new Date(token.created_at).toLocaleString() : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => deleteToken(token.tokenIdentifier)}
                                  disabled={deletingToken === token.tokenIdentifier}
                                  className={`text-red-600 hover:text-red-900 font-medium ${
                                    deletingToken === token.tokenIdentifier
                                      ? 'opacity-50 cursor-not-allowed'
                                      : ''
                                  }`}
                                >
                                  {deletingToken === token.tokenIdentifier ? (
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  ) : (
                                    'Delete'
                                  )}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default OAuth;