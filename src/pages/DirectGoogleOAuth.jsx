import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import backendAuthService from '../services/backendAuthService';

import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';

function DirectGoogleOAuth() {
  const [searchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authState, setAuthState] = useState('idle'); // 'idle', 'authenticating', 'success', 'error'
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [nickname, setNickname] = useState('');

  // Google OAuth configuration - using your credentials
  const GOOGLE_CLIENT_ID = '176922886044-5qek1iidvdao1rv3hv02pb96mnd2gmiv.apps.googleusercontent.com';
  const redirectUri = `${window.location.origin}/oauth/direct-google`;

  useEffect(() => {
    // Check if we have authorization code in URL parameters
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      setError(`Authentication error: ${errorDescription || error}`);
      setAuthState('error');
      return;
    }

    if (code && authState === 'idle') {
      // Check if we've already processed this authorization code
      const processedCode = localStorage.getItem('google_oauth_processed_code');
      if (processedCode === code) {
        console.log('🔄 Authorization code already processed, skipping...');
        return;
      }

      // Mark this code as being processed
      localStorage.setItem('google_oauth_processed_code', code);

      // We have an authorization code and haven't started authentication yet
      setAuthState('authenticating');
      exchangeCodeForTokens(code);
    }
  }, [searchParams, authState]);

  const exchangeCodeForTokens = async (code) => {
    setLoading(true);
    setError(null);

    try {
      // Exchange authorization code for tokens directly with Google
      console.log('🔄 Exchanging authorization code for tokens with Google...');
      
      // Get client secret from backend (for security)
      // Note: In production, consider doing token exchange on backend instead
      const secretResponse = await fetch('/api/oauth/google-client-secret');
      const secretData = await secretResponse.json();
      
      if (!secretResponse.ok || !secretData.secret) {
        throw new Error(secretData.error || 'Failed to get Google client secret from backend');
      }
      
      const GOOGLE_CLIENT_SECRET = secretData.secret;

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });

      const tokens = await response.json();

      if (!response.ok) {
        throw new Error(tokens.error_description || tokens.error || 'Failed to exchange code for tokens');
      }

      console.log('✅ Tokens received from Google');
      console.log('📋 Token response details:', {
        has_access_token: !!tokens.access_token,
        has_refresh_token: !!tokens.refresh_token,
        has_id_token: !!tokens.id_token,
        scope: tokens.scope,
        expires_in: tokens.expires_in,
        token_type: tokens.token_type
      });

      if (!tokens.refresh_token) {
        console.warn('⚠️  No refresh_token in response. This may happen if:');
        console.warn('   - User already granted access (prompt=consent needed)');
        console.warn('   - offline_access scope not properly requested');
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
          tokenIdentifier: localStorage.getItem('google_oauth_nickname') || 'default_token',
          tokens: tokens
        }),
      });

      const backendResult = await backendResponse.json();

      if (!backendResponse.ok) {
        throw new Error(backendResult.error || 'Failed to store tokens in backend');
      }

      // Step 3: Create/login app user using Google ID token and redirect to users page.
      const googleSignup = await backendAuthService.completeGoogleSignup({
        idToken: tokens.id_token,
      });
      if (!googleSignup.success) {
        throw new Error(googleSignup.error || 'Failed to create user from Google authentication');
      }

      console.log('✅ Tokens successfully stored in Azure Tables via backend');
      setAuthState('success');

      // Store minimal info in localStorage for UI state
      const tokenId = localStorage.getItem('google_oauth_nickname') || 'default_token';
      localStorage.setItem('google_oauth_status', JSON.stringify({
        authenticated: true,
        storedAt: new Date().toISOString(),
        tenantEmail: 'admin@example.com',
        tokenIdentifier: tokenId,
        hasRefreshToken: !!tokens.refresh_token
      }));

      // Clear the nickname from localStorage after use
      localStorage.removeItem('google_oauth_nickname');

      // Clear the processed code flag since we succeeded
      localStorage.removeItem('google_oauth_processed_code');

      // Full page navigation so AuthContext reloads session from localStorage (client-side navigate leaves user null → signin redirect).
      window.location.replace('/ecommerce/users');

    } catch (err) {
      console.error('❌ OAuth flow error:', err);

      // Clear the processed code flag on error so it can be retried
      localStorage.removeItem('google_oauth_processed_code');

      if (authState !== 'success') {
        setError(err.message);
        setAuthState('error');
      }
    } finally {
      setLoading(false);
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

    // Store the nickname in localStorage
    localStorage.setItem('google_oauth_nickname', nickname.trim());
    setShowNicknameModal(false);

    // Direct Google OAuth - request Gmail scopes and offline access
    const scope = encodeURIComponent('https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send');
    const state = encodeURIComponent('GOOGLE_OAUTH_' + Date.now());

    const url = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${scope}` +
      `&access_type=offline` + // Required for refresh token
      `&prompt=consent` + // Force consent to get refresh token
      `&state=${state}`;

    console.log('🔗 Redirecting to Google OAuth...');
    window.location.href = url;
  };

  // Load authentication status from localStorage on component mount
  useEffect(() => {
    const storedStatus = localStorage.getItem('google_oauth_status');
    if (storedStatus) {
      try {
        const status = JSON.parse(storedStatus);
        if (status.authenticated) {
          setAuthState('success');
        }
      } catch (err) {
        console.error('Error parsing stored status:', err);
        localStorage.removeItem('google_oauth_status');
      }
    }
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
                Please provide a nickname for this Google account. This will be used to identify the token in Azure Tables.
              </p>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g., Work Gmail, Personal Account"
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
                  Continue with Google OAuth
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
                Direct Google OAuth (Bypass Auth0)
              </h1>
              <p className="text-slate-600 mt-2">
                Authenticate directly with Google to get refresh tokens. This bypasses Auth0 and gives you direct Google tokens.
              </p>
            </div>

            {/* Main content */}
            <div className="bg-white shadow-lg rounded-sm border border-slate-200 p-6">
              {/* Authentication Section */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">
                  Direct Google Authentication
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
                      Authenticate with Google (Direct)
                    </button>
                    <p className="text-slate-600 mt-4">
                      Click to start direct OAuth flow with Google (bypasses Auth0)
                    </p>
                    <p className="text-slate-500 text-sm mt-2">
                      This will give you Google refresh tokens directly
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
                      Your Google OAuth tokens (including refresh token) have been securely stored in Azure Tables.
                    </p>
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
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default DirectGoogleOAuth;
