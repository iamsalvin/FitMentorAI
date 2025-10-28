import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/clerk-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Menu, User, Dumbbell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { userApi } from '@/services/api';

const Navigation = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let mounted = true;
    // Fetch profile to detect admin role
    userApi.getProfile()
      .then((res) => {
        if (!mounted) return;
        const profileAdmin = !!res.data?.isAdmin;
        // Check env-based admin email as well
        const envAdmin = (import.meta.env.VITE_ADMIN_EMAIL || '').trim().toLowerCase();
        const clerkEmails: string[] = (user?.emailAddresses || []).map((e: any) => String(e.emailAddress || '').trim().toLowerCase());
        const envAdminMatch = !!envAdmin && clerkEmails.includes(envAdmin);
        setIsAdmin(profileAdmin || envAdminMatch);
      })
      .catch(() => {
        if (!mounted) return;
        const envAdmin = (import.meta.env.VITE_ADMIN_EMAIL || '').trim().toLowerCase();
        const clerkEmails: string[] = (user?.emailAddresses || []).map((e: any) => String(e.emailAddress || '').trim().toLowerCase());
        const envAdminMatch = !!envAdmin && clerkEmails.includes(envAdmin);
        setIsAdmin(envAdminMatch);
      });
    return () => { mounted = false; };
  }, [user?.id]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const navigationItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: null
    },
    {
      name: 'Workout',
      path: '/workout',
      icon: null
    },
    {
      name: 'Diet',
      path: '/diet',
      icon: null
    },
    {
      name: 'Progress',
      path: '/progress',
      icon: null
    },
    {
      name: 'Challenges',
      path: '/challenges',
      icon: null
    },
    {
      name: 'Saved Workouts',
      path: '/saved-workouts',
      icon: Dumbbell
    },
    {
      name: 'Leaderboard',
      path: '/leaderboard',
      icon: null
    },
    ...(isAdmin ? [{ name: 'Admin', path: '/admin', icon: null }] : [])
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold text-foreground">
            FitMentor
          </Link>

          <div className="hidden md:flex items-center space-x-4">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="text-muted-foreground hover:text-foreground"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.imageUrl} alt={user.fullName || ''} />
                    <AvatarFallback>{getInitials(user.fullName || 'User')}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => navigate('/sign-in')} variant="default">
              Sign In
            </Button>
          )}

          {isMobile && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {navigationItems.map((item) => (
                  <DropdownMenuItem
                    key={item.path}
                    onClick={() => navigate(item.path)}
                  >
                    {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                    <span>{item.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          </div>
      </div>
    </nav>
  );
};

export default Navigation;