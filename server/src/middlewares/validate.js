export const validate =
  (schema, source = "body") =>
  (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.issues.map(({ path, message }) => ({
          field: path.join("."),
          message,
        })),
      });
    }

    if (source === "body") {
      req.body = result.data;
    } else {
      req.validated = { ...(req.validated ?? {}), [source]: result.data };
    }
    return next();
  };
