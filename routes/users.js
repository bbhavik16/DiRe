const express = require('express');
const router = express.Router();
const passport = require('passport');
const catchAsync = require("../errors/catchAsync")
const User = require("../models/user.js")

router.get('/register', (req, res) => {
    res.render('users/register')
})

router.post('/register', catchAsync(async(req, res) => {
    try{
        const { username, email, password, name } = req.body;
        const user = new User({username, email});
        const registeredUser = await User.register(user, password);
        console.log(registeredUser);
        req.login(registeredUser, (err) => {
            if(err) return next(err);
            res.redirect('/volunteer/new');
        })
    } catch(e) {
        res.redirect('/volunteer/register');
    }
}))

router.get('/login', (req, res) => {
    res.render('users/login');
})

router.post('/login', passport.authenticate('local', {failureFlash: true, failureRedirect: '/volunteer/login'}), (req, res) => {
    req.flash('success', 'Welcome back');
    const redirectUrl = req.session.returnTo || '/volunteer';
    delete req.session.returnTo;
    res.redirect(redirectUrl)
})

router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/volunteer');
})

module.exports = router;