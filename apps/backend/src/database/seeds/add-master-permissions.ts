import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';
import { MasterPermission } from '../entities';

async function addMasterPermissions() {
  const dataSource = AppDataSource;
  
  try {
    await dataSource.initialize();
    console.log('📦 Database connected');
    
    const masterPermissionRepository = dataSource.getRepository(MasterPermission);
    
    // Additional permissions that need to be added to master permissions
    const newPermissions = [
      // Payments module
      {
        key: 'payments.read',
        name: 'View Payments',
        description: 'View payment records and transaction history',
        category: 'Payments',
        module: 'payments',
        action: 'read',
        defaultEnabled: true,
        sortOrder: 100,
      },
      {
        key: 'payments.create',
        name: 'Create Payments',
        description: 'Process new payments and transactions',
        category: 'Payments',
        module: 'payments',
        action: 'create',
        defaultEnabled: true,
        sortOrder: 101,
      },
      {
        key: 'payments.update',
        name: 'Update Payments',
        description: 'Modify payment records and status',
        category: 'Payments',
        module: 'payments',
        action: 'update',
        defaultEnabled: true,
        sortOrder: 102,
      },
      {
        key: 'payments.process',
        name: 'Process Payments',
        description: 'Process and authorize payments',
        category: 'Payments',
        module: 'payments',
        action: 'process',
        defaultEnabled: true,
        sortOrder: 103,
      },
      {
        key: 'payments.refund',
        name: 'Process Refunds',
        description: 'Process payment refunds and reversals',
        category: 'Payments',
        module: 'payments',
        action: 'refund',
        defaultEnabled: true,
        sortOrder: 104,
      },
      
      // Roles module
      {
        key: 'roles.read',
        name: 'View Roles',
        description: 'View roles and role assignments',
        category: 'Roles',
        module: 'roles',
        action: 'read',
        defaultEnabled: true,
        sortOrder: 200,
      },
      {
        key: 'roles.create',
        name: 'Create Roles',
        description: 'Create new roles and assign permissions',
        category: 'Roles',
        module: 'roles',
        action: 'create',
        defaultEnabled: true,
        sortOrder: 201,
      },
      {
        key: 'roles.update',
        name: 'Update Roles',
        description: 'Modify existing roles and permissions',
        category: 'Roles',
        module: 'roles',
        action: 'update',
        defaultEnabled: true,
        sortOrder: 202,
      },
      {
        key: 'roles.delete',
        name: 'Delete Roles',
        description: 'Remove roles from the system',
        category: 'Roles',
        module: 'roles',
        action: 'delete',
        defaultEnabled: true,
        sortOrder: 203,
      },
      
      // Product admin permissions
      {
        key: 'product.admin',
        name: 'Product Administration',
        description: 'Full product administration access',
        category: 'Product',
        module: 'product',
        action: 'admin',
        defaultEnabled: false,
        sortOrder: 300,
      },
      {
        key: 'product.packages',
        name: 'Manage Feature Packages',
        description: 'Create and manage feature packages',
        category: 'Product',
        module: 'product',
        action: 'packages',
        defaultEnabled: false,
        sortOrder: 301,
      },
      {
        key: 'product.organizations',
        name: 'Manage Organizations',
        description: 'Create and manage organizations',
        category: 'Product',
        module: 'product',
        action: 'organizations',
        defaultEnabled: false,
        sortOrder: 302,
      },
    ];
    
    console.log(`🔧 Adding ${newPermissions.length} new master permissions`);
    
    for (const permissionData of newPermissions) {
      const existingPermission = await masterPermissionRepository.findOne({
        where: { key: permissionData.key }
      });
      
      if (!existingPermission) {
        const masterPermission = masterPermissionRepository.create(permissionData);
        await masterPermissionRepository.save(masterPermission);
        console.log(`✅ Created master permission: ${permissionData.key}`);
      } else {
        console.log(`⏭️  Master permission already exists: ${permissionData.key}`);
      }
    }
    
    // Summary
    const totalPermissions = await masterPermissionRepository.count();
    console.log(`\n🎉 Master permissions setup complete!`);
    console.log(`📋 Total master permissions: ${totalPermissions}`);
    
  } catch (error) {
    console.error('❌ Error adding master permissions:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('📦 Database connection closed');
  }
}

addMasterPermissions();
