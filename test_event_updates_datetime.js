import fetch from 'node-fetch';

async function testEventUpdatesDateTime() {
  try {
    const eventId = 31;
    
    console.log('🧪 Testing event updates with custom date/time for event', eventId);
    
    // Test data with custom timestamps
    const updateData = {
      notifications: [
        {
          id: 'test1',
          title: 'Updated Schedule Change',
          body: 'The event has been rescheduled to accommodate our keynote speaker.',
          createdAt: '2025-11-10T15:30:00.000Z' // Custom date/time
        },
        {
          id: 'test2', 
          title: 'Parking Update',
          body: 'New parking instructions have been added.',
          createdAt: '2025-11-09T10:15:00.000Z' // Different custom date/time
        },
        {
          id: 'test3',
          title: 'Special Announcement',
          body: 'We have exciting news to share about our event!',
          createdAt: '2025-11-08T14:45:00.000Z' // Another custom date/time
        }
      ]
    };
    
    console.log('📤 Sending update with custom timestamps:');
    updateData.notifications.forEach((notif, i) => {
      console.log(`  ${i+1}. "${notif.title}" - ${notif.createdAt}`);
    });
    
    // Send PUT request to update event
    const response = await fetch(`http://localhost:5000/api/events/${eventId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('\n✅ Update successful! Returned notifications:');
      result.data.notifications?.forEach((notif, i) => {
        console.log(`  ${i+1}. "${notif.title}" - ${notif.createdAt}`);
      });
    } else {
      console.log('❌ Update failed:', result.message);
    }
    
    // Fetch the event again to verify the custom timestamps were saved
    console.log('\n🔍 Fetching event to verify timestamps...');
    const fetchResponse = await fetch(`http://localhost:5000/api/events/${eventId}`);
    const fetchResult = await fetchResponse.json();
    
    if (fetchResult.success && fetchResult.data.notifications) {
      console.log('📥 Fetched notifications with timestamps:');
      fetchResult.data.notifications.forEach((notif, i) => {
        const date = new Date(notif.createdAt);
        console.log(`  ${i+1}. "${notif.title}" - ${date.toISOString()} (${date.toLocaleString()})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Only run if node-fetch is available, otherwise skip
try {
  testEventUpdatesDateTime();
} catch (e) {
  console.log('⚠️ Skipping test - node-fetch not available');
}