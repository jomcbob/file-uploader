
function renderIndex(req, res) {
  res.render("pageOne", { title: "Route One Index" });
}

module.exports = {
  renderIndex,
};