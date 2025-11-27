mod config;
mod handlers;
mod utils;

use axum::{
    Router,
    extract::DefaultBodyLimit,
    http::{Method, header::ACCEPT, header::CONTENT_TYPE, header::HeaderName},
    middleware,
    routing::{delete, get, post},
};
use dotenvy::dotenv;
use std::net::SocketAddr;
use tower_http::{
    cors::{Any, CorsLayer},
    services::ServeDir,
}; // Import dotenvy

use crate::config::AppConfig;
use crate::handlers::{delete::delete_file, upload::upload_file};
use crate::utils::auth::auth_middleware;

#[tokio::main]
async fn main() {
    // 1. Load .env file if present
    // `.ok()` means missing .env will not error (e.g., production uses real env vars)
    dotenv().ok();

    // 2. Initialize logger & configuration
    tracing_subscriber::fmt::init();
    let app_config = AppConfig::from_env();

    // Convenience binding
    let config = &app_config;

    // 3. Ensure upload folder exists (from config)
    tokio::fs::create_dir_all(&config.upload_dir).await.unwrap();

    // 4. Setup CORS
    let cors = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST, Method::DELETE])
        .allow_headers([CONTENT_TYPE, ACCEPT, HeaderName::from_static("x-api-key")])
        .allow_origin(Any);

    // 5. Setup Router
    let public_router = Router::new().nest_service("/files", ServeDir::new(&config.upload_dir));

    let private_router = Router::new()
        .route("/", get(|| async { "Sikap Storage: Env Var Version 🚀" }))
        .route("/upload", post(upload_file))
        .route("/file/{filename}", delete(delete_file))
        .layer(DefaultBodyLimit::max(10 * 1024 * 1024))
        .route_layer(middleware::from_fn_with_state(
            app_config.clone(),
            auth_middleware,
        ));

    let app = Router::new()
        .merge(public_router)
        .merge(private_router)
        .layer(cors)
        .with_state(app_config.clone());

    // 6. Run Server (port from config)
    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    println!("🚀 Server listening on {}", addr);
    println!("📂 Upload Dir: {}", config.upload_dir);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
