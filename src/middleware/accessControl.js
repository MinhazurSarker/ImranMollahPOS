const jwt = require('jsonwebtoken');
const User = require('./../model/User.js');
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");

dotenv.config();
const jwt_secret = process.env.JWT_SECRET || '';
const isViewer = async (req, res, next) => {
    const token = req.headers.token || req.cookies.token || req.query.token;
    try {
        if (token) {
            const tokenString = await jwt.verify(token, jwt_secret, (err, decoded) => {
                if (err) {
                    return ''
                } else {
                    return decoded.token;
                }
            })
            const tokenData = {
                id: tokenString?.toString().split('dfaTokenHashBearerName')[0],
                pass: tokenString?.toString().split('dfaTokenHashBearerName')[1]
            }
            const user = await User.findOne({ _id: tokenData?.id })
            if (user) {
                const isValid = await bcrypt.compare(tokenData?.pass || '', user.password)
                if (user && isValid) {
                    if (['admin', 'editor', 'viewer'].includes(user.role)) {
                        req.body.requesterId = user._id;
                        req.body.requesterRole = user.role;
                        req.params.requesterId = user._id;
                        req.params.requesterRole = user.role;
                        req.query.requesterId = user._id;
                        req.query.requesterRole = user.role;
                        next()
                    } else {
                        res.status(403).json({ msg: 'Unauthorized' })
                    }
                } else {
                    res.status(403).json({ msg: 'Invalid token' })
                }
            } else {
                res.status(403).json({ msg: 'Invalid token' })
            }
        } else {
            res.status(403).json({ msg: 'Need To Login' })
        }
    } catch (err) {
        res.status(500).json({ err: err.message });
    }
}
const isEditor = async (req, res, next) => {
    const token = req.headers.token || req.cookies.token || req.query.token;
    try {
        if (token) {
            const tokenString = await jwt.verify(token, jwt_secret, (err, decoded) => {
                if (err) {
                    return ''
                } else {
                    return decoded.token;
                }
            });
            const tokenData = {
                id: tokenString?.toString().split('dfaTokenHashBearerName')[0],
                pass: tokenString?.toString().split('dfaTokenHashBearerName')[1]
            }
            const user = await User.findOne({ _id: tokenData?.id })
            if (user) {
                const isValid = await bcrypt.compare(tokenData?.pass || '', user.password)
                if (user && isValid) {
                    if (['admin', 'editor',].includes(user.role)) {
                        req.body.requesterId = user._id;
                        req.body.requesterRole = user.role;
                        req.params.requesterId = user._id;
                        req.params.requesterRole = user.role;
                        req.query.requesterId = user._id;
                        req.query.requesterRole = user.role;
                        next()
                    } else {
                        res.status(403).json({ msg: 'Unauthorized' })
                    }
                } else {
                    res.status(403).json({ msg: 'Invalid token' })
                }
            } else {
                res.status(403).json({ msg: 'Invalid token' })
            }
        } else {
            res.status(403).json({ msg: 'Need To Login' })
        }
    } catch (err) {
        res.status(500).json({ err: err.message });
    }
}
const isAdmin = async (req, res, next) => {
    const token = req.headers.token || req.cookies.token || req.query.token;
    try {
        if (token) {
            const tokenString = await jwt.verify(token, jwt_secret, (err, decoded) => {
                if (err) {
                    return ''
                } else {
                    return decoded.token;
                }
            });
            const tokenData = {
                id: tokenString?.toString().split('dfaTokenHashBearerName')[0],
                pass: tokenString?.toString().split('dfaTokenHashBearerName')[1]
            }
            const user = await User.findOne({ _id: tokenData?.id })
            if (user) {
                const isValid = await bcrypt.compare(tokenData?.pass || '', user.password)
                if (user && isValid) {
                    if (['admin', 'editor', 'viewer'].includes(user.role)) {
                        req.body.requesterId = user._id;
                        req.body.requesterRole = user.role;
                        req.params.requesterId = user._id;
                        req.params.requesterRole = user.role;
                        req.query.requesterId = user._id;
                        req.query.requesterRole = user.role;
                        next()
                    } else {
                        res.status(403).json({ msg: 'Unauthorized' })
                    }
                } else {
                    res.status(403).json({ msg: 'Invalid token' })
                }
            } else {
                res.status(403).json({ msg: 'Invalid token' })
            }
        } else {
            res.status(403).json({ err: 'Need To Login' })
        }
    } catch (err) {
        res.status(500).json({ err: err.message });
    }
}
module.exports = {
    isViewer,
    isEditor,
    isAdmin,
}