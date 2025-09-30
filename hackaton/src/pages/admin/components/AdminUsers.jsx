import { useState, useEffect } from 'react';
import { getUsers, updateUserStatus } from '../../../api';
import { Button } from '../../../ui/Button';
import { Skeleton } from '../../../ui/Skeleton';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUsers().then(data => {
      setUsers(data);
      setLoading(false);
    });
  }, []);

  const handleStatusUpdate = async (userId, status) => {
    const result = await updateUserStatus(userId, status);
    if (!result.error) {
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status } : user
      ));
    }
  };

  if (loading) return <div className="max-w-4xl mx-auto py-8 px-4"><Skeleton height="h-32" /></div>;

  return (
    <div className="bg-white shadow rounded-lg">
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="px-6 py-3 border-b">Name</th>
            <th className="px-6 py-3 border-b">Email</th>
            <th className="px-6 py-3 border-b">Role</th>
            <th className="px-6 py-3 border-b">Status</th>
            <th className="px-6 py-3 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td className="px-6 py-4">{user.name}</td>
              <td className="px-6 py-4">{user.email}</td>
              <td className="px-6 py-4">{user.role}</td>
              <td className="px-6 py-4">{user.status}</td>
              <td className="px-6 py-4 space-x-2">
                <Button onClick={() => handleStatusUpdate(user.id, 'BANNED')} variant="danger" size="sm">Ban</Button>
                <Button onClick={() => handleStatusUpdate(user.id, 'ACTIVE')} variant="success" size="sm">Approve</Button>
                <Button onClick={() => handleStatusUpdate(user.id, 'DELETED')} variant="outline" size="sm">Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
