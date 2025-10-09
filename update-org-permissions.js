// Script to update organization permissions
// Run this in the browser console while logged in to your organization

async function updateOrganizationPermissions() {
  try {
    // First, get the current organization ID from localStorage or session
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const organizationId = user.organizationId;
    
    if (!organizationId) {
      console.error('No organization ID found. Make sure you are logged in.');
      return;
    }
    
    console.log('Updating permissions for organization:', organizationId);
    
    // Get current permissions
    const currentResponse = await fetch(`http://localhost:6000/api/organizations/${organizationId}/permissions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    if (!currentResponse.ok) {
      console.error('Failed to get current permissions:', currentResponse.status);
      return;
    }
    
    const currentData = await currentResponse.json();
    console.log('Current permissions:', currentData);
    
    // Update all permissions to enabled: true
    const updatedPermissions = currentData.data.permissions.map(permission => ({
      ...permission,
      enabled: true
    }));
    
    // Update permissions
    const updateResponse = await fetch(`http://localhost:6000/api/organizations/${organizationId}/permissions`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        permissions: updatedPermissions
      })
    });
    
    if (updateResponse.ok) {
      const result = await updateResponse.json();
      console.log('✅ Permissions updated successfully!', result);
      console.log('🔄 Please refresh the page to see the changes.');
    } else {
      console.error('❌ Failed to update permissions:', updateResponse.status);
      const errorData = await updateResponse.json();
      console.error('Error details:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Error updating permissions:', error);
  }
}

// Run the function
updateOrganizationPermissions();
