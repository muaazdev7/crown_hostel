const jwt = require("jsonwebtoken");

const generateToken = (userId, role, designation = null) => {
  const payload = { id: userId, role };
  if (designation) payload.designation = designation;
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

module.exports = generateToken;
