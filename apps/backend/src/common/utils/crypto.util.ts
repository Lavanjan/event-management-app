import * as crypto from 'crypto';

export class CryptoUtil {
  /**
   * Generate a secure random OTP
   * @param length - Length of the OTP (default: 6)
   * @returns string - Generated OTP
   */
  static generateOTP(length: number = 6): string {
    const digits = '0123456789';
    let otp = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, digits.length);
      otp += digits[randomIndex];
    }
    
    return otp;
  }

  /**
   * Generate a secure random password
   * @param length - Length of the password (default: 12)
   * @returns string - Generated password
   */
  static generateSecurePassword(length: number = 12): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    
    let password = '';
    
    // Ensure at least one character from each category
    password += lowercase[crypto.randomInt(0, lowercase.length)];
    password += uppercase[crypto.randomInt(0, uppercase.length)];
    password += numbers[crypto.randomInt(0, numbers.length)];
    password += symbols[crypto.randomInt(0, symbols.length)];
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[crypto.randomInt(0, allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => crypto.randomInt(-1, 2)).join('');
  }

  /**
   * Generate a secure random token
   * @param length - Length of the token in bytes (default: 32)
   * @returns string - Generated token in hex format
   */
  static generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate OTP expiry time
   * @param minutes - Minutes from now (default: 10)
   * @returns Date - Expiry date
   */
  static generateOTPExpiry(minutes: number = 10): Date {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + minutes);
    return expiry;
  }

  /**
   * Check if OTP is expired
   * @param expiryDate - The expiry date to check
   * @returns boolean - True if expired
   */
  static isOTPExpired(expiryDate: Date): boolean {
    return new Date() > expiryDate;
  }
}
