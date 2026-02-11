import logixlysia from "logixlysia";

export const logger = logixlysia({
  config: {
    showStartupMessage: true,
    startupMessageFormat: "simple",
    timestamp: { translateTime: "yyyy-mm-dd HH:MM:ss.SSS" },
    ip: true,
  },
});
