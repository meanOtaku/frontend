import express, { response } from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import ejs from "ejs";
import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";
import http from "http";
import _ from "lodash";
import fetch from "node-fetch"


const url = "http://localhost:5000/course";


const app = express();

app.set('view engine','ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());


app.use(session({
    secret: "our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);



const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);


const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



//GET Routes

app.get("/admin", function(req, res){
    res.render("home");
});

app.get("/admin/login", function(req, res){
    res.render("login");
});

app.get("/admin/logout", function(req, res){
    req.logout();
    res.redirect("/admin");
})

app.get("/admin/register", function(req, res){
    res.render("register");
});

app.get("/admin/console", function(req, res){

    http.get(url, function(response){
        response.on("data", function(data){
            if(req.isAuthenticated()){
                res.render("ad/console", {Course: JSON.parse(data)});
            }else{
                res.redirect("/admin/login");
            }
        })
    })

})

app.get("/admin/course/:courseTitle", function(req, res){
    http.get(url + "/" + req.params.courseTitle, function(response){
        response.on("data", function(data){
            if(req.isAuthenticated()){
                res.render("ad/course", {Course: JSON.parse(data)});
            }else{
                res.redirect("/admin/login");
            }
        })
    });
})


//POST Route


app.post("/admin/register", function(req, res){
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            res.redirect(err);
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/admin/console");
            })
        }
    })
})

app.post("/admin/login", function(req, res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function(err){
        if(err){
            res.redirect("/admin/login");
        }
        else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/admin/console");
            });
        }
    });
});


app.post("/admin/course", function(req, res){
    fetch('http://localhost:5000/course', {
        method: 'post',
        body:    JSON.stringify(req.body),
        headers: { 'Content-Type': 'application/json' },
    })
    .then(response => response.text())
    .catch(json => console.log(json));
    res.redirect("/admin/console");
})

app.post("/admin/course/:courseTitle", function(req, res){
    fetch('http://localhost:5000/course'+'/'+req.params.courseTitle, {
        method: 'patch',
        body:    JSON.stringify(req.body),
        headers: { 'Content-Type': 'application/json' },
    })
    .then(response => response.text())
    .catch(json => console.log(json));
    res.redirect("/admin/course/" + req.params.courseTitle);
})

//delete routes

app.post("/admin/delete/course", function(req, res){
    fetch('http://localhost:5000/course', {
        method: 'delete',
        //body:    JSON.stringify(req.body),
        //headers: { 'Content-Type': 'application/json' },
    })
    .then(response => response.text())
    .catch(json => console.log(json));
    res.redirect("/admin/console");
})

app.post("/admin/delete/course/:courseTitle", function(req, res){
    fetch('http://localhost:5000/course'+'/'+req.params.courseTitle, {
        method: 'delete',
        //body:    JSON.stringify(req.body),
        //headers: { 'Content-Type': 'application/json' },
    })
    .then(response => response.text())
    .catch(json => console.log(json));
    res.redirect("/admin/console");
})

app.post("/admin/delete/course/:courseTitle/:module", function(req, res){
    fetch('http://localhost:5000/course'+'/'+req.params.courseTitle+'/'+req.params.module, {
        method: 'delete',
        //body:    JSON.stringify(req.body),
        //headers: { 'Content-Type': 'application/json' },
    })
    .then(response => response.text())
    .catch(json => console.log(json));
    res.redirect("/admin/course/" + req.params.courseTitle);
})


//Normal Views

app.get("/", function(req, res){
    res.redirect("/course");
})

app.get("/course", function(req, res){
    http.get(url, function(response){
        response.on("data", function(data){
            res.render("nor/console", {Course: JSON.parse(data)});
        })
    });
})

app.get("/course/:courseTitle", function(req, res){
    http.get(url + "/" + req.params.courseTitle, function(response){
        response.on("data", function(data){
            res.render("nor/Course", {Course: JSON.parse(data)});
        })
    });
})


app.listen(process.env.PORT || 3000, function () {
    console.log("server is running")
})