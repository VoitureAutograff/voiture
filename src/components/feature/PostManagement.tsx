import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { createNotification } from '../base/NotificationSystem';

interface Post {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  location: string | null;
  status: 'pending' | 'active' | 'sold' | 'hidden';
  vehicle_type: 'car' | 'bike';
  images: string[] | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  posted_by: string;
}

interface PostManagementProps {
  post: Post;
  onUpdate: (updatedPost: Post) => void;
  onDelete: (postId: string) => void;
  userRole?: string;
}

export default function PostManagement({ post, onUpdate, onDelete, userRole }: PostManagementProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    title: post.title,
    price: post.price,
    location: post.location || '',
    description: post.description || '',
    status: post.status
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('vehicle_listings')
        .update({
          title: editForm.title,
          price: editForm.price,
          location: editForm.location || null,
          description: editForm.description || null,
          status: editForm.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', post.id)
        .select()
        .single();

      if (error) throw error;

      onUpdate(data);
      setShowEditModal(false);
      
      // Create notification for status changes
      if (editForm.status !== post.status && editForm.status === 'sold') {
        await createNotification(
          post.posted_by,
          `Your vehicle "${post.title}" has been marked as sold!`,
          post.id,
          'vehicle_sold'
        );
      }

    } catch (error: any) {
      console.error('Error updating post:', error);
      alert('Failed to update post: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from('vehicle_listings')
        .delete()
        .eq('id', post.id);

      if (error) throw error;

      onDelete(post.id);
      setShowDeleteConfirm(false);

    } catch (error: any) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const markAsSold = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('vehicle_listings')
        .update({ 
          status: 'sold',
          updated_at: new Date().toISOString()
        })
        .eq('id', post.id)
        .select()
        .single();

      if (error) throw error;

      onUpdate(data);
      
      // Create notification
      await createNotification(
        post.posted_by,
        `Congratulations! Your vehicle "${post.title}" has been marked as sold!`,
        post.id,
        'vehicle_sold'
      );

    } catch (error: any) {
      console.error('Error marking as sold:', error);
      alert('Failed to mark as sold: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'sold': return 'bg-blue-100 text-blue-800';
      case 'hidden': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        {/* Status badge */}
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
          {post.status}
        </span>

        {/* Quick actions */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setShowEditModal(true)}
            className="text-blue-600 hover:text-blue-700 p-1 rounded cursor-pointer"
            title="Edit post"
          >
            <i className="ri-edit-line"></i>
          </button>

          {post.status === 'active' && (
            <button
              onClick={markAsSold}
              disabled={loading}
              className="text-green-600 hover:text-green-700 p-1 rounded cursor-pointer disabled:opacity-50"
              title="Mark as sold"
            >
              <i className="ri-check-line"></i>
            </button>
          )}

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-600 hover:text-red-700 p-1 rounded cursor-pointer"
            title="Delete post"
          >
            <i className="ri-delete-bin-line"></i>
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Post</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={editForm.price}
                    onChange={(e) => setEditForm({...editForm, price: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value as any})}
                    className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="hidden">Hidden</option>
                    <option value="sold">Sold</option>
                    {userRole === 'admin' && <option value="pending">Pending</option>}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-delete-bin-line text-red-600 text-xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Post</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{post.title}"? This action cannot be undone.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}