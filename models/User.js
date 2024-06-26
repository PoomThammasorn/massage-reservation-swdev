const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const OTP = require("./OTP");

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please add a name"],
    },
    email: {
        type: String,
        required: [true, "Please add an email"],
        unique: true,
        match: [
            /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            "Please add a valid email",
        ],
    },
    tel: {
        type: String,
        required: [true, "Please add a phone number"],
        unique: true,
        length: [10, "Phone number must be 10 digits"],
        format: {
            with: /^[0-9]+$/,
            message: "Only numbers are allowed",
        },
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
    password: {
        type: String,
        require: [true, "Please add a password"],
        minlength: 6,
        select: false,
    },
    // resetPasswordToken: String,
    // resetPasswordExpire: Date,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Encrypt password using bcrypt
UserSchema.pre("save", async function (next) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function (TTL) {
    // console.log("TTL: ", TTL);
    return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
        expiresIn: TTL,
    });
};

// Cascade delete reservations when a user is deleted
UserSchema.pre(
    "deleteOne",
    { document: false, query: true },
    async function (next) {
        console.log(`Reservations being removed from user ${this._id}`);
        await this.model("Reservation").deleteMany({ user: this._id });
        next();
    }
);

// Cascade delete OTPs when a user is deleted
UserSchema.pre(
    "deleteOne",
    { document: false, query: true },
    async function (next) {
        console.log(`OTPs being removed from user ${this._id}`);
        await this.model("OTP").deleteMany({ email: this.email });
        next();
    }
);

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Validate OTP
UserSchema.methods.validateOTP = async function (enteredOTP) {
    const otp = await OTP.findOne({ email: this.email });
    if (!otp) {
        return false;
    }
    return otp.otp === enteredOTP;
};

module.exports = mongoose.model("User", UserSchema);
