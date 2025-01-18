//app/page.tsx

"use client";
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import axios from 'axios';
import PayPalButton from './_components/Paypal-button';
import { Subscription, Todo } from '@prisma/client';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import toast from 'react-hot-toast';

type Todos = {
  id: String;
  content: String;
  userId: String;
};

type User = {
  id: String;
  clerkId: String;
  todos: Todo[] | null;
  subscription: Subscription;
};

const Page = () => {
  const { user: userClark, isSignedIn } = useUser();
  const [user, setUser] = useState<User | null>(null);
  const [todos, setTodos] = useState<Todos[]>([]);
  const [content, setContent] = useState('');
  const [subscriptionType, setSubscriptionType] = useState('');
  const [reachedLimit, setReachedLimit] = useState<string | null>(null);

  // Fetch user data when userClark changes
  useEffect(() => {
    if (userClark) {
      axios
        .post('/api/user', { clerkId: userClark.id })
        .then((response) => {
          setUser(response.data);
          setTodos(response.data.todos || []); // Ensure todos is always an array
        })
        .catch((error) => console.error('Error adding user to MongoDB:', error));
    }
  }, [userClark]); // Dependency on userClark

  // Always call this useEffect hook, but control logic inside it
  useEffect(() => {
    if (user) {
      const checkSubscription = async () => {
        try {
          const res = await axios.get('/api/checkSubscription',{}); // Using axios to make a GET request
          const data = res.data; // Axios automatically parses the response as JSON
    
          if (data.message === 'Subscription expired. Please renew.') {
            alert('Your subscription has expired. Please renew your payment.');
          } else if (data.message === 'Subscription is active') {
            console.log('Your subscription is active.');
          } else {
            console.log(data.error || 'Unknown error');
          }
        } catch (error) {
          console.error('Error checking subscription:', error); // Log the error
        }
      };
    
      checkSubscription();
    }
  }, [user]); // Runs when `user` is set

  // Ensure that user is available before rendering
  if (!user) return <div>Loading...</div>;

  const handleAddTodo = () => {
    axios
      .post('/api/todo', { userId: user.id, content })
      .then((response) => {
        setTodos([...todos, response.data]);
        setContent('');
      })
      .catch((error) => {
        console.error('Error adding todo:', error);
        setReachedLimit(error.response.data.error);
      });
  };

  const handleSubscriptionSuccess = (type: string) => {
    console.log(type);

    axios
      .post('/api/subscription', { userId: user?.id, type })
      .then((response) => {
        setUser({ ...user, subscription: response.data });
        setSubscriptionType('');
        toast.success('Payment successful!');
        setReachedLimit(null);
      })
      .catch((error) => console.log('Error adding subscription:', error));
  };

  const initialOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '', 
    currency: "USD",
    intent: "capture",
  };

  return (
    <div>
      <h1>Todo App</h1>
      {user && (
        <>
          <div>
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Add a todo"
            />
            <button onClick={handleAddTodo}>Add Todo</button>
          </div>
          <ul>
            {todos.map((todo: Todos) => (
              <li key={todo.id as any}>{todo.content}</li>
            ))}
          </ul>
          {reachedLimit && <p className="bg-slate-300 w-max p-2 rounded-md">{reachedLimit} you need to upgrade your plan</p>}
          <div>
            <h2>Subscribe</h2>
            <div className="flex gap-3">
              <button className="bg-slate-300 rounded-md p-2" onClick={() => setSubscriptionType('daily')}>Daily purchases ($1)</button>
              <button className="bg-slate-300 rounded-md p-2" onClick={() => setSubscriptionType('weekly')}>Weekly ($5)</button>
              <button className="bg-slate-300 rounded-md p-2" onClick={() => setSubscriptionType('monthly')}>Monthly ($10)</button>
              <button className="bg-slate-300 rounded-md p-2" onClick={() => setSubscriptionType('yearly')}>Yearly ($30)</button>
            </div>

            <div className="m-6 max-w-sm">
              {subscriptionType && (
                <PayPalScriptProvider options={initialOptions}>
                  <PayPalButton
                    amount={getSubscriptionAmount(subscriptionType)}
                    onSuccess={() => handleSubscriptionSuccess(subscriptionType)}
                  />
                </PayPalScriptProvider>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

function getSubscriptionAmount(type: string) {
  switch (type) {
    case 'daily':
      return '1.00';
    case 'weekly':
      return '5.00';
    case 'monthly':
      return '10.00';
    case 'yearly':
      return '30.00';
    default:
      return '0.00';
  }
}

export default Page;



