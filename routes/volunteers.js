const express = require('express');
const { isLoggedIn } = require('../middleware');
const router = express.Router();
const catchAsync = require("../errors/catchAsync")
const Volunteer = require('../models/volunteer');

router.get('/', catchAsync(async (req, res) => {
    const volunteers = await Volunteer.find({});
    res.render('volunteer/index', { volunteers })
}))
  
router.get('/new', isLoggedIn, (req, res) => {
    res.render('volunteer/new');
})
  
router.get('/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    const volunteer = await Volunteer.findById(id);
    res.render('volunteer/show', { volunteer });
}))
  
router.post('/', catchAsync(async (req, res) => {
    const volunteer = new Volunteer({
        name: req.body.volunteer.name,
        email: req.body.volunteer.email,
        phone: req.body.volunteer.phone,
        gender: req.body.volunteer.gender,
        dob: req.body.volunteer.dob,
        occupation: req.body.volunteer.occupation,
        city: req.body.volunteer.city,
        state: req.body.volunteer.state,
        fieldInterest: req.body.volunteer.fieldInterest
    });
    await volunteer.save();
    res.redirect(`/volunteer/${volunteer._id}`);
}))
  
router.get('/:id/edit', isLoggedIn, catchAsync(async (req, res) => {
    const { id } = req.params;
    const volunteer = await Volunteer.findById(id);
    res.render('volunteer/edit', { volunteer });
}))
  
router.put('/:id',catchAsync(async (req, res) => {
    const { id } = req.params;
    const volunteer = await Volunteer.findByIdAndUpdate(id, {
        name: req.body.volunteer.name,
        email: req.body.volunteer.email,
        phone: req.body.volunteer.phone,
        gender: req.body.volunteer.gender,
        dob: req.body.volunteer.dob,
        occupation: req.body.volunteer.occupation,
        city: req.body.volunteer.city,
        state: req.body.volunteer.state,
        fieldInterest: req.body.volunteer.fieldInterest
    });
    res.redirect(`/volunteer/${volunteer._id}`);
}))
  
router.delete('/:id', isLoggedIn, catchAsync(async (req, res) => {
    const { id } = req.params;
    const volunteer = await Volunteer.findById(id);
    await Volunteer.findByIdAndDelete(id);
    res.redirect('/volunteer');
}))

module.exports = router;