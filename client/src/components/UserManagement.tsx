import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, User as UserIcon, Mail, Phone, MapPin } from 'lucide-react';
import type { User, CreateUserInput, UpdateUserInput } from '../../../server/src/schema';

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [formData, setFormData] = useState<CreateUserInput>({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const loadUsers = useCallback(async () => {
    try {
      const result = await trpc.getUsers.query();
      setUsers(result);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: ''
    });
    setEditingUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (editingUser) {
        // Update existing user
        const updateData: UpdateUserInput = {
          id: editingUser.id,
          ...formData
        };
        const updatedUser = await trpc.updateUser.mutate(updateData);
        setUsers((prev: User[]) => prev.map(user => user.id === updatedUser.id ? updatedUser : user));
      } else {
        // Create new user
        const newUser = await trpc.createUser.mutate(formData);
        setUsers((prev: User[]) => [...prev, newUser]);
      }
      
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (userId: number) => {
    try {
      await trpc.deleteUser.mutate({ id: userId });
      setUsers((prev: User[]) => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600 mt-1">Manage customer information and contacts</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
              <DialogDescription>
                {editingUser ? 'Update user information below.' : 'Enter the user details below to create a new account.'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateUserInput) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Enter full name"
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateUserInput) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="Enter email address"
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateUserInput) => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="Enter phone number"
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateUserInput) => ({ ...prev, address: e.target.value }))
                    }
                    placeholder="Enter full address"
                    required
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users List */}
      {users.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserIcon className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first user.</p>
            <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add First User
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {users.map((user: User) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <UserIcon className="h-5 w-5 text-blue-600" />
                      {user.name}
                    </CardTitle>
                    <CardDescription>
                      User ID: {user.id} • Created: {user.created_at.toLocaleDateString()}
                    </CardDescription>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete User</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {user.name}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(user.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{user.phone}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{user.address}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}