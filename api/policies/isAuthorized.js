const jwt = require('jsonwebtoken');

module.exports = async function (req, res, proceed) {
  try {
    const token = await getToken(req);
    req.token = await jwt.verify(token, process.env.MYUNISOFT_JWT_SECRET);
    proceed()
  } catch (error) {
    return res.badRequest(error)
  }
};
