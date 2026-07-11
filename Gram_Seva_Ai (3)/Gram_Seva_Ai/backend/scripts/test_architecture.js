require('dotenv').config();

const { db, FieldValue } = require('../src/firebase/firebaseAdmin');
const logger = require('../src/config/logger');

async function runTests() {
  console.log('\n--- 🧪 STARTING END-TO-END ARCHITECTURE TEST ---\n');

  try {
    // 1. Test Express REST API
    console.log('1️⃣ Testing Express REST API (Health Check)...');
    const healthRes = await fetch('http://localhost:3000/api/health').then(r => r.json());
    console.log('   ✅ Health OK:', healthRes.message);

    // 2. Test PostgreSQL / Prisma via Express
    console.log('\n2️⃣ Testing Express -> Controller -> Service -> Prisma -> PostgreSQL...');
    const testAadhaar = '999900001111';
    
    // First let's check if the citizen exists and delete it if so (cleanup)
    try {
      const allCitizensRes = await fetch('http://localhost:3000/api/citizens').then(r => r.json());
      const existing = allCitizensRes.data.find(c => c.aadhaar === testAadhaar);
      if (existing) {
        await fetch(`http://localhost:3000/api/citizens/${existing.id}`, { method: 'DELETE' });
        console.log(`   (Cleaned up existing test citizen ID: ${existing.id})`);
      }
    } catch(e) {}

    const newCitizenPayload = {
      aadhaar: testAadhaar,
      fullName: 'Integration Test User',
      age: 28,
      gender: 'MALE',
      phone: '9876543210',
      address: 'Test Address',
      villageId: 1,
      occupation: 'Farmer',
      annualIncome: 50000
    };

    console.log('   -> Creating new citizen via POST /api/citizens');
    const createRes = await fetch('http://localhost:3000/api/citizens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCitizenPayload)
    }).then(r => r.json());
    if (!createRes.success) throw new Error("API returned error: " + JSON.stringify(createRes));
    const citizenId = createRes.data.id;
    console.log(`   ✅ Citizen created in PostgreSQL with ID: ${citizenId}`);

    // Wait a brief moment for the asynchronous Prisma Hook to publish to Firebase
    console.log('\n3️⃣ Testing Outbound Sync (Prisma Extension -> Firebase Publisher)...');
    await new Promise(resolve => setTimeout(resolve, 2000)); 

    const liveDoc = await db.collection('gram_seva_live').doc(`citizen_${citizenId}`).get();
    if (liveDoc.exists && liveDoc.data().data.fullName === 'Integration Test User') {
      console.log(`   ✅ SUCCESS: Prisma hook automatically published Citizen #${citizenId} to 'gram_seva_live' in Firestore!`);
    } else {
      console.log(`   ❌ FAILED: Citizen not found in Firebase 'gram_seva_live' collection.`);
    }

    // 4. Test Inbound Sync (Firebase Request -> Snapshot Listener -> Action Router -> Service)
    console.log('\n4️⃣ Testing Inbound Sync (Firestore Queue -> Backend)...');
    const requestId = 'test_req_' + Date.now();
    console.log(`   -> Simulating frontend creating request: ${requestId}`);
    
    await db.collection('gram_seva_requests').doc(requestId).set({
      action: 'findCitizen',
      status: 'pending',
      payload: { aadhaar: testAadhaar },
      timestamp: FieldValue.serverTimestamp()
    });

    console.log('   -> Waiting for Backend SnapshotListener to process...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const responseDoc = await db.collection('gram_seva_responses').doc(requestId).get();
    if (responseDoc.exists && responseDoc.data().success) {
      console.log(`   ✅ SUCCESS: Listener processed request and saved result to 'gram_seva_responses'!`);
      console.log(`   -> Fetched Data from PostgreSQL via Firebase:`, responseDoc.data().data.fullName);
    } else {
      console.log(`   ❌ FAILED: Listener did not create a successful response in 'gram_seva_responses'.`);
    }

    console.log('\n--- 🎉 ALL TESTS COMPLETED ---\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:');
    if (error.response) {
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

runTests();
