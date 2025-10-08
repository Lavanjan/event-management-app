import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useToast } from '../../hooks/use-toast';

export function VerificationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const token = searchParams.get('token');
  const prefilledOtp = searchParams.get('otp');

  useEffect(() => {
    if (prefilledOtp) {
      setOtp(prefilledOtp);
    }
  }, [prefilledOtp]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast({
        title: 'Error',
        description: 'Invalid verification link',
        variant: 'destructive',
      });
      return;
    }

    if (!otp || otp.length !== 6) {
      toast({
        title: 'Error',
        description: 'Please enter a valid 6-digit OTP',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '/api';
      const response = await fetch(`${apiUrl}/verify/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          otp,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Email verified successfully! You can now log in.',
        });
        navigate('/login');
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Verification failed',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred during verification',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!token) {
      toast({
        title: 'Error',
        description: 'Invalid verification link',
        variant: 'destructive',
      });
      return;
    }

    setResendLoading(true);

    try {
      const response = await fetch('http://localhost:3004/api/verify/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: '', // We'll need to get this from the token or ask user
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Verification email sent successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to resend verification email',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while resending verification email',
        variant: 'destructive',
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter the 6-digit verification code sent to your email address
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleVerify}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
                className="text-center text-2xl tracking-widest"
                maxLength={6}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Check your email for the verification code
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
              {loading ? 'Verifying...' : 'Verify Email'}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleResend}
              disabled={resendLoading}
            >
              {resendLoading ? 'Sending...' : 'Resend Verification Email'}
            </Button>
          </div>

          <div className="text-center">
            <Button
              type="button"
              variant="link"
              onClick={() => navigate('/login')}
              className="text-sm"
            >
              Back to Login
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
