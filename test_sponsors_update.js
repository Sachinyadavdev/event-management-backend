import fetch from 'node-fetch';

async function testSponsorsUpdate() {
  try {
    const eventId = 31;
    
    console.log('🧪 Testing sponsors update for event', eventId);
    
    // Test data with updated sponsors
    const updateData = {
      sponsors: [
        {
          name: 'Apple',
          logo: 'https://logos-world.net/wp-content/uploads/2020/04/Apple-Logo.png',
          website: 'https://apple.com',
          level: 'platinum',
          customLabel: ''
        },
        {
          name: 'Tesla', 
          logo: 'https://logos-world.net/wp-content/uploads/2020/08/Tesla-Logo.png',
          website: 'https://tesla.com',
          level: 'gold',
          customLabel: ''
        }
      ]
    };
    
    console.log('📤 Sending update request with sponsors:', updateData.sponsors);
    
    // Send PUT request to update event
    const response = await fetch(`http://localhost:5000/api/events/${eventId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    });
    
    const result = await response.json();
    
    console.log('📥 Update response:', {
      success: result.success,
      message: result.message,
      sponsorsCount: result.data?.sponsors?.length || 0
    });
    
    if (result.success && result.data.sponsors) {
      console.log('✅ Updated sponsors:', result.data.sponsors);
    } else {
      console.log('❌ Update failed or no sponsors returned');
    }
    
    // Fetch the event again to verify
    console.log('\n🔍 Fetching event to verify sponsors were saved...');
    const fetchResponse = await fetch(`http://localhost:5000/api/events/${eventId}`);
    const fetchResult = await fetchResponse.json();
    
    console.log('📥 Fetch response sponsors:', fetchResult.data?.sponsors || []);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSponsorsUpdate();