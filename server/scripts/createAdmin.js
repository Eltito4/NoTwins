import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

async function createSuperAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Admin user details - use environment variables or secure defaults
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@notwins.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'SuperSecure2024!';
    const adminName = 'Super Admin';

    // Check if admin user already exists
    let adminUser = await User.findOne({ email: adminEmail });
    
    if (!adminUser) {
      // Create admin user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      adminUser = new User({
        email: adminEmail,
        password: hashedPassword,
        name: adminName
      });

      await adminUser.save();
      console.log('✅ Admin user created');
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    // Check if admin record exists
    let adminRecord = await Admin.findOne({ userId: adminUser._id });
    
    if (!adminRecord) {
      // Create admin record with all permissions
      adminRecord = new Admin({
        userId: adminUser._id,
        role: 'super_admin',
        permissions: [
          'view_all_users',
          'manage_users',
          'view_all_events',
          'manage_events',
          'view_analytics',
          'manage_ai_settings',
          'view_financial_data',
          'manage_sponsors',
          'export_data',
          'system_settings'
        ],
        isActive: true
      });

      await adminRecord.save();
      console.log('✅ Admin permissions created');
    } else {
      console.log('ℹ️ Admin permissions already exist');
    }

    console.log('\n🎉 Super Admin Setup Complete!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password: [HIDDEN FOR SECURITY]');
    console.log('⚠️ IMPORTANT: Admin credentials created. Store them securely!');
    console.log('💡 TIP: Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables for custom credentials');
    console.log('\n🚀 You can now login as admin and access the admin dashboard');

  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

createSuperAdmin();