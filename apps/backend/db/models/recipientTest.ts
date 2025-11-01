import mongoose from 'mongoose';
import Recipient from './recipientSchema';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/testdb';

async function runTests() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to DB');

  // clear existing test data
  await Recipient.deleteMany({ email: 'test@example.com' });

  // Create new
  const recipient = await Recipient.create({
    email: 'test@example.com',
    name: 'Tester McTesterson',
  });
  console.log('Created recipient:', recipient);

  // Method tests

  await recipient.updateStatus('unsubscribed');
  console.log('Updated status:', recipient.status);

  const fakeListId = new mongoose.Types.ObjectId();
  await recipient.addToList(fakeListId);
  console.log('Lists after adding:', recipient.lists);

  const fakeCampaignId = new mongoose.Types.ObjectId();
  await recipient.recordEngagement(fakeCampaignId, 'openedEmails');
  console.log('Engagement after open:', recipient.engagementHistory);

  await recipient.updateAggregateEngagement();
  console.log('Aggregate totals:', recipient.aggregateEngagement);

  await mongoose.disconnect();
  console.log('Disconnected');
}

runTests().catch(console.error);
