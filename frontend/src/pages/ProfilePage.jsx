import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="container-custom py-16 flex justify-center min-h-[70vh]">
      <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-extrabold text-dark mb-6 border-b border-gray-100 pb-4">User Profile</h1>
        
        {user && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-medium uppercase tracking-wide mb-1">Name</label>
              <p className="text-lg font-medium text-dark bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">{user.name}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-medium uppercase tracking-wide mb-1">Email Address</label>
              <p className="text-lg font-medium text-dark bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">{user.email}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-medium uppercase tracking-wide mb-1">Account Role</label>
              <p className="text-lg font-medium text-dark bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                {user.isAdmin ? <span className="text-primary font-bold">Administrator</span> : 'Customer'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
