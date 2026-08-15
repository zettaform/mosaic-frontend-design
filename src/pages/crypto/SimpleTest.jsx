import React, { useState } from 'react';

const SimpleTest = () => {
  const [result, setResult] = useState('');

  const testAPI = async () => {
    try {
      console.log('Testing API directly...');
      const response = await fetch('/api/crypto/addresses?page=1&limit=3');
      console.log('Response:', response);
      const data = await response.json();
      console.log('Data:', data);
      console.log('Data stringified:', JSON.stringify(data, null, 2));
      setResult(JSON.stringify(data, null, 2));
      console.log('Result state set to:', JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error:', error);
      setResult('Error: ' + error.message);
    }
  };

  const testGenerate = async () => {
    try {
      console.log('Testing generate API directly...');
      const response = await fetch('/api/crypto/addresses/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: 2,
          xpub: 'tpubD6NzVbkrYhZ4W3eHqTksuP8fPfMXxRhv8HH4sGRzzQ8ayP6PKvThGJ2i6PT1k3knx76MrwWH5NkPvcRmNQpbYcmgxJRGCh2nGkR9vEjxHDo'
        })
      });
      console.log('Response:', response);
      const data = await response.json();
      console.log('Data:', data);
      console.log('Data stringified:', JSON.stringify(data, null, 2));
      setResult(JSON.stringify(data, null, 2));
      console.log('Result state set to:', JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error:', error);
      setResult('Error: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Simple API Test</h1>
      <button onClick={testAPI} style={{ marginRight: '10px', padding: '10px' }}>
        Test Load Addresses
      </button>
      <button onClick={testGenerate} style={{ padding: '10px' }}>
        Test Generate Addresses
      </button>
      <div style={{ marginTop: '20px' }}>
        <h3>Current Result State:</h3>
        <p>Length: {result.length} characters</p>
        <p>First 100 chars: {result.substring(0, 100)}...</p>
      </div>
      <pre style={{ marginTop: '20px', background: '#f5f5f5', padding: '10px', maxHeight: '400px', overflow: 'auto' }}>
        {result || 'No data yet - click a button above'}
      </pre>
    </div>
  );
};

export default SimpleTest;
