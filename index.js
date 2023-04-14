//create an express server
const express = require('express');
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();
const bp = require("body-parser");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
mongoose.set('strictQuery', false);

const app = express();
const corsOption = {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
};
let URI = process.env.MONGODB_URI||'';
let user = process.env.MONGODB_USER||'';
let pass = process.env.MONGODB_PASS||'';
let Options = {
    user: user,
    pass: pass,
    autoIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
};

mongoose.connect(URI, Options)
    .then(() => console.log("DB Connected"))
    .catch((err) => console.log(err));
app.use(cors(corsOption));
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(cookieParser());
global.appRoot = path.resolve(__dirname);
dotenv.config();
app.use(bp.json({ limit: "100mb" }));
app.use(bp.urlencoded({ extended: true, limit: "100mb" }));
app.use(express.static(path.join(__dirname, "public")));
app.disable("x-powered-by");


app.get('/', (req, res) => {
    res.status(200).json({ msg: 'OK' });
})
app.use('/api/', require('./src/route/api'))
app.get("/*", (req, res) => {
    res.status(404).send();
});


app.listen(process.env.PORT, () => {
    console.log(`listening on port number ${process.env.PORT}`)
})