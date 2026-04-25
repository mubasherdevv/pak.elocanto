import axios from 'axios';

async function testSave() {
  try {
    const payload = {
      pageType: 'home',
      referenceId: '', // What frontend sends
      title: 'Test Title - Elocanto',
      metaDescription: 'Test Description',
      keywords: 'test, seo',
      isActive: true
    };
    
    // Note: We need a token, but let's see if it hits the controller logic or fails at auth
    const res = await axios.post('http://localhost:5000/api/seo-settings', payload);
    console.log('Success:', res.data);
  } catch (err) {
    console.log('Error Status:', err.response?.status);
    console.log('Error Message:', err.response?.data);
  }
}
testSave();
