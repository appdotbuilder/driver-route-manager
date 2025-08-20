import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { BarChart3, Search, Download, Calendar, Truck, MapPin, Clock, TrendingUp, Navigation } from 'lucide-react';
import type { RouteReportSummary, RouteReportFilter, Driver, RouteWithDriver } from '../../../server/src/schema';

export function RouteReports() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [reportData, setReportData] = useState<RouteReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [filters, setFilters] = useState<RouteReportFilter>({
    driver_id: undefined,
    start_date: undefined,
    end_date: undefined,
    route_status: undefined
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

  const generateReport = async () => {
    setIsLoading(true);
    try {
      const result = await trpc.getRouteReport.query(filters);
      setReportData(result);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      driver_id: undefined,
      start_date: undefined,
      end_date: undefined,
      route_status: undefined
    });
    setReportData(null);
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

  const getCompletionRate = () => {
    if (!reportData || reportData.total_routes === 0) return 0;
    return Math.round((reportData.completed_routes / reportData.total_routes) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Route Reports</h2>
          <p className="text-gray-600 mt-1">Generate detailed reports and analytics for route performance</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
          {reportData && (
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            Report Filters
          </CardTitle>
          <CardDescription>
            Set your criteria to generate custom route reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Driver Filter */}
            <div className="grid gap-2">
              <Label htmlFor="driver-filter">Driver</Label>
              <Select
                value={filters.driver_id?.toString() || 'all'}
                onValueChange={(value: string) =>
                  setFilters((prev: RouteReportFilter) => ({
                    ...prev,
                    driver_id: value === 'all' ? undefined : parseInt(value)
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Drivers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Drivers</SelectItem>
                  {drivers.map((driver: Driver) => (
                    <SelectItem key={driver.id} value={driver.id.toString()}>
                      {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date Filter */}
            <div className="grid gap-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={filters.start_date ? filters.start_date.toISOString().split('T')[0] : ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFilters((prev: RouteReportFilter) => ({
                    ...prev,
                    start_date: e.target.value ? new Date(e.target.value) : undefined
                  }))
                }
              />
            </div>

            {/* End Date Filter */}
            <div className="grid gap-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={filters.end_date ? filters.end_date.toISOString().split('T')[0] : ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFilters((prev: RouteReportFilter) => ({
                    ...prev,
                    end_date: e.target.value ? new Date(e.target.value) : undefined
                  }))
                }
              />
            </div>

            {/* Status Filter */}
            <div className="grid gap-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select
                value={filters.route_status || 'all'}
                onValueChange={(value: string) =>
                  setFilters((prev: RouteReportFilter) => ({
                    ...prev,
                    route_status: value === 'all' ? undefined : value as 'pending' | 'in_progress' | 'completed' | 'cancelled'
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">⏳ Pending</SelectItem>
                  <SelectItem value="in_progress">🚛 In Progress</SelectItem>
                  <SelectItem value="completed">✅ Completed</SelectItem>
                  <SelectItem value="cancelled">❌ Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={generateReport} disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
              <BarChart3 className="h-4 w-4 mr-2" />
              {isLoading ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      {reportData && (
        <div className="space-y-6">
          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{reportData.total_routes}</div>
                <div className="text-sm text-gray-600">Total Routes</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{reportData.completed_routes}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-yellow-500">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-600">{reportData.pending_routes + reportData.in_progress_routes}</div>
                <div className="text-sm text-gray-600">Active</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-600">{reportData.total_distance.toFixed(1)} km</div>
                <div className="text-sm text-gray-600">Total Distance</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-600">{getCompletionRate()}%</div>
                <div className="text-sm text-gray-600">Completion Rate</div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div className="text-lg font-semibold text-gray-900">{formatDuration(reportData.total_duration)}</div>
                  <div className="text-sm text-gray-600">Total Duration</div>
                </div>
                
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {reportData.total_routes > 0 ? (reportData.total_distance / reportData.total_routes).toFixed(1) : '0'} km
                  </div>
                  <div className="text-sm text-gray-600">Avg Distance</div>
                </div>
                
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {reportData.total_routes > 0 ? Math.round(reportData.total_duration / reportData.total_routes) : 0} min
                  </div>
                  <div className="text-sm text-gray-600">Avg Duration</div>
                </div>
                
                <div>
                  <div className="text-lg font-semibold text-red-600">{reportData.cancelled_routes}</div>
                  <div className="text-sm text-gray-600">Cancelled Routes</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Route Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Route Details ({reportData.routes.length} routes)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.routes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No routes match your filter criteria.
                </div>
              ) : (
                <div className="space-y-4">
                  {reportData.routes.map((route: RouteWithDriver) => (
                    <div key={route.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900 flex items-center gap-2">
                            <Navigation className="h-4 w-4 text-gray-600" />
                            {route.origin} → {route.destination}
                          </h4>
                          <p className="text-sm text-gray-600">Route #{route.id}</p>
                        </div>
                        {getStatusBadge(route.route_status)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-gray-400" />
                          <span>{route.driver.name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>{route.distance} km</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span>{formatDuration(route.estimated_duration)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{formatDateTime(route.start_datetime)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!reportData && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Generate Reports</h3>
            <p className="text-gray-500 mb-4 text-center max-w-md">
              Set your filters above and click "Generate Report" to view detailed analytics and performance metrics for your routes.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}