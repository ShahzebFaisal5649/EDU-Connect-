// client/src/components/SessionRequests.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';

interface SessionRequestsProps {
  userRole: string | null;
  userId: string | null;
}

interface SessionRequest {
  _id: string;
  student: {
    name: string;
    _id: string;
  };
  tutor: {
    name: string;
    _id: string;
  };
  subject: string;
  requestedTime: string;
  status: string;
}

const SessionRequests: React.FC<SessionRequestsProps> = ({ userRole, userId }) => {
  const [requests, setRequests] = useState<SessionRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Fetch session requests based on user role
  useEffect(() => {
    const fetchRequests = async () => {
      if (userId && userRole) {
        try {
          const response = await fetch(
            `http://localhost:5000/api/users/session-requests?role=${userRole}&userId=${userId}`
          );
          const data = await response.json();
          if (response.ok) {
            setRequests(data.requests);
          } else {
            alert(data.message || 'Failed to fetch session requests');
          }
        } catch (error) {
          console.error('Error fetching session requests:', error);
          alert('An error occurred while fetching session requests.');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchRequests();
  }, [userId, userRole]);

  // Handle accepting or declining session requests (For tutors)
  const handleResponse = async (requestId: string, status: 'accepted' | 'declined') => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/session/${requestId}/respond`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      if (response.ok) {
        // Update the request list after response
        setRequests((prevRequests) =>
          prevRequests.map((req) => (req._id === requestId ? { ...req, status } : req))
        );
        alert(`Session request ${status}`);
      } else {
        alert(data.message || 'Failed to respond to session request');
      }
    } catch (error) {
      console.error(`Error responding to session request:`, error);
      alert('An error occurred while responding to session request.');
    }
  };

  // Render the list of session requests
  if (loading) {
    return <p>Loading session requests...</p>;
  }

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">Manage Session Requests</h1>
      {requests.length === 0 ? (
        <p>No session requests available.</p>
      ) : (
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Student</th>
              <th className="py-2 px-4 border-b">Tutor</th>
              <th className="py-2 px-4 border-b">Subject</th>
              <th className="py-2 px-4 border-b">Requested Time</th>
              <th className="py-2 px-4 border-b">Status</th>
              {userRole === 'tutor' && <th className="py-2 px-4 border-b">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request._id}>
                <td className="py-2 px-4 border-b">{request.student.name}</td>
                <td className="py-2 px-4 border-b">{request.tutor.name}</td>
                <td className="py-2 px-4 border-b">{request.subject}</td>
                <td className="py-2 px-4 border-b">{new Date(request.requestedTime).toLocaleString()}</td>
                <td className="py-2 px-4 border-b">{request.status.charAt(0).toUpperCase() + request.status.slice(1)}</td>

                {/* Actions for Tutors */}
                {userRole === 'tutor' && request.status === 'pending' && (
                  <td className="py-2 px-4 border-b space-x-2">
                    <Button
                      variant="default"
                      onClick={() => handleResponse(request._id, 'accepted')}
                      className="mr-2"
                    >
                      Accept
                    </Button>
                    <Button variant="outline" onClick={() => handleResponse(request._id, 'declined')}>
                      Decline
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Button for students to navigate to request a session */}
      {userRole === 'student' && (
        <Button onClick={() => navigate('/request-session')} className="mt-4">
          Request a Session
        </Button>
      )}
    </div>
  );
};

export default SessionRequests;
