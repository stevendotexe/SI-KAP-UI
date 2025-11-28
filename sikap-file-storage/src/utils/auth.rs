use crate::config::AppConfig;
use axum::{
    extract::{Request, State},
    http::{HeaderMap, StatusCode},
    middleware::Next,
    response::IntoResponse,
}; // Import config global

/// Simple API-key based authentication middleware.
///
/// Expects header `x-api-key` to match the configured `api_secret`.
///
/// Example:
/// ```bash
/// curl -H "x-api-key: <SECRET>" http://localhost:4000/
/// ```
pub async fn auth_middleware(
    State(config): State<AppConfig>,
    request: Request,
    next: Next,
) -> Result<impl IntoResponse, StatusCode> {
    let secret = &config.api_secret;
    let headers: &HeaderMap = request.headers();

    match headers.get("x-api-key") {
        Some(key) if key == secret => Ok(next.run(request).await),
        _ => Err(StatusCode::UNAUTHORIZED),
    }
}
