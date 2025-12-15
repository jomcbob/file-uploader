
function renderIndex(req, res) {
  res.render("pageTwo", { title: "Route Two Index" });
}

module.exports = {
  renderIndex,
};