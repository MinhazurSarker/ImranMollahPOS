const User = require('./../model/User.js');
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const fs = require("fs");
dotenv.config();

const jwt_secret = process.env.JWT_SECRET || '';
const createAdmin = async (req, res) => {
    try {
        if (req.headers.secret === jwt_secret) {
            const u = await User.findOne({ email: req.body.email })
            if (!u) {
                const hashPassword = await bcrypt.hash(req.body.password, 10);
                const user = await new User({
                    name: req.body.name,
                    email: req.body.email,
                    role: 'admin',
                    password: hashPassword
                })
                await user.save()
                res.status(200).json({ msg: 'success', user: { name: user.name, role: user.role, email: user.email, _id: user._id } })
            } else {
                res.status(403).json({ msg: 'userAlreadyExists' })
            }
        } else {
            res.status(403).json({ msg: 'Unauthorized' })
        }
    } catch (error) {
        res.status(500).json({ err: 'something went wrong' })
    }
}
const createUser = async (req, res) => {
    const roles = ['admin', 'editor'];
    const file = req.file?.path.replace("public", "").split("\\").join("/");
    console.log(req.file)
    try {
        const u = await User.findOne({ email: req.body.email })
        if (!u) {
            const hashPassword = await bcrypt.hash(req.body.password, 10);
            const user = await new User({
                name: req.body.name,
                email: req.body.email,
                role: roles.includes(req.body.role) ? (req.body.role).toString() : 'editor',
                password: hashPassword,
                img: file,
            })
            await user.save()
            res.status(200).json({ msg: 'success', user: { name: user.name, role: user.role, email: user.email, _id: user._id } })
        } else {
            res.status(403).json({ err: 'userAlreadyExists' })
        }
    } catch (error) {
        res.status(500).json({ err: 'something went wrong' })
    }
}
const login = async (req, res) => {
    try {
        const user = await User.findOne({
            email: req.body.email,
        })
        if (user) {
            const isValid = await bcrypt.compare(req.body.password, user.password)
            if (isValid) {
                const payload = {
                    token: user._id + 'dfaTokenHashBearerName' + req.body.password,
                };
                // const payload = {
                //     userId: user._id,
                //     userName: req.body.password,
                // };
                const token = jwt.sign(payload, jwt_secret, {
                    expiresIn: 60 * 60 * 24 * 30 * 6,
                });
                res.status(200).json({ msg: 'success', token: token, user: { name: user.name, role: user.role, email: user.email, _id: user._id, img: user.img } })
            } else {
                res.status(401).json({ err: 'invalid' })
            }
        } else {
            res.status(404).json({ err: 'notFound' })

        }
    } catch (error) {
        res.status(500).json({ err: 'something went wrong' })
    }
}

const getUsers = async (req, res) => {
    try {
        const users = await User.find().select('_id email role name img ');
        res.status(200).json({ msg: 'success', users: users })
    } catch (err) {
        res.status(400).json({ err: 'something went wrong' })

    }
}
const getUser = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.userId })
        if (user) {
            res.status(200).json({ msg: 'success', user: { name: user.name, role: user.role, email: user.email, _id: user._id, img: user.img } })
        } else {
            res.status(404).json({ err: 'notFound', })
        }
    } catch (err) {
        res.status(400).json({ err: err })
    }
}
const getMyProfile = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.requesterId })
        if (user) {
            res.status(200).json({ msg: 'success', user: { name: user.name, role: user.role, email: user.email, _id: user._id, img: user.img } })
        } else {
            res.status(200).json({ err: 'notFound', })
        }
    } catch (err) {
        res.status(400).json({ err: err })
    }
}

const updateUser = async (req, res) => {
    const roles = ['admin', 'editor'];
    const file = req.file?.path.replace("public", "").split("\\").join("/");
    try {
        const user = await User.findOne({ _id: req.params.userId })
        if (user) {
            const hashPassword = req.body.password ? await bcrypt.hash(req.body.password, 10) : user.password;
            user.name = req.body.name;
            user.email = req.body.email;
            if (req.file) {
                fs.unlink("./public" + user.img, (err) => {
                    console.log(err);
                })
                user.img = file;
            }
            user.role = roles.includes(req.body.role) ? (req.body.role).toString() : 'editor';
            user.password = hashPassword
            await user.save().then(() => {
                res.status(200).json({ msg: 'success', user: { name: user.name, role: user.role, email: user.email, _id: user._id, img: user.img } })
            }).catch(err => {
                res.status(404).json({ err: 'notFound', })
            })
        } else {
            res.status(404).json({ err: 'notFound', })
        }
    } catch (err) {
        console.log(err)
        res.status(400).json({ err: err })
    }
}
const deleteUser = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.body.requesterId })
        if (user?.addedBy !== req.params.userId) {
            await User.deleteOne({ _id: req.params.userId });
            res.status(200).json({ msg: 'success' })
        } else {
            res.status(404).json({ err: 'notAllowed', })

        }
    } catch (err) {
        console.log(err)
        res.status(400).json({ err: err })
    }
}
module.exports = {
    createAdmin,
    createUser,
    login,
    getUsers,
    getUser,
    updateUser,
    deleteUser,
    getMyProfile,
}