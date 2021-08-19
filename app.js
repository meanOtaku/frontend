import express, { response } from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import ejs from "ejs";
import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";
import https from "https";
import _ from "lodash";
import fetch from "node-fetch"


const url = "<Api link>";


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
const port = process.env.PORT || 3000
const dbURI = 'mongodb+srv://Cherag:racoon2004R@cluster0.qbqdg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex:true })
  .then((result) => app.listen(port, function(){
      console.log("Server Running");
  }))
  .catch((err) => console.log(err));

mongoose.set("useCreateIndex", true);

const applicationSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    phonenumber: {
        type: String,
        required: true
    },
    course: {
        type: String,
        required: true
    }
})

const Application = mongoose.model("Course", applicationSchema);

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
    
    if(req.isAuthenticated()){
        res.render("register");
    }else{
        res.redirect("/admin/login");
    }
});

app.get("/admin/console", function(req, res){

    https.get(url, function(response){
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
    https.get(url + "/" + req.params.courseTitle, function(response){
        response.on("data", function(data){
            if(req.isAuthenticated()){
                res.render("ad/Course", {Course: JSON.parse(data)});
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
                res.redirect("/admin");
            });
        }
    });
});


app.post("/admin/course", function(req, res){
    fetch(url, {
        method: 'post',
        body:    JSON.stringify(req.body),
        headers: { 'Content-Type': 'application/json' },
    })
    .then(response => response.text())
    .catch(json => console.log(json));
    res.redirect("/admin/console");
})

app.post("/admin/course/:courseTitle", function(req, res){
    fetch(url +'/'+req.params.courseTitle, {
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
    fetch(url , {
        method: 'delete',
        //body:    JSON.stringify(req.body),
        //headers: { 'Content-Type': 'application/json' },
    })
    .then(response => response.text())
    .catch(json => console.log(json));
    res.redirect("/admin/console");
})

app.post("/admin/delete/course/:courseTitle", function(req, res){
    fetch(url +'/'+req.params.courseTitle, {
        method: 'delete',
        //body:    JSON.stringify(req.body),
        //headers: { 'Content-Type': 'application/json' },
    })
    .then(response => response.text())
    .catch(json => console.log(json));
    res.redirect("/admin/console");
})

app.post("/admin/delete/course/:courseTitle/:module", function(req, res){
    fetch(url +'/'+req.params.courseTitle+'/'+req.params.module, {
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
    https.get(url, function(response){
        response.on("data", function(data){
            res.render("nor/console", {Course: JSON.parse(data)});
        })
    });
})

app.get("/course/:courseTitle", function(req, res){
    https.get(url + "/" + req.params.courseTitle, function(response){
        response.on("data", function(data){
            res.render("nor/Course", {Course: JSON.parse(data)});
        })
    });
})

app.get("/applications", function(req, res){
    Application.find(function(err, foundApplications){
        if(!err){
            if(req.isAuthenticated()){
                res.render("applied", {applications: foundApplications});
            }else{
                res.redirect("/admin/login");
            }
        }else{
            res.send(err);
        }
    })
})

app.post("/delete/applications/:id", function(req, res){
    Application.findByIdAndDelete(
        {_id: req.params.id},
        function(err, foundApplications){
        if(!err){
            if(req.isAuthenticated()){
                res.redirect("/applications");
            }else{
                res.redirect("/admin/login");
            }
        }else{
            res.send(err);
        }
    })
})

app.get("/apply/:applyTitle", function(req, res){
    res.render("apply", {applied: req.params.applyTitle});
})

app.post("/apply", function(req, res){
    const application = new Application({
        email: req.body.email,
        phonenumber: req.body.phonenumber,
        course: req.body.course
    })

    application.save(function(err){
        if(!err){
            res.redirect("/course");
        }else{
            res.send(err);
        }
    })
})

app.get('/PrivacyPolicy', function(req, res){
    res.render("PrivacyPolicy")
  });

app.get('/TermsConditions', function(req, res){
    res.render("TermsConditions")
  });
app.get('/disclaimer', function(req, res){
    res.render("disclaimer")
  });
app.get('/about', function(req, res){
    res.render("about")
  });

app.get('*', function(req, res){
    res.status(404).render("404");
  });
