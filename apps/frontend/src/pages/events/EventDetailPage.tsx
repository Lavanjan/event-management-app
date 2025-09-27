import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Clock,
  Edit,
  Copy,
  Trash2,
  Plus,
  BookOpen,
  Package
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { PageLoading, ErrorState } from '../../components/forms/LoadingSpinner';
import { useEvent, useEventStats, useDuplicateEvent, useDeleteEvent } from '../../hooks/useEvents';
import { useBookingsByEvent } from '../../hooks/useBookings';
import { format } from 'date-fns';

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: event, isLoading, error } = useEvent(id!);
  const { data: stats, isLoading: statsLoading } = useEventStats(id!);
  const { data: bookings, isLoading: bookingsLoading } = useBookingsByEvent(id!, { limit: 5 });
  const duplicateEvent = useDuplicateEvent();
  const deleteEvent = useDeleteEvent();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'published':
        return 'success';
      case 'draft':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      case 'completed':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const handleDuplicate = async () => {
    if (!event) return;
    const newName = prompt('Enter name for the duplicated event:', `${event.name} (Copy)`);
    if (newName) {
      await duplicateEvent.mutateAsync({ id: event.id, newName });
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      await deleteEvent.mutateAsync(event.id);
      navigate('/events');
    }
  };

  if (isLoading) {
    return <PageLoading message="Loading event details..." />;
  }

  if (error || !event) {
    return (
      <ErrorState
        title="Event not found"
        message="The event you're looking for doesn't exist or has been deleted."
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/events')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{event.name}</h1>
            <p className="text-muted-foreground">{event.description}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant={getStatusColor(event.status)}>
            {event.status}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/bookings/create?eventId=${event.id}`)}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/events/${event.id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDuplicate}
          >
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Event Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                  <p className="text-lg">{format(new Date(event.startDate), 'PPP p')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">End Date</label>
                  <p className="text-lg">{format(new Date(event.endDate), 'PPP p')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Location</label>
                  <p className="text-lg flex items-center">
                    <MapPin className="mr-1 h-4 w-4" />
                    {event.location}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Event Type</label>
                  <p className="text-lg">{event.type}</p>
                </div>
                {event.maxCapacity && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Max Capacity</label>
                    <p className="text-lg flex items-center">
                      <Users className="mr-1 h-4 w-4" />
                      {event.maxCapacity} attendees
                    </p>
                  </div>
                )}
                {event.basePrice && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Base Price</label>
                    <p className="text-lg flex items-center">
                      <DollarSign className="mr-1 h-4 w-4" />
                      {formatCurrency(event.basePrice)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5" />
                Payment Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Required Advance</label>
                  <p className="text-lg">{event.requiredAdvancePercentage}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Balance Payment Window</label>
                  <p className="text-lg">{event.balancePaymentWindowDays} days before event</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${event.allowInventoryAllocation ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-sm">Inventory allocation {event.allowInventoryAllocation ? 'enabled' : 'disabled'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Bookings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Recent Bookings
                </CardTitle>
                <CardDescription>Latest bookings for this event</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/bookings?eventId=${event.id}`)}
              >
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {bookingsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : bookings && bookings.items.length > 0 ? (
                <div className="space-y-4">
                  {bookings.items.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => navigate(`/bookings/${booking.id}`)}
                    >
                      <div>
                        <p className="font-medium">{booking.customerName}</p>
                        <p className="text-sm text-muted-foreground">{booking.customerEmail}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(booking.createdAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(booking.totalAmount)}</p>
                        <Badge variant={booking.status === 'confirmed' ? 'success' : 'secondary'}>
                          {booking.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">No bookings yet</p>
                  <Button
                    className="mt-2"
                    size="sm"
                    onClick={() => navigate(`/bookings/create?eventId=${event.id}`)}
                  >
                    Create First Booking
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Event Statistics */}
          {!statsLoading && stats && (
            <Card>
              <CardHeader>
                <CardTitle>Event Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{stats.totalBookings}</p>
                    <p className="text-sm text-muted-foreground">Total Bookings</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{stats.confirmedBookings}</p>
                    <p className="text-sm text-muted-foreground">Confirmed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{stats.totalAttendees}</p>
                    <p className="text-sm text-muted-foreground">Attendees</p>
                  </div>
                </div>

                {event.maxCapacity && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Capacity Used</span>
                      <span>{stats.totalAttendees}/{event.maxCapacity}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{
                          width: `${Math.min((stats.totalAttendees / event.maxCapacity) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate(`/bookings/create?eventId=${event.id}`)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Booking
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate(`/events/${event.id}/edit`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Event
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleDuplicate}
              >
                <Copy className="mr-2 h-4 w-4" />
                Duplicate Event
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate(`/bookings?eventId=${event.id}`)}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                View All Bookings
              </Button>
            </CardContent>
          </Card>

          {/* Event Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <div>
                  <p className="text-sm font-medium">Event Created</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(event.createdAt), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>

              {event.status === 'active' && (
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <div>
                    <p className="text-sm font-medium">Event Published</p>
                    <p className="text-xs text-muted-foreground">Available for booking</p>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                <div>
                  <p className="text-sm font-medium">Event Starts</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(event.startDate), 'MMM dd, yyyy p')}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                <div>
                  <p className="text-sm font-medium">Event Ends</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(event.endDate), 'MMM dd, yyyy p')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
