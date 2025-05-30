var con  = require("./connection");
var express = require('express');
var app = express();
const port = 7000;
const session = require('express-session');
const bcrypt = require('bcryptjs');
var bodyParser = require('body-parser');

con.connect(function(error){
    if(error) {
        console.log("Database connection failed:", error.message);
        process.exit(1);
    }
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));

app.use(session({
    secret: 'mySecretKey', 
    resave: false,
    saveUninitialized: true
}));

app.set('view engine','ejs');

app.get('/', function(req, res){
    res.sendFile(__dirname+'/login.html');
});

app.post('/', function(req, res){
    var name = req.body.name;
    var password = req.body.password;
    var userType = req.body.userType;

    if(userType=="client") {
        var sql = "SELECT * FROM client WHERE c_name=?";
        con.query(sql,[name],function(error,result){
            if(error) return res.redirect(`/error?message=${encodeURIComponent(error.message)}`);
            if (result.length > 0 && bcrypt.compareSync(password,result[0].password)) {
                req.session.userType = userType;
                req.session.userName = name;
                res.render(__dirname+"/client-profile",{client:result});
            } else {
                res.redirect('/error?message=Invalid client credentials');
            }
        });
    }
    else if(userType=="provider") {
        var sql = "SELECT * FROM provider WHERE p_name=?";
        con.query(sql,[name],function(error,result){
            if(error) return res.redirect(`/error?message=${encodeURIComponent(error.message)}`);
            if (result.length > 0 && bcrypt.compareSync(password,result[0].password)) {
                req.session.userType = userType;
                req.session.userName = name;
                res.render(__dirname+"/provider-profile",{provider:result});
            } else {
                res.redirect('/error?message=Invalid provider credentials');
            }
        });
    }
    else res.redirect('/error?message=Invalid user type');
});

app.get('/register', function(req, res){
    res.sendFile(__dirname+'/register.html');
});

app.get('/search-service', function(req, res){
    var sql = "SELECT * FROM provider";
    var c_id= req.query.c_id;
    con.query(sql,function(error,result){
        if(error) return res.redirect(`/error?message=${encodeURIComponent(error.message)}`);
        res.render(__dirname+"/search-service",{provider:result,c_id:c_id});
    });
});

app.get('/request-service', function(req, res){
    var sql = "INSERT INTO service(service_name,p_id,c_id) values(?,?,?)";
    var c_id= req.query.c_id;
    var p_id = req.query.p_id;
    var service = req.query.service;
    con.query(sql,[service,p_id,c_id],function(error,result){
        if(error) return res.redirect(`/error?message=${encodeURIComponent(error.message)}`);
        var sql1= "SELECT * FROM service s JOIN provider p ON s.p_id = p.p_id WHERE service_name=? and s.p_id=? and s.c_id =?";
        con.query(sql1,[service,p_id,c_id],function(error,result){
            if(error) return res.redirect(`/error?message=${encodeURIComponent(error.message)}`);
            res.render(__dirname+"/client-booking",{service:result,req:req});
        });
    });
});

app.get('/client-booking', function(req, res){
    var c_id= req.query.c_id;
    var sql= "SELECT * FROM service s JOIN provider p ON s.p_id = p.p_id WHERE c_id =?";
    con.query(sql,[c_id],function(error,result){
        if(error) return res.redirect(`/error?message=${encodeURIComponent(error.message)}`);
        res.render(__dirname+"/client-booking",{service:result,req:req});
    });
});

app.get('/view-booking', function(req, res){
    var p_id= req.query.p_id;
    var sql= "SELECT * FROM service s JOIN client c ON s.c_id = c.c_id WHERE p_id =?";
    con.query(sql,[p_id],function(error,result){
        if(error) return res.redirect(`/error?message=${encodeURIComponent(error.message)}`);
        res.render(__dirname+"/view-booking",{service:result,req:req});
    });
});

app.get('/view-accepted-booking', function(req, res){
    var p_id= req.query.p_id;
    var sql= "SELECT * FROM service s JOIN client c ON s.c_id = c.c_id WHERE p_id =?";
    con.query(sql,[p_id],function(error,result){
        if(error) return res.redirect(`/error?message=${encodeURIComponent(error.message)}`);
        res.render(__dirname+"/view-accepted-booking",{service:result,req:req});
    });
});

app.post('/register', function(req, res){
    var name = req.body.name;
    var id = req.body.id;
    var password = bcrypt.hashSync(req.body.password,10);
    var house = req.body.house;
    var street = req.body.street;
    var city = req.body.city;
    var country = req.body.country;
    var service = req.body.service;
    var userType = req.body.userType;

    if(userType=="client") {
        var sql = "INSERT INTO client(c_id,c_name,password,house,street,city,country) VALUES (?,?,?,?,?,?,?)";
        con.query(sql,[id,name,password,house,street,city,country],function(error,result){
            if(error) return res.redirect(`/error?message=${encodeURIComponent(error.message)}`);
            req.session.userType = userType;
            req.session.userName = name;
            res.redirect('/client');
        });
    }
    else if(userType=="provider") {
        var sql = "INSERT INTO provider(p_id,p_name,password,house,street,city,country,service) VALUES (?,?,?,?,?,?,?,?)";
        con.query(sql,[id,name,password,house,street,city,country,service],function(error,result){
            if(error) return res.redirect(`/error?message=${encodeURIComponent(error.message)}`);
            req.session.userType = userType;
            req.session.userName = name;
            res.redirect('/provider');
        });
    }
    else res.redirect('/error?message=Invalid user type');
});

