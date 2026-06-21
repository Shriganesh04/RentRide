// One-time fix: removes the stale unique index on transactionId
// that's left over from an earlier schema version.
// Run once: node fix_payment_index.js
require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const db = mongoose.connection.db;
  const collection = db.collection('payments');

  const indexes = await collection.indexes();
  console.log('Current indexes on payments collection:');
  indexes.forEach(idx => console.log(' -', idx.name, JSON.stringify(idx.key), idx.unique ? '(unique)' : ''));

  const staleIndex = indexes.find(idx => idx.name === 'transactionId_1');

  if (staleIndex) {
    await collection.dropIndex('transactionId_1');
    console.log('✅ Dropped stale unique index: transactionId_1');
  } else {
    console.log('ℹ️  No transactionId_1 index found — nothing to drop.');
  }

  // Recreate it as a sparse, non-unique index instead (useful for lookups,
  // but won't collide on multiple null values)
  await collection.createIndex({ transactionId: 1 }, { sparse: true });
  console.log('✅ Recreated transactionId index as sparse (non-unique)');

  await mongoose.disconnect();
  console.log('✅ Done.');
}

run().catch(err => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});