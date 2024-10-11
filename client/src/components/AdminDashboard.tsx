import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  verificationStatus?: string;
}

interface SessionRequest {
  _id: string;
  student: { name: string };
  tutor: { name: string };
  subject: string;
  requestedTime: string;
  status: string;
}

interface Feedback {
  _id: string;
  from: { name: string; role: string };
  to: { name: string; role: string };
  rating: number;
  comments: string;
}

const AdminDashboard: React.FC = () => {
  const [tutors, setTutors] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [sessionRequests, setSessionRequests] = useState<SessionRequest[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);

  useEffect(() => {
    fetchTutors();
    fetchStudents();
    fetchSessionRequests();
    fetchFeedbacks();
  }, []);

  const fetchTutors = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users/admin/tutors', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication header here if required
        },
      });
      if (response.ok) {
        const data = await response.json();
        setTutors(data.tutors);
      } else {
        console.error('Failed to fetch tutors');
      }
    } catch (error) {
      console.error('Error fetching tutors:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users/admin/students', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication header here if required
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students);
      } else {
        console.error('Failed to fetch students');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchSessionRequests = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users/admin/session-requests', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication header here if required
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSessionRequests(data.sessionRequests);
      } else {
        console.error('Failed to fetch session requests');
      }
    } catch (error) {
      console.error('Error fetching session requests:', error);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users/admin/feedbacks', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication header here if required
        },
      });
      if (response.ok) {
        const data = await response.json();
        setFeedbacks(data.feedbacks);
      } else {
        console.error('Failed to fetch feedbacks');
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    }
  };

  const handleVerify = async (userId: string, status: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/admin/users/${userId}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication header here if required
        },
        body: JSON.stringify({ verificationStatus: status }),
      });
      if (response.ok) {
        fetchTutors(); // Refresh the tutor list
      } else {
        console.error('Failed to update user verification status');
      }
    } catch (error) {
      console.error('Error updating user verification status:', error);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <Tabs defaultValue="tutors">
        <TabsList>
          <TabsTrigger value="tutors">Tutors</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="sessions">Session Requests</TabsTrigger>
          <TabsTrigger value="feedbacks">Feedbacks</TabsTrigger>
        </TabsList>
        <TabsContent value="tutors">
          <Card>
            <CardHeader>
              <CardTitle>Tutors</CardTitle>
              <CardDescription>Manage and verify tutors</CardDescription>
            </CardHeader>
            <CardContent>
              {tutors.map((tutor) => (
                <div key={tutor._id} className="border p-4 rounded-lg mb-4">
                  <h2 className="text-xl font-semibold">{tutor.name}</h2>
                  <p>Email: {tutor.email}</p>
                  <p>Verification Status: {tutor.verificationStatus || 'Pending'}</p>
                  <div className="mt-2 space-x-2">
                    <Button onClick={() => handleVerify(tutor._id, 'verified')}>Verify</Button>
                    <Button onClick={() => handleVerify(tutor._id, 'rejected')} variant="destructive">Reject</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Students</CardTitle>
              <CardDescription>View registered students</CardDescription>
            </CardHeader>
            <CardContent>
              {students.map((student) => (
                <div key={student._id} className="border p-4 rounded-lg mb-4">
                  <h2 className="text-xl font-semibold">{student.name}</h2>
                  <p>Email: {student.email}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Session Requests</CardTitle>
              <CardDescription>View all session requests</CardDescription>
            </CardHeader>
            <CardContent>
              {sessionRequests.map((request) => (
                <div key={request._id} className="border p-4 rounded-lg mb-4">
                  <p>Student: {request.student.name}</p>
                  <p>Tutor: {request.tutor.name}</p>
                  <p>Subject: {request.subject}</p>
                  <p>Requested Time: {new Date(request.requestedTime).toLocaleString()}</p>
                  <p>Status: {request.status}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="feedbacks">
          <Card>
            <CardHeader>
              <CardTitle>Feedbacks</CardTitle>
              <CardDescription>View all feedbacks</CardDescription>
            </CardHeader>
            <CardContent>
              {feedbacks.map((feedback) => (
                <div key={feedback._id} className="border p-4 rounded-lg mb-4">
                  <p>From: {feedback.from.name} ({feedback.from.role})</p>
                  <p>To: {feedback.to.name} ({feedback.to.role})</p>
                  <p>Rating: {feedback.rating}</p>
                  <p>Comments: {feedback.comments}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;