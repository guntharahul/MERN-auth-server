const { check } = require('express-validator');
exports.userSignupValidator = [
  check('name').not().isEmpty().withMessage('Name is required'),
  check('email').isEmail().withMessage('Must be a valida email Address'),
  check('password')
    .isLength({ min: 8 })
    .withMessage('Password must be atleast 8 characters'),
];

exports.userSigninValidator = [
  check('email')
    .not()
    .isEmpty()
    .isEmail()
    .withMessage('Must be a valida email Address'),
  check('password')
    .isLength({ min: 8 })
    .withMessage('Password must be atleast 8 characters'),
];

// forgot password validators
exports.forgotPasswordValidator = [
  check('email')
    .not()
    .isEmpty()
    .withMessage('Email can not be empty')
    .isEmail()
    .withMessage('Please enter valid email address'),
];

//reset password validator
exports.resetPasswordValidator = [
  check('newPassword')
    .not()
    .isEmpty()
    .isLength({
      min: 6,
    })
    .withMessage('Password must be atleast 6 characters long'),
];