app.get('/client',function(req, res){
    var sql = "SELECT * FROM client";
    con.query(sql,function(error,result){
        if(error) return res.redirect(`/error?message=${encodeURIComponent(error.message)}`);
        res.render(__dirname+"/client",{client:result, userType: 'client', req: req});
    });
});

app.get('/provider',function(req, res){
    var sql = "SELECT * FROM provider";
    con.query(sql,function(error,result){
        if(error) return res.redirect(`/error?message=${encodeURIComponent(error.message)}`);
        res.render(__dirname+"/provider",{provider:result, userType: 'provider', req: req});
    });
});

app.get('/delete-client',function(req, res){
    var sql = "DELETE FROM client WHERE c_id=?";
    var id = req.query.id;
    con.query(sql,[id],function(error,result){
        if(error) return res.redirect(`/error?message=${encodeURIComponent(error.message)}`);
        res.redirect('/client');
    });
});

app.get('/delete-provider',function(req, res){
    var sql = "DELETE FROM provider WHERE p_id=?";
    var id = req.query.id;
    con.query(sql,[id],function(error,result){
        if(error) return res.redirect(`/error?message=${encodeURIComponent(error.message)}`);
        res.redirect('/provider');
    });
});

app.get('/update-client',function(req, res){
    var sql = "SELECT * FROM client WHERE c_id=?";
    var id = req.query.id;
    con.query(sql,[id],function(error,result){
        if(error) return res.redirect(`/error?message=${encodeURIComponent(error.message)}`);
        res.render(__dirname+"/update-client",{client:result});
    });
});

app.post('/update-client', function(req, res){
    var name = req.body.name;
    var id = req.body.id;
    var password = bcrypt.hashSync(req.body.password,10);
    var house = req.body.house;
    var street = req.body.street;
    var city = req.body.city;
    var country = req.body.country;
    var sql = "UPDATE client SET c_name=?,house=?,street=?,city=?,country=?,password=? where c_id=?";
    con.query(sql,[name,house,street,city,country,password,id],function(error,result){
        if(error) return res.redirect(`/error?message=${encodeURIComponent(error.message)}`);
        res.redirect('/client');
    });
});

app.get('/update-provider',function(req, res){
    var sql = "SELECT * FROM provider WHERE p_id=?";
    var id = req.query.id;
    con.query(sql,[id],function(error,result){
        if(error) return res.redirect(`/error?message=${encodeURIComponent(error.message)}`);
        res.render(__dirname+"/update-provider",{provider:result});
    });
});

app.post('/update-provider', function(req, res){
    var name = req.body.name;
    var id = req.body.id;
    var password = bcrypt.hashSync(req.body.password,10);
    var house = req.body.house;
    var street = req.body.street;
    var city = req.body.city;
    var country = req.body.country;
    var service = req.body.service;
    var sql = "UPDATE provider SET p_name=?,house=?,street=?,city=?,country=?,password=?,service=? where p_id=?";
    con.query(sql,[name,house,street,city,country,password,service,id],function(error,result){
        if(error) return res.redirect(`/error?message=${encodeURIComponent(error.message)}`);
        res.redirect('/provider');
    });
});

app.get('/search-client',function(req, res){
    var sql = "SELECT * FROM client";
    con.query(sql,function(error,result){
        if(error) return res.redirect(`/error?message=${encodeURIComponent(error.message)}`);
        res.render(__dirname+"/search-client",{client:result});
    });
});

/*app.get('/search', function(req,res){
    var name = req.query.name;
    var service = req.query.service;
    var sql = "SELECT * FROM provider WHERE p_name LIKE '%"+name+"%' AND service LIKE '%"+service+"%' ";
    con.query(sql,function(error,result){
        if(error) return res.redirect(`/error?message=${encodeURIComponent(error.message)}`);
        res.render(__dirname+"/search-service",{provider:result});
    });
});*/
app.get('/search', function(req, res) {
    var name = req.query.name || "";
    var service = req.query.service || "";
    var c_id = req.query.c_id || "";  // <- this line is critical

    var sql = "SELECT * FROM provider WHERE p_name LIKE '%" + name + "%' AND service LIKE '%" + service + "%'";
    con.query(sql, function(error, result) {
        if (error) return res.redirect(`/error?message=${encodeURIComponent(error.message)}`);

        // ✅ Pass c_id to EJS here
        res.render(__dirname + "/search-service", {
            provider: result,
            c_id: c_id      // <-- THIS IS MANDATORY
        });
    });
});




app.get('/logout', function(req, res) {
    req.session.destroy(function(err) {
        if (err) {
            return res.redirect(`/error?message=${encodeURIComponent(err.message)}`);
        } else {
            res.redirect('/');
        }
    });
});

app.get('/client-profile', function(req, res){
    res.sendFile(__dirname+'/client-profile.html');
});

// ✅ Global error handler
app.get('/error', function(req, res) {
    const errorMessage = req.query.message || 'An unknown error occurred.';
    res.render(__dirname + '/error', { error: errorMessage });
});

app.listen(port, function() {
    console.log(`Server is listening on port ${port}`);
});
