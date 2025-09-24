// Debug helper for testing program publish endpoint
const debugPublishEndpoint = async (eventId, programId, token) => {
  console.log('🔍 Testing publish endpoint...');
  console.log(`Event ID: ${eventId}`);
  console.log(`Program ID: ${programId}`);
  console.log(`Token: ${token ? 'Provided' : 'Missing'}`);
  
  try {
    const url = `/api/event/${eventId}/programs/${programId}/publish`;
    console.log(`📡 Making POST request to: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      credentials: 'include' // For cookie-based auth
    });
    
    console.log(`📊 Response status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    console.log('📄 Response data:', data);
    
    if (response.ok) {
      console.log('✅ Success! Results published successfully');
      return data;
    } else {
      console.log('❌ Error:', data.error);
      
      // Provide specific guidance based on error
      switch (response.status) {
        case 401:
          console.log('💡 Solution: Provide a valid authentication token');
          break;
        case 403:
          console.log('💡 Solution: Token is invalid or expired - try logging in again');
          break;
        case 404:
          console.log('💡 Solution: Check if event/program exists or if results were entered first');
          break;
        case 400:
          console.log('💡 Solution: Enter results first using the scores endpoint');
          break;
        default:
          console.log('💡 Solution: Check server logs for more details');
      }
      
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('🚨 Network or other error:', error.message);
    throw error;
  }
};

// Example usage:
// debugPublishEndpoint('alaska', 'YSq3YtEZ1P7TAOXhShnY', 'your-token-here');

// Test without authentication first
console.log('Testing endpoint availability...');
debugPublishEndpoint('test', 'test', null)
  .catch(error => console.log('Expected error (no auth):', error.message));

export default debugPublishEndpoint;