// client/src/components/Feedback.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";

interface FeedbackFormProps {}

interface SessionRequest {
  _id: string;
  student: { name: string; _id: string };
  tutor: { name: string; _id: string };
  subject: string;
  requestedTime: string;
  status: string;
}

const feedbackSchema = z.object({
  rating: z
    .number()
    .min(1, { message: "Rating must be at least 1" })
    .max(5, { message: "Rating cannot be more than 5" }),
  comments: z.string().optional(),
});

type FeedbackData = z.infer<typeof feedbackSchema>;

const Feedback: React.FC<FeedbackFormProps> = () => {
  const { id } = useParams<{ id: string }>(); // session request id
  const [sessionRequest, setSessionRequest] = useState<SessionRequest | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const form = useForm<FeedbackData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      rating: 5,
      comments: '',
    },
  });

  useEffect(() => {
    const fetchSessionRequest = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/users/session/${id}`);
        const data = await response.json();

        if (response.ok) {
          setSessionRequest(data.session);
        } else {
          setError(data.message || 'Failed to fetch session request');
        }
      } catch (err) {
        console.error('Error fetching session request:', err);
        setError('An error occurred while fetching session request.');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionRequest();
  }, [id]);

  const onSubmit: SubmitHandler<FeedbackData> = async (values) => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/session/${id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      if (response.ok) {
        alert('Feedback submitted successfully!');
        navigate('/dashboard');
      } else {
        alert(data.message || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('An error occurred during feedback submission.');
    }
  };

  if (loading) {
    return <p>Loading session details...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!sessionRequest) {
    return <p>Session request not found.</p>;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-lg p-8 space-y-6 rounded-xl bg-white shadow-lg">
        <h1 className="text-3xl font-bold text-center">Submit Feedback</h1>
        <p className="text-lg text-center mb-6">
          Provide feedback for the session with <strong>{sessionRequest.tutor.name}</strong> (Tutor) or <strong>{sessionRequest.student.name}</strong> (Student)
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Rating Field */}
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating (1-5)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      placeholder="Your rating (1-5)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Comments Field */}
            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comments</FormLabel>
                  <FormControl>
                    <Input placeholder="Your feedback (optional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button type="submit" className="w-full">
              Submit Feedback
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default Feedback;
