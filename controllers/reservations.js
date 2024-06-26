const Reservation = require("../models/Reservation");
const MassageShop = require("../models/MassageShop");

// @desc	Add new reservation
// @route	POST /api/v1/shops/:shopId/reservations
// @access	Private
exports.addReservation = async (req, res, next) => {
    try {
        req.body.massageShop = req.params.shopId;

        const massageShop = await MassageShop.findById(req.params.shopId);

        if (!massageShop) {
            return res.status(400).json({
                success: false,
                message: `No massage shop with the id of ${req.params.shopId}`,
            });
        }
        console.log(req.body);

        if (req.user.role !== "admin") {
            // add user Id to the request body
            req.body.user = req.user.id;
        } else if (!req.body.user) {
            // check if is an admin and user ID is not provided
            return res.status(400).json({
                success: false,
                message: `Please provide a user ID`,
            });
        }

		// check for existed reservation
		const existedReservation = await Reservation.find({
			user: req.body.user,
		});

		// if the user is not an admin, they can only add 3 reservations
		if (req.user.role !== "admin" && existedReservation.length >= 3) {
			return res.status(400).json({
				success: false,
				message: `The user with ID ${req.body.user} has already made 3 reservations`,
			});
		}

        const reservation = await Reservation.create(req.body);

        res.status(201).json({
            success: true,
            data: reservation,
        });
    } catch (err) {
        console.log(err.stack);
        return res
            .status(500)
            .json({ success: false, message: "Cannot create reservation" });
    }
};

//@desc Get all reservation
//@route GET /api/v1/reservations
//@access Public

exports.getReservations = async (req,res,next) =>{
    let query;
    //General users can see only thier reservations!
    if(req.user.role !== 'admin'){
        query = Reservation.find({user: req.user.id}).populate({
            path: "massageShop",
            select: "name address district province tel"
        });
    }else{ // iF you are admin, you can see all!

        if(req.params.shopId){

            console.log(req.params.shopId);

            query = Reservation.find({shop: req.params.shopId}).populate({
                path: "massageShop",
                select: "name address district province tel",
            });
        }
        else query = Reservation.find().populate({
            path: "massageShop",
            select: "name address district province tel",
        });
    }
    try{
        const reservations = await query;
        res.status(200).json({success:true,count:reservations.length,data: reservations});

    }catch(error){
        console.log(error);
        return res.status(500).json({success:false,message:"Cannot find Reservation"});
    }
};

//@desc Update reservation
//route PUT /api/v1/reservations/:id
//@access Private

exports.updateReservation = async (req,res,next)=>{
    try{
        let reservation = await Reservation.findById(req.params.id);

        if(!reservation){
            return res.status(404).json({success:false,message:`No reservation with the id of ${req.params.id}`});
        }

        //Make sure user is the reservation owner
        if(reservation.user.toString() !== req.user.id && req.user.role !== 'admin'){
            return res.status(401).json({success:false, message:`User ${req.user.id} is not authorized to update this reservation`});
        }

        reservation = await Reservation.findByIdAndUpdate(req.params.id,req.body,{
            new:true,
            runValidators:true

        });

        res.status(200).json({success:true,data:reservation});

    }catch(error){

        console.log(error);
        return res.status(500).json({success:false,message:"Cannot update Reservation"});
    }
};

//@desc Delete reservation
//@route DELETE /api/v1/reservations/:id
//@access Private

exports.deleteReservation = async (req,res,next) =>{
    try{

        const reservation = await Reservation.findById(req.params.id);
        if(!reservation){
            return res.status(404).json({success:false,message:`No reservation with the id of ${req.params.id}`});
        }

        //Make sure user is the reservation owner
        if(reservation.user.toString() !== req.user.id && req.user.role !== 'admin'){
            return res.status(401).json({success:false, message:`User ${req.user.id} is not authorized to update this reservation`});
        }

        await reservation.deleteOne();

        res.status(200).json({success:true,data:{}});

    }catch(error){
        console.log(error);
        return res.status(500).json({success:false,message:"Cannot delete Reservation"});
    }
};

//@desc Get single reservation 
//@route Get /api/v1/reservations/:id
//@acess Public
exports.getReservation = async (req,res,next) => {
    try{
        const reservation = await Reservation.findById(req.params.id);

        if(!reservation){
            res.status(400).json({success:false});
        }

        res.status(200).json({success:true,data:reservation});
    }catch(err){
        res.status(400).json({success:false});
    }
    
};