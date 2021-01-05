//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require('lodash');

const app = express();

//Tells apps(which is generated using express) to use ejs as its view engine
//Put it below the declaration of app constant
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//Using mongoDB and mongoose
//Create DB and connect to mongoDB atlas (password replace with the admin password created and add the DB name after mongo.net/)
mongoose.connect("mongodb+srv://<admin-name>:<password>@cluster0.y5vmi.mongodb.net/<DB Name>", {useNewUrlParser : true, useUnifiedTopology : true})

const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  }
});

const Item = mongoose.model("Item", itemsSchema)

const item1 = new Item({
  name: "Welcome to your todo list!"
});

const item2 = new Item({
  name: "Press the + button to add a new item"
});

const item3 = new Item({
  name : "⬅ Click the checkbox to delete"
});

const item4 = new Item({
  name : "Stay Motivated & Keep Going!"
});

const defaultItems = [item1, item2, item3, item4];

const listSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema)

app.get("/", function(req, res) {

  //find all items inside Item collection
  Item.find({}, function(err, foundItems){

    //If no items, add the default items 
    if (foundItems.length === 0){
      Item.insertMany(defaultItems,function(err){
          if (err) {
              console.log(err);
          }else{
              console.log("Succesfully saved default items to Database");
          };
      });
      //If empty and default added it will get again and this time it will not trigger the if block since there are items in the array
      res.redirect("/")
    }else{
      res.render("list", {listTitle: "Today", newListItems: foundItems}); 
    }
  });
});

//let user create their own route
app.get("/:customListName", function (req, res) {
  //save what user enter into url 
  const customListName = _.capitalize(req.params.customListName)
  //find if the url exists
  List.findOne({name : customListName}, function(err, foundList){
    //if no errors
    if(!err){
      //if not found same url,create the url and save it into the database
      if(!foundList){   
        const list = new List({
          name : customListName,
          items : defaultItems
        });
        //save list
        list.save();
        //redirect to customed route
        res.redirect("/" + customListName);
      }else{
        //if url same, render the list.ejs with title of the extended url eg: /home = home
        res.render("list", {listTitle: foundList.name, newListItems : foundList.items})
      }
    }

  });

});

app.post("/", function(req, res){
  //save text submitted by user into itemName
  const itemName = req.body.newItem;
  const listName = req.body.list

  //make a new item document
  const item = new Item({
    name: itemName
  });
  //If it is the home page
  if (listName === "Today"){
  //Save user's new item
  item.save();
  //Redirect to root route to show the items on the screen as the Item.find searches all items in the DB and shows the name.
  res.redirect("/");
  //If it is custom route
  }else{
    List.findOne({name: listName}, function(err, foundList){
      //push item into array foundList
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }

});

app.post("/delete", function(req, res){
  //save the id of checked item from database based on the ejs value in list.ejs "value"
  const checkedItemId= req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today"){
      Item.deleteOne({_id : checkedItemId}, function(err){
        if (err){
          console.log(err);
        }else{
          console.log("Successfully Deleted")};
          res.redirect("/");
        });
      }else{
        List.findOneAndUpdate(
          {name : listName},
          {$pull: {items: {_id:checkedItemId}}},
          function(err, foundList){
            if(!err){
              res.redirect("/" + listName)
            }
          }
          )
      }
});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == ""){
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started succesfully!");
});
