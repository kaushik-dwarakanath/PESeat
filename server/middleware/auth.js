import jwt from "jsonwebtoken";

export const verifyJWT = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach staff flag (if present in token payload)
    req.user = { id: decoded.id, staff: decoded.staff === true };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};


