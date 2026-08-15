import React, { useState, useEffect } from 'react';
import cryptoService from '../../services/cryptoService';

const TestCrypto = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadAddresses = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Testing API call...');
      const response = await cryptoService.getAddresses(1, 5, '');
      console.log('API Response:', response);
      
      if (response.success) {
        setAddresses(response.data.addresses);
        console.log('Addresses loaded:', response.data.addresses.length);
      } else {
        setError(response.error || 'Failed to load addresses');
        console.error('API Error:', response.error);
      }
    } catch (error) {
      console.error('Network Error:', error);
      setError('Network error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateAddresses = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Testing generate API...');
      const response = await cryptoService.generateAddresses(2, 'tpubD6NzVbkrYhZ4W3eHqTksuP8fPfMXxRhv8HH4sGRzzQ8ayP6PKvThGJ2i6PT1k3knx76MrwWH5NkPvcRmNQpbYcmgxJRGCh2nGkR9vEjxHDo');
      console.log('Generate Response:', response);
      
      if (response.success) {
        console.log('Addresses generated, reloading...');
        await loadAddresses();
      } else {
        setError(response.error || 'Failed to generate addresses');
        console.error('Generate Error:', response.error);
      }
    } catch (error) {
      console.error('Generate Network Error:', error);
      setError('Generate network error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Test Crypto API</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={loadAddresses} 
          disabled={loading}
          style={{ marginRight: '10px', padding: '10px' }}
        >
          {loading ? 'Loading...' : 'Load Addresses'}
        </button>
        
        <button 
          onClick={generateAddresses} 
          disabled={loading}
          style={{ padding: '10px' }}
        >
          {loading ? 'Generating...' : 'Generate 2 Addresses'}
        </button>
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: '20px', padding: '10px', border: '1px solid red' }}>
          Error: {error}
        </div>
      )}

      <div>
        <h3>Addresses ({addresses.length})</h3>
        {addresses.map((addr, index) => (
          <div key={index} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ccc' }}>
            <div><strong>Address:</strong> {addr.address}</div>
            <div><strong>Index:</strong> {addr.index}</div>
            <div><strong>Type:</strong> {addr.type}</div>
            <div><strong>Created:</strong> {new Date(addr.created_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestCrypto;
