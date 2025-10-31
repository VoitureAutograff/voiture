import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import ProfilePicture from '../../../components/base/ProfilePicture';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  is_super_admin: boolean;
  status: string;
  last_login_at?: string;
  created_at?: string;
  auth_user_id?: string;
  role?: string;
}

interface AdminManagementProps {
  adminUsers: AdminUser[];
  currentAdmin: AdminUser;
  onRefresh: () => void;
  searchFilter: string;
}

export default function AdminManagement({ adminUsers, currentAdmin, onRefresh, searchFilter }: AdminManagementProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFilteredAdmins = () => {
    if (!searchFilter) return adminUsers;
    const term = searchFilter.toLowerCase();
    return adminUsers.filter(admin =>
      admin.name?.toLowerCase().includes(term) ||
      admin.email?.toLowerCase().includes(term) ||
      admin.status?.toLowerCase().includes(term)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;
    const isSuperAdmin = formData.get('is_super_admin') === 'true';

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/create-admin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ email, password, name, isSuperAdmin })
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create admin');
      }

      alert('Admin created successfully!');
      setShowCreateModal(false);
      onRefresh();
    } catch (err: any) {
      console.error('Error creating admin:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingAdmin) return;

    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const isSuperAdmin = formData.get('is_super_admin') === 'true';
    const status = formData.get('status') as string;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/update-admin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            adminId: editingAdmin.id,
            name,
            email,
            isSuperAdmin,
            status
          })
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update admin');
      }

      alert('Admin updated successfully!');
      setShowEditModal(false);
      setEditingAdmin(null);
      onRefresh();
    } catch (err: any) {
      console.error('Error updating admin:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdmin = async (admin: AdminUser) => {
    if (!confirm(`Are you sure you want to delete admin "${admin.name}"? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/delete-admin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ adminId: admin.id })
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete admin');
      }

      alert('Admin deleted successfully!');
      onRefresh();
    } catch (err: any) {
      console.error('Error deleting admin:', err);
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (admin: AdminUser) => {
    const newStatus = admin.status === 'active' ? 'inactive' : 'active';
    
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/update-admin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            adminId: admin.id,
            status: newStatus
          })
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update status');
      }

      alert(`Admin ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
      onRefresh();
    } catch (err: any) {
      console.error('Error updating status:', err);
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Admin Management</h3>
            {currentAdmin.is_super_admin && (
              <p className="text-sm text-gray-500 mt-1">Manage admin users and permissions</p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {currentAdmin.is_super_admin && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium cursor-pointer whitespace-nowrap"
              >
                <i className="ri-add-line mr-2"></i>
                Add Admin
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Admin
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Login
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {getFilteredAdmins().map((admin) => (
              <tr key={admin.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <ProfilePicture src={undefined} name={admin.name} size="sm" />
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{admin.name}</div>
                      <div className="text-sm text-gray-500">{admin.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      admin.is_super_admin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {admin.is_super_admin ? 'Super Admin' : 'Admin'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(admin.status)}`}>
                    {admin.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {admin.last_login_at ? new Date(admin.last_login_at).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    {currentAdmin.is_super_admin && admin.id !== currentAdmin.id && (
                      <>
                        <button
                          onClick={() => {
                            setEditingAdmin(admin);
                            setShowEditModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 cursor-pointer"
                          title="Edit admin"
                        >
                          <i className="ri-edit-line"></i>
                        </button>
                        <button
                          onClick={() => handleToggleStatus(admin)}
                          className={`${
                            admin.status === 'active' ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'
                          } cursor-pointer`}
                          title={admin.status === 'active' ? 'Deactivate' : 'Activate'}
                          disabled={loading}
                        >
                          <i className={admin.status === 'active' ? 'ri-pause-line' : 'ri-play-line'}></i>
                        </button>
                        <button
                          onClick={() => handleDeleteAdmin(admin)}
                          className="text-red-600 hover:text-red-900 cursor-pointer"
                          title="Delete admin"
                          disabled={loading}
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </>
                    )}
                    {admin.id === currentAdmin.id && (
                      <span className="text-xs text-gray-400">(You)</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {getFilteredAdmins().length === 0 && adminUsers.length > 0 && (
          <div className="text-center py-12">
            <i className="ri-search-line text-4xl text-gray-300 mb-4"></i>
            <p className="text-gray-500">No admins match your search</p>
          </div>
        )}

        {adminUsers.length === 0 && (
          <div className="text-center py-12">
            <i className="ri-admin-line text-4xl text-gray-300 mb-4"></i>
            <p className="text-gray-500">No admin users found</p>
          </div>
        )}
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleCreateAdmin}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Admin</h3>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name *</label>
                      <input
                        type="text"
                        name="name"
                        required
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email *</label>
                      <input
                        type="email"
                        name="email"
                        required
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Password *</label>
                      <input
                        type="password"
                        name="password"
                        required
                        minLength={6}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">Minimum 6 characters</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Role *</label>
                      <select
                        name="is_super_admin"
                        defaultValue="false"
                        className="mt-1 block w-full pr-8 border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                      >
                        <option value="false">Admin</option>
                        <option value="true">Super Admin</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 cursor-pointer whitespace-nowrap"
                  >
                    {loading ? 'Creating...' : 'Create Admin'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setError(null);
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm cursor-pointer whitespace-nowrap"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {showEditModal && editingAdmin && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleUpdateAdmin}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Admin</h3>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name *</label>
                      <input
                        type="text"
                        name="name"
                        defaultValue={editingAdmin.name}
                        required
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email *</label>
                      <input
                        type="email"
                        name="email"
                        defaultValue={editingAdmin.email}
                        required
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Role *</label>
                      <select
                        name="is_super_admin"
                        defaultValue={editingAdmin.is_super_admin ? 'true' : 'false'}
                        className="mt-1 block w-full pr-8 border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                      >
                        <option value="false">Admin</option>
                        <option value="true">Super Admin</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status *</label>
                      <select
                        name="status"
                        defaultValue={editingAdmin.status}
                        className="mt-1 block w-full pr-8 border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 cursor-pointer whitespace-nowrap"
                  >
                    {loading ? 'Updating...' : 'Update Admin'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingAdmin(null);
                      setError(null);
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm cursor-pointer whitespace-nowrap"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
