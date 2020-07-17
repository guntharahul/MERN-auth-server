const User = require('../models/user');
const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');
const expressJWT = require('express-jwt');
const _ = require('loadsh');
const user = require('../models/user');
const { OAuth2Client } = require('google-auth-library');
const { response } = require('express');
const fetch = require('node-fetch');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// @User Signup to send activation link to email
exports.signup = (req, res) => {
  const { name, email, password } = req.body;
  User.findOne({ email: email }).exec((error, user) => {
    if (user) {
      return res.status(400).json({ error: 'User with email already exists' });
    }
    //creating a signed token
    const token = jwt.sign(
      { name, email, password },
      process.env.JWT_ACCOUNT_ACTIVATION,
      {
        expiresIn: '10m',
      }
    );
    const emailData = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Account activation link`,
      html: `<h1>Please use the link to activate your account</h1>
            <p>${process.env.CLIENT_URL}/auth/activate/${token}</p>
            <hr/>
            <p>This email may contains sensitive data</p>
            <p>${process.env.CLIENT_URL}</p>
      `,
    };
    sgMail
      .send(emailData)
      .then((sent) => {
        console.log('SignUp email sent');
        res.json({
          message: `Email sent to ${email}.Follow the instructions to activate your account`,
        });
      })
      .catch((error) => {
        // console.log(error);
        return res.json({
          message: error.message,
        });
      });
  });
};

exports.accountActivation = (req, res) => {
  const { token } = req.body;

  if (token) {
    jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION, function (
      err,
      decoded
    ) {
      if (err) {
        console.log('JWT VERIFY IN ACCOUNT ACTIVATION ERROR', err);
        return res.status(401).json({
          error: 'Expired link. Signup again',
        });
      }

      const { name, email, password } = jwt.decode(token);

      const user = new User({ name, email, password });

      user.save((err, user) => {
        if (err) {
          console.log('SAVE USER IN ACCOUNT ACTIVATION ERROR', err);
          return res.status(401).json({
            error: 'Error saving user in database. Try signup again',
          });
        }
        return res.json({
          message: 'Signup success. Please signin.',
        });
      });
    });
  } else {
    return res.json({
      message: 'Something went wrong. Try again.',
    });
  }
};

// @signin
// check if the user has account or not
// check with password matched with hashed_password in DB
// if yes send token to frontend
// later we allow user to access protected routes  if they have valid token
//on sucessful signin we send user info and token as response.

exports.signin = (req, res) => {
  const { email, password } = req.body;
  // check if user exist
  User.findOne({ email }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: 'User with that email does not exist. Please signup',
      });
    }
    // authenticate
    if (!user.authenticate(password)) {
      return res.status(400).json({
        error: 'Email and password do not match',
      });
    }
    // generate a token and send to client
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });
    const { _id, name, email, role } = user;

    return res.json({
      token,
      user: { _id, name, email, role },
    });
  });
};

exports.requireSignin = expressJWT({
  secret: process.env.JWT_SECRET,
  algorithms: ['HS256'],
});
// it will also make data available in the req.user._id

//admin middleware
exports.adminMiddlware = (req, res, next) => {
  User.findById({ _id: req.user._id }).exec((err, user) => {
    if (err) {
      return res.status(400).json({
        error: 'User not found',
      });
    }
    if (user.role !== 'admin') {
      return res.status(400).json({
        error: 'Access denied',
      });
    }
    req.profile = user;
    next();
  });
};

exports.forgotPassword = (req, res) => {
  const { email } = req.body;
  // find user in DB
  User.findOne({ email }).exec((err, user) => {
    if (err || !user) {
      console.log('Password reset error');
      return res.status(400).json({
        error: 'User not registered',
      });
    }
    const token = jwt.sign(
      { _id: user._id, name: user.name },
      process.env.JWT_RESET_PASSWORD,
      {
        expiresIn: '10m',
      }
    );
    const emailData = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Password Reset Link`,
      html: `<h1>Please use the link to reset your password</h1>
            <p>${process.env.CLIENT_URL}/auth/password/reset/${token}</p>
            <hr/>
            <p>This email may contains sensitive data</p>
            <p>${process.env.CLIENT_URL}</p>
      `,
    };

    //save reset password link in DB  to verify
    return user.updateOne({ resetPasswordLink: token }, (err, success) => {
      if (err) {
        return res.status(400).json({
          error: 'Database connection on user password forgot request',
        });
      } else {
        sgMail
          .send(emailData)
          .then((sent) => {
            console.log('SignUp email sent');
            res.json({
              message: `Email sent to ${email}.Follow the instructions to reset your password`,
            });
          })
          .catch((error) => {
            // console.log(error);
            return res.json({
              message: error.message,
            });
          });
      }
    });
  });
};

