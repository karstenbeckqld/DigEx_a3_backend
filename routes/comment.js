/*--------------------------------------------------------------------------------------------------------------------*/
/*--------------------------------------             Comment Routes              -------------------------------------*/
/*--------------------------------------------------------------------------------------------------------------------*/

/*jshint esversion: 8 */
// To avoid validator errors regarding arrow function syntax, we use the above comment line.

// Import dependencies.
const express = require('express');
const router = express.Router();
const Comment = require('../models/comment');
const Utils = require('../Utils');

// Get all comments ----------------------------------------------------------------------------------------------------
// Endpoint /comment
// This endpoint is used to get all comments.
router.get('/', Utils.authenticateToken, async (req, res) => {
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

// Get comments for a provided cocktail ID -----------------------------------------------------------------------------
// Endpoint /comment/:id
// This endpoint is used to get all comments for a provided cocktail ID, so that comments can be displayed along with
// the cocktail details.
router.get('/:id', Utils.authenticateToken, async (req, res) => {

    if (!req.params.id) {
        res.status(400).json({
            message: 'No cocktail id provided.'
        });
        return;
    }

    // We search for all comments that contain the provided cocktail ID and return the result in the response.
    await Comment.find({cocktailId: req.params.id})
        .then((comment) => {
            res.status(200).json(comment);
        })
        .catch((err) => {
            console.log('Cannot get cocktail: ', err);
            res.status(400).json({
                message: 'Cannot get cocktail.',
                error: err
            });
        });
});

// Add a comment -------------------------------------------------------------------------------------------------------
// Endpoint /comment
// THis endpoint adds a comment to the database.
router.post('/', Utils.authenticateToken, async (req, res) => {

    if (!req.body) {
        res.status(400).json({
            message: 'No comment provided.'
        });
        return;
    }

    console.log('Comment POST Route content: ', req.body);

    const newComment = new Comment({
        avatar: req.body.avatar,
        text: req.body.text,
        cocktailId: req.body.cocktailId,
        userId: req.body.userId,
        userName: req.body.userName
    });

    await newComment.save()
        .then((comment) => {
            res.status(200).json(comment);
        })
        .catch((err) => {
            console.log('Cannot add comment: ', err);
            res.status(400).json({
                message: 'Cannot add comment.',
                error: err
            });
        });
});

// Delete a comment (admin only)
// Endpoint /comment/:id
// This endpoint allows an admin to delete a comment.
router.delete('/:id', Utils.authenticateToken, async (req, res) => {

        if (!req.params.id) {
            res.status(400).json({
                message: 'No comment id provided.'
            });
            return;
        }

        await Comment.findByIdAndDelete(req.params.id)
            .then((comment) => {
                res.status(200).json(comment);
            })
            .catch((err) => {
                console.log('Cannot delete comment: ', err);
                res.status(400).json({
                    message: 'Cannot delete comment.',
                    error: err
                });
            });
});

module.exports = router;