import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';
import { User, Role } from '../entities';

async function assignExistingUserRole() {
  const dataSource = AppDataSource;
  
  try {
    await dataSource.initialize();
    console.log('📦 Database connected');
    
    const userRepository = dataSource.getRepository(User);
    const roleRepository = dataSource.getRepository(Role);
    
    // Find the existing user with ID from conversation history
    const existingUserId = '293fb000-6781-44d9-bbb1-79ecdd2d0daf';
    const organizationId = '92c8966d-a30e-4dd3-9e22-e0ba7ee20991';
    
    const existingUser = await userRepository.findOne({
      where: { id: existingUserId },
      relations: ['roles']
    });
    
    if (!existingUser) {
      console.log('❌ Existing user not found');
      return;
    }
    
    console.log(`✅ Found existing user: ${existingUser.email}`);
    
    // Find the Organization Admin role for the organization
    const adminRole = await roleRepository.findOne({
      where: { 
        name: 'Organization Admin', 
        organizationId: organizationId 
      }
    });
    
    if (!adminRole) {
      console.log('❌ Organization Admin role not found');
      return;
    }
    
    console.log(`✅ Found Organization Admin role: ${adminRole.id}`);
    
    // Check if user already has the role
    const hasRole = existingUser.roles.some(role => role.id === adminRole.id);
    
    if (hasRole) {
      console.log('✅ User already has Organization Admin role');
    } else {
      // Assign the role to the user
      existingUser.roles.push(adminRole);
      await userRepository.save(existingUser);
      console.log('✅ Assigned Organization Admin role to existing user');
    }
    
    // Update user type to organization_admin
    if (existingUser.userType !== 'organization_admin') {
      existingUser.userType = 'organization_admin' as any;
      await userRepository.save(existingUser);
      console.log('✅ Updated user type to organization_admin');
    }
    
    // Update organization ID if needed
    if (existingUser.organizationId !== organizationId) {
      existingUser.organizationId = organizationId;
      await userRepository.save(existingUser);
      console.log('✅ Updated user organization ID');
    }
    
    console.log('🎉 User role assignment completed successfully');
  } catch (error) {
    console.error('❌ Error assigning user role:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('📦 Database connection closed');
  }
}

assignExistingUserRole();
