exports.validatePayload = (payload) => {
  if (!payload || !payload.action) throw new Error('Invalid payload: missing action');
  return true;
};
