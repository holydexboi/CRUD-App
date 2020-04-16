var express       = require("express"),
    mongoose      = require("mongoose"),
    passport      = require("passport"),
    methodOverride = require("method-override"),
    localStrategy = require("passport-local"),
    session       = require("express-session"),
    bodyParser    = require("body-parser"),
    app           = express(),
    User          = require("./models/user")

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
mongoose.connect("mongodb://localhost/crud_app", { useUnifiedTopology: true, useNewUrlParser: true });
app.use(bodyParser.urlencoded({extended: true}));


app.use(session({
	secret: "Once again I am cute and Handsome",
	resave: false,
	saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	// res.locals.success = req.flash("success");
	// res.locals.error = req.flash("error");
	next();
});


//INDEX ROUTE
app.get("/", function(req, res){
	res.render("index");
});

//USERS ROUTE
app.get("/userlist", isLoggedIn, function(req, res){
	User.find({}, function(err, alluser){
		if(err){
			console.log(err);
		}else{
			res.render("userlist", {user: alluser});
		}
	});
	
});

//REGISTER FORM ROUTE
app.get("/register", function(req, res){
	res.render("register");
});

//REGISTER POST ROUTE
app.post("/register", function(req, res){
	
	User.register(new User({username: req.body.username}), req.body.password, function(err, user){
		if(err){
			console.log(err);
			res.redirect("/register");
		}
		passport.authenticate("local")(req, res, function(){
			res.redirect("/userlist");
		});
	})
});

app.get("/login", function(req, res){
	res.render("login");
});

app.post("/login", passport.authenticate("local", {
	successRedirect: "/userlist",
	failureRedirect: "/login"
}), function(req, res){

});

//USER EDIT
app.get("/:id/edit", checkUserOwnership, function(req, res){
	User.findById(req.params.id, function(err, foundUser){
		if(err){
			res.redirect("back");
		}else{
			res.render("edit", {user: foundUser});
		}

	});
	
});

//USER UPDATE ROUTE
app.put("/:id", checkUserOwnership, function(req, res){
	User.findByIdAndUpdate(req.params.id,  req.body.user, function(err, updatedUser){
		if(err){
			console.log(err);
			res.redirect("back");
		}else{
			res.redirect("/");
		}
	})
});

//USER DELETE ROUTE
app.delete("/:id", checkUserOwnership, function(req, res){
	User.findByIdAndRemove(req.params.id, function(err){
		if(err){
			res.redirect("back");
		}else{
			req.logout();
			res.redirect("/");
		}
	});
});

//USER LOGOUT ROUTE
app.get("/logout", function(req, res){
	req.logout();
	res.redirect("/");

});

function isLoggedIn(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect("/login");
}

function checkUserOwnership(req, res, next){
	if(req.isAuthenticated()){
		User.findById(req.params.id, function(err, foundUser){
		if(err){
			res.redirect("back");
		}else{
			if(foundUser._id.equals(req.user._id)){

				next();
			}else{
				
				res.redirect("back");
			}
		}
	});

	}else{
		
		res.redirect("back");
	}
}


app.listen(process.env.PORT || 3000, 
	() => console.log("Server Connected!!!"));