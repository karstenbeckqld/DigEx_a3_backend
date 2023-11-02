/*--------------------------------------------------------------------------------------------------------------------*/
/*---------------------------------------              User Model              ---------------------------------------*/
/*--------------------------------------------------------------------------------------------------------------------*/

/*jshint esversion: 8 */
// To avoid validator errors regarding arrow function syntax, we use the above comment line.

// Bring in dependencies
const mongoose = require("mongoose");
const {isEmail} = require('validator');
require('mongoose-type-email');
const Utils = require('../Utils');

// Create user schema
// The schema defines the database fields and their properties.
const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true,'First name is required.']
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required.']
    },
    email: {
        type: mongoose.SchemaTypes.Email,
        required: [true, 'Please enter an email.'],
        unique: true,
        validate: [isEmail, 'Please enter a valid email.']
    },
    accessLevel: {
        type: Number,
        required: [true, 'The access level is required.']
    },
    password: {
        type: String,
        required: [true, 'Please enter a password.'],
        minLength: [6, 'Password must have a minimum of 6 characters.']
    },
    avatar: {
        type: String,
    },
    bio: {
        type: String,
    },
    newUser: {
        type: Boolean,
        default: true
    }

}, {timestamps: true});

// Mongoose allows for so-called mongoose hooks to be applied in the model. We make use of them here to generate the
// hashed password before the data gets saved to the database. The pre method allows for that to take place before saving
// occurs.

// Execute function before doc gets saved to the database (Middleware)
userSchema.pre('save', async function (next) {

    // Check if the password is present and is modified.
    if (this.password && this.isModified()) {

        // We replace the original password with the new hashed password.
        this.password = Utils.hashPassword(this.password);
    }

    // Execute next function.
    next();
});

// To facilitate the login process, we add a static method to the user model that checks for validity of the entered
// email address and password. In case of a wrong entry, we throw an error which can be handled by the user route and
// displayed in the form in the front end.

// Static method to log in user
userSchema.statics.login = async function (email, password) {

    // First we retrieve the user from tha database by searching for the email address of the user that wants to log in.
    const user = await this.findOne({email});

    // If the user exists we then compare the hashed password to the entered password.
    if (user) {

        // Bcrypt takes two parameters, the plain password, and, if the user exists, the stored and hashed password from
        // the database.
        const auth = Utils.verifyPassword(password, user.password);

        // If the passwords match, we return the user.
        if (auth){
            return user;
        }

        // If the password doesn't match, we trow an error.
        throw Error('incorrect password');
    }

    // If the user doesn't exist, we throw an error.
    throw Error('incorrect email');
};


// Export the model
module.exports = mongoose.model("User", userSchema);

// Mongoose Hooks derived from Net Ninja Tutorial Node.js Auth Tutorial (JWT),
// https://www.youtube.com/playlist?list=PL4cUxeGkcC9iqqESP8335DA5cRFp8loyp