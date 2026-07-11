module.exports = (schema) => (req, res, next) => {
  const { error } = schema(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: 'Validation Error', error: error });
  }
  next();
};