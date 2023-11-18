/*--------------------------------------------------------------------------------------------------------------------*/
/*---------------------------------------             Utility Class              -------------------------------------*/
/*--------------------------------------------------------------------------------------------------------------------*/

/*jshint esversion: 6 */
// To avoid validator errors regarding arrow function syntax, we use the above comment line.

// The Utils class provides miscellaneous functions to the API that can get used by any JS file in the application and
// are not necessarily restricted to one functionality.

// Required dependencies


require('dotenv').config();
let crypto = require('crypto');
const jwt = require('jsonwebtoken');
const {v4: uuidv4} = require('uuid');
const path = require('path');
const sharp = require('sharp');
const Cocktail = require("./models/cocktail");
const {json} = require("express/lib/response");
const {promisify} = require("util");
const multer = require('multer');
const {unlinkSync, unlink} = require("fs");
// Create multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, path.join(__dirname, '..', 'public', 'images'));
    },
    filename: (req, file, callback) => {
        const fileExt = file.originalname.split('.').pop();
        const uniqueFileName = uuidv4(undefined, undefined, undefined) + '.' + fileExt;
        callback(null, uniqueFileName);
    },
});
const upload = multer({storage: storage});

// Class declaration
class Utils {

    // Handle errors for user signup
    // The handleErrors function reads the errors generated by the user model or mongoose and allows for them to be
    // returned to the user in json format. This function is not exhaustive and doesn't handle every error in the
    // application. It's main purpose is to generate message for users for the signup and login processes that can be
    // displayed in the front end.
    // Error handling function derived from Net Ninja Tutorial Node.js Auth Tutorial (JWT),
    // https://www.youtube.com/playlist?list=PL4cUxeGkcC9iqqESP8335DA5cRFp8loyp
    handleErrors(err) {

        // Define an errors object that stores errors for email and password errors.
        let errors = {email: '', password: ''};

        // Duplicate email error
        // The user model defines for email addresses to be unique. As they get used as login, this makes sense. If a user
        // tries to register with an email that is already present in the database, mongoose will throw an error. Here we
        // catch the error code produced by mongoose to relay a message to the front end in json format, so that the user
        // gets informed that the entered email is already registered.
        if (err.code === 11000) {
            errors.email = 'This email is already registered';
            return errors;
        }

        // Input validation errors
        // We've put other requirements in the user model, that is that an email must be provided upon registration and
        // that the password must have a certain length. These validations get returned by mongoose with the prefix: User
        // validation failed. All these kinds of errors will be handled by the below code block and are returned to the
        // user in a more user-friendly way.
        // Mongoose returns an error object with values for each error that occurred. With err.errors, we access this
        // errors object and with forEach(({properties})) we can cycle through the contained properties. The line with
        // errors[properties.path] = properties.message assigns these property values to the locally defined errors
        // properties email and password, respectively. In the end, the code returns these values to the user route.
        if (err.message.includes('User validation failed')) {
            console.log(err.message);
            Object.values(err.errors).forEach(({properties}) => {
                errors[properties.path] = properties.message;
            });
            return errors;
        }
    }

    // The hashPassword function takes in a parameter which is the plain password entered by the user. It then uses the
    // randomBytes method of the crypto package to generate a salt and the pbkdf2Sync method to create the password hash.
    // At the end, it joins the salt and hash and returns it to the calling function.
    hashPassword(password) {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, salt, 2048, 32, 'sha512').toString('hex');
        return [salt, hash].join('$');
    }

    // The verifyPassword function takes in a plain text password and the hashed password from the database. We then
    // split the sored password hash at the $-sign, as the hashed passwords are stored as salt$hash. We then encrypt the
    // plain text password and compare the resulting hashes. It needs to be mentioned that hashes cannot get decrypted,
    // it's a one-way operation. What actually happens is that whenever the same hashing algorithm is applied to a string,
    // it produces the same hash. This is when the two hashes can get compared with each other.
    verifyPassword(password, dbPassword) {
        const savedPassword = dbPassword.split('$')[1];
        const salt = dbPassword.split('$')[0];
        const hash = crypto.pbkdf2Sync(password, salt, 2048, 32, 'sha512').toString('hex');
        return hash === savedPassword;
    }

    // The createToken function takes in a user id and uses the jwt sign() method to create a jsonwebtoken. The required
    // secret is stored in the.ebv file for security reasons and gets retrieved from there via the process.env function. It
    // then returns the json web token to the calling function.
    createToken(userObject) {
        return jwt.sign(userObject, process.env.ACCESS_TOKEN_SECRET, {

            // Now we set the expiry for this token to 30 minutes.
            expiresIn: '360min'
        });
    }

    authenticateToken(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (token == null) {
            res.redirect('/auth/signin');
        }

        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            if (err) {
                res.redirect('/auth/signin');
            }
            req.user = user;
            next();
        })
    }

    async processImage(file, width, height, next) {

        let filename = null;

        try {

            filename = path.parse(file).name;

            const processedImage = await sharp('public/images/' + file)
                .resize(width,height)
                .png({quality: 80,compressionLevel: 9, adaptiveFiltering: true, force: true})
                .toFile('public/images/processed/' + file)

            console.log('Processed Image', processedImage);
            console.log(file);

            await unlink('public/images/' + file, err => {
                console.log(err)
            });
            console.log('Deleted original file', file);
        } catch (err) {
            console.log('Error processing image', err);
            throw err;
        }

        return file;
    }
}

// Export the class using the 'new' keyword.
module.exports = new Utils();