import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle, Mail, Key, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { useToast } from '../../hooks/use-toast';
import { userService } from '../../services/userService';

const verifySchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

type VerifyForm = z.infer<typeof verifySchema>;

export function VerifyAccountPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState<'token' | 'otp'>('token');

  const token = searchParams.get('token');
  const userId = searchParams.get('userId');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyForm>({
    resolver: zodResolver(verifySchema),
  });

  useEffect(() => {
    // If token is provided, try to verify automatically
    if (token) {
      handleTokenVerification();
    } else if (!userId) {
      // If no token or userId, redirect to login
      navigate('/login');
    }
  }, [token, userId, navigate]);

  const handleTokenVerification = async () => {
    if (!token) return;

    setIsVerifying(true);
    try {
      await userService.verifyByToken(token);
      setIsVerified(true);
      toast({
        title: 'Success',
        description: 'Your account has been verified successfully!',
      });
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      toast({
        title: 'Verification Failed',
        description: error.response?.data?.message || 'Invalid or expired verification link',
        variant: 'destructive',
      });
      setVerificationMethod('otp');
    } finally {
      setIsVerifying(false);
    }
  };

  const onSubmit = async (data: VerifyForm) => {
    if (!userId) {
      toast({
        title: 'Error',
        description: 'User ID is required for verification',
        variant: 'destructive',
      });
      return;
    }

    setIsVerifying(true);
    try {
      await userService.verifyUser(userId, data.otp);
      setIsVerified(true);
      toast({
        title: 'Success',
        description: 'Your account has been verified successfully!',
      });
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      toast({
        title: 'Verification Failed',
        description: error.response?.data?.message || 'Invalid or expired OTP code',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendVerification = async () => {
    if (!userId) {
      toast({
        title: 'Error',
        description: 'User ID is required to resend verification',
        variant: 'destructive',
      });
      return;
    }

    setIsResending(true);
    try {
      await userService.resendVerification(userId);
      toast({
        title: 'Success',
        description: 'Verification email sent successfully!',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to resend verification email',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                <h2 className="mt-4 text-2xl font-bold text-gray-900">Account Verified!</h2>
                <p className="mt-2 text-gray-600">
                  Your account has been successfully verified. You will be redirected to the login page shortly.
                </p>
                <Button
                  onClick={() => navigate('/login')}
                  className="mt-4"
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Go to Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Mail className="mx-auto h-12 w-12 text-blue-500" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Verify Your Account</h2>
          <p className="mt-2 text-gray-600">
            {verificationMethod === 'token' 
              ? 'Verifying your account...'
              : 'Enter the 6-digit code sent to your email'
            }
          </p>
        </div>

        {verificationMethod === 'token' && isVerifying ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <RefreshCw className="mx-auto h-8 w-8 text-blue-500 animate-spin" />
                <p className="mt-2 text-gray-600">Verifying your account...</p>
              </div>
            </CardContent>
          </Card>
        ) : verificationMethod === 'otp' ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="mr-2 h-5 w-5" />
                Enter Verification Code
              </CardTitle>
              <CardDescription>
                Check your email for the 6-digit verification code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    {...register('otp')}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="text-center text-lg tracking-widest"
                  />
                  {errors.otp && (
                    <p className="text-sm text-red-600">{errors.otp.message}</p>
                  )}
                </div>

                <Button type="submit" disabled={isVerifying} className="w-full">
                  {isVerifying ? 'Verifying...' : 'Verify Account'}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <Button
                  variant="ghost"
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="text-sm"
                >
                  {isResending ? 'Sending...' : "Didn't receive the code? Resend"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/login')}
            className="text-sm"
          >
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  );
}
