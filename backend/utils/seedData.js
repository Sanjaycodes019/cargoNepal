const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const Admin = require('../models/AdminModel');
const Owner = require('../models/OwnerModel');
const Customer = require('../models/CustomerModel');
const Truck = require('../models/TruckModel');

// Sample data generators
const firstNames = [
  'Raj', 'Suresh', 'Kumar', 'Prakash', 'Bishnu', 'Gopal', 'Hari', 'Ram',
  'Shyam', 'Mohan', 'Sita', 'Gita', 'Rita', 'Sangita', 'Prabha', 'Sunita',
  'Anita', 'Kumari', 'Devi', 'Maya', 'Pramila', 'Manisha', 'Sabina', 'Sabita'
];

const lastNames = [
  'Shrestha', 'Tamang', 'Rai', 'Gurung', 'Limbu', 'Magar', 'Thapa', 'Acharya',
  'Sharma', 'Pandey', 'Karki', 'Adhikari', 'Basnet', 'Basnyat', 'Rana', 'Pradhan'
];

const truckTypes = ['tipper', 'container', 'flatbed', 'box', 'tanker', 'refrigerated'];
const truckTitles = [
  'Tata Tipper 10 Ton', 'Ashok Leyland Container', 'Mahindra Flatbed', 'Eicher Box Truck',
  'BharatBenz Tipper 15 Ton', 'Volvo Container Truck', 'Tata Prima Container', 'Eicher Tipper 8 Ton',
  'Mahindra Container', 'Ashok Leyland Tipper', 'Tata LPT Container', 'Eicher Flatbed',
  'Mahindra Tipper 12 Ton', 'BharatBenz Container', 'Ashok Leyland Flatbed', 'Tata Box Truck',
  'Eicher Container', 'Volvo Tipper', 'Mahindra Tanker', 'Tata Refrigerated'
];

const locations = [
  { lat: 27.7172, lng: 85.3240 }, // Kathmandu
  { lat: 27.6710, lng: 85.4298 }, // Bhaktapur
  { lat: 27.6298, lng: 85.5214 }, // Lalitpur
  { lat: 26.4525, lng: 87.2718 }, // Biratnagar
  { lat: 28.2096, lng: 83.9856 }, // Pokhara
  { lat: 26.7288, lng: 88.2314 }, // Jhapa
  { lat: 28.0530, lng: 84.5513 }, // Chitwan
  { lat: 27.9734, lng: 83.7647 }  // Butwal
];

const addresses = [
  'Kathmandu, Bagmati', 'Lalitpur, Bagmati', 'Bhaktapur, Bagmati',
  'Biratnagar, Province 1', 'Pokhara, Gandaki', 'Chitwan, Bagmati',
  'Jhapa, Province 1', 'Butwal, Lumbini', 'Dharan, Province 1', 'Hetauda, Bagmati'
];

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomName() {
  return `${getRandomItem(firstNames)} ${getRandomItem(lastNames)}`;
}

function generateRandomEmail(name, index, type) {
  const cleanName = name.toLowerCase().replace(/\s+/g, '');
  return `${cleanName}${index}${type}@cargonepal.com`;
}

function generateRandomPhone() {
  return `98${getRandomNumber(1000000, 9999999)}`;
}

async function seedAll() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('Clearing existing data...');
    await Admin.deleteMany({});
    await Owner.deleteMany({});
    await Customer.deleteMany({});
    await Truck.deleteMany({});
    console.log('✅ Existing data cleared\n');

    // Create 2 Admins
    console.log('Creating 2 Admins...');
    const admins = [];
    const salt = await bcrypt.genSalt(10);
    
    for (let i = 1; i <= 2; i++) {
      const name = i === 1 ? 'Admin User' : 'System Admin';
      const email = i === 1 ? 'admin@cargonepal.com' : 'admin2@cargonepal.com';
      const passwordHash = await bcrypt.hash('admin123', salt);
      
      const admin = await Admin.create({
        name,
        email,
        passwordHash,
        role: 'admin'
      });
      admins.push(admin);
      console.log(`  ✓ Admin ${i}: ${email} (password: admin123)`);
    }
    console.log(`✅ Created ${admins.length} admins\n`);

    // Create 20 Owners
    console.log('Creating 20 Owners...');
    const owners = [];
    for (let i = 1; i <= 20; i++) {
      const name = generateRandomName();
      const email = generateRandomEmail(name, i, 'owner');
      const passwordHash = await bcrypt.hash('owner123', salt);
      const phone = generateRandomPhone();
      const address = getRandomItem(addresses);

      const owner = await Owner.create({
        name,
        email,
        passwordHash,
        phone,
        address,
        role: 'owner'
      });
      owners.push(owner);
      console.log(`  ✓ Owner ${i}: ${name} (${email})`);
    }
    console.log(`✅ Created ${owners.length} owners\n`);

    // Create 20 Customers
    console.log('Creating 20 Customers...');
    const customers = [];
    for (let i = 1; i <= 20; i++) {
      const name = generateRandomName();
      const email = generateRandomEmail(name, i, 'customer');
      const passwordHash = await bcrypt.hash('customer123', salt);
      const phone = getRandomNumber(1000000000, 9999999999).toString();
      const address = getRandomItem(addresses);

      const customer = await Customer.create({
        name,
        email,
        passwordHash,
        phone,
        address,
        role: 'customer'
      });
      customers.push(customer);
      console.log(`  ✓ Customer ${i}: ${name} (${email})`);
    }
    console.log(`✅ Created ${customers.length} customers\n`);

    // Create 20 Trucks (distributed among owners)
    console.log('Creating 20 Trucks...');
    const trucks = [];
    for (let i = 0; i < 20; i++) {
      const owner = owners[i % owners.length]; // Distribute trucks among owners
      const title = truckTitles[i] || `Truck ${i + 1}`;
      const type = getRandomItem(truckTypes);
      const capacityTons = getRandomNumber(5, 25);
      const ratePerKm = getRandomNumber(20, 40);
      const location = getRandomItem(locations);
      const available = Math.random() > 0.2; // 80% available
      const description = `Well maintained ${type} truck with ${capacityTons} ton capacity.`;

      const truck = await Truck.create({
        owner: owner._id,
        title,
        type,
        capacityTons,
        ratePerKm,
        location,
        available,
        description
      });

      // Add truck to owner's trucks array
      await Owner.findByIdAndUpdate(owner._id, {
        $push: { trucks: truck._id }
      });

      trucks.push(truck);
      console.log(`  ✓ Truck ${i + 1}: ${title} (Owner: ${owner.name})`);
    }
    console.log(`✅ Created ${trucks.length} trucks\n`);

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎉 Seed data created successfully!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`\nSummary:`);
    console.log(`  • Admins: ${admins.length}`);
    console.log(`  • Owners: ${owners.length}`);
    console.log(`  • Customers: ${customers.length}`);
    console.log(`  • Trucks: ${trucks.length}`);
    console.log(`\nLogin Credentials:`);
    console.log(`  Admin 1: admin@cargonepal.com / admin123`);
    console.log(`  Admin 2: admin2@cargonepal.com / admin123`);
    console.log(`  Owners: [email] / owner123`);
    console.log(`  Customers: [email] / customer123`);
    console.log(`\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedAll();

