// Create nestify database and user
db = db.getSiblingDB('nestify');

// Create user with readWrite privileges
db.createUser({
  user: 'nestify_user',
  pwd: 'nestify_password',
  roles: [
    {
      role: 'readWrite',
      db: 'nestify'
    }
  ]
});

// Create indexes for better performance
db.properties.createIndex({ 'location_id.city': 1, type: 1, price: 1 });
db.properties.createIndex({ 'location_id.coordinates': '2dsphere' });
db.properties.createIndex({ created_at: -1 });
db.properties.createIndex({ views: -1 });
db.properties.createIndex({ title: 'text', description: 'text' });
db.properties.createIndex({ 'VEFA_details_id.is_vefa': 1 });
db.properties.createIndex({ 'apartment_details_id.rooms': 1 });
db.properties.createIndex({ promoter_id: 1 });
db.properties.createIndex({ validated: 1 });

db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ phone: 1 }, { sparse: true });
db.users.createIndex({ createdAt: -1 });

db.promoters.createIndex({ name: 'text' });
db.promoters.createIndex({ verified: 1, rating: -1 });

print('MongoDB initialization completed');