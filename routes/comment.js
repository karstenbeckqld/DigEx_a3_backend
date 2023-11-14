/*--------------------------------------------------------------------------------------------------------------------*/
/*--------------------------------------             Comment Routes              -------------------------------------*/
/*--------------------------------------------------------------------------------------------------------------------*/

/*jshint esversion: 8 */
// To avoid validator errors regarding arrow function syntax, we use the above comment line.

// Import dependencies.
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Comment = require('../models/comment');
const Utils = require('../Utils');
const path = require('path');
const multer = require('multer');
const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images');
    },
    filename: (req, file, cb) => {
        const ext = file.mimetype.split('/')[1];
        cb(null, `${file.originalname}-${Date.now()}.${ext}`);
    }
});
const upload = multer({dest: 'public/uploads/'});
const sharp = require('sharp');

router.get('/comment', async (req, res) => {
    await Comment.find()
        .then((comments) => {
            res.status(200).json(comments);
        })
        .catch((err) => {
            console.log('Cannot get list of users: ', err);
            res.status(400).json({
                message: 'Cannot get users.',
                error: err
            });
        });
});

router.get('/comment/:id', (req, res) => {

});

router.post('/comment', (req, res) => {

});

module.exports = router;