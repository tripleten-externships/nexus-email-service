import React from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../hooks/use-auth';
import { useNavigate } from 'react-router-dom';

type FormData = {
  email: string;
  password: string;
  remember: boolean;
};

const LoginForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>();

  const { signIn, currentUser, authError, loading } = useAuth();
  const navigate = useNavigate();

  const onSubmit = (data: FormData) => {
    signIn(data.email, data.password, data.remember);
    if (authError) {
      reset({
        email: '',
        password: '',
        remember: data.remember,
      });
      return;
    }
    if (currentUser) {
      navigate('/dashboard');
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-md mx-auto mt-10 px-4 sm:px-6 py-6 bg-white shadow-md rounded-md space-y-6"
    >
      <h2 className="text-2xl font-bold text-center text-gray-800">Login</h2>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Enter a valid email',
            },
          })}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter your email"
        />
        {errors.email && (
          <p id="email-error" role="alert" className="mt-1 text-sm text-red-500">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          {...register('password', { required: 'Password is required' })}
          className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.password ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter your password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'password-error' : undefined}
        />
        {errors.password && (
          <p id="password-error" role="alert" className="text-red-500 text-sm mt-1">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Auth error */}
      {authError && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-3 text-sm text-red-700 bg-red-100 rounded"
        >
          {authError}
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        className="w-full px-4 py-2 font-semibold text-white !bg-blue-600 rounded-md hover:!bg-blue-700 disabled:opacity-50 cursor-pointer"
        disabled={loading}
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>

      {/* Remember Me */}
      <div className="flex items-center">
        <input
          id="remember"
          type="checkbox"
          {...register('remember')}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer"
        />
        <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
          Remember me
        </label>
      </div>
    </form>
  );
};

export default LoginForm;
