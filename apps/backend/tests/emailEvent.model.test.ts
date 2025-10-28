import mongoose from 'mongoose';
import {
  EmailEvent,
  getEventCountsByType,
  getGeoEngagement,
  getHourlyEventTrends,
} from '../app/models/emailEvent.model';

const MONGO_URI = 'mongodb://localhost:27017/nexus-email-service';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  await EmailEvent.deleteMany({});

  const now = new Date();
  const events = [
    {
      messageId: 'msg1',
      recipientEmail: 'user1@example.com',
      eventType: 'opened',
      timestamp: now,
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      geoLocationData: 'US-NY',
      campaignId: 'campaignA',
    },
    {
      messageId: 'msg1',
      recipientEmail: 'user1@example.com',
      eventType: 'clicked',
      timestamp: now,
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      geoLocationData: 'US-NY',
      campaignId: 'campaignA',
    },
    {
      messageId: 'msg2',
      recipientEmail: 'user2@example.com',
      eventType: 'bounced',
      timestamp: new Date(now.getTime() - 3600000),
      ipAddress: '192.168.2.2',
      userAgent: 'Mozilla/5.0',
      geoLocationData: 'US-CA',
      campaignId: 'campaignB',
    },
  ];

  await EmailEvent.insertMany(events);
  console.log('Seeded events');

  const typeCounts = await getEventCountsByType();
  console.log('Event counts by type:', typeCounts);

  const hourly = await getHourlyEventTrends();
  console.log('Hourly event trends:', hourly);

  const geo = await getGeoEngagement();
  console.log('Geo engagement:', geo);

  await mongoose.disconnect();
}

seed().catch(console.error);
