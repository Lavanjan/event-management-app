import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';
import { User } from '../entities';
import * as bcrypt from 'bcrypt';

async function resetUserPassword() {
  const dataSource = AppDataSource;
  
  try {
    await dataSource.initialize();
    console.log('📦 Database connected');
    
    const userRepository = dataSource.getRepository(User);
    
    // Find the existing user
    const existingUserId = '293fb000-6781-44d9-bbb1-79ecdd2d0daf';
    const newPassword = 'admin123';
    
    const existingUser = await userRepository.findOne({
      where: { id: existingUserId }
    });
    
    if (!existingUser) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`✅ Found user: ${existingUser.email}`);
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update the user's password
    existingUser.password = hashedPassword;
    await userRepository.save(existingUser);
    
    console.log(`✅ Password reset for user: ${existingUser.email}`);
    console.log(`🔑 New password: ${newPassword}`);
    
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('📦 Database connection closed');
  }
}

resetUserPassword();
