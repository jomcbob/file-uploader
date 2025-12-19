import passport from "passport";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";

function renderIndex(req, res) {
  res.render("login", { title: "Log In" });
}

function renderSignUp(req, res) {
  res.render("signup", { title: "Sign Up" });
}

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/auth/login");
  }
}

function loginUser(req, res, next) {
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/auth/login",
  })(req, res, next);
}

async function signupUser(req, res, next) {
  // const errors = validationResult(req);
  // if (!errors.isEmpty()) {
  //   return res.status(400).render("signup", { errors: errors.array(), title: "Sign Up" });
  // }

  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    await prisma.user.create({
      data: {
        username: req.body.username,
        password: hashedPassword,
        firstname: req.body.firstname,
        lastname: req.body.lastname,
      },
    });

    res.redirect("/login");
  } catch (err) {
    console.error(err);
    next(err);
  }
}

function logoutUser(req, res) {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/auth/login");
  });
}

export default {
  renderIndex,
  loginUser,
  isAuthenticated,
  logoutUser,
  renderSignUp,
  signupUser,
}