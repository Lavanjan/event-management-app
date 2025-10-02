import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export function VerificationSuccessPage() {
  const [searchParams] = useSearchParams();
  const [verified, setVerified] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifiedParam = searchParams.get('verified');
    const errorParam = searchParams.get('error');

    if (verifiedParam === 'true') {
      setVerified(true);
    } else if (verifiedParam === 'false') {
      setVerified(false);
      setError(errorParam ? decodeURIComponent(errorParam) : 'Verification failed');
    }
  }, [searchParams]);

  if (verified === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Processing verification...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {verified ? (
              <CheckCircle className="h-16 w-16 text-green-500" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {verified ? 'Email Verified!' : 'Verification Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {verified ? (
            <>
              <p className="text-gray-600">
                Your email has been successfully verified. Your account is now active and you can start using the Event Booking System.
              </p>
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link to="/auth/login">
                    Continue to Login
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-600">
                {error || 'There was an error verifying your email. Please try again or contact support.'}
              </p>
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link to="/auth/verification">
                    Try Again
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/auth/login">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
