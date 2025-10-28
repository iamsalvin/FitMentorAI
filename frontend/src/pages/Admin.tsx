import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '@/services/api';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@clerk/clerk-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type AdminUser = {
  _id: string;
  clerkId: string;
  isAdmin?: boolean;
  profile?: {
    height?: number;
    weight?: number;
    age?: number;
    gender?: string;
    fitnessGoal?: string;
    activityLevel?: string;
    preferredWorkoutDuration?: number;
  };
  stats?: {
    totalWorkouts?: number;
    totalWorkoutMinutes?: number;
    streakDays?: number;
    caloriesBurned?: number;
    lastWorkoutDate?: string;
  };
  createdAt?: string;
  updatedAt?: string;
  name?: string;
  avatarUrl?: string | null;
};

export default function AdminPage() {
  const { user } = useUser();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);

  // crude check: expect isAdmin to be in our backend user document; we can't read it from Clerk directly here
  const canView = true; // The backend will enforce admin; frontend is optimistic and shows 403 fallback if the request fails

  const fetchUsers = async (q?: string) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await adminApi.getUsers(q);
      setUsers(resp.data.users || []);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 403) {
        setError('Forbidden: Admins only');
      } else {
        setError(e?.response?.data?.error || 'Failed to load users');
      }
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = useMemo(() => users, [users]);

  if (!canView) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Access denied</CardTitle>
          </CardHeader>
          <CardContent>
            You do not have permission to view this page.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 mb-4">
            <Input
              placeholder="Search by Clerk ID"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') fetchUsers(query);
              }}
            />
            <button
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
              onClick={() => fetchUsers(query)}
              disabled={loading}
            >
              {loading ? 'Loading…' : 'Search'}
            </button>
          </div>

          {error && (
            <div className="text-sm text-red-600 mb-3">{error}</div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Goal</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Workouts</TableHead>
                  <TableHead>Minutes</TableHead>
                  <TableHead>Streak</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={u.avatarUrl || undefined} alt={u.name || ''} />
                          <AvatarFallback>
                            {(u.name || u.clerkId || 'U').split(' ').map(s => s[0]).join('').slice(0,2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{u.name || 'Unknown'}</span>
                          <span className="text-xs text-muted-foreground font-mono">{u.clerkId}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {u.isAdmin ? (
                        <Badge variant="default">Admin</Badge>
                      ) : (
                        <Badge variant="secondary">User</Badge>
                      )}
                    </TableCell>
                    <TableCell>{u.profile?.fitnessGoal || '-'}</TableCell>
                    <TableCell>{u.profile?.activityLevel || '-'}</TableCell>
                    <TableCell>{u.stats?.totalWorkouts ?? 0}</TableCell>
                    <TableCell>{u.stats?.totalWorkoutMinutes ?? 0}</TableCell>
                    <TableCell>{u.stats?.streakDays ?? 0}</TableCell>
                    <TableCell>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}




