import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Truck, Mail, Phone, CreditCard, Car, Hash } from 'lucide-react';
import type { Driver, CreateDriverInput, UpdateDriverInput } from '../../../server/src/schema';

export function DriverManagement() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  
  const [formData, setFormData] = useState<CreateDriverInput>({
    name: '',
    email: '',
    phone: '',
    license_number: '',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_license_plate: '',
    availability_status: 'available'
  });

  const loadDrivers = useCallback(async () => {
    try {
      const result = await trpc.getDrivers.query();
      setDrivers(result);
    } catch (error) {
      console.error('Failed to load drivers:', error);
    }
  }, []);

  useEffect(() => {
    loadDrivers();
  }, [loadDrivers]);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      license_number: '',
      vehicle_make: '',
      vehicle_model: '',
      vehicle_license_plate: '',
      availability_status: 'available'
    });
    setEditingDriver(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (editingDriver) {
        // Update existing driver
        const updateData: UpdateDriverInput = {
          id: editingDriver.id,
          ...formData
        };
        const updatedDriver = await trpc.updateDriver.mutate(updateData);
        setDrivers((prev: Driver[]) => prev.map(driver => driver.id === updatedDriver.id ? updatedDriver : driver));
      } else {
        // Create new driver
        const newDriver = await trpc.createDriver.mutate(formData);
        setDrivers((prev: Driver[]) => [...prev, newDriver]);
      }
      
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save driver:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      license_number: driver.license_number,
      vehicle_make: driver.vehicle_make,
      vehicle_model: driver.vehicle_model,
      vehicle_license_plate: driver.vehicle_license_plate,
      availability_status: driver.availability_status
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (driverId: number) => {
    try {
      await trpc.deleteDriver.mutate({ id: driverId });
      setDrivers((prev: Driver[]) => prev.filter(driver => driver.id !== driverId));
    } catch (error) {
      console.error('Failed to delete driver:', error);
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    return status === 'available' ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
        🟢 Available
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-100">
        🔴 Unavailable
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Driver Management</h2>
          <p className="text-gray-600 mt-1">Manage fleet drivers and their vehicle information</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Driver
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingDriver ? 'Edit Driver' : 'Add New Driver'}</DialogTitle>
              <DialogDescription>
                {editingDriver ? 'Update driver and vehicle information below.' : 'Enter driver and vehicle details to add them to the fleet.'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 border-b pb-2">Personal Information</h4>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateDriverInput) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Enter driver's full name"
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
                        setFormData((prev: CreateDriverInput) => ({ ...prev, email: e.target.value }))
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
                        setFormData((prev: CreateDriverInput) => ({ ...prev, phone: e.target.value }))
                      }
                      placeholder="Enter phone number"
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="license_number">License Number</Label>
                    <Input
                      id="license_number"
                      value={formData.license_number}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateDriverInput) => ({ ...prev, license_number: e.target.value }))
                      }
                      placeholder="Enter driver's license number"
                      required
                    />
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 border-b pb-2">Vehicle Information</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="vehicle_make">Make</Label>
                      <Input
                        id="vehicle_make"
                        value={formData.vehicle_make}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateDriverInput) => ({ ...prev, vehicle_make: e.target.value }))
                        }
                        placeholder="e.g., Toyota"
                        required
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="vehicle_model">Model</Label>
                      <Input
                        id="vehicle_model"
                        value={formData.vehicle_model}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateDriverInput) => ({ ...prev, vehicle_model: e.target.value }))
                        }
                        placeholder="e.g., Camry"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="vehicle_license_plate">License Plate</Label>
                    <Input
                      id="vehicle_license_plate"
                      value={formData.vehicle_license_plate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateDriverInput) => ({ ...prev, vehicle_license_plate: e.target.value.toUpperCase() }))
                      }
                      placeholder="Enter license plate number"
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="availability_status">Availability Status</Label>
                    <Select
                      value={formData.availability_status}
                      onValueChange={(value: 'available' | 'unavailable') =>
                        setFormData((prev: CreateDriverInput) => ({ ...prev, availability_status: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select availability status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">🟢 Available</SelectItem>
                        <SelectItem value="unavailable">🔴 Unavailable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : editingDriver ? 'Update Driver' : 'Add Driver'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Drivers List */}
      {drivers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Truck className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No drivers found</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first driver to the fleet.</p>
            <Button onClick={openCreateDialog} className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Add First Driver
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {drivers.map((driver: Driver) => (
            <Card key={driver.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Truck className="h-5 w-5 text-green-600" />
                        {driver.name}
                      </CardTitle>
                      <CardDescription>
                        Driver ID: {driver.id} • Joined: {driver.created_at.toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {getStatusBadge(driver.availability_status)}
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(driver)}
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
                            <AlertDialogTitle>Delete Driver</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {driver.name} from the fleet? This action cannot be undone and may affect existing routes.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(driver.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Personal Info */}
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{driver.email}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{driver.phone}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">License: {driver.license_number}</span>
                    </div>
                  </div>
                </div>

                {/* Vehicle Info */}
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Vehicle Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{driver.vehicle_make} {driver.vehicle_model}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {driver.vehicle_license_plate}
                      </span>
                    </div>
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