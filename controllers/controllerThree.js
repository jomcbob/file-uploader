
function renderIndex(req, res) {
  res.render("pageThree", { title: "Route Three Index" });
}

module.exports = {
  renderIndex,
};