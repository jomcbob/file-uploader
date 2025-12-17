import passport from "passport";

function renderIndex(req, res) {
  res.render("login", { title: "Login" });
}

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/auth/login");
  }
}

function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.isadmin) {
    return next();
  } else {
    return next(new Error('User not authorized as admin'));
  }
}

function loginUser(req, res, next) {
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/auth/login",
  })(req, res, next);
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
  isAdmin,
  isAuthenticated,
  logoutUser
}