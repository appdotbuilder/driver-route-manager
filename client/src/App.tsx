import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserManagement } from '@/components/UserManagement';
import { DriverManagement } from '@/components/DriverManagement';
import { RouteManagement } from '@/components/RouteManagement';
import { RouteReports } from '@/components/RouteReports';
import { Truck, Users, Route, BarChart3 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { trpc } from '@/utils/trpc';

function App() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDrivers: 0,
    totalRoutes: 0,
    availableDrivers: 0
  });

  // Load dashboard stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        const [users, drivers, routes] = await Promise.all([
          trpc.getUsers.query(),
          trpc.getDrivers.query(),
          trpc.getRoutes.query()
        ]);
        
        const availableDrivers = drivers.filter(d => d.availability_status === 'available').length;
        
        setStats({
          totalUsers: users.length,
          totalDrivers: drivers.length,
          totalRoutes: routes.length,
          availableDrivers
        });
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
    };

    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <Truck className="h-8 w-8 text-blue-600" />
            Fleet Route Manager
          </h1>
          <p className="text-gray-600 text-lg">Manage drivers, routes, and generate comprehensive reports</p>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Total Drivers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.totalDrivers}</div>
              <div className="text-xs text-gray-500 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {stats.availableDrivers} available
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Route className="h-4 w-4" />
                Total Routes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.totalRoutes}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Active Routes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {/* This will be calculated from route statuses */}
                <Badge variant="outline">Coming Soon</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Card className="shadow-lg">
          <Tabs defaultValue="users" className="w-full">
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-4 bg-gray-100">
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="drivers" className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Drivers
                </TabsTrigger>
                <TabsTrigger value="routes" className="flex items-center gap-2">
                  <Route className="h-4 w-4" />
                  Routes
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Reports
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="users" className="mt-0">
                <UserManagement />
              </TabsContent>
              
              <TabsContent value="drivers" className="mt-0">
                <DriverManagement />
              </TabsContent>
              
              <TabsContent value="routes" className="mt-0">
                <RouteManagement />
              </TabsContent>
              
              <TabsContent value="reports" className="mt-0">
                <RouteReports />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

export default App;