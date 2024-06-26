const User = require("../models/User");
const { generateToken } = require("../utils/utils");

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        const { name, email, tel, password, role } = req.body;

        const user = await User.create({
            name,
            tel,
            email,
            password,
            role,
        });

        // const token = user.getSignedJwtToken();
        // res.status(200).json({ success: true, token });
        sendTokenResponse(user, 200, res);
    } catch (err) {
        res.status(400).json({ success: false, msg: "Cannot create user" });
        console.log(err.stack);
    }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                msg: "Please provide an email and password",
            });
        }

        // Check for user
        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return res
                .status(401)
                .json({ success: false, msg: "Invalid username or password" });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res
                .status(401)
                .json({ success: false, msg: "Invalid username or password" });
        }

        // const token = user.getSignedJwtToken();
        // res.status(200).json({ success: true, token });
        sendTokenResponse(user, 200, res);
    } catch (err) {
        console.log(err.stack);
        return res.status(401).json({
            success: false,
            msg: "Cannot convert email or password to string",
        });
    }
};

// @desc    Log user out / clear cookie
// @route   GET /api/v1/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
    // console.log("logout");
    res.cookie("token", "none", {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });

    res.status(200).json({ success: true, data: {} });
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const { token, options } = generateToken(user);

    res.status(statusCode)
        .cookie("token", token, options)
        .json({
            success: true,
            token,
            // add for frontend
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                tel: user.tel,
                role: user.role,
            },
            // end for frontend
        });
};

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    const user = await User.findById(req.user.id);
    const { _id, name, email, tel, role } = user;
    res.status(200).json({
        success: true,
        data: { id: _id, name, email, tel, role },
    });
};
