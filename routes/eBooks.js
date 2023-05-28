const express = require("express");
const router = express.Router();
// Import Express validatior
const { check, validationResult } = require("express-validator");
const eBook = require("../models/eBook");

// Import Video and User Mongoose schemas
let Ebook = require("../models/eBook");
let User = require("../models/user");

// Level
let levels = ["Beginner", "Intermediate", "Advanced"];

// Attach routes to router
router
  .route("/add")
  // Get method renders the pug add_video page
  .get(ensureAuthenticated, (req, res) => {
    // Render page with list of levels
    res.render("add_eBook", {
      levels: levels,
    });
    // Post method accepts form submission and saves eBook in MongoDB
  })
  .post(ensureAuthenticated, async (req, res) => {
    // Async validation check of form elements
    await check("name", "Name is required").notEmpty().run(req);
    await check("description", "Description is required").notEmpty().run(req);
    await check("link", "Link is required").notEmpty().run(req);
    await check("level", "Level is required").notEmpty().run(req);

    // Get validation errors
    const errors = validationResult(req);

    if (errors.isEmpty()) {
      // Create new video from mongoose model
      let eBook = new Ebook();
      // Assign attributes based on form data
      eBook.name = req.body.name;
      eBook.description = req.body.description;
      eBook.link = req.body.link;
      eBook.level = req.body.level;
      eBook.posted_by = req.user.id;

      // Save video to MongoDB
      eBook.save(function (err) {
        if (err) {
          // Log error if failed
          console.log(err);
          return;
        } else {
          // Route to home to view eBook if suceeeded
          res.redirect("/");
        }
      });
    } else {
      res.render("add_eBook", {
        // Render form with errors
        errors: errors.array(),
        levels: levels,
      });
    }
  });

// Route that returns and deletes video based on id
router
  .route("/:id")
  .get((req, res) => {
    // Get eBook by id from MongoDB
    // Get user name by id from DB
    Ebook.findById(req.params.id, function (err, eBook) {
      User.findById(eBook.posted_by, function (err, user) {
        if (err) {
          console.log(err);
        }
        res.render("eBook", {
          eBook: eBook,
          posted_by: user.name,
        });
      });
    });
  })
  .delete((req, res) => {
    // Restrict delete if user not logged in
    if (!req.user._id) {
      res.status(500).send();
    }

    // Create query dict
    let query = { _id: req.params.id };

    Ebook.findById(req.params.id, function (err, eBook) {
      // Restrict delete if user did not post eBook
      if (eBook.posted_by != req.user._id) {
        res.status(500).send();
      } else {
        // MongoDB delete with Mongoose schema deleteOne
        Ebook.deleteOne(query, function (err) {
          if (err) {
            console.log(err);
          }
          res.send("Successfully Deleted");
        });
      }
    });
  });

// Route that return form to edit eBook
router
  .route("/edit/:id")
  .get(ensureAuthenticated, (req, res) => {
    // Get eBook by id from MongoDB
    Ebook.findById(req.params.id, function (err, eBook) {
      // Restrict to only allowing user that posted to make updates
      if (eBook.posted_by != req.user._id) {
        res.redirect("/");
      }
      res.render("edit_eBook", {
        eBook: eBook,
        levels: levels,
      });
    });
  })
  .post(ensureAuthenticated, (req, res) => {
    // Create dict to hold video values
    let eBookUpdate = {};

    // Assign attributes based on form data
    eBookUpdate.name = req.body.name;
    eBookUpdate.description = req.body.description;
    eBookUpdate.link = req.body.link;
    eBookUpdate.level = req.body.level;

    let query = { _id: req.params.id };

    Ebook.findById(req.params.id, function (err, eBook) {
      // Restrict to only allowing user that posted to make updates
      if (eBook.posted_by != req.user._id) {
        res.redirect("/");
      } else {
        // Update eBook in MongoDB
        Ebook.updateOne(query, eBookUpdate, function (err) {
          if (err) {
            console.log(err);
            return;
          } else {
            res.redirect("/");
          }
        });
      }
    });
  });

// Function to protect routes from unauthenticated users
function ensureAuthenticated(req, res, next) {
  // If logged in proceed to next middleware
  if (req.isAuthenticated()) {
    return next();
    // Otherwise redirect to login page
  } else {
    res.redirect("/users/login");
  }
}

module.exports = router;
