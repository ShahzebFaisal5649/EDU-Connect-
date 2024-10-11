import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { CalendarDays, BookOpen, MessageSquare, User, LogOut, Search } from 'lucide-react';

interface DashboardProps {
  setIsLoggedIn: (value: boolean) => void;
  userRole: string | null;
  userId: string | null;
}

interface UserProfile {
  _id: string;
  name: string;
  role: string;
  email: string;
  subjects?: string[];
  location?: string;
  availability?: { day: string; time: string }[];
  learningGoals?: string;
  preferredSubjects?: string[];
}

interface SessionRequest {
  _id: string;
  student: { name: string; _id: string };
  tutor: { name: string; _id: string };
  subject: string;
  requestedTime: string;
  status: string;
}

interface SearchResult {
  _id: string;
  name: string;
  role: string;
  subjects?: string[];
  location?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ setIsLoggedIn, userRole, userId }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sessionRequests, setSessionRequests] = useState<SessionRequest[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfileAndSessions = async () => {
      if (userId) {
        try {
          // Fetch user profile
          const profileResponse = await fetch(`http://localhost:5000/api/users/profile/${userId}`);
          const profileData = await profileResponse.json();
          if (profileResponse.ok) {
            setProfile(profileData.user);
          } else {
            console.error(profileData.message);
          }

          // Fetch session requests
          const sessionResponse = await fetch(`http://localhost:5000/api/users/session-requests?role=${userRole}&userId=${userId}`);
          const sessionData = await sessionResponse.json();
          if (sessionResponse.ok) {
            setSessionRequests(sessionData.requests);
          } else {
            console.error(sessionData.message);
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      }
    };

    fetchProfileAndSessions();
  }, [userId, userRole]);

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    navigate('/');
  };

  const handleSearch = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/search?query=${searchQuery}&role=${userRole}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSearchResults(data.results);
    } catch (error) {
      console.error('Error searching:', error);
      setSearchResults([]);
      // You might want to set an error state here to display to the user
    }
  };

  const handleSessionResponse = async (sessionId: string, status: 'accepted' | 'declined') => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/session/${sessionId}/respond`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setSessionRequests(prevRequests =>
          prevRequests.map(req =>
            req._id === sessionId ? { ...req, status } : req
          )
        );
      } else {
        console.error('Failed to update session status');
      }
    } catch (error) {
      console.error('Error updating session status:', error);
    }
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <p>You have {sessionRequests.filter(req => req.status === 'accepted').length} upcoming sessions.</p>
          <Button variant="link" onClick={() => setActiveTab('sessions')}>View all sessions</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p>You have {sessionRequests.filter(req => req.status === 'pending').length} pending session requests.</p>
          <Button variant="link" onClick={() => setActiveTab('sessions')}>Manage sessions</Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderSessions = () => (
    <div>
      <h2 className="text-2xl font-bold mb-4">Session Management</h2>
      {userRole === 'student' ? (
        <>
          <Button variant="default" className="mr-2">Request a Session</Button>
          <div className="mt-4">
            <h3 className="text-xl font-semibold mb-2">Your Session Requests</h3>
            {sessionRequests.map(request => (
              <Card key={request._id} className="mb-2">
                <CardContent className="py-2">
                  <p><strong>Tutor:</strong> {request.tutor.name}</p>
                  <p><strong>Subject:</strong> {request.subject}</p>
                  <p><strong>Requested Time:</strong> {new Date(request.requestedTime).toLocaleString()}</p>
                  <p><strong>Status:</strong> {request.status}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="mt-4">
            <h3 className="text-xl font-semibold mb-2">Session Requests</h3>
            {sessionRequests.map(request => (
              <Card key={request._id} className="mb-2">
                <CardContent className="py-2">
                  <p><strong>Student:</strong> {request.student.name}</p>
                  <p><strong>Subject:</strong> {request.subject}</p>
                  <p><strong>Requested Time:</strong> {new Date(request.requestedTime).toLocaleString()}</p>
                  <p><strong>Status:</strong> {request.status}</p>
                  {request.status === 'pending' && (
                    <div className="mt-2">
                      <Button variant="default" className="mr-2" onClick={() => handleSessionResponse(request._id, 'accepted')}>Accept</Button>
                      <Button variant="outline" onClick={() => handleSessionResponse(request._id, 'declined')}>Decline</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );

  const renderMaterials = () => (
    <div>
      <h2 className="text-2xl font-bold mb-4">Study Materials</h2>
      {userRole === 'tutor' ? (
        <Button variant="default">Upload Study Material</Button>
      ) : (
        <Button variant="default">Browse Study Materials</Button>
      )}
      {/* Add functionality for managing study materials */}
    </div>
  );

  const renderProfile = () => (
    <div>
      <h2 className="text-2xl font-bold mb-4">My Profile</h2>
      {profile && (
        <div>
          <p><strong>Name:</strong> {profile.name}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Role:</strong> {profile.role}</p>
          {profile.role === 'tutor' && (
            <>
              <p><strong>Subjects:</strong> {profile.subjects?.join(', ')}</p>
              <p><strong>Location:</strong> {profile.location}</p>
              <p><strong>Availability:</strong></p>
              <ul>
                {profile.availability?.map((slot, index) => (
                  <li key={index}>{slot.day}: {slot.time}</li>
                ))}
              </ul>
            </>
          )}
          {profile.role === 'student' && (
            <>
              <p><strong>Learning Goals:</strong> {profile.learningGoals}</p>
              <p><strong>Preferred Subjects:</strong> {profile.preferredSubjects?.join(', ')}</p>
            </>
          )}
          <Button variant="outline" className="mt-4">Edit Profile</Button>
        </div>
      )}
    </div>
  );

  const renderSearchResults = () => (
    <div className="mt-4">
      <h3 className="text-xl font-semibold mb-2">Search Results</h3>
      {searchResults.map((result) => (
        <Card key={result._id} className="mb-2">
          <CardContent className="py-2">
            <p><strong>Name:</strong> {result.name}</p>
            {result.subjects && <p><strong>Subjects:</strong> {result.subjects.join(', ')}</p>}
            {result.location && <p><strong>Location:</strong> {result.location}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4">
          <div className="flex items-center space-x-4 mb-6">
            <Avatar>
              <AvatarImage src="/placeholder-avatar.jpg" />
              <AvatarFallback>{profile?.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold">{profile?.name}</h2>
              <p className="text-sm text-gray-500">{profile?.role}</p>
            </div>
          </div>
          <nav>
            <ul className="space-y-2">
              <li>
                <Button variant="ghost" className="w-full justify-start" onClick={() => setActiveTab('overview')}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Overview
                </Button>
              </li>
              <li>
                <Button variant="ghost" className="w-full justify-start" onClick={() => setActiveTab('sessions')}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Sessions
                </Button>
              </li>
              <li>
                <Button variant="ghost" className="w-full justify-start" onClick={() => setActiveTab('materials')}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Study Materials
                </Button>
              </li>
              <li>
                <Button variant="ghost" className="w-full justify-start" onClick={() => setActiveTab('profile')}>
                  <User className="mr-2 h-4 w-4" />
                  My Profile
                </Button>
              </li>
            </ul>
          </nav>
        </div>
        <div className="absolute bottom-4 left-4">
          <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-red-500">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        
        {/* Search bar */}
        <div className="mb-6 flex">
          <Input
            type="text"
            placeholder={`Search for ${userRole === 'student' ? 'tutors' : 'students'}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mr-2"
          />
          <Button onClick={handleSearch}>
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </div>

        {/* Search results */}
        {searchResults.length > 0 && renderSearchResults()}

        {/* Existing dashboard content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'sessions' && renderSessions()}
        {activeTab === 'materials' && renderMaterials()}
        {activeTab === 'profile' && renderProfile()}
      </div>
    </div>
  );
};

export default Dashboard;