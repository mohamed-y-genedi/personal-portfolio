const { body, validationResult } = require('express-validator');
const xss = require('xss');

const sanitizeText = (value) =>
    xss(String(value || ''), {
        whiteList: {},          // remove all HTML tags
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script']
    }).trim();

const validateContact = [
    body('name')
        .exists({ checkFalsy: true }).withMessage('Name is required')
        .bail()
        .isString().withMessage('Name must be a string')
        .bail()
        .isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters')
        .bail()
        .customSanitizer(sanitizeText),

    body('email')
        .exists({ checkFalsy: true }).withMessage('Email is required')
        .bail()
        .isEmail().withMessage('Please provide a valid email address')
        .bail()
        .normalizeEmail(),

    body('message')
        .exists({ checkFalsy: true }).withMessage('Message is required')
        .bail()
        .isString().withMessage('Message must be a string')
        .bail()
        .isLength({ min: 10, max: 2000 }).withMessage('Message must be between 10 and 2000 characters')
        .bail()
        .customSanitizer(sanitizeText),

    body('_honey')
        .optional({ values: 'falsy' })
        .isString().withMessage('Invalid honeypot field')
        .customSanitizer(sanitizeText),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array({ onlyFirstError: true }).map((err) => err.msg)
            });
        }
        next();
    }
];

module.exports = { validateContact };
