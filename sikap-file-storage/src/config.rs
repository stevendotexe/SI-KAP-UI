use std::env;
// no global singleton; pass config via Axum state

/// Application configuration loaded from environment variables.
#[derive(Debug, Clone)]
pub struct AppConfig {
    /// Directory where uploaded files are stored.
    pub upload_dir: String,
    /// Shared secret used for API authentication.
    pub api_secret: String,
    /// TCP port the server listens on.
    pub port: u16,
}

impl AppConfig {
    /// Creates a configuration instance by reading environment variables without touching global state.
    ///
    /// Variables:
    /// - `UPLOAD_DIR`: optional, defaults to `./uploads`.
    /// - `API_SECRET`: required; the process will panic if missing.
    /// - `PORT`: optional, defaults to `4000`; must be a valid number.
    pub fn from_env() -> AppConfig {
        let upload_dir = env::var("UPLOAD_DIR").unwrap_or_else(|_| "./uploads".to_string());

        let api_secret = env::var("API_SECRET")
            .expect("FATAL: API_SECRET must be set in .env or environment variables!");

        let port = env::var("PORT")
            .unwrap_or_else(|_| "4000".to_string())
            .parse::<u16>()
            .expect("FATAL: PORT must be a number!");

        AppConfig {
            upload_dir,
            api_secret,
            port,
        }
    }

    // Prefer `from_env()` and state injection instead of global initialization.
}
