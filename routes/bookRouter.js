const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');
const cors = require('./cors');

const Books = require('../models/books');

const bookRouter = express.Router();

bookRouter.use(express.json());

bookRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Books.find({})
    .populate('user')
    .then((books) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(books);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Books.create(req.body)   
    .then((book) => {
        book.user = req.user._id;
        book.save()
        .then((b) => {
        console.log('Book Created ', b);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(b);
        }, (err) => next(err))
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /Books');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Books.deleteMany({ user: req.user._id })
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));
});

bookRouter.route('/mybooks')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, (req,res,next) => {
    Books.find({user: req.user._id})
    .populate('user')
    .then((book) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(book);
    }, (err) => next(err))
    .catch((err) => next(err));
})

.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Books.findOne({_id: req.body.id})
        .populate('user')
        .then((book) => {

            if (book.user._id.toString() === req.user.id.toString()) {

                book.remove()
                .then((result) => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(result);
                }, (err) => next(err));
            } 
             else {
                var err = new Error('You do not have any books');
                err.status = 404;
                return next(err);
            }
        }, (err) => next(err))
        .catch((err) => next(err));
});



module.exports = bookRouter;