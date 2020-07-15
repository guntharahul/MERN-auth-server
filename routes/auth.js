const express = require('express');
const router = express.Router();
const {
  signup,
  signin,
  accountActivation,
  forgotPassword,
  resetPassword,
  googleLogin,
  facebookLogin,
} = require('../controllers/auth');
const {
  userSignupValidator,
  userSigninValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require('../validators/auth');
const { runValidation } = require('../validators/index');

router.post('/signup', userSignupValidator, runValidation, signup);
router.post('/signin', userSigninValidator, runValidation, signin);
router.post('/account-activation', accountActivation);
// forgot and reset password routes
router.put(
  '/forgot-password',
  forgotPasswordValidator,
  runValidation,
  forgotPassword
);
router.put(
  '/reset-password',
  resetPasswordValidator,
  runValidation,
  resetPassword
);
router.post('/google-login', googleLogin);
router.post('/facebook-login', facebookLogin);

module.exports = router;
