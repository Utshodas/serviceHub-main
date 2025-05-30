var mysql= require("mysql");
var con = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"utsho",
    database:"serviceHub"
});
module.exports = con;
