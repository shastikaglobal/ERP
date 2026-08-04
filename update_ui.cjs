const fs = require('fs');

let f1 = fs.readFileSync('src/components/ResetPasswordModal.tsx', 'utf8');

f1 = f1.replace(/We've sent a password reset link to \$\{email\}\. Please check your inbox to securely update your password\./g, 
  "Your password reset request has been sent to the system administrator. Please wait for the administrator to provide your temporary password.");

f1 = f1.replace(/Enter the email address associated with your account, and we'll send the reset link to it\./g, 
  "Enter your registered company email address to request a password reset from the administrator.");

fs.writeFileSync('src/components/ResetPasswordModal.tsx', f1);
