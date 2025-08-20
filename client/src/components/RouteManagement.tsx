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
import { Plus, Edit, Trash2, Route, MapPin, Clock, Calendar, Truck, Navigation } from 'lucide-react';
import type { RouteWithDriver, Driver, CreateRouteInput, UpdateRouteInput } from '../../../server/src/schema';

export function RouteManagement() {
  const [routes, setRoutes] = useState<RouteWithDriver[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RouteWithDriver | null>(null);
  
  const [formData, setFormData] = useState<CreateRouteInput>({
    driver_id: 0,
    origin: '',
    destination: '',
    distance: 0,
    estimated_duration: 0,
    start_datetime: new Date(),
    end_datetime: null,
    route_status: 'pending'
  });

  const loadRoutes = useCallback(async () => {
    try {
      const result = await trpc.getRoutes.query();
      setRoutes(result);
    } catch (error) {
      console.error('Failed to load routes:', error);
    }
  }, []);

  const loadDrivers = useCallback(async () => {
    try {
      const result = await trpc.getDrivers.query();
      setDrivers(result);
    } catch (error) {
      console.error('Failed to load drivers:', error);
    }
  }, []);

  useEffect(() => {
    loadRoutes();
    loadDrivers();
  }, [loadRoutes, loadDrivers]);

  const resetForm = () => {
    setFormData({
      driver_id: 0,
      origin: '',
      destination: '',
      distance: 0,
      estimated_duration: 0,
      start_datetime: new Date(),
      end_datetime: null,
      route_status: 'pending'
    });
    setEditingRoute(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (editingRoute) {
        // Update existing route
        const updateData: UpdateRouteInput = {
          id: editingRoute.id,
          ...formData
        };
        await trpc.updateRoute.mutate(updateData);
      } else {
        // Create new route
        await trpc.createRoute.mutate(formData);
      }
      
      resetForm();
      setIsDialogOpen(false);
      // Reload routes to ensure we have updated data with driver info
      await loadRoutes();
    } catch (error) {
      console.error('Failed to save route:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (route: RouteWithDriver) => {
    setEditingRoute(route);
    setFormData({
      driver_id: route.driver_id,
      origin: route.origin,
      destination: route.destination,
      distance: route.distance,
      estimated_duration: route.estimated_duration,
      start_datetime: route.start_datetime,
      end_datetime: route.end_datetime,
      route_status: route.route_status
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (routeId: number) => {
    try {
      await trpc.deleteRoute.mutate({ id: routeId });
      setRoutes((prev: RouteWithDriver[]) => prev.filter(route => route.id !== routeId));
    } catch (error) {
      console.error('Failed to delete route:', error);
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">⏳ Pending</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">🚛 In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">✅ Completed</Badge>;
      case 'cancelled':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">❌ Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Route Management</h2>
          <p className="text-gray-600 mt-1">Plan and track driver routes and deliveries</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Route
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRoute ? 'Edit Route' : 'Create New Route'}</DialogTitle>
              <DialogDescription>
                {editingRoute ? 'Update route information below.' : 'Enter route details to create a new delivery route.'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                {/* Driver Selection */}
                <div className="grid gap-2">
                  <Label htmlFor="driver_id">Assign Driver</Label>
                  <Select
                    value={formData.driver_id.toString()}
                    onValueChange={(value: string) =>
                      setFormData((prev: CreateRouteInput) => ({ ...prev, driver_id: parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.filter(d => d.availability_status === 'available').map((driver: Driver) => (
                        <SelectItem key={driver.id} value={driver.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            {driver.name} - {driver.vehicle_make} {driver.vehicle_model}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {drivers.filter(d => d.availability_status === 'available').length === 0 && (
                    <p className="text-sm text-red-600">No available drivers. Please ensure drivers are marked as available.</p>
                  )}
                </div>

                {/* Route Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 border-b pb-2">Route Details</h4>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="origin">Origin</Label>
                    <Input
                      id="origin"
                      value={formData.origin}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateRouteInput) => ({ ...prev, origin: e.target.value }))
                      }
                      placeholder="Starting location"
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="destination">Destination</Label>
                    <Input
                      id="destination"
                      value={formData.destination}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateRouteInput) => ({ ...prev, destination: e.target.value }))
                      }
                      placeholder="Destination location"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="distance">Distance (km)</Label>
                      <Input
                        id="distance"
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData.distance}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateRouteInput) => ({ ...prev, distance: parseFloat(e.target.value) || 0 }))
                        }
                        placeholder="0.0"
                        required
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="estimated_duration">Duration (min)</Label>
                      <Input
                        id="estimated_duration"
                        type="number"
                        min="1"
                        value={formData.estimated_duration}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateRouteInput) => ({ ...prev, estimated_duration: parseInt(e.target.value) || 0 }))
                        }
                        placeholder="60"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Schedule */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 border-b pb-2">Schedule</h4>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="start_datetime">Start Date & Time</Label>
                    <Input
                      id="start_datetime"
                      type="datetime-local"
                      value={formData.start_datetime.toISOString().slice(0, 16)}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateRouteInput) => ({ ...prev, start_datetime: new Date(e.target.value) }))
                      }
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="end_datetime">End Date & Time (Optional)</Label>
                    <Input
                      id="end_datetime"
                      type="datetime-local"
                      value={formData.end_datetime ? formData.end_datetime.toISOString().slice(0, 16) : ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateRouteInput) => ({ 
                          ...prev, 
                          end_datetime: e.target.value ? new Date(e.target.value) : null 
                        }))
                      }
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="route_status">Status</Label>
                    <Select
                      value={formData.route_status}
                      onValueChange={(value: 'pending' | 'in_progress' | 'completed' | 'cancelled') =>
                        setFormData((prev: CreateRouteInput) => ({ ...prev, route_status: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select route status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">⏳ Pending</SelectItem>
                        <SelectItem value="in_progress">🚛 In Progress</SelectItem>
                        <SelectItem value="completed">✅ Completed</SelectItem>
                        <SelectItem value="cancelled">❌ Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || formData.driver_id === 0}>
                  {isLoading ? 'Saving...' : editingRoute ? 'Update Route' : 'Create Route'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Routes List */}
      {routes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Route className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No routes found</h3>
            <p className="text-gray-500 mb-4">Create your first route to get started with deliveries.</p>
            <Button onClick={openCreateDialog} className="bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" />
              Create First Route
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {routes.map((route: RouteWithDriver) => (
            <Card key={route.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Navigation className="h-5 w-5 text-orange-600" />
                      {route.origin} → {route.destination}
                    </CardTitle>
                    <CardDescription>
                      Route #{route.id} • Created: {route.created_at.toLocaleDateString()}
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {getStatusBadge(route.route_status)}
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(route)}
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
                            <AlertDialogTitle>Delete Route</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this route from {route.origin} to {route.destination}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(route.id)}
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
                {/* Driver Information */}
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Assigned Driver</h4>
                  <div className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded-md">
                    <Truck className="h-4 w-4 text-gray-600" />
                    <span className="font-medium">{route.driver.name}</span>
                    <span className="text-gray-500">•</span>
                    <span>{route.driver.vehicle_make} {route.driver.vehicle_model}</span>
                    <span className="text-gray-500">•</span>
                    <span className="font-mono text-xs bg-white px-2 py-1 rounded">
                      {route.driver.vehicle_license_plate}
                    </span>
                  </div>
                </div>

                {/* Route Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Distance</p>
                      <p className="text-sm font-medium">{route.distance} km</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="text-sm font-medium">{formatDuration(route.estimated_duration)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Start</p>
                      <p className="text-sm font-medium">{formatDateTime(route.start_datetime)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">End</p>
                      <p className="text-sm font-medium">
                        {route.end_datetime ? formatDateTime(route.end_datetime) : 'Not set'}
                      </p>
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