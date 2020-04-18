const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer')
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const router = express.Router();
const User = require('../models/user');

//Create storage engine
const storage = new GridFsStorage({
  url: 'mongodb+srv://test:test@cluster0-2czvc.mongodb.net/3d?retryWrites=true&w=majority',
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = `${req.body.filename} (${file.originalname})` ;
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        User.collection.findOneAndUpdate(
          {username: req.user.username},
          {$push: {uploads: `${req.body.filename} (${file.originalname})`}}
        )
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });


router.get('/login', (req, res) => {
    res.render('login')
});

router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect('/login');
    }
    req.logIn(user, function(err) {
      if (err) {
        return next(err);
      }
      res.redirect(req.session.returnTo || '/user/dashboard');
      delete req.session.returnTo;
    });
  })(req, res, next);
});

router.get('/sign-up', (req, res) => {
  res.render('user-signup')
})

router.post('/sign-up', (req, res) => {
  User.register(new User({ username: req.body.username, email: req.body.email, name: req.body.name, contact: req.body.contact }), req.body.password, function(err, user) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate('local')(req, res, function() {
                res.redirect('/');
            })
        }
   });
})

router.post('/upload', upload.single('file'), (req, res) => {
  res.redirect('/user/dashboard');
});

function checkLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  next();
}

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  res.redirect('/login');
}

module.exports =  router ;