exports.resetPassword = (req, res) => {
  const { resetPasswordLink, newPassword } = req.body;
  if (resetPasswordLink) {
    jwt.verify(resetPasswordLink, process.env.JWT_RESET_PASSWORD, function (
      err,
      decoded
    ) {
      if (err) {
        return res.status(400).json({
          error: 'Expired link please try again',
        });
      }
      User.findOne({ resetPasswordLink }).exec((err, user) => {
        if (err || !user) {
          return res.status(400).json({
            error: 'Some thing went wrong please try later',
          });
        }
        const updatedFields = {
          password: newPassword,
          resetPasswordLink: '',
        };
        user = _.extend(user, updatedFields);
        user.save((err, result) => {
          if (err) {
            res.status(400).json({
              error: 'Unable to reset Password.please try gain after 5 min.',
            });
          }
          res.json({
            message: 'Great. Your password has been updated. please sign in.',
          });
        });
      });
    });
  }
};

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
exports.googleLogin = (req, res) => {
  const { idToken } = req.body;
  client
    .verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID })
    .then((response) => {
      console.log('Goolge login response');
      console.log(response);
      const { email_verified, name, email } = response.payload;
      // check if email is verified
      if (email_verified) {
        //check if user is there in DB
        User.findOne({ email }).exec((err, user) => {
          if (user) {
            //generate the token
            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
              expiresIn: '7d',
            });
            const { _id, email, name, role } = user;
            return res
              .status(200)
              .json({ token, user: { _id, email, name, role } });
          } else {
            // if user is not there we have to signup and save in DB and generate the password
            let password = email + process.env.JWT_SECRET;
            user = new User({ name, email, password });
            user.save((err, data) => {
              if (err) {
                console.log('Error google login on saving user');
                return res.status(400).json({
                  error: 'User sign up failed with google',
                });
              }
              // generating the token
              const token = jwt.sign(
                { _id: data._id },
                process.env.JWT_SECRET,
                {
                  expiresIn: '7d',
                }
              );
              const { _id, email, name, role } = data;
              return res
                .status(200)
                .json({ token, user: { _id, email, name, role } });
            });
          }
        });
      } else {
        return res.status(400).json({
          error: 'Goolge login failed try again later',
        });
      }
    });
};

exports.facebookLogin = (req, res) => {
  console.log('FACEBOOK LOGIN REQ BODY', req.body);
  const { userID, accessToken } = req.body;

  const url = `https://graph.facebook.com/v2.11/${userID}/?fields=id,name,first_name,last_name,email,picture&access_token=${accessToken}`;

  return (
    fetch(url, {
      method: 'GET',
    })
      .then((response) => response.json())
      // .then(response => console.log(response))
      .then((response) => {
        console.log(response);
        const { email, name } = response;
        User.findOne({ email }).exec((err, user) => {
          if (user) {
            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
              expiresIn: '7d',
            });
            const { _id, email, name, role } = user;
            return res.json({
              token,
              user: { _id, email, name, role },
            });
          } else {
            let password = email + process.env.JWT_SECRET;
            user = new User({ name, email, password });
            user.save((err, data) => {
              if (err) {
                console.log('ERROR FACEBOOK LOGIN ON USER SAVE', err);
                return res.status(400).json({
                  error: 'User signup failed with facebook',
                });
              }
              const token = jwt.sign(
                { _id: data._id },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
              );
              const { _id, email, name, role } = data;
              return res.json({
                token,
                user: { _id, email, name, role },
              });
            });
          }
        });
      })
      .catch((error) => {
        res.json({
          error: 'Facebook login failed. Try later',
        });
      })
  );
};
